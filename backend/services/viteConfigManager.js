const fs = require('fs');
const path = require('path');

class ViteConfigManager {
    constructor() {
        this.defaultConfig = {
            server: {
                host: true,
                port: 3000,
                strictPort: true,
                hmr: {
                    clientPort: 443,
                    path: 'hmr/'
                },
                cors: {
                    origin: '*',
                    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                    allowedHeaders: ['Content-Type', 'Authorization']
                },
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'X-Frame-Options': 'ALLOWALL',
                    'Content-Security-Policy': "frame-ancestors *"
                }
            },
            preview: {
                port: 3000,
                strictPort: true,
                host: true,
                cors: {
                    origin: '*',
                    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                    allowedHeaders: ['Content-Type', 'Authorization']
                },
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'X-Frame-Options': 'ALLOWALL',
                    'Content-Security-Policy': "frame-ancestors *"
                }
            }
        };
    }

    /**
     * Generates a Vite config with the workspace preview URL
     * @param {string} workspaceId - The Daytona workspace ID
     * @param {string} nodeDomain - The Daytona node domain
     * @returns {Object} The Vite configuration object
     */
    generateViteConfig(workspaceId, nodeDomain) {
        const previewUrl = `https://3000-${workspaceId}.${nodeDomain}`;
        const workspaceDomain = `${workspaceId}.${nodeDomain}`;
        const previewHost = `3000-${workspaceId}.${nodeDomain}`;

        // Generate allowed hosts with specific patterns
        const allowedHosts = [
            previewHost,
            workspaceDomain,
            `*.${nodeDomain}`,
            `3000-*.${nodeDomain}`,
            `*.h*.${nodeDomain}`,
            `3000-*.h*.${nodeDomain}`
        ];

        const config = {
            ...this.defaultConfig,
            server: {
                ...this.defaultConfig.server,
                allowedHosts,
                hmr: {
                    ...this.defaultConfig.server.hmr,
                    host: previewHost
                }
            },
            preview: {
                ...this.defaultConfig.preview,
                allowedHosts
            }
        };

        return config;
    }

    /**
     * Creates a Vite config file in the workspace
     * @param {Object} workspace - The Daytona workspace object
     * @param {string} workspaceId - The workspace ID
     * @param {string} nodeDomain - The node domain
     * @param {string} sessionId - The session ID to use for commands
     * @param {string} projectName - The name of the project
     * @returns {Promise<boolean>} Whether the config was created successfully
     */
    async createViteConfig(workspace, workspaceId, nodeDomain, sessionId, projectName) {
        try {
            console.log('[ViteConfigManager] Creating Vite configuration...');
            const config = this.generateViteConfig(workspaceId, nodeDomain);
            
            // Create the config file content
            const configContent = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: ${JSON.stringify(config.server, null, 2)},
  preview: ${JSON.stringify(config.preview, null, 2)}
});`;

            // Set the target path in the project directory
            const targetPath = `/home/daytona/testdir/${projectName}/vite.config.js`;
            console.log(`[ViteConfigManager] Creating Vite config at: ${targetPath}`);

            // Create directory if it doesn't exist with timeout
            const dirPath = path.dirname(targetPath);
            const mkdirResult = await workspace.process.executeSessionCommand(sessionId, {
                command: `mkdir -p ${dirPath}`,
                timeout: 10000
            });
            
            if (!mkdirResult || mkdirResult.error) {
                throw new Error(`Failed to create directory: ${mkdirResult?.error || 'Unknown error'}`);
            }

            // Write the file with timeout and proper escaping
            const escapedContent = configContent.replace(/'/g, "'\\''");
            const writeResult = await workspace.process.executeSessionCommand(sessionId, {
                command: `echo '${escapedContent}' > ${targetPath}`,
                timeout: 10000
            });

            if (!writeResult || writeResult.error) {
                throw new Error(`Failed to write file: ${writeResult?.error || 'Unknown error'}`);
            }

            // Verify the file was created with timeout
            const verifyResult = await workspace.process.executeSessionCommand(sessionId, {
                command: `cat ${targetPath}`,
                timeout: 10000
            });

            if (!verifyResult || verifyResult.error) {
                throw new Error(`Failed to verify file: ${verifyResult?.error || 'Unknown error'}`);
            }

            if (verifyResult.output.includes('defineConfig')) {
                console.log('[ViteConfigManager] Vite config created successfully');
                return true;
            } else {
                throw new Error('Vite config verification failed - content mismatch');
            }
        } catch (error) {
            console.error('[ViteConfigManager] Error creating Vite config:', error);
            // Don't throw the error, just return false to allow the process to continue
            return false;
        }
    }
}

module.exports = new ViteConfigManager(); 