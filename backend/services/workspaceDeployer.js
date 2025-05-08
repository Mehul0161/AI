const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const { Daytona } = require('@daytonaio/sdk');
const workspaceManager = require('./workspaceManager');

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
        // Create deployment session
        console.log('[WorkspaceDeployer] Creating deployment session...');
        const session = await workspace.process.createSession(sessionId);
        console.log(`[WorkspaceDeployer] Session created successfully with ID: ${sessionId}`);

        // Initialize workspace directory with better error handling
        console.log('[WorkspaceDeployer] Initializing workspace directory...');
        const initCommands = [
            'pwd',  // Check current directory
            'ls -la',  // List directory contents
            'rm -rf testdir',  // Clean up any existing directory
            'mkdir -p testdir',  // Create fresh project directory
            'cd testdir',  // Change to project directory
        ];

        // Add src directory only for non-static projects
        if (!technology.toLowerCase().includes('static')) {
            initCommands.push('mkdir -p public src');
        }

        for (const cmd of initCommands) {
            console.log(`[WorkspaceDeployer] Executing command: ${cmd}`);
            const result = await workspace.process.executeSessionCommand(sessionId, { 
                command: cmd,
                timeout: 30000  // 30 second timeout for each command
            });
            console.log(`[WorkspaceDeployer] Command output:`, result.output);
        }

        // Upload files with improved error handling
        console.log('[WorkspaceDeployer] Starting file upload process...');
        for (const file of files) {
            const cleanPath = file.path.replace(/^[^/]+\//, '');
            const filePath = `/home/daytona/testdir/${cleanPath}`;
            console.log(`[WorkspaceDeployer] Processing file: ${filePath}`);
            
            try {
                if (!file.content || typeof file.content !== 'string' || file.content.trim() === '') {
                    console.error(`[WorkspaceDeployer] Error: Invalid or empty content for file ${file.path}`);
                    throw new Error(`Invalid or empty content for file ${file.path}`);
                }

                // Create directory with error handling
                const dirPath = filePath.substring(0, filePath.lastIndexOf('/'));
                console.log(`[WorkspaceDeployer] Creating directory: ${dirPath}`);
                await workspace.process.executeSessionCommand(sessionId, { 
                    command: `mkdir -p ${dirPath}`,
                    timeout: 30000
                });

                // Write file content with proper escaping
                const escapedContent = file.content.replace(/'/g, "'\\''");
                const createFileCmd = `echo '${escapedContent}' > ${filePath}`;
                await workspace.process.executeSessionCommand(sessionId, {
                    command: createFileCmd,
                    timeout: 30000
                });

                // Verify file content
                const verifyCmd = `cat ${filePath}`;
                const verifyResult = await workspace.process.executeSessionCommand(sessionId, {
                    command: verifyCmd,
                    timeout: 30000
                });

                if (!verifyResult.output || verifyResult.output.trim() === '') {
                    throw new Error(`File ${file.path} was created but is empty`);
                }

                console.log(`[WorkspaceDeployer] Successfully created and verified: ${filePath}`);
            } catch (uploadError) {
                console.error(`[WorkspaceDeployer] Error uploading file ${filePath}:`, uploadError);
                throw uploadError;
            }
        }

        // Move files to root directory with error handling
        console.log('[WorkspaceDeployer] Moving files to root directory...');
        await workspace.process.executeSessionCommand(sessionId, {
            command: 'cd /home/daytona/testdir && find . -maxdepth 1 -type d -not -path "." -not -path "./node_modules" -not -path "./.git" | while read dir; do mv "$dir"/* . 2>/dev/null || true; mv "$dir"/.* . 2>/dev/null || true; rm -rf "$dir"; done',
            timeout: 60000
        });

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
                    cd /home/daytona/testdir && \
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
            // Get workspace info for the correct host
            const workspaceInfo = await workspace.info();
            const previewHost = `3000-${workspaceInfo.id}.${workspaceInfo.nodeDomain}`;
            
            // Kill any existing processes on port 3000
            await workspace.process.executeSessionCommand(sessionId, {
                command: 'pkill -f "node.*3000" || true',
                timeout: 30000
            });

            // Create a temporary script to start the server
            const startScript = `
                cd /home/daytona/testdir && \
                # Create .env file
                echo 'VITE_HOST=0.0.0.0' > .env && \
                echo 'VITE_PORT=3000' >> .env && \
                # Start the server in background
                nohup ${startCommand} > dev-server.log 2>&1 & echo $! > server.pid
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
                    command: `if [ -f /home/daytona/testdir/server.pid ] && ps -p $(cat /home/daytona/testdir/server.pid) > /dev/null; then echo "running"; else echo "not running"; fi`,
                    timeout: 30000
                });
                
                if (processCheck.output.trim() !== 'running') {
                    const logResult = await workspace.process.executeSessionCommand(sessionId, {
                        command: 'cat /home/daytona/testdir/dev-server.log',
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
        return 'npm run dev -- --port 3000 --host 0.0.0.0';
    } else if (tech.includes('vue')) {
        return 'npm run dev -- --port 3000 --host 0.0.0.0';
    } else {
        return 'npm run dev -- --port 3000 --host 0.0.0.0';  // Default to dev for modern projects
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