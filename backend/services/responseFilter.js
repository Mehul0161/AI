// responseFilter.js

function parseProjectFiles(response, provider = 'gemini') {
  let files = [];

  if (provider === 'gemini') {
    // Gemini: expects markdown code blocks with file headers
    const fileRegex = /File: (.*?)\n```(?:[a-zA-Z0-9]*)\n([\s\S]*?)```/g;
    let match;
    while ((match = fileRegex.exec(response)) !== null) {
      files.push({
        path: match[1].trim(),
        content: match[2].trim()
      });
    }
  } else if (provider === 'claude') {
    // Claude: expects File: ...\n<content>\nFile: ...
    const fileRegex = /File: (.*?)\n([\s\S]*?)(?=File:|$)/g;
    let match;
    while ((match = fileRegex.exec(response)) !== null) {
      files.push({
        path: match[1].trim(),
        content: match[2].trim()
      });
    }
  } else if (provider === 'openai') {
    // OpenAI: expects markdown code blocks with file headers
    const fileRegex = /File: (.*?)\n```[a-zA-Z0-9]*\n([\s\S]*?)```/g;
    let match;
    while ((match = fileRegex.exec(response)) !== null) {
      files.push({
        path: match[1].trim(),
        content: match[2].trim()
      });
    }
  } else {
    // Fallback: try to parse as Gemini/OpenAI style
    const fileRegex = /File: (.*?)\n```[a-zA-Z0-9]*\n([\s\S]*?)```/g;
    let match;
    while ((match = fileRegex.exec(response)) !== null) {
      files.push({
        path: match[1].trim(),
        content: match[2].trim()
      });
    }
  }

  if (files.length === 0) {
    throw new Error('No valid files were parsed from the AI response');
  }

  return files;
}

function filterAIResponse(data, technology) {
  // Validate response structure
  if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
    throw new Error('Invalid response structure from AI service');
  }

  if (!data.candidates[0].content || !data.candidates[0].content.parts || !Array.isArray(data.candidates[0].content.parts) || data.candidates[0].content.parts.length === 0) {
    throw new Error('Invalid response content structure from AI service');
  }

  const aiResponse = data.candidates[0].content.parts[0].text;

  if (!aiResponse || typeof aiResponse !== 'string') {
    throw new Error('Invalid response text from AI service');
  }

  console.log(`${technology} code generated`);
  const files = parseProjectFiles(aiResponse);

  // Validate parsed files
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error('No valid files were parsed from the AI response');
  }

  return files;
}

module.exports = { filterAIResponse, parseProjectFiles }; 