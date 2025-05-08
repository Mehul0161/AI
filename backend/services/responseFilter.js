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
      let currentFile = null;
      let currentContent = '';

      // Split response into lines for better parsing
      const lines = response.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Check for file header
        const fileMatch = line.match(/^File: (.*?)$/);
        if (fileMatch) {
          // If we have a previous file, save it
          if (currentFile) {
            let content = currentContent.trim();
            
            // Fix package.json if needed
            if (currentFile === 'package.json') {
              if (!content.startsWith('{')) {
                content = '{' + content;
              }
              if (!content.endsWith('}')) {
                content = content + '}';
              }
              try {
                // Validate JSON
                JSON.parse(content);
              } catch (e) {
                console.error('[ResponseFilter] Invalid package.json:', e);
                content = JSON.stringify({
                  name: projectName.toLowerCase().replace(/\s+/g, '-'),
                  private: true,
                  version: "0.0.0",
                  type: "module",
                  scripts: {
                    dev: "vite",
                    build: "vite build",
                    lint: "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0",
                    preview: "vite preview"
                  },
                  dependencies: {
                    "@fortawesome/react-fontawesome": "^0.2.0",
                    "react": "^18.2.0",
                    "react-dom": "^18.2.0"
                  },
                  devDependencies: {
                    "@types/react": "^18.2.15",
                    "@types/react-dom": "^18.2.7",
                    "@vitejs/plugin-react": "^4.0.3",
                    "autoprefixer": "^10.4.17",
                    "eslint": "^8.45.0",
                    "eslint-plugin-react": "^7.32.2",
                    "eslint-plugin-react-hooks": "^4.6.0",
                    "eslint-plugin-react-refresh": "^0.4.3",
                    "postcss": "^8.4.35",
                    "tailwindcss": "^3.4.1",
                    "vite": "^4.4.5"
                  }
                }, null, 2);
              }
            }
            
            files.push({
              path: currentFile,
              content: content
            });
          }
          // Start new file
          currentFile = fileMatch[1].trim();
          currentContent = '';
          continue;
        }

        // Check for code block start
        if (line.startsWith('```')) {
          // Skip the language identifier line
          i++;
          continue;
        }

        // Check for code block end
        if (line === '```') {
          // Save the current file
          if (currentFile) {
            let content = currentContent.trim();
            
            // Fix package.json if needed
            if (currentFile === 'package.json') {
              if (!content.startsWith('{')) {
                content = '{' + content;
              }
              if (!content.endsWith('}')) {
                content = content + '}';
              }
              try {
                // Validate JSON
                JSON.parse(content);
              } catch (e) {
                console.error('[ResponseFilter] Invalid package.json:', e);
                content = JSON.stringify({
                  name: projectName.toLowerCase().replace(/\s+/g, '-'),
                  private: true,
                  version: "0.0.0",
                  type: "module",
                  scripts: {
                    dev: "vite",
                    build: "vite build",
                    lint: "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0",
                    preview: "vite preview"
                  },
                  dependencies: {
                    "@fortawesome/react-fontawesome": "^0.2.0",
                    "react": "^18.2.0",
                    "react-dom": "^18.2.0"
                  },
                  devDependencies: {
                    "@types/react": "^18.2.15",
                    "@types/react-dom": "^18.2.7",
                    "@vitejs/plugin-react": "^4.0.3",
                    "autoprefixer": "^10.4.17",
                    "eslint": "^8.45.0",
                    "eslint-plugin-react": "^7.32.2",
                    "eslint-plugin-react-hooks": "^4.6.0",
                    "eslint-plugin-react-refresh": "^0.4.3",
                    "postcss": "^8.4.35",
                    "tailwindcss": "^3.4.1",
                    "vite": "^4.4.5"
                  }
                }, null, 2);
              }
            }
            
            files.push({
              path: currentFile,
              content: content
            });
            currentFile = null;
            currentContent = '';
          }
          continue;
        }

        // Add line to current content if we're in a file
        if (currentFile) {
          currentContent += line + '\n';
        }
      }

      // Save the last file if exists
      if (currentFile && currentContent) {
        let content = currentContent.trim();
        
        // Fix package.json if needed
        if (currentFile === 'package.json') {
          if (!content.startsWith('{')) {
            content = '{' + content;
          }
          if (!content.endsWith('}')) {
            content = content + '}';
          }
          try {
            // Validate JSON
            JSON.parse(content);
          } catch (e) {
            console.error('[ResponseFilter] Invalid package.json:', e);
            content = JSON.stringify({
              name: projectName.toLowerCase().replace(/\s+/g, '-'),
              private: true,
              version: "0.0.0",
              type: "module",
              scripts: {
                dev: "vite",
                build: "vite build",
                lint: "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0",
                preview: "vite preview"
              },
              dependencies: {
                "@fortawesome/react-fontawesome": "^0.2.0",
                "react": "^18.2.0",
                "react-dom": "^18.2.0"
              },
              devDependencies: {
                "@types/react": "^18.2.15",
                "@types/react-dom": "^18.2.7",
                "@vitejs/plugin-react": "^4.0.3",
                "autoprefixer": "^10.4.17",
                "eslint": "^8.45.0",
                "eslint-plugin-react": "^7.32.2",
                "eslint-plugin-react-hooks": "^4.6.0",
                "eslint-plugin-react-refresh": "^0.4.3",
                "postcss": "^8.4.35",
                "tailwindcss": "^3.4.1",
                "vite": "^4.4.5"
              }
            }, null, 2);
          }
        }
        
        files.push({
          path: currentFile,
          content: content
        });
      }
    } else if (provider === 'claude') {
      // Claude: supports both plain and code block formats
      // 1. Try code block format first
      const codeBlockRegex = /File: (.*?)\n```([a-zA-Z0-9]*)\n([\s\S]*?)```/g;
      let match;
      while ((match = codeBlockRegex.exec(response)) !== null) {
        const filePath = match[1].trim();
        const content = match[3].trim();
        
        if (!content) {
          console.log(`[ResponseFilter] Warning: Empty content for file ${filePath}`);
          continue;
        }

        files.push({
          path: filePath,
          content: content
        });
      }
      
      // 2. Fallback to plain text format
      const plainRegex = /File: (.*?)\n([\s\S]*?)(?=File:|$)/g;
      while ((match = plainRegex.exec(response)) !== null) {
        const filePath = match[1].trim();
        const content = match[2].trim();
        
        // Only add if not already present and content is not empty
        if (!files.some(f => f.path === filePath) && content) {
          files.push({
            path: filePath,
            content: content
          });
        }
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
  
    // Validate files
    if (files.length === 0) {
      console.error('[ResponseFilter] No files found in response. Raw response:', response);
      throw new Error('No valid files were parsed from the AI response');
    }

    // Log parsed files for debugging
    console.log('[ResponseFilter] Parsed files:');
    files.forEach(file => {
      console.log(`[ResponseFilter] File: ${file.path}, Content length: ${file.content.length}`);
      if (file.content.length === 0) {
        console.log(`[ResponseFilter] Warning: Empty content for file ${file.path}`);
      }
    });
  
    // After parsing files, verify and fix structure
    const fixedFiles = verifyAndFixFileStructure(files);
    
    // After fixing structure, inject Vite config
    const filesWithConfig = injectViteConfig(fixedFiles);
  
    return { files: filesWithConfig, projectName };
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
  
function injectViteConfig(files) {
    // Find or create vite.config.js
    const viteConfigIndex = files.findIndex(file => file.path === 'vite.config.js');
    const viteConfig = {
        path: 'vite.config.js',
        content: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    strictPort: true,
    hmr: {
      protocol: 'wss',
      host: 'localhost',
      port: 443,
      clientPort: 443
    },
    watch: {
      usePolling: true
    },
    allowedHosts: [
      'all',
      'localhost',
      '*.daytona.work',
      '*.daytona.io',
      '*.daytona.dev',
      /^3000-.*\\.daytona\\.work$/,
      /^3000-.*\\.daytona\\.io$/,
      /^3000-.*\\.daytona\\.dev$/
    ],
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'X-Frame-Options': 'ALLOWALL',
      'Content-Security-Policy': "frame-ancestors *"
    }
  },
  preview: {
    port: 3000,
    host: true,
    strictPort: true
  }
})`
    };

    if (viteConfigIndex === -1) {
        files.push(viteConfig);
    } else {
        files[viteConfigIndex] = viteConfig;
    }

    return files;
}

function verifyAndFixFileStructure(files) {
    console.log('[ResponseFilter] Verifying file structure...');
    
    // Expected structure for a Vite React project
    const expectedStructure = {
        'package.json': true,
        'vite.config.js': true,
        'index.html': true,
        'src/main.jsx': true,
        'src/App.jsx': true,
        'src/index.css': true,
        'public/': true
    };

    // Check if all required files exist
    const existingFiles = new Set(files.map(f => f.path));
    console.log('[ResponseFilter] Existing files:', Array.from(existingFiles));

    // Fix file paths and ensure correct structure
    const fixedFiles = files.map(file => {
        let fixedPath = file.path;
        
        // Remove any leading slashes or unnecessary prefixes
        fixedPath = fixedPath.replace(/^[\/\\]+/, '');
        
        // Ensure src files are in the correct location
        if (fixedPath.includes('src/') || fixedPath.includes('src\\')) {
            fixedPath = fixedPath.replace(/^.*?[\/\\]src[\/\\]/, 'src/');
        }
        
        // Ensure public files are in the correct location
        if (fixedPath.includes('public/') || fixedPath.includes('public\\')) {
            fixedPath = fixedPath.replace(/^.*?[\/\\]public[\/\\]/, 'public/');
        }

        // Ensure root files are in the correct location
        if (['package.json', 'vite.config.js', 'index.html'].includes(fixedPath)) {
            fixedPath = fixedPath.replace(/^.*?[\/\\]/, '');
        }

        console.log(`[ResponseFilter] Fixed path: ${file.path} -> ${fixedPath}`);
        return {
            ...file,
            path: fixedPath
        };
    });

    // Log the final structure
    console.log('[ResponseFilter] Final file structure:');
    fixedFiles.forEach(file => {
        console.log(`[ResponseFilter] ${file.path}`);
    });

    return fixedFiles;
}
  
module.exports = { filterAIResponse, parseProjectFiles }; 