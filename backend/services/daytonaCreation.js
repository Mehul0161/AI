const { Daytona } = require("@daytonaio/sdk");
const dotenv = require('dotenv');
const https = require('https');
const { deployToWorkspace, isWorkspaceReady, getPreviewUrl } = require('./workspaceDeployer');

dotenv.config();

// Cache for workspaces
const workspaceCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Custom HTTPS agent to ignore certificate errors
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

async function createWorkspace(technology, files) {
    try {
        const cacheKey = `${technology}-${Date.now()}`;
        
        // Check cache first
        const cachedWorkspace = workspaceCache.get(cacheKey);
        if (cachedWorkspace && (Date.now() - cachedWorkspace.timestamp) < CACHE_TTL) {
            console.log('Using cached workspace');
            return cachedWorkspace.workspace;
        }

        const daytona = new Daytona({
            apiKey: process.env.DAYTONA_API_KEY,
            apiUrl: process.env.DAYTONA_API_URL || 'https://app.daytona.io/api',
            httpsAgent
        });

        const language = technology.toLowerCase().includes('react') ? 'typescript' : 'javascript';
        
        const workspace = await daytona.create({
            name: `${technology}-${Date.now()}`,
            image: 'daytonaio/ai-test:0.2.3',
            env: {
                NODE_ENV: 'development',
                PORT: '3000',
                HOST: '0.0.0.0'
            },
            resources: {
                cpu: 2,
                memory: 4,
                disk: 5
            },
            language,
            public: true, // Make workspace publicly accessible
            ports: [{
                port: 3000,
                public: true,
                protocol: 'http'
            }]
        });

        // Wait for workspace to be ready with increased timeout
        let attempts = 0;
        const maxAttempts = 30; // Increased from 10 to 30
        while (attempts < maxAttempts) {
            if (await isWorkspaceReady(workspace)) {
                // Additional wait to ensure the workspace is fully ready
                await new Promise(resolve => setTimeout(resolve, 5000));
                break;
            }
            console.log(`Waiting for workspace to start... Attempt ${attempts + 1}/${maxAttempts}`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
            attempts++;
        }

        if (attempts >= maxAttempts) {
            console.error('Workspace failed to start within the timeout period');
            return null;
        }

        // Deploy files to workspace
        if (files && files.length > 0) {
            const deploymentSuccess = await deployToWorkspace(workspace, files, technology);
            if (!deploymentSuccess) {
                console.error('Failed to deploy files to workspace');
                return null;
            }
        }

        // Get the preview URL
        const previewUrl = await getPreviewUrl(workspace);
        workspace.previewUrl = previewUrl;

        // Cache the workspace
        workspaceCache.set(cacheKey, {
            workspace,
            timestamp: Date.now()
        });

        // Clean up old cache entries
        const now = Date.now();
        for (const [key, value] of workspaceCache.entries()) {
            if (now - value.timestamp > CACHE_TTL) {
                workspaceCache.delete(key);
            }
        }

        return workspace;
    } catch (error) {
        console.error('Error creating workspace:', error.message);
        if (error.response) {
            console.error('Error details:', error.response.data);
        }
        return null;
    }
}

module.exports = { createWorkspace };

