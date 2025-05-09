const fs = require('fs').promises;
const path = require('path');

class ViteConfigManager {
    constructor() {
        this.defaultConfig = {
            server: {
                host: true,
                port: 3000,
                strictPort: true,
                hmr: false,
                watch: {
                    usePolling: false
                },
                proxy: {
                    '/api': {
                        target: 'http://localhost:3000',
                        changeOrigin: true,
                        secure: false
                    }
                }
            },
            preview: {
                port: 3000,
                strictPort: true,
                host: true
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
        
        const allowedHosts = [
            'localhost',
            workspaceDomain,
            previewHost,
            previewUrl,
            'codex-v4-backend.vercel.app',
            'latest-frontend.vercel.app'
        ];
        
        return {
            ...this.defaultConfig,
            server: {
                ...this.defaultConfig.server,
                cors: {
                    origin: '*',
                    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                    allowedHeaders: ['Content-Type', 'Authorization']
                },
                allowedHosts,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                    'X-Frame-Options': 'ALLOWALL',
                    'Content-Security-Policy': "frame-ancestors *"
                }
            },
            preview: {
                ...this.defaultConfig.preview,
                allowedHosts,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                    'X-Frame-Options': 'ALLOWALL',
                    'Content-Security-Policy': "frame-ancestors *"
                }
            },
            define: {
                'process.env.VITE_PREVIEW_URL': JSON.stringify(previewUrl)
            },
            optimizeDeps: {
                exclude: ['@vite/client']
            },
            build: {
                sourcemap: true,
                rollupOptions: {
                    output: {
                        manualChunks: undefined
                    }
                }
            }
        };
    }

    /**
     * Creates a Vite config file in the workspace
     * @param {Object} workspace - The Daytona workspace object
     * @param {string} workspaceId - The workspace ID
     * @param {string} nodeDomain - The node domain
     * @param {string} sessionId - The session ID to use for commands
     * @returns {Promise<boolean>} Whether the config was created successfully
     */
    async createViteConfig(workspace, workspaceId, nodeDomain, sessionId) {
        try {
            const config = this.generateViteConfig(workspaceId, nodeDomain);
            const configContent = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(${JSON.stringify(config, null, 2)})`;
            
            const targetPath = '/home/daytona/testdir/vite.config.js';
            
            // Create directory if it doesn't exist
            await workspace.process.executeSessionCommand(sessionId, {
                command: `mkdir -p ${path.dirname(targetPath)}`,
                timeout: 30000
            });

            // Write file content with proper escaping
            const escapedContent = configContent.replace(/'/g, "'\\''");
            const createFileCmd = `echo '${escapedContent}' > ${targetPath}`;
            await workspace.process.executeSessionCommand(sessionId, {
                command: createFileCmd,
                timeout: 30000
            });
            
            // Verify file content
            const verifyCmd = `cat ${targetPath}`;
            const verifyResult = await workspace.process.executeSessionCommand(sessionId, {
                command: verifyCmd,
                timeout: 30000
            });
            
            if (!verifyResult.output || verifyResult.output.trim() === '') {
                throw new Error('Vite config file was created but is empty');
            }

            console.log('[ViteConfigManager] Successfully created Vite config');
            return true;
        } catch (error) {
            console.error('[ViteConfigManager] Error creating Vite config:', error);
            return false;
        }
    }
}

// Create a singleton instance
const viteConfigManager = new ViteConfigManager();
module.exports = viteConfigManager; 