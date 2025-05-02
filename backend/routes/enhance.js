const express = require('express');
const router = express.Router();
const { enhancePrompt } = require('../services/enhancePrompt');

// POST /enhance
router.post('/', async (req, res) => {
  const { prompt, technology, techContext } = req.body;
  if (!prompt || !technology) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const enhanced = await enhancePrompt({ prompt, technology, techContext });
    res.json({ enhancedPrompt: enhanced });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to enhance prompt' });
  }
});

module.exports = router; 