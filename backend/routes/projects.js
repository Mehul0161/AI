const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const User = require('../models/User');
const auth = require('../middleware/auth');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');

// Get all projects for a user
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find({ user: req.user._id })
      .select('name technology createdAt')
      .sort({ createdAt: -1 });
    res.json({ projects });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching projects' });
  }
});

// Get a specific project
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching project' });
  }
});

// Create a new project
router.post('/', auth, async (req, res) => {
  try {
    const { name, technology, files } = req.body;
    
    if (!name || !technology || !files || !Array.isArray(files)) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: {
          name: !name ? 'Project name is required' : null,
          technology: !technology ? 'Technology is required' : null,
          files: !files ? 'Files are required' : !Array.isArray(files) ? 'Files must be an array' : null
        }
      });
    }

    // Validate files array
    for (const file of files) {
      if (!file.path || !file.content) {
        return res.status(400).json({
          error: 'Invalid file format',
          details: 'Each file must have path and content'
        });
      }
    }
    
    // Create new project
    const project = new Project({
      name,
      technology,
      files,
      user: req.user._id
    });
    
    await project.save();
    
    // Add project to user's projects array
    await User.findByIdAndUpdate(
      req.user._id,
      { $push: { projects: project._id } }
    );
    
    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ 
      error: 'Error creating project',
      details: error.message
    });
  }
});

// Update a project
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, files } = req.body;
    
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { name, files, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Error updating project' });
  }
});

// Delete a project
router.delete('/:id', auth, async (req, res) => {
  try {
    // Find and delete the project in one operation
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Remove project reference from user's projects array
    await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { projects: req.params.id } }
    );
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Error deleting project: ' + error.message });
  }
});

// Download project files
router.get('/:projectId/download', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Find the project in the database
    const project = await Project.findOne({
      _id: projectId,
      user: req.user._id
    });
    
    if (!project) {
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

    // Add each file to the archive
    project.files.forEach(file => {
      archive.append(file.content, { name: file.path });
    });

    // Finalize the archive
    await archive.finalize();
  } catch (error) {
    console.error('Error downloading project:', error);
    res.status(500).json({ error: 'Failed to download project' });
  }
});

module.exports = router; 