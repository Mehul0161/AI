const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const { Daytona } = require('@daytonaio/sdk');
const workspaceManager = require('./workspaceManager');
const viteConfigManager = require('./viteConfigManager');

/**
 * Deploys generated files to a workspace and starts the development server
 * @param {Object} workspace - The Daytona workspace object
 * @param {Array} files - Array of generated files with path and content
 * @param {string} technology - The technology being used (react, next, vue, etc.)
 * @returns {Promise<boolean>} - Whether deployment was successful
 */
async function deployToWorkspace(workspace, files, technology) {
    console.log('[WorkspaceDeployer] Starting deployment process...');
    console.log(`[WorkspaceDeployer] Total files to deploy: ${files.length}`);
    console.log(`[WorkspaceDeployer] Technology: ${technology}`);
    
    const sessionId = `deploy-${Date.now()}`;
    
    try {
        // Create deployment session first
        console.log('[WorkspaceDeployer] Creating deployment session...');
        const session = await workspace.process.createSession(sessionId);
        console.log(`[WorkspaceDeployer] Session created successfully with ID: ${sessionId}`);

        // Get workspace info for the correct host
        const workspaceInfo = await workspace.info();
        const previewHost = `3000-${workspaceInfo.id}.${workspaceInfo.nodeDomain}`;

        // Extract project name from package.json content
        let projectName = 'luxecart'; // default fallback
        try {
            const packageJsonFile = files.find(file => file.path.endsWith('package.json'));
            if (packageJsonFile) {
                const packageJson = JSON.parse(packageJsonFile.content);
                projectName = packageJson.name || projectName;
            }
        } catch (error) {
            console.error('[WorkspaceDeployer] Error extracting project name:', error);
        }
        console.log(`[WorkspaceDeployer] Project name: ${projectName}`);

        // Initialize workspace directory
        console.log('[WorkspaceDeployer] Initializing workspace directory...');
        const initCommands = [
            'pwd',
            'ls -la',
            'rm -rf testdir',
            'mkdir -p testdir',
            `mkdir -p testdir/${projectName}`,
            `cd testdir/${projectName}`
        ];

        for (const cmd of initCommands) {
            console.log(`[WorkspaceDeployer] Executing command: ${cmd}`);
            const result = await workspace.process.executeSessionCommand(sessionId, { 
                command: cmd,
                timeout: 30000
            });
            console.log(`[WorkspaceDeployer] Command output:`, result.output);
        }

        // Create Vite config if it's a Vite-based project
        if (technology.toLowerCase().includes('vite') || technology.toLowerCase().includes('react')) {
            console.log('[WorkspaceDeployer] Creating Vite configuration...');
            const viteConfigCreated = await viteConfigManager.createViteConfig(workspace, workspaceInfo.id, workspaceInfo.nodeDomain, sessionId, projectName);
            if (!viteConfigCreated) {
                console.warn('[WorkspaceDeployer] Vite config creation failed, continuing with deployment...');
            }
        }

        // Upload files using the structure from responseFilter
        console.log('[WorkspaceDeployer] Starting file upload process...');
        let uploadSuccess = true;
        for (const file of files) {
            // Skip vite.config.js as it's handled separately
            if (file.path.endsWith('vite.config.js')) {
                console.log('[WorkspaceDeployer] Skipping vite.config.js as it will be created separately');
                continue;
            }

            // Remove project name from path if it exists at the start
            const filePath = file.path.startsWith(`${projectName}/`) 
                ? file.path.substring(projectName.length + 1) 
                : file.path;

            // Use the path directly from the responseFilter
            const targetPath = `/home/daytona/testdir/${projectName}/${filePath}`;
            console.log(`[WorkspaceDeployer] Processing file: ${targetPath}`);
            
            try {
                if (!file.content || typeof file.content !== 'string' || file.content.trim() === '') {
                    console.error(`[WorkspaceDeployer] Error: Invalid or empty content for file ${file.path}`);
                    continue;
                }

                // Create directory with error handling and timeout
                const dirPath = targetPath.substring(0, targetPath.lastIndexOf('/'));
                console.log(`[WorkspaceDeployer] Creating directory: ${dirPath}`);
                const mkdirResult = await workspace.process.executeSessionCommand(sessionId, { 
                    command: `mkdir -p ${dirPath}`,
                    timeout: 10000
                });

                if (!mkdirResult || mkdirResult.error) {
                    console.error(`[WorkspaceDeployer] Failed to create directory ${dirPath}:`, mkdirResult?.error);
                    continue;
                }

                // Write file content with proper escaping and timeout
                const escapedContent = file.content.replace(/'/g, "'\\''");
                const writeResult = await workspace.process.executeSessionCommand(sessionId, {
                    command: `echo '${escapedContent}' > ${targetPath}`,
                    timeout: 10000
                });

                if (!writeResult || writeResult.error) {
                    console.error(`[WorkspaceDeployer] Failed to write file ${targetPath}:`, writeResult?.error);
                    continue;
                }
                
                // Verify file content with timeout
                const verifyResult = await workspace.process.executeSessionCommand(sessionId, {
                    command: `cat ${targetPath}`,
                    timeout: 10000
                });
                
                if (!verifyResult || verifyResult.error || !verifyResult.output || verifyResult.output.trim() === '') {
                    console.error(`[WorkspaceDeployer] File verification failed for ${targetPath}`);
                    continue;
                }
                
                console.log(`[WorkspaceDeployer] Successfully created and verified: ${targetPath}`);
            } catch (uploadError) {
                console.error(`[WorkspaceDeployer] Error uploading file ${targetPath}:`, uploadError);
                uploadSuccess = false;
                continue;
            }
        }

        if (!uploadSuccess) {
            console.warn('[WorkspaceDeployer] Some files failed to upload, but continuing with deployment...');
        }

        // Verify the final structure
        console.log('[WorkspaceDeployer] Verifying final file structure...');
        const structureCheck = await workspace.process.executeSessionCommand(sessionId, {
            command: `cd /home/daytona/testdir/${projectName} && find . -type f -not -path "*/node_modules/*" -not -path "*/.git/*" | sort`,
            timeout: 30000
        });
        console.log('[WorkspaceDeployer] Final file structure:', structureCheck.output);

        // Check for critical files
        const criticalFiles = [
            'package.json',
            'vite.config.js',
            'src/main.jsx',
            'src/App.jsx',
            'index.html'
        ];

        for (const file of criticalFiles) {
            const checkFile = await workspace.process.executeSessionCommand(sessionId, {
                command: `cd /home/daytona/testdir/${projectName} && test -f ${file} && echo "Found ${file}" || echo "Missing ${file}"`,
                timeout: 30000
            });
            console.log(`[WorkspaceDeployer] ${checkFile.output.trim()}`);
        }

        // Check file contents of critical files
        console.log('[WorkspaceDeployer] Checking critical file contents...');
        for (const file of criticalFiles) {
            try {
                const contentCheck = await workspace.process.executeSessionCommand(sessionId, {
                    command: `cd /home/daytona/testdir/${projectName} && cat ${file}`,
                    timeout: 30000
                });
                console.log(`[WorkspaceDeployer] Contents of ${file}:`);
                console.log(contentCheck.output);
            } catch (error) {
                console.log(`[WorkspaceDeployer] Could not read ${file}: ${error.message}`);
            }
        }

        // For static websites, skip dependency installation
        if (technology.toLowerCase().includes('static')) {
            console.log('[WorkspaceDeployer] Static website detected, skipping dependency installation');
            return true;
        }

        // Install dependencies with improved error handling and retry logic
        console.log('[WorkspaceDeployer] Starting dependency installation...');
        let installSuccess = false;
        let retryCount = 0;
        const maxRetries = 3;

        while (!installSuccess && retryCount < maxRetries) {
            try {
                console.log(`[WorkspaceDeployer] Running npm install (attempt ${retryCount + 1}/${maxRetries})...`);
                
                // Create a temporary script for npm installation
                const installScript = `
                    cd /home/daytona/testdir/${projectName} && \
                    # Set npm configuration
                    npm config set fetch-retry-mintimeout 20000 && \
                    npm config set fetch-retry-maxtimeout 120000 && \
                    npm config set fetch-timeout 300000 && \
                    # Install dependencies with optimized settings
                    npm install --no-audit --no-fund --prefer-offline --no-package-lock --legacy-peer-deps
                `;
                
                const installResult = await workspace.process.executeSessionCommand(sessionId, { 
                    command: installScript,
                    timeout: 300000  // 5 minutes timeout
                });
                
                console.log('[WorkspaceDeployer] Dependencies installation output:', installResult.output);
                installSuccess = true;
            } catch (error) {
                retryCount++;
                console.error(`[WorkspaceDeployer] Install attempt ${retryCount} failed:`, error);
                
                if (retryCount === maxRetries) {
                    throw new Error(`Failed to install dependencies after ${maxRetries} attempts: ${error.message}`);
                }
                
                console.log(`[WorkspaceDeployer] Retrying in 10 seconds...`);
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
        }

        // Start development server with improved error handling
        console.log('[WorkspaceDeployer] Starting development server...');
        const startCommand = getStartCommand(technology);
        
        try {
            // Kill any existing processes on port 3000
            await workspace.process.executeSessionCommand(sessionId, {
                command: 'pkill -f "node.*3000" || true',
                timeout: 30000
            });

            // Create a temporary script to start the server
            const startScript = `
                cd /home/daytona/testdir/${projectName} && \
                # Create .env file with necessary variables
                echo 'VITE_HOST=0.0.0.0' > .env && \
                echo 'VITE_PORT=3000' >> .env && \
                echo 'VITE_WS_PROTOCOL=wss' >> .env && \
                # Ensure proper file permissions
                chmod -R 755 . && \
                # Start the server in background with proper environment
                NODE_ENV=production nohup ${startCommand} > dev-server.log 2>&1 & echo $! > server.pid
            `;
            
            await workspace.process.executeSessionCommand(sessionId, { 
                command: startScript,
                timeout: 300000
            });
            
            // Wait for server to start with improved checks
            console.log('[WorkspaceDeployer] Waiting for server to initialize...');
            let serverReady = false;
            let attempts = 0;
            const maxAttempts = 12;
            
            while (!serverReady && attempts < maxAttempts) {
                attempts++;
                console.log(`[WorkspaceDeployer] Checking server status (attempt ${attempts}/${maxAttempts})...`);
                
                // Check if process is running
                const processCheck = await workspace.process.executeSessionCommand(sessionId, {
                    command: `if [ -f /home/daytona/testdir/${projectName}/server.pid ] && ps -p $(cat /home/daytona/testdir/${projectName}/server.pid) > /dev/null; then echo "running"; else echo "not running"; fi`,
                    timeout: 30000
                });
                
                if (processCheck.output.trim() !== 'running') {
                    const logResult = await workspace.process.executeSessionCommand(sessionId, {
                        command: `cat /home/daytona/testdir/${projectName}/dev-server.log`,
                        timeout: 30000
                    });
                    console.error('[WorkspaceDeployer] Server log:', logResult.output);
                    throw new Error('Development server process died');
                }
                
                // Check if server is responding
                try {
                    const portCheck = await workspace.process.executeSessionCommand(sessionId, {
                        command: 'curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "not_ready"',
                        timeout: 30000
                    });
                    
                    if (portCheck.output.trim() === '200') {
                            serverReady = true;
                        console.log('[WorkspaceDeployer] Server is responding on port 3000');
                            break;
                    }
                } catch (error) {
                    console.log('[WorkspaceDeployer] Server not ready yet, waiting...');
                }
                
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
            
            if (!serverReady) {
                const logResult = await workspace.process.executeSessionCommand(sessionId, {
                    command: 'cat /home/daytona/testdir/dev-server.log',
                    timeout: 30000
                });
                console.error('[WorkspaceDeployer] Server log:', logResult.output);
                throw new Error('Development server failed to start within timeout');
            }
            
            console.log('[WorkspaceDeployer] Development server is running and ready');

            // Add workspace to manager
            workspaceManager.addWorkspace(workspace.id, workspace);
            
            return true;
        } catch (error) {
            console.error('[WorkspaceDeployer] Error starting development server:', error);
            throw error;
        }
    } catch (error) {
        console.error('[WorkspaceDeployer] Deployment error:', error);
        if (sessionId) {
            try {
                await workspace.process.deleteSession(sessionId);
            } catch (cleanupError) {
                console.error('[WorkspaceDeployer] Error cleaning up session:', cleanupError);
            }
        }
        throw error;
    }
}

/**
 * Gets the appropriate start command based on the technology
 * @param {string} technology - The technology being used
 * @returns {string} The start command
 */
function getStartCommand(technology) {
    const tech = technology.toLowerCase();
    console.log(`[WorkspaceDeployer] Getting start command for technology: ${tech}`);
    
    if (tech.includes('next')) {
        return 'npm run dev -- --port 3000 --host 0.0.0.0';
    } else if (tech.includes('react')) {
        return 'npm run dev -- --host 0.0.0.0 --port 3000 --strictPort';
    } else if (tech.includes('vue')) {
        return 'npm run dev -- --host 0.0.0.0 --port 3000 --strictPort';
    } else {
        return 'npm run dev -- --host 0.0.0.0 --port 3000 --strictPort';
    }
}

/**
 * Checks if the workspace is ready to serve the application
 * @param {Object} workspace - The Daytona workspace object
 * @returns {Promise<boolean>} - Whether the workspace is ready
 */
async function isWorkspaceReady(workspace) {
    try {
        console.log('[WorkspaceDeployer] Checking workspace status...');
        const info = await workspace.info();
        console.log('[WorkspaceDeployer] Workspace status:', info.state);
        return info.state === 'started';
    } catch (error) {
        console.error('[WorkspaceDeployer] Error checking workspace status:', error);
        return false;
    }
}

/**
 * Gets the preview URL for the workspace
 * @param {Object} workspace - The Daytona workspace object
 * @returns {Promise<string>} The preview URL
 */
async function getPreviewUrl(workspace) {
    console.log('[WorkspaceDeployer] Generating preview URL...');
    try {
        const info = await workspace.info();
        const previewUrl = `https://3000-${info.id}.${info.nodeDomain}`;
        console.log('[WorkspaceDeployer] Generated preview URL:', previewUrl);
        return previewUrl;
    } catch (error) {
        console.error('[WorkspaceDeployer] Error generating preview URL:', error);
        throw error;
    }
}

module.exports = {
    deployToWorkspace,
    isWorkspaceReady,
    getPreviewUrl
}; 