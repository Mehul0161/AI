const express = require('express');
const router = express.Router();
const { generateCode } = require('../services/generateCode');
const { parseProjectFiles } = require('../services/responseFilter');

function extractCodeTextFromResponse(response, provider) {
  if (provider === 'gemini') {
    try {
      const data = typeof response === 'string' ? JSON.parse(response) : response;
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (e) { return ''; }
  } else if (provider === 'claude') {
    try {
      const data = typeof response === 'string' ? JSON.parse(response) : response;
      return data.content || '';
    } catch (e) { return ''; }
  } else if (provider === 'openai') {
    try {
      const data = typeof response === 'string' ? JSON.parse(response) : response;
      return data.choices?.[0]?.message?.content || '';
    } catch (e) { return ''; }
  }
  return '';
}

function getProviderFromModel(model) {
  if (model.includes('gemini')) return 'gemini';
  if (model.includes('claude')) return 'claude';
  if (model.includes('gpt') || model.includes('openai') || model.includes('chatgpt')) return 'openai';
  return 'unknown';
}

// POST /generate
router.post('/', async (req, res) => {
  const { prompt, technology, model } = req.body;
  console.log('Received /generate request:', req.body);
  if (!prompt || !technology || !model) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const codeResponse = await generateCode({ prompt, technology, model });
    console.log('Raw AI response:', codeResponse);
    const provider = getProviderFromModel(model.toLowerCase());
    const codeText = extractCodeTextFromResponse(codeResponse, provider);
    const files = parseProjectFiles(codeText).map(file => ({
      ...file,
      provider,
      model,
      technology
    }));
    if (!Array.isArray(files) || files.length === 0) {
      throw new Error('No valid files were parsed from the AI response');
    }
    res.json({ files });
  } catch (err) {
    console.error('Error in /generate:', err);
    res.status(500).json({ error: err.message || 'Failed to generate code' });
  }
});

module.exports = router; 