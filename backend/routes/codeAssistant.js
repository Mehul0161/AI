const express = require('express');
const router = express.Router();
const { processCodeAssistantRequest } = require('../services/codeAssistant');

// POST /code-assistant
router.post('/', async (req, res) => {
  const { message, files, model, history } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Missing user message' });
  }
  
  if (!files || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: 'No files provided for context' });
  }
  
  if (!model) {
    return res.status(400).json({ error: 'No AI model specified' });
  }
  
  try {
    const aiReply = await processCodeAssistantRequest({ 
      message, 
      files, 
      model,
      history: Array.isArray(history) ? history : [] 
    });
    
    res.json({ reply: aiReply });
  } catch (err) {
    console.error('Error in /code-assistant:', err);
    res.status(500).json({ error: err.message || 'Failed to get AI response' });
  }
});

module.exports = router; 