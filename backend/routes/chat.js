const express = require('express');
const router = express.Router();
const { geminiAI } = require('../services/ai/gemini');

// POST /chat
router.post('/', async (req, res) => {
  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Missing user message' });
  }
  try {
    // Compose messages for Gemini
    const messages = Array.isArray(history) ? history : [];
    messages.push({ role: 'user', content: message });
    const model = 'gemini-2.0-flash';
    const response = await geminiAI({ prompt: '', messages, model });
    let aiText = '';
    try {
      const data = typeof response === 'string' ? JSON.parse(response) : response;
      aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (e) {
      aiText = '';
    }
    if (!aiText) throw new Error('No AI response');
    res.json({ reply: aiText });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to get AI reply' });
  }
});

module.exports = router; 