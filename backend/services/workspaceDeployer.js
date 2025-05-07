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
            'mkdir -p testdir',  // Create project directory
            'cd testdir',  // Change to project directory
        ];

        // Add src directory only for non-static projects
        if (!technology.toLowerCase().includes('static')) {
            initCommands.push('mkdir -p public src');
        }

        for (const cmd of initCommands) {
            console.log(`[WorkspaceDeployer] Executing command: ${cmd}`);
            const result = await workspace.process.executeSessionCommand(sessionId, { command: cmd });
            console.log(`[WorkspaceDeployer] Command output:`, result.output);
        }

        // Upload files
        console.log('[WorkspaceDeployer] Starting file upload process...');
        for (const file of files) {
            // Remove any leading project directory from the path
            const cleanPath = file.path.replace(/^[^/]+\//, '');
            const filePath = `/home/daytona/testdir/${cleanPath}`;
            console.log(`[WorkspaceDeployer] Processing file: ${filePath}`);
            
            try {
                // Validate file content before processing
                if (!file.content || typeof file.content !== 'string' || file.content.trim() === '') {
                    console.error(`[WorkspaceDeployer] Error: Invalid or empty content for file ${file.path}`);
                    console.error(`[WorkspaceDeployer] Content type: ${typeof file.content}`);
                    console.error(`[WorkspaceDeployer] Content length: ${file.content ? file.content.length : 0}`);
                    throw new Error(`Invalid or empty content for file ${file.path}`);
                }

                console.log(`[WorkspaceDeployer] File content length: ${file.content.length} bytes`);
                
                // Create directory if it doesn't exist
                const dirPath = filePath.substring(0, filePath.lastIndexOf('/'));
                console.log(`[WorkspaceDeployer] Creating directory: ${dirPath}`);
                const mkdirResult = await workspace.process.executeSessionCommand(sessionId, { 
                    command: `mkdir -p ${dirPath}` 
                });
                console.log(`[WorkspaceDeployer] Directory creation result:`, mkdirResult.output);

                // For package.json, ensure it's valid JSON and has required scripts
                if (cleanPath === 'package.json') {
                    try {
                        const packageJson = JSON.parse(file.content);
                        // Ensure required scripts exist
                        if (!packageJson.scripts) {
                            packageJson.scripts = {};
                        }
                        packageJson.scripts.dev = "vite";
                        packageJson.scripts.build = "vite build";
                        packageJson.scripts.preview = "vite preview";
                        
                        // Ensure required dependencies exist
                        if (!packageJson.dependencies) {
                            packageJson.dependencies = {};
                        }
                        if (!packageJson.dependencies.react) {
                            packageJson.dependencies.react = "^18.2.0";
                        }
                        if (!packageJson.dependencies["react-dom"]) {
                            packageJson.dependencies["react-dom"] = "^18.2.0";
                        }
                        
                        // Update the content with the modified package.json
                        file.content = JSON.stringify(packageJson, null, 2);
                    } catch (parseError) {
                        console.error(`[WorkspaceDeployer] Invalid package.json content:`, parseError);
                        throw new Error(`Invalid package.json format: ${parseError.message}`);
                    }
                }

                // Create file with content using echo command
                const escapedContent = file.content.replace(/'/g, "'\\''");
                const createFileCmd = `echo '${escapedContent}' > ${filePath}`;
                console.log(`[WorkspaceDeployer] Creating file with content: ${filePath}`);
                const createResult = await workspace.process.executeSessionCommand(sessionId, {
                    command: createFileCmd
                });
                
                // Verify file was created and has content
                const verifyCmd = `cat ${filePath}`;
                const verifyResult = await workspace.process.executeSessionCommand(sessionId, {
                    command: verifyCmd
                });
                
                if (!verifyResult.output || verifyResult.output.trim() === '') {
                    throw new Error(`File ${file.path} was created but is empty`);
                }
                
                console.log(`[WorkspaceDeployer] Successfully created and verified: ${filePath}`);
            } catch (uploadError) {
                console.error(`[WorkspaceDeployer] Error uploading file ${filePath}:`, uploadError);
                console.error(`[WorkspaceDeployer] Error details:`, uploadError.message);
                throw uploadError;
            }
        }

        // Move all files from nested directory to root directory
        console.log('[WorkspaceDeployer] Moving files to root directory...');
        const moveResult = await workspace.process.executeSessionCommand(sessionId, {
            command: 'cd /home/daytona/testdir && find . -maxdepth 1 -type d -not -path "." -not -path "./node_modules" -not -path "./.git" | while read dir; do mv "$dir"/* . 2>/dev/null || true; mv "$dir"/.* . 2>/dev/null || true; rm -rf "$dir"; done'
        });
        console.log('[WorkspaceDeployer] Move result:', moveResult.output);

        // Verify package.json is in the correct location
        const verifyPackageJson = await workspace.process.executeSessionCommand(sessionId, {
            command: 'cd /home/daytona/testdir && ls -la package.json || echo "package.json not found"'
        });
        console.log('[WorkspaceDeployer] Package.json verification:', verifyPackageJson.output);

        // List all files after moving to verify structure
        const listFiles = await workspace.process.executeSessionCommand(sessionId, {
            command: 'cd /home/daytona/testdir && ls -la'
        });
        console.log('[WorkspaceDeployer] Directory structure after moving files:', listFiles.output);

        // For static websites, we don't need to install dependencies or start a dev server
        if (technology.toLowerCase().includes('static')) {
            console.log('[WorkspaceDeployer] Static website detected, skipping dependency installation and server start');
            return true;
        }

        // Install dependencies with retry logic
        console.log('[WorkspaceDeployer] Starting dependency installation...');
        let installSuccess = false;
        let retryCount = 0;
        const maxRetries = 3;

        while (!installSuccess && retryCount < maxRetries) {
            try {
                console.log(`[WorkspaceDeployer] Running npm install (attempt ${retryCount + 1}/${maxRetries})...`);
                // Change to the directory containing package.json before running npm install
                const installResult = await workspace.process.executeSessionCommand(sessionId, { 
                    command: 'cd /home/daytona/testdir && ls -la && npm install' 
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
                # Create .env file for environment variables
                echo 'VITE_HOST=0.0.0.0' > .env && \
                echo 'VITE_PORT=3000' >> .env && \
                # Ensure main.jsx has proper React setup
                cat > main.jsx << 'EOL'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
EOL
                # Ensure index.html has proper root element
                cat > index.html << 'EOL'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Tetris Game</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/main.jsx"></script>
  </body>
</html>
EOL
                # Update Vite config with allowed hosts and proper base URL
                cat > vite.config.js << 'EOL'
import { defineConfig } from 'vite'
${technology.toLowerCase().includes('react') ? "import react from '@vitejs/plugin-react'" : 
  technology.toLowerCase().includes('vue') ? "import vue from '@vitejs/plugin-vue'" : ""}

export default defineConfig({
  plugins: [${technology.toLowerCase().includes('react') ? 'react()' : 
    technology.toLowerCase().includes('vue') ? 'vue()' : ''}],
  base: '/',
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
      host: '${previewHost}',
      protocol: 'wss'
    },
    watch: {
      usePolling: true,
      interval: 1000
    },
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  },
  build: {
    sourcemap: true,
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
})
EOL
                # Install the correct plugin based on technology
                ${technology.toLowerCase().includes('react') ? 'npm install @vitejs/plugin-react --save-dev' : 
                  technology.toLowerCase().includes('vue') ? 'npm install @vitejs/plugin-vue --save-dev' : ''} && \
                # Start the server in background and save PID
                nohup ${startCommand} > dev-server.log 2>&1 & echo $! > server.pid
            `;
            
            const serverResult = await workspace.process.executeSessionCommand(sessionId, { 
                command: startScript,
                timeout: 30000  // 30 second timeout for starting the process
            });
            
            // Get the process ID from the pid file
            const pidResult = await workspace.process.executeSessionCommand(sessionId, {
                command: 'cat /home/daytona/testdir/server.pid'
            });
            const pid = pidResult.output.trim();
            console.log('[WorkspaceDeployer] Development server started with PID:', pid);
            
            // Wait for server to start (with multiple checks)
            console.log('[WorkspaceDeployer] Waiting for server to initialize...');
            let serverReady = false;
            let attempts = 0;
            const maxAttempts = 12; // Increased attempts for slower systems
            
            while (!serverReady && attempts < maxAttempts) {
                attempts++;
                console.log(`[WorkspaceDeployer] Checking server status (attempt ${attempts}/${maxAttempts})...`);
                
                // Check if process is running using the pid file
                const processCheck = await workspace.process.executeSessionCommand(sessionId, {
                    command: `if [ -f /home/daytona/testdir/server.pid ] && ps -p $(cat /home/daytona/testdir/server.pid) > /dev/null; then echo "running"; else echo "not running"; fi`
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
                        // Additional check for actual content
                        const contentCheck = await workspace.process.executeSessionCommand(sessionId, {
                            command: 'curl -s http://localhost:3000 | grep -q "<html" && echo "has_content" || echo "no_content"',
                            timeout: 5000
                        });
                        
                        if (contentCheck.output.trim() === 'has_content') {
                            serverReady = true;
                            console.log('[WorkspaceDeployer] Server is responding with content on port 3000');
                            break;
                        } else {
                            console.log('[WorkspaceDeployer] Server responded but no content found, checking logs...');
                            const logCheck = await workspace.process.executeSessionCommand(sessionId, {
                                command: 'cat /home/daytona/testdir/dev-server.log'
                            });
                            console.log('[WorkspaceDeployer] Current server log:', logCheck.output);
                        }
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

            // Set up file watching for AI-generated changes
            console.log('[WorkspaceDeployer] Setting up file watching for AI changes...');
            const watchScript = `
                cd /home/daytona/testdir && \
                # Create a watcher script
                cat > watch-changes.sh << 'EOL'
#!/bin/bash
while true; do
    if [ -f "dev-server.log" ]; then
        if grep -q "AI changes detected" "dev-server.log"; then
            echo "AI changes detected, restarting server..."
            pkill -f "node.*3000" || true
            npm run dev -- --port 3000 --host 0.0.0.0 > dev-server.log 2>&1 &
        fi
    fi
    sleep 5
done
EOL
                chmod +x watch-changes.sh && \
                nohup ./watch-changes.sh > watcher.log 2>&1 &
            `;
            
            await workspace.process.executeSessionCommand(sessionId, {
                command: watchScript,
                timeout: 10000
            });
            
            console.log('[WorkspaceDeployer] File watching setup complete');
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