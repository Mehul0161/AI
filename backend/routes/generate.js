const express = require('express');
const router = express.Router();
const { generateCode } = require('../services/generateCode');
const { parseProjectFiles } = require('../services/responseFilter');

function extractCodeTextFromResponse(response, provider) {
  let data;
  try {
    data = typeof response === 'string' ? JSON.parse(response) : response;
  } catch (e) {
    data = response;
  }
  if (provider === 'gemini') {
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } else if (provider === 'claude') {
    // Claude: response.content[0].text
    if (Array.isArray(data.content) && data.content[0]?.text) {
      return data.content.map(c => c.text).join('\n');
    }
    return data.content?.text || '';
  } else if (provider === 'openai') {
    // OpenAI: response.output[0].content[0].text
    if (Array.isArray(data.output) && Array.isArray(data.output[0]?.content) && data.output[0].content[0]?.text) {
      return data.output.map(o => o.content.map(c => c.text).join('\n')).join('\n');
    }
    return data.choices?.[0]?.message?.content || '';
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
    let codeText = extractCodeTextFromResponse(codeResponse, provider);
    if (provider === 'claude' && Array.isArray(codeText)) {
      codeText = codeText.map(item => (typeof item === 'string' ? item : item.text || '')).join('\n');
    }
    console.log('Provider:', provider);
    console.log('Extracted codeText (first 500 chars):', typeof codeText === 'string' ? codeText.slice(0, 500) : JSON.stringify(codeText).slice(0, 500));
    if (typeof codeResponse === 'string') {
      console.log('Raw AI response (first 500 chars):', codeResponse.slice(0, 500));
    } else {
      console.log('Raw AI response (object):', JSON.stringify(codeResponse).slice(0, 500));
    }
    const files = parseProjectFiles(codeText, provider).map(file => ({
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