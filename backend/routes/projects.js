const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const User = require('../models/User');
const auth = require('../middleware/auth');

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
    
    // Create new project
    const project = new Project({
      name,
      technology,
      files,
      user: req.user._id
    });
    
    await project.save();
    
    // Add project to user's projects array
    req.user.projects.push(project._id);
    await req.user.save();
    
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: 'Error creating project' });
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

module.exports = router; 