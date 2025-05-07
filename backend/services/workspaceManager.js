const activeWorkspaces = new Map();

class WorkspaceManager {
    constructor() {
        this.activeWorkspaces = new Map();
    }

    addWorkspace(workspaceId, workspace) {
        console.log(`[WorkspaceManager] Adding workspace: ${workspaceId}`);
        this.activeWorkspaces.set(workspaceId, {
            workspace,
            lastAccessed: Date.now(),
            sessionId: `deploy-${Date.now()}`
        });
    }

    async cleanupWorkspace(workspaceId) {
        console.log(`[WorkspaceManager] Cleaning up workspace: ${workspaceId}`);
        const workspaceData = this.activeWorkspaces.get(workspaceId);
        
        if (!workspaceData) {
            console.log(`[WorkspaceManager] Workspace ${workspaceId} not found`);
            return;
        }

        try {
            // Clean up the session
            if (workspaceData.sessionId) {
                console.log(`[WorkspaceManager] Cleaning up session: ${workspaceData.sessionId}`);
                await workspaceData.workspace.process.deleteSession(workspaceData.sessionId);
            }

            // Remove from active workspaces
            this.activeWorkspaces.delete(workspaceId);
            console.log(`[WorkspaceManager] Workspace ${workspaceId} cleaned up successfully`);
        } catch (error) {
            console.error(`[WorkspaceManager] Error cleaning up workspace ${workspaceId}:`, error);
            throw error;
        }
    }

    updateLastAccessed(workspaceId) {
        const workspaceData = this.activeWorkspaces.get(workspaceId);
        if (workspaceData) {
            workspaceData.lastAccessed = Date.now();
        }
    }

    getWorkspace(workspaceId) {
        this.updateLastAccessed(workspaceId);
        return this.activeWorkspaces.get(workspaceId)?.workspace;
    }
}

// Create a singleton instance
const workspaceManager = new WorkspaceManager();
module.exports = workspaceManager; 