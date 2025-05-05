const { Daytona } = require("@daytonaio/sdk");
const dotenv = require('dotenv');
const https = require('https');

dotenv.config();

// Cache for workspaces
const workspaceCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Custom HTTPS agent to ignore certificate errors
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

async function createWorkspace(technology) {
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
                NODE_ENV: 'development'
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

        // Wait for workspace to be ready
        let attempts = 0;
        const maxAttempts = 10;
        while (attempts < maxAttempts) {
            const info = await workspace.info();
            if (info.state === 'started') {
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
            attempts++;
        }

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

