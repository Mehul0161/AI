const { geminiAI } = require('./ai/gemini');
const { claudeAI } = require('./ai/claude');
const { openaiAI } = require('./ai/openai');

const CODE_ASSISTANT_SYSTEM_PROMPT = `You are an expert code assistant helping users improve their generated code. Focus on providing specific, actionable feedback that helps users enhance, refactor, debug, or optimize their code. 

When responding:
- Be concise and direct
- When suggesting changes, provide the COMPLETE file content for any file you modify
- Format complete files like this:
  File: path/to/file.js
  \`\`\`javascript
  // Complete file content here
  \`\`\`
- IMPORTANT: When modifying a file:
  1. Keep all existing imports and exports
  2. Maintain compatibility with other files that import/use this file
  3. Preserve the file's interface/API if it's used by other files
  4. Keep any existing function signatures that are used elsewhere
  5. Maintain the same file structure and organization
  6. Keep any existing configuration or setup code
- Include all necessary imports, exports, and dependencies
- Focus on best practices, performance improvements, and code quality
- Explain your reasoning briefly when suggesting changes
- Consider cross-file dependencies and implications

Areas to focus on:
- Code organization and structure
- Performance optimizations
- Bug fixes and edge cases
- Modern syntax and patterns
- Accessibility improvements
- Responsive design considerations
- Code readability and maintenance`;

function getAIProvider(model) {
  if (model.includes('gemini')) return geminiAI;
  if (model.includes('claude')) return claudeAI;
  if (model.includes('gpt') || model.includes('openai') || model.includes('chatgpt')) return openaiAI;
  return geminiAI; // Default to Gemini
}

async function processCodeAssistantRequest({ message, files, model, history = [] }) {
  // Select the appropriate AI provider based on the model
  const aiProvider = getAIProvider(model);
  
  // Format the files for the context, including information about dependencies
  const fileContext = files.map(file => {
    // Find files that import/use this file
    const dependentFiles = files.filter(f => 
      f.content.includes(`import.*from.*['"]${file.path}['"]`) || 
      f.content.includes(`require.*['"]${file.path}['"]`) ||
      f.content.includes(`from.*['"]${file.path}['"]`)
    ).map(f => f.path);

    return `File: ${file.path}
Dependencies: ${dependentFiles.length > 0 ? dependentFiles.join(', ') : 'None'}
\`\`\`${file.language || ''}
${file.content}
\`\`\``;
  }).join('\n\n');
  
  // Compose the final prompt
  const finalPrompt = `${CODE_ASSISTANT_SYSTEM_PROMPT}\n\nHere are the files from the project with their dependencies:\n\n${fileContext}\n\nUser request: ${message}`;
  
  console.log('Sending request to AI with prompt:', finalPrompt);
  
  // Call the AI with the prepared prompt
  const response = await aiProvider({ 
    prompt: finalPrompt, 
    messages: history,
    model 
  });
  
  console.log('Received AI response:', response);
  
  // Parse the response
  let aiReply = '';
  try {
    const data = typeof response === 'string' ? JSON.parse(response) : response;
    
    // Handle different response formats based on the provider
    if (model.includes('gemini')) {
      aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else if (model.includes('claude')) {
      if (Array.isArray(data.content) && data.content[0]?.text) {
        aiReply = data.content.map(c => c.text).join('\n');
      } else {
        aiReply = data.content?.text || '';
      }
    } else if (model.includes('gpt') || model.includes('openai') || model.includes('chatgpt')) {
      if (Array.isArray(data.output) && Array.isArray(data.output[0]?.content) && data.output[0].content[0]?.text) {
        aiReply = data.output.map(o => o.content.map(c => c.text).join('\n')).join('\n');
      } else {
        aiReply = data.choices?.[0]?.message?.content || '';
      }
    }
  } catch (e) {
    console.error('Failed to parse AI response:', e);
    throw new Error('Failed to parse AI response: ' + e.message);
  }
  
  if (!aiReply) throw new Error('No response received from AI');
  
  console.log('Parsed AI reply:', aiReply);
  
  // Check if the reply contains code changes
  const codeChanges = extractCodeChanges(aiReply);
  console.log('Extracted code changes:', codeChanges);
  
  if (codeChanges.length > 0) {
    // Add a message about the changes
    aiReply += '\n\nI have suggested changes to the following files:\n' +
      codeChanges.map(change => `- ${change.filePath} (${change.lineRange || 'complete file'})`).join('\n') +
      '\n\nThese changes will be automatically applied.';
  }
  
  return aiReply.trim();
}

// Helper function to extract code changes from AI response
function extractCodeChanges(reply) {
  console.log('Extracting code changes from reply:', reply);
  const changes = [];
  // Look for code blocks with file paths
  const fileRegex = /File: (.*?)\n```(?:[a-zA-Z0-9]*)\n([\s\S]*?)```/g;
  let match;
  while ((match = fileRegex.exec(reply)) !== null) {
    console.log('Found code change match:', match);
    changes.push({
      filePath: match[1].trim(),
      newContent: match[2].trim()
    });
  }
  console.log('Extracted changes:', changes);
  return changes;
}

module.exports = { processCodeAssistantRequest }; 