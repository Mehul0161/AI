const express = require('express');
const router = express.Router();
const { generateCode } = require('../services/generateCode');
const { parseProjectFiles } = require('../services/responseFilter');
const { createWorkspace } = require('../services/daytonaCreation');

// Track active requests to prevent duplicates
const activeRequests = new Map();

// Function to extract relevant workspace info
function extractWorkspaceInfo(workspace) {
  if (!workspace) return null;
  
  const nodeDomain = workspace.instance?.info?.nodeDomain;
  const workspaceId = workspace.id;
  
  return {
    id: workspaceId,
    name: workspace.name,
    state: workspace.instance?.state,
    nodeDomain: nodeDomain,
    region: workspace.instance?.info?.region,
    resources: {
      cpu: workspace.instance?.cpu,
      memory: workspace.instance?.memory,
      disk: workspace.instance?.disk
    },
    created: workspace.instance?.info?.created,
    updatedAt: workspace.instance?.info?.updatedAt,
    previewUrl: nodeDomain ? `https://3000-${workspaceId}.${nodeDomain}` : null
  };
}

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
  try {
    console.log(`[${Date.now()}] Received /generate request:`, req.body);
    
    // Set a longer timeout for the response
    req.setTimeout(300000); // 5 minutes
    
    const requestId = Date.now();
    const requestKey = `${req.body.prompt}-${req.body.technology}-${req.body.model}`;
    
    // Check if this exact request is already being processed
    if (activeRequests.has(requestKey)) {
      console.log(`[${requestId}] Duplicate request detected, returning existing response`);
      return res.status(429).json({ error: 'Request already in progress' });
    }
    
    const { prompt, technology, model } = req.body;
    
    if (!prompt || !technology || !model) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Mark this request as active
    activeRequests.set(requestKey, requestId);

    let workspaceInfo = null;
    let workspace = null;

    // Generate code first
    const codeResponse = await generateCode({ prompt, technology, model });
    console.log(`[${requestId}] Raw AI response created`);
    const provider = getProviderFromModel(model.toLowerCase());
    let codeText = extractCodeTextFromResponse(codeResponse, provider);
    if (provider === 'claude' && Array.isArray(codeText)) {
      codeText = codeText.map(item => (typeof item === 'string' ? item : item.text || '')).join('\n');
    }
    console.log(`[${requestId}] Provider:`, provider);
    console.log(`[${requestId}] Extracted codeText (first 500 chars):`, typeof codeText === 'string' ? codeText.slice(0, 500) : JSON.stringify(codeText).slice(0, 500));
    
    const { files, projectName } = parseProjectFiles(codeText, provider);
    const processedFiles = files.map(file => ({
      ...file,
      provider,
      model,
      technology
    }));
    
    if (!Array.isArray(processedFiles) || processedFiles.length === 0) {
      throw new Error('No valid files were parsed from the AI response');
    }

    // Create workspace and deploy files if not static
    if (technology !== 'Static') {
      console.log(`[${requestId}] Creating workspace with ${processedFiles.length} files`);
      try {
        workspace = await createWorkspace(technology, processedFiles);
        if (workspace) {
          workspaceInfo = extractWorkspaceInfo(workspace);
          console.log(`[${requestId}] Workspace created and files deployed:`, workspaceInfo);
        } else {
          console.error(`[${requestId}] Failed to create workspace and deploy files`);
        }
      } catch (error) {
        console.error(`[${requestId}] Error creating workspace and deploying files:`, error);
      }
    }
    
    res.json({ 
      files: processedFiles,
      projectName,
      workspace: workspaceInfo
    });
  } catch (error) {
    console.error('Generate error:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate project',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    // Clean up the request tracking
    activeRequests.delete(requestKey);
  }
});


module.exports = router; 