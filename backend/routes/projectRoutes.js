const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');

// Download project files
router.get('/:projectId/download', async (req, res) => {
  try {
    const { projectId } = req.params;
    const projectPath = path.join(__dirname, '..', 'projects', projectId);

    // Check if project directory exists
    if (!fs.existsSync(projectPath)) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Create a zip archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=project-${projectId}.zip`);

    // Pipe archive data to response
    archive.pipe(res);

    // Add project files to archive
    archive.directory(projectPath, false);

    // Finalize the archive
    await archive.finalize();
  } catch (error) {
    console.error('Error downloading project:', error);
    res.status(500).json({ error: 'Failed to download project' });
  }
});

module.exports = router; 