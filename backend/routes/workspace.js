const express = require('express');
const router = express.Router();
const workspaceManager = require('../services/workspaceManager');

// Cleanup workspace when user leaves
router.delete('/:workspaceId', async (req, res) => {
    const { workspaceId } = req.params;
    console.log(`[WorkspaceRoute] Received cleanup request for workspace: ${workspaceId}`);

    try {
        await workspaceManager.cleanupWorkspace(workspaceId);
        res.json({ message: 'Workspace cleaned up successfully' });
    } catch (error) {
        console.error(`[WorkspaceRoute] Error cleaning up workspace ${workspaceId}:`, error);
        res.status(500).json({ error: 'Failed to clean up workspace' });
    }
});

module.exports = router; 