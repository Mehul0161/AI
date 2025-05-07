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

        // Initialize workspace directory
        console.log('[WorkspaceDeployer] Initializing workspace directory...');
        const initCommands = [
            'pwd',  // Check current directory
            'ls -la',  // List directory contents
            'mkdir testdir',  // Create project directory
            'cd testdir',  // Change to project directory
            'mkdir public src'  // Create necessary directories
        ];

        for (const cmd of initCommands) {
            console.log(`[WorkspaceDeployer] Executing command: ${cmd}`);
            const result = await workspace.process.executeSessionCommand(sessionId, { command: cmd });
            console.log(`[WorkspaceDeployer] Command output:`, result.output);
        }

        // Upload files
        console.log('[WorkspaceDeployer] Starting file upload process...');
        for (const file of files) {
            const filePath = `/home/daytona/testdir/${file.path}`;
            console.log(`[WorkspaceDeployer] Processing file: ${filePath}`);
            console.log(`[WorkspaceDeployer] File content length: ${file.content.length} bytes`);
            
            try {
                // Create directory if it doesn't exist
                const dirPath = filePath.substring(0, filePath.lastIndexOf('/'));
                console.log(`[WorkspaceDeployer] Creating directory: ${dirPath}`);
                const mkdirResult = await workspace.process.executeSessionCommand(sessionId, { 
                    command: `mkdir -p ${dirPath}` 
                });
                console.log(`[WorkspaceDeployer] Directory creation result:`, mkdirResult.output);
                
                // Create a File object from the content
                console.log(`[WorkspaceDeployer] Creating File object for: ${file.path}`);
                const fileContent = new File([file.content], file.path.split('/').pop());
                
                // Upload the file
                console.log(`[WorkspaceDeployer] Uploading file to: ${filePath}`);
                await workspace.fs.uploadFile(filePath, fileContent);
                console.log(`[WorkspaceDeployer] Successfully uploaded: ${filePath}`);
            } catch (uploadError) {
                console.error(`[WorkspaceDeployer] Error uploading file ${filePath}:`, uploadError);
                console.error(`[WorkspaceDeployer] Error details:`, uploadError.message);
                throw uploadError;
            }
        }

        // Install dependencies with retry logic
        console.log('[WorkspaceDeployer] Starting dependency installation...');
        let installSuccess = false;
        let retryCount = 0;
        const maxRetries = 3;

        while (!installSuccess && retryCount < maxRetries) {
            try {
                console.log(`[WorkspaceDeployer] Running npm install (attempt ${retryCount + 1}/${maxRetries})...`);
                const installResult = await workspace.process.executeSessionCommand(sessionId, { 
                    command: 'cd /home/daytona/testdir && npm install' 
                });
                console.log('[WorkspaceDeployer] Dependencies installation output:', installResult.output);
                console.log('[WorkspaceDeployer] Dependencies installation exit code:', installResult.exitCode);
                installSuccess = true;
            } catch (error) {
                retryCount++;
                if (retryCount === maxRetries) {
                    throw error;
                }
                console.log(`[WorkspaceDeployer] Install attempt ${retryCount} failed, retrying in 5 seconds...`);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }

        // Start development server in background
        console.log('[WorkspaceDeployer] Starting development server in background...');
        const startCommand = getStartCommand(technology);
        console.log(`[WorkspaceDeployer] Using start command: ${startCommand}`);
        
        // Start the server in the background without waiting for completion
        try {
            console.log('[WorkspaceDeployer] Executing development server command...');
            
            // Get workspace info for the correct host
            const workspaceInfo = await workspace.info();
            const previewHost = `3000-${workspaceInfo.id}.${workspaceInfo.nodeDomain}`;
            console.log(`[WorkspaceDeployer] Using preview host: ${previewHost}`);

            // Kill any existing processes on port 3000
            await workspace.process.executeSessionCommand(sessionId, {
                command: 'pkill -f "node.*3000" || true'
            });

            // Create a temporary script to start the server with proper host configuration
            const startScript = `
                cd /home/daytona/testdir && \
                # Create .env file for Next.js
                echo 'PORT=3000' > .env.local && \
                echo 'HOST=0.0.0.0' >> .env.local && \
                # Update Vite config with allowed hosts
                cat > vite.config.js << 'EOL'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '${previewHost}'
    ],
    hmr: {
      clientPort: 443,
      host: '${previewHost}'
    }
  }
})
EOL
                # Start the server in background and save PID
                nohup ${startCommand} > dev-server.log 2>&1 & echo $!
            `;
            
            const serverResult = await workspace.process.executeSessionCommand(sessionId, { 
                command: startScript,
                timeout: 30000  // 30 second timeout for starting the process
            });
            
            // Get the process ID from the output
            const pid = serverResult.output.trim();
            console.log('[WorkspaceDeployer] Development server started with PID:', pid);
            
            // Wait for server to start (with multiple checks)
            console.log('[WorkspaceDeployer] Waiting for server to initialize...');
            let serverReady = false;
            let attempts = 0;
            const maxAttempts = 12; // Increased attempts for slower systems
            
            while (!serverReady && attempts < maxAttempts) {
                attempts++;
                console.log(`[WorkspaceDeployer] Checking server status (attempt ${attempts}/${maxAttempts})...`);
                
                // Check if process is running
                const processCheck = await workspace.process.executeSessionCommand(sessionId, {
                    command: `ps -p ${pid} > /dev/null && echo "running" || echo "not running"`
                });
                
                if (processCheck.output.trim() !== 'running') {
                    console.error('[WorkspaceDeployer] Server process is not running');
                    const logResult = await workspace.process.executeSessionCommand(sessionId, {
                        command: 'cat /home/daytona/testdir/dev-server.log'
                    });
                    console.error('[WorkspaceDeployer] Server log:', logResult.output);
                    throw new Error('Development server process died');
                }
                
                // Check if server is responding on port 3000
                try {
                    const portCheck = await workspace.process.executeSessionCommand(sessionId, {
                        command: 'curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "not_ready"',
                        timeout: 5000
                    });
                    
                    const status = portCheck.output.trim();
                    console.log(`[WorkspaceDeployer] Port check status: ${status}`);
                    
                    if (status === '200') {
                        serverReady = true;
                        console.log('[WorkspaceDeployer] Server is responding on port 3000');
                        break;
                    }
                } catch (error) {
                    console.log('[WorkspaceDeployer] Server not ready yet, waiting...');
                }
                
                // Check server logs for any errors
                const logCheck = await workspace.process.executeSessionCommand(sessionId, {
                    command: 'cat /home/daytona/testdir/dev-server.log'
                });
                console.log('[WorkspaceDeployer] Current server log:', logCheck.output);
                
                // Wait before next attempt
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
            
            if (!serverReady) {
                console.error('[WorkspaceDeployer] Server failed to start within timeout');
                const logResult = await workspace.process.executeSessionCommand(sessionId, {
                    command: 'cat /home/daytona/testdir/dev-server.log'
                });
                console.error('[WorkspaceDeployer] Server log:', logResult.output);
                throw new Error('Development server failed to start within timeout');
            }
            
            console.log('[WorkspaceDeployer] Development server is running and ready');
        } catch (error) {
            console.error('[WorkspaceDeployer] Error starting development server:', error);
            throw error;
        }

        // Add workspace to manager
        workspaceManager.addWorkspace(workspace.id, workspace);

        console.log('[WorkspaceDeployer] Deployment process completed successfully');
        return true;
    } catch (error) {
        console.error('[WorkspaceDeployer] Error during deployment:', error);
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