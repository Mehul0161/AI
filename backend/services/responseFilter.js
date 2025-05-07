 // responseFilter.js

function parseProjectFiles(response, provider = 'gemini') {
    let files = [];
    let projectName = 'Project'; // Default name
  
    // Try to extract project name from the response
    const projectNameMatch = response.match(/Project Name:?\s*([^\n]+)/i) || 
                            response.match(/project-name:?\s*([^\n]+)/i) || 
                            response.match(/project name:?\s*([^\n]+)/i) ||
                            response.match(/\/project-name\/([^\/\n]+)/i);
    
    if (projectNameMatch && projectNameMatch[1]) {
      projectName = projectNameMatch[1].trim();
    }
  
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
      // Claude: supports both plain and code block formats
      // 1. Try code block format first
      const codeBlockRegex = /File: (.*?)\n```([a-zA-Z0-9]*)\n([\s\S]*?)```/g;
      let match;
      while ((match = codeBlockRegex.exec(response)) !== null) {
        files.push({
          path: match[1].trim(),
          content: match[3].trim()
        });
      }
      // 2. Fallback to plain text format
      const plainRegex = /File: (.*?)\n([\s\S]*?)(?=File:|$)/g;
      while ((match = plainRegex.exec(response)) !== null) {
        // Only add if not already present (avoid duplicates)
        if (!files.some(f => f.path === match[1].trim())) {
          files.push({
            path: match[1].trim(),
            content: match[2].trim()
          });
        }
      }
       // Merge '[continued]' files into their base file
       const merged = {};
       files.forEach(file => {
         // Check if file is a continued part
         const continuedMatch = file.path.match(/^(.*?)(\[continued\])$/i) || file.path.match(/^(.*?)(\(continued\))$/i);
         if (continuedMatch) {
           const base = continuedMatch[1];
           if (!merged[base]) merged[base] = '';
           merged[base] += '\n' + file.content;
         } else {
           if (!merged[file.path]) merged[file.path] = '';
           merged[file.path] += '\n' + file.content;
         }
       });
       files = Object.entries(merged).map(([path, content]) => ({ path, content: content.trim() }));
     
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
  
    return { files, projectName };
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
    const { files, projectName } = parseProjectFiles(aiResponse);
  
    // Validate parsed files
    if (!Array.isArray(files) || files.length === 0) {
      throw new Error('No valid files were parsed from the AI response');
    }
  
    return { files, projectName };
  }
  
  module.exports = { filterAIResponse, parseProjectFiles }; 