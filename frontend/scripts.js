// Sidebar functionality
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const openSidebarBtn = document.getElementById('openSidebarBtn');
const closeSidebarBtn = document.getElementById('closeSidebar');
openSidebarBtn.addEventListener('click', () => {
  sidebar.classList.remove('translate-x-full');
  sidebarOverlay.classList.remove('hidden');
});
closeSidebarBtn.addEventListener('click', () => {
  sidebar.classList.add('translate-x-full');
  sidebarOverlay.classList.add('hidden');
});

// Close sidebar if overlay is clicked
window.closeSidebarOnOverlay = function(event) {
  if (event.target === sidebarOverlay) {
    sidebar.classList.add('translate-x-full');
    sidebarOverlay.classList.add('hidden');
  }
};

// Credits Used Section (dynamic)
let creditsUsed = 0;
const creditsMax = 5;
const creditsText = document.getElementById('creditsText');
const creditsDetail = document.getElementById('creditsDetail');
const creditsBar = document.getElementById('creditsBar');
function updateCreditsDisplay() {
  creditsText.textContent = `${creditsUsed}/${creditsMax}`;
  creditsDetail.textContent = `${creditsUsed} of your daily credits used`;
  creditsBar.style.width = `${(creditsUsed / creditsMax) * 100}%`;
}
updateCreditsDisplay();

// Sidebar actions as global functions for onclick
window.openSettingsModal = function() {
  document.getElementById('settingsModal').classList.remove('hidden');
};
window.closeSettingsModal = function() {
  document.getElementById('settingsModal').classList.add('hidden');
};
window.toggleTheme = function() {
  const html = document.documentElement;
  const themeIcon = document.getElementById('themeIcon');
  if (html.classList.contains('light')) {
    html.classList.remove('light');
    html.classList.add('dark');
    // Optionally switch icon to moon
    if (themeIcon) themeIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"/>';
  } else {
    html.classList.remove('dark');
    html.classList.add('light');
    // Optionally switch icon to sun
    if (themeIcon) themeIcon.innerHTML = '<circle cx="12" cy="12" r="5"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 1v2m0 16v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M6.05 17.95l-1.414 1.414M17.95 17.95l-1.414-1.414M6.05 6.05L4.636 4.636"/>';
  }
};
window.openHelpCenter = function() {
  window.open('help.html', '_blank');
};
window.openInviteModal = function() {
  document.getElementById('inviteModal').classList.remove('hidden');
};
window.closeInviteModal = function() {
  document.getElementById('inviteModal').classList.add('hidden');
};
window.signOut = function() {
  alert('Sign out functionality coming soon!');
};

// Sign In Modal logic
window.openSignInModal = function() {
  document.getElementById('signInModal').classList.remove('hidden');
};
window.closeSignInModal = function() {
  document.getElementById('signInModal').classList.add('hidden');
};
const signInForm = document.getElementById('signInForm');
if (signInForm) {
  signInForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const username = document.getElementById('signInUsername').value.trim();
    const email = document.getElementById('signInEmail').value.trim();
    const password = document.getElementById('signInPassword').value;
    try {
      const res = await fetch('http://localhost:4000/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Signed in successfully!');
        window.closeSignInModal();
        localStorage.setItem('codexUserEmail', email);
        localStorage.setItem('codexUserName', username);
        updateSidebarUser(username, email);
      } else {
        alert(data.error || 'Sign in failed.');
      }
    } catch (err) {
      alert('Network error: ' + err.message);
    }
  });
}

// Enhance and Generate button functionality
const enhanceBtn = document.getElementById('enhanceBtn');
const spinner = enhanceBtn ? enhanceBtn.querySelector('.enhance-spinner') : null;
if (enhanceBtn) enhanceBtn.addEventListener('click', async () => {
  const promptInput = document.getElementById('prompt');
  const techSelect = document.getElementById('tech');
  const prompt = promptInput.value.trim();
  const technology = techSelect.value;
  const techContext = '';

  if (!prompt) {
    alert('Please enter a prompt to enhance.');
    return;
  }

  enhanceBtn.disabled = true;
  if (spinner) spinner.classList.remove('hidden');

  try {
    const response = await fetch('http://localhost:4000/enhance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, technology, techContext })
    });
    const data = await response.json();
    if (data.enhancedPrompt) {
      promptInput.value = data.enhancedPrompt;
    } else {
      alert('Enhancement failed: ' + (data.error || 'Unknown error'));
    }
  } catch (err) {
    alert('Network error: ' + err.message);
  } finally {
    enhanceBtn.disabled = false;
    if (spinner) spinner.classList.add('hidden');
  }
});
const generateBtn = document.getElementById('generateBtn');
const generatedCodeDiv = document.getElementById('generatedCode');

// Update the generate code function to track the current model
generateBtn?.addEventListener('click', async function() {
  const prompt = document.getElementById('prompt')?.value;
  const tech = document.getElementById('tech')?.value;
  const model = document.getElementById('model')?.value;
  
  if (!prompt || prompt.trim() === '') {
    alert('Please enter a prompt');
    return;
  }
  
  // Save the current model for code assistant to use
  currentModel = model;
  
  this.disabled = true;
  this.innerHTML = 'Generating <span class="animate-spin ml-2 inline-block">↻</span>';
  
  // Clear previously generated files
  generatedFiles = [];
  
  try {
    const response = await fetch('http://localhost:4000/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt, technology: tech, model })
    });
    
    const data = await response.json();
    
    if (data.error) {
      alert('Error: ' + data.error);
      this.disabled = false;
      this.innerHTML = 'Generate';
      return;
    }
    
    generatedFiles = data.files;
    projectName = data.projectName || 'Project';
    selectedFilePath = generatedFiles[0]?.path || null;
    
    // Update project name in navbar
    const projectNameEls = document.querySelectorAll('.project-name');
    projectNameEls.forEach(el => el.textContent = projectName);
    
    switchToEditorView();
  } catch (error) {
    console.error('Error generating code:', error);
    alert('Error: ' + (error.message || 'Failed to generate code'));
    this.disabled = false;
    this.innerHTML = 'Generate';
  } finally {
    this.disabled = false;
    this.innerHTML = 'Generate';
  }
});

// Editor functionality
let currentFileIndex = 0;
const editorView = document.getElementById('editorView');
const generatorView = document.getElementById('generatorView');
const fileTabs = document.getElementById('fileTabs');
const editorContent = document.getElementById('editorContent');
const backToGeneratorBtn = document.getElementById('backToGenerator');
const mainHeader = document.getElementById('mainHeader');
const monacoContainer = document.getElementById('monacoContainer');
const previewContainer = document.getElementById('previewContainer');

// Global variables
let monacoEditor = null;
let monacoLoaded = false;
let selectedFilePath = null;
let projectName = 'Project'; // Default
let generatedFiles = [];
let isPreviewMode = false;
let currentModel = 'gemini-2.0-flash';  // Default model
let currentMode = 'generator';
let currentPreviewBlobUrl = null;

function guessLanguage(filename) {
  const ext = filename.split('.').pop();
  switch (ext) {
    case 'js': return 'javascript';
    case 'ts': return 'typescript';
    case 'json': return 'json';
    case 'html': return 'html';
    case 'css': return 'css';
    case 'py': return 'python';
    case 'java': return 'java';
    case 'md': return 'markdown';
    case 'sh': return 'shell';
    case 'c': return 'c';
    case 'cpp': return 'cpp';
    case 'cs': return 'csharp';
    case 'go': return 'go';
    case 'php': return 'php';
    case 'rb': return 'ruby';
    case 'xml': return 'xml';
    case 'yml':
    case 'yaml': return 'yaml';
    case 'txt': return 'plaintext';
    default: return 'plaintext';
  }
}

// --- Hierarchical File Explorer ---
function buildFileTreeWithRoot(files, rootName) {
  const root = {};
  root[rootName] = {};
  files.forEach((file, idx) => {
    const parts = file.path.split('/');
    let node = root[rootName];
    parts.forEach((part, i) => {
      if (!node[part]) {
        node[part] = (i === parts.length - 1)
          ? { __fileIdx: idx, __isFile: true }
          : { __isFile: false };
      }
      node = node[part];
    });
  });
  return root;
}

function renderFileTree(node, parentPath = '', depth = 0) {
  const container = document.createElement('div');
  Object.entries(node).forEach(([name, value]) => {
    if (name.startsWith('__')) return; // skip meta
    const fullPath = parentPath ? parentPath + '/' + name : name;
    if (value.__isFile) {
      // File node
      const ext = name.split('.').pop();
      let icon = '<svg class="w-4 h-4 mr-2 text-blue-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4h16v16H4z"/></svg>';
      if (ext === 'js') icon = '<svg class="w-4 h-4 mr-2 text-yellow-400" fill="currentColor" viewBox="0 0 24 24"><rect width="24" height="24" rx="4"/><text x="6" y="18" font-size="12" fill="#000">JS</text></svg>';
      if (ext === 'jsx') icon = '<svg class="w-4 h-4 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 24 24"><rect width="24" height="24" rx="4"/><text x="3" y="18" font-size="12" fill="#fff">JSX</text></svg>';
      if (ext === 'ts') icon = '<svg class="w-4 h-4 mr-2 text-blue-300" fill="currentColor" viewBox="0 0 24 24"><rect width="24" height="24" rx="4"/><text x="6" y="18" font-size="12" fill="#fff">TS</text></svg>';
      if (ext === 'tsx') icon = '<svg class="w-4 h-4 mr-2 text-cyan-400" fill="currentColor" viewBox="0 0 24 24"><rect width="24" height="24" rx="4"/><text x="3" y="18" font-size="12" fill="#fff">TSX</text></svg>';
      if (ext === 'json') icon = '<svg class="w-4 h-4 mr-2 text-green-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><text x="7" y="17" font-size="10" fill="#22c55e">{}</text></svg>';
      if (ext === 'html') icon = '<svg class="w-4 h-4 mr-2 text-pink-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><text x="7" y="17" font-size="10" fill="#ec4899">&lt;/&gt;</text></svg>';
      if (ext === 'css') icon = '<svg class="w-4 h-4 mr-2 text-blue-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><text x="7" y="17" font-size="10" fill="#3b82f6">CSS</text></svg>';
      if (ext === 'scss') icon = '<svg class="w-4 h-4 mr-2 text-pink-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><text x="7" y="17" font-size="10" fill="#ec4899">SCSS</text></svg>';
      if (ext === 'md') icon = '<svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><text x="7" y="17" font-size="10" fill="#a3a3a3">MD</text></svg>';
      if (ext === 'vue') icon = '<svg class="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 24 24"><rect width="24" height="24" rx="4"/><text x="3" y="18" font-size="12" fill="#fff">VUE</text></svg>';
      if (ext === 'cjs') icon = '<svg class="w-4 h-4 mr-2 text-orange-400" fill="currentColor" viewBox="0 0 24 24"><rect width="24" height="24" rx="4"/><text x="3" y="18" font-size="12" fill="#fff">CJS</text></svg>';
      if (ext === 'mjs') icon = '<svg class="w-4 h-4 mr-2 text-yellow-300" fill="currentColor" viewBox="0 0 24 24"><rect width="24" height="24" rx="4"/><text x="3" y="18" font-size="12" fill="#fff">MJS</text></svg>';
      if (ext === 'lock') icon = '<svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><text x="7" y="17" font-size="10" fill="#6b7280">LOCK</text></svg>';
      if (ext === 'config' || name.endsWith('.config.js') || name.endsWith('.config.ts')) icon = '<svg class="w-4 h-4 mr-2 text-indigo-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><text x="5" y="17" font-size="10" fill="#6366f1">CFG</text></svg>';
      if (name === 'package.json') icon = '<svg class="w-4 h-4 mr-2 text-orange-500" fill="currentColor" viewBox="0 0 24 24"><rect width="24" height="24" rx="4"/><text x="2" y="18" font-size="10" fill="#fff">PKG</text></svg>';
      if (name === 'tsconfig.json') icon = '<svg class="w-4 h-4 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 24 24"><rect width="24" height="24" rx="4"/><text x="2" y="18" font-size="10" fill="#fff">TSCFG</text></svg>';
      if (name === 'vite.config.js' || name === 'vite.config.ts') icon = '<svg class="w-4 h-4 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><rect width="24" height="24" rx="4"/><text x="2" y="18" font-size="10" fill="#fff">VITE</text></svg>';
      if (name === 'next.config.js' || name === 'next.config.mjs') icon = '<svg class="w-4 h-4 mr-2 text-black" fill="currentColor" viewBox="0 0 24 24"><rect width="24" height="24" rx="4"/><text x="2" y="18" font-size="10" fill="#fff">NEXT</text></svg>';
      if (name === 'postcss.config.js') icon = '<svg class="w-4 h-4 mr-2 text-pink-400" fill="currentColor" viewBox="0 0 24 24"><rect width="24" height="24" rx="4"/><text x="2" y="18" font-size="10" fill="#fff">POST</text></svg>';
      if (name === 'tailwind.config.js' || name === 'tailwind.config.cjs') icon = '<svg class="w-4 h-4 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 24 24"><rect width="24" height="24" rx="4"/><text x="2" y="18" font-size="10" fill="#fff">TW</text></svg>';
      if (name === 'README.md') icon = '<svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><text x="7" y="17" font-size="10" fill="#a3a3a3">MD</text></svg>';
      if (name === '.gitignore') icon = '<svg class="w-4 h-4 mr-2 text-gray-700" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><text x="4" y="17" font-size="10" fill="#374151">GIT</text></svg>';
      if (ext === 'yml' || ext === 'yaml') icon = '<svg class="w-4 h-4 mr-2 text-green-700" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><text x="7" y="17" font-size="10" fill="#22c55e">YML</text></svg>';
      if (ext === 'env' || name === '.env') icon = '<svg class="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><text x="7" y="17" font-size="10" fill="#22c55e">ENV</text></svg>';
      // Add more icons as needed
      const fileDiv = document.createElement('div');
      fileDiv.className = `flex items-center px-3 py-2 rounded cursor-pointer text-sm mb-1 transition-colors font-medium select-none ${fullPath === selectedFilePath ? 'bg-blue-700 text-white' : 'text-gray-200 hover:bg-[#23272e]'}`;
      fileDiv.style.marginLeft = `${depth * 16}px`;
      fileDiv.innerHTML = `${icon}<span class="truncate">${name}</span>`;
      fileDiv.onclick = () => {
        openFileInMonaco(value.__fileIdx);
      };
      container.appendChild(fileDiv);
    } else {
      // Folder node
      const folderDiv = document.createElement('div');
      folderDiv.className = 'flex items-center px-3 py-2 rounded cursor-pointer text-sm mb-1 font-semibold text-gray-300 hover:bg-[#23272e] select-none';
      folderDiv.style.marginLeft = `${depth * 16}px`;
      folderDiv.innerHTML = `<svg class="w-4 h-4 mr-2 text-yellow-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 7h2l2-2h10l2 2h2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg><span>${name}</span>`;
      // Expand/collapse logic
      let expanded = true;
      const childrenContainer = renderFileTree(value, fullPath, depth + 1);
      childrenContainer.style.display = expanded ? '' : 'none';
      folderDiv.onclick = (e) => {
        e.stopPropagation();
        expanded = !expanded;
        childrenContainer.style.display = expanded ? '' : 'none';
        folderDiv.querySelector('svg').classList.toggle('rotate-90', expanded);
      };
      container.appendChild(folderDiv);
      container.appendChild(childrenContainer);
    }
  });
  return container;
}

function renderFileExplorer() {
  const explorer = document.getElementById('fileExplorer');
  if (!explorer) return;
  explorer.innerHTML = '';
  if (!generatedFiles || generatedFiles.length === 0) {
    explorer.innerHTML = '<div class="text-gray-500 text-sm px-2 py-1">No files</div>';
    return;
  }
  const tree = buildFileTreeWithRoot(generatedFiles, projectName);
  explorer.appendChild(renderFileTree(tree));
}

function openFileInMonaco(idx) {
  if (!window.monaco || !generatedFiles[idx]) return;
  const file = generatedFiles[idx];
  selectedFilePath = file.path;
  renderFileExplorer();
  const lang = guessLanguage(file.path);
  if (monacoEditor) {
    monacoEditor.setValue(file.content);
    monaco.editor.setModelLanguage(monacoEditor.getModel(), lang);
  }
  const currentFileText = document.getElementById('currentFileText');
  if (currentFileText) {
    currentFileText.textContent = file.path.split('/').pop();
  }
}

function initMonacoEditor() {
  if (monacoLoaded) return;
  monacoLoaded = true;
  window.require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' } });
  window.require(['vs/editor/editor.main'], function () {
    monacoEditor = monaco.editor.create(document.getElementById('monacoContainer'), {
      value: '',
      language: 'plaintext',
      theme: 'vs-dark',
      readOnly: false,
      fontSize: 15,
      minimap: { enabled: false },
      automaticLayout: true,
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      smoothScrolling: true,
      lineNumbers: 'on',
    });

    // Add change listener to update the file content
    monacoEditor.onDidChangeModelContent(() => {
      const currentFile = generatedFiles.find(f => f.path === selectedFilePath);
      if (currentFile) {
        currentFile.content = monacoEditor.getValue();
        // Update preview if in preview mode
        if (isPreviewMode) {
          showPreview();
        }
      }
    });

    // Open first file if available
    if (generatedFiles && generatedFiles.length > 0) {
      openFileInMonaco(0);
    }
  });
}

// Clear chat history
window.clearChatHistory = function() {
  chatMessages = [];
  renderChatMessages();
}

// Update chat context based on the current view
function updateChatContext(isEditorView) {
  const chatTitle = document.getElementById('chatTitle');
  const chatEmptyMessage = document.getElementById('chatEmptyMessage');
  const chatInput = document.getElementById('chatInput');
  
  if (isEditorView) {
    if (chatTitle) chatTitle.textContent = 'Code Assistant';
    if (chatEmptyMessage) chatEmptyMessage.textContent = 'Ask questions about your code!';
    if (chatInput) chatInput.placeholder = 'Ask about your code...';
  } else {
    if (chatTitle) chatTitle.textContent = 'Chat';
    if (chatEmptyMessage) chatEmptyMessage.textContent = 'Start a conversation with your AI assistant!';
    if (chatInput) chatInput.placeholder = 'Ask AI...';
  }
}

// Switch to Editor View
window.switchToEditorView = function() {
  if (mainHeader) mainHeader.classList.add('hidden');
  document.body.classList.remove('bg-gradient-to-b', 'from-gray-900', 'via-blue-900', 'to-orange-400');
  document.body.classList.add('bg-black');
  
  const generatorView = document.getElementById('generatorView');
  const editorView = document.getElementById('editorView');
  
  if (generatorView) generatorView.style.display = 'none';
  if (editorView) {
    editorView.classList.remove('hidden');
    editorView.style.opacity = '0';
    editorView.style.transform = 'translateY(20px)';
    editorView.style.display = 'flex';
    setTimeout(() => {
      editorView.style.transition = 'all 0.3s ease-out';
      editorView.style.opacity = '1';
      editorView.style.transform = 'translateY(0)';
    }, 50);
  }
  
  // Clear chat when switching views
  clearChatHistory();
  
  // Update chat context for editor view
  updateChatContext(true);
  
  renderFileExplorer();
  setTimeout(() => {
    initMonacoEditor();
  }, 100);
  
  // Set currentMode
  currentMode = 'editor';
}

// Switch to Generator View
window.switchToGeneratorView = function() {
  if (mainHeader) mainHeader.classList.remove('hidden');
  // Restore body background gradient for generator
  document.body.classList.remove('bg-black');
  document.body.classList.add('bg-gradient-to-b', 'from-gray-900', 'via-blue-900', 'to-orange-400');
  
  const generatorView = document.getElementById('generatorView');
  const editorView = document.getElementById('editorView');
  
  if (editorView) {
    editorView.style.transition = 'all 0.3s ease-out';
    editorView.style.opacity = '0';
    editorView.style.transform = 'translateY(20px)';
    setTimeout(() => {
      editorView.classList.add('hidden');
      editorView.style.display = 'none';
      if (generatorView) {
        generatorView.style.display = 'block';
        generatorView.style.opacity = '0';
        generatorView.style.transform = 'translateY(-20px)';
        setTimeout(() => {
          generatorView.style.transition = 'all 0.3s ease-out';
          generatorView.style.opacity = '1';
          generatorView.style.transform = 'translateY(0)';
        }, 50);
      }
    }, 300);
  }
  
  // Clear chat when switching views
  clearChatHistory();
  
  // Update chat context for generator view
  updateChatContext(false);
  
  // Set currentMode
  currentMode = 'generator';
}

// Update the generate code function to track the current model
document.getElementById('generateBtn')?.addEventListener('click', async function() {
  const prompt = document.getElementById('prompt')?.value;
  const tech = document.getElementById('tech')?.value;
  const model = document.getElementById('model')?.value;
  
  if (!prompt || prompt.trim() === '') {
    alert('Please enter a prompt');
    return;
  }
  
  // Save the current model for code assistant to use
  currentModel = model;
  
  this.disabled = true;
  this.innerHTML = 'Generating <span class="animate-spin ml-2 inline-block">↻</span>';
  
  // Clear previously generated files
  generatedFiles = [];
  
  try {
    const response = await fetch('http://localhost:4000/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt, technology: tech, model })
    });
    
    const data = await response.json();
    
    if (data.error) {
      alert('Error: ' + data.error);
      this.disabled = false;
      this.innerHTML = 'Generate';
      return;
    }
    
    generatedFiles = data.files;
    switchToEditorView();
  } catch (error) {
    console.error('Error generating code:', error);
    alert('Error: ' + (error.message || 'Failed to generate code'));
    this.disabled = false;
    this.innerHTML = 'Generate';
  } finally {
    this.disabled = false;
    this.innerHTML = 'Generate';
  }
});

// Add back to generator button handler
if (backToGeneratorBtn) {
  backToGeneratorBtn.addEventListener('click', switchToGeneratorView);
}

// Toggle code/preview logic
const togglePreviewBtn = document.getElementById('togglePreviewBtn');
const togglePreviewIcon = document.getElementById('togglePreviewIcon');
const togglePreviewText = document.getElementById('togglePreviewText');
const openPreviewInNewTabBtn = document.getElementById('openPreviewInNewTabBtn');

// --- Static Project Preview ---
function getMainHtmlFile() {
  // Try common locations for index.html
  const candidates = [
    'index.html',
    'public/index.html',
    'src/index.html'
  ];
  for (const path of candidates) {
    const file = generatedFiles.find(f => f.path === path);
    if (file) return file;
  }
  // Fallback: first .html file
  return generatedFiles.find(f => f.path.endsWith('.html'));
}

function assembleStaticPreviewHtml() {
  const mainHtml = getMainHtmlFile();
  if (!mainHtml) return null;
  let html = mainHtml.content;
  // Inject CSS files
  const cssFiles = generatedFiles.filter(f => f.path.endsWith('.css'));
  if (cssFiles.length > 0) {
    const styles = cssFiles.map(f => `<style>\n${f.content}\n</style>`).join('\n');
    html = html.replace('</head>', styles + '\n</head>');
  }
  // Inject JS files
  const jsFiles = generatedFiles.filter(f => f.path.endsWith('.js'));
  if (jsFiles.length > 0) {
    const scripts = jsFiles.map(f => `<script>\n${f.content}\n</script>`).join('\n');
    html = html.replace('</body>', scripts + '\n</body>');
  }
  return html;
}

window.showPreview = function() {
  const previewFrame = document.getElementById('previewFrame');
  const previewUnavailable = document.getElementById('previewUnavailable');
  const mainHtml = getMainHtmlFile();
  if (mainHtml && previewFrame) {
    const html = assembleStaticPreviewHtml();
    // Clean up previous Blob URL
    if (currentPreviewBlobUrl) {
      URL.revokeObjectURL(currentPreviewBlobUrl);
      currentPreviewBlobUrl = null;
    }
    // Create Blob and set iframe src
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    currentPreviewBlobUrl = url;
    previewFrame.src = url;
    previewFrame.style.display = '';
    if (previewUnavailable) previewUnavailable.style.display = 'none';
  } else {
    if (previewFrame) previewFrame.style.display = 'none';
    if (previewUnavailable) previewUnavailable.style.display = '';
  }
}

// Update togglePreview to call showPreview when switching to preview mode
window.togglePreview = function() {
  isPreviewMode = !isPreviewMode;
  if (isPreviewMode) {
    if (monacoContainer) monacoContainer.style.display = 'none';
    if (previewContainer) previewContainer.classList.remove('hidden');
    if (togglePreviewIcon) {
      togglePreviewIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 0c0 5-7 9-7 9s-7-4-7-9a7 7 0 0114 0z" />';
    }
    if (togglePreviewText) togglePreviewText.textContent = 'Code';
    if (openPreviewInNewTabBtn) openPreviewInNewTabBtn.classList.remove('hidden');
    const currentFileText = document.getElementById('currentFileText');
    if (currentFileText) currentFileText.style.display = 'none';
    showPreview();
  } else {
    if (monacoContainer) monacoContainer.style.display = '';
    if (previewContainer) previewContainer.classList.add('hidden');
    if (togglePreviewIcon) {
      togglePreviewIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2a4 4 0 014-4h4m0 0V7m0 4h-4" />';
    }
    if (togglePreviewText) togglePreviewText.textContent = 'Preview';
    if (openPreviewInNewTabBtn) openPreviewInNewTabBtn.classList.add('hidden');
    const currentFileText = document.getElementById('currentFileText');
    if (currentFileText) currentFileText.style.display = '';
  }
}

// Chat functionality
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const chatHistory = document.getElementById('chatHistory');
const chatEmptyState = document.getElementById('chatEmptyState');
const chatTyping = document.getElementById('chatTyping');

let chatMessages = [];

function renderChatMessages() {
  if (!chatHistory) return;
  chatHistory.innerHTML = '';
  if (chatMessages.length === 0) {
    if (chatEmptyState) {
      chatEmptyState.style.display = '';
      // Add contextual suggestions when in editor view
      if (currentMode === 'editor' && generatedFiles.length > 0) {
        const suggestions = document.createElement('div');
        suggestions.className = 'mt-4 space-y-2';
        suggestions.innerHTML = `
          <p class="text-center text-gray-400 text-xs mb-2">Try asking about:</p>
          <div class="grid grid-cols-1 gap-2">
            <button class="text-xs bg-[#23272e] hover:bg-blue-700 transition text-gray-300 hover:text-white px-3 py-2 rounded-lg text-left" onclick="suggestQuery(this)">How can I improve the code structure?</button>
            <button class="text-xs bg-[#23272e] hover:bg-blue-700 transition text-gray-300 hover:text-white px-3 py-2 rounded-lg text-left" onclick="suggestQuery(this)">Is there a more efficient way to implement this?</button>
            <button class="text-xs bg-[#23272e] hover:bg-blue-700 transition text-gray-300 hover:text-white px-3 py-2 rounded-lg text-left" onclick="suggestQuery(this)">Can you explain how this code works?</button>
            <button class="text-xs bg-[#23272e] hover:bg-blue-700 transition text-gray-300 hover:text-white px-3 py-2 rounded-lg text-left" onclick="suggestQuery(this)">How can I add feature X to this project?</button>
          </div>
        `;
        chatEmptyState.appendChild(suggestions);
      }
    }
    return;
  }
  if (chatEmptyState) chatEmptyState.style.display = 'none';
  chatMessages.forEach(msg => {
    const bubble = document.createElement('div');
    if (msg.role === 'user') {
      bubble.className = 'flex justify-end mb-2';
      bubble.innerHTML = `
        <div class="flex items-end gap-2">
          <div class="rounded-full w-7 h-7 bg-gradient-to-tr from-blue-500 to-blue-400 flex items-center justify-center text-white font-bold text-sm shadow">U</div>
          <div class="max-w-[70%] bg-blue-600 text-white px-4 py-2 rounded-2xl rounded-br-sm shadow text-sm">${msg.content}</div>
        </div>
      `;
    } else {
      bubble.className = 'flex justify-start mb-2';
      bubble.innerHTML = `
        <div class="flex items-end gap-2">
          <div class="rounded-full w-7 h-7 bg-[#23272e] flex items-center justify-center text-blue-400 font-bold text-sm shadow">AI</div>
          <div class="max-w-[70%] bg-[#23272e] text-gray-200 px-4 py-2 rounded-2xl rounded-bl-sm shadow text-sm">${msg.content}</div>
        </div>
      `;
    }
    chatHistory.appendChild(bubble);
  });
  // Auto-scroll to bottom
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

// Suggested query function
window.suggestQuery = function(element) {
  if (chatInput) {
    chatInput.value = element.textContent;
    chatInput.focus();
  }
}

// Chat functionality
window.sendChatMessage = async function() {
  const value = chatInput.value.trim();
  if (!value) return;
  
  chatMessages.push({ role: 'user', content: value });
  renderChatMessages();
  chatInput.value = '';
  
  if (chatTyping) chatTyping.classList.remove('hidden');
  
  try {
    let endpoint = 'http://localhost:4000/chat';
    let requestBody = {
      message: value,
      history: chatMessages.filter(m => m.role === 'user' || m.role === 'ai')
    };

    // If we're in the editor view, use the code assistant API instead
    if (document.getElementById('editorView').style.display !== 'none') {
      endpoint = 'http://localhost:4000/code-assistant';
      requestBody = {
        message: value,
        files: generatedFiles,
        model: currentModel || 'gemini-2.0-flash',
        history: chatMessages.filter(m => m.role === 'user' || m.role === 'ai')
      };
    }

    console.log('Sending request to:', endpoint);
    console.log('Request body:', requestBody);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    
    const data = await response.json();
    console.log('Received response:', data);
    
    if (chatTyping) chatTyping.classList.add('hidden');
    
    if (data.reply) {
      // Check if the reply contains code changes
      const codeChanges = extractCodeChanges(data.reply);
      console.log('Extracted code changes:', codeChanges);
      
      if (codeChanges.length > 0) {
        // Apply each code change
        codeChanges.forEach(change => {
          console.log('Applying change:', change);
          if (applyCodeChanges(change.filePath, change.newContent)) {
            chatMessages.push({ 
              role: 'ai', 
              content: `I've updated ${change.filePath} with the suggested changes while preserving existing code.` 
            });
          } else {
            chatMessages.push({ 
              role: 'ai', 
              content: `Failed to apply changes to ${change.filePath}. Please try again.` 
            });
          }
        });
      } else {
        chatMessages.push({ role: 'ai', content: data.reply });
      }
      renderChatMessages();
    } else {
      chatMessages.push({ role: 'ai', content: 'AI did not reply.' });
      renderChatMessages();
    }
  } catch (err) {
    console.error('Chat error:', err);
    if (chatTyping) chatTyping.classList.add('hidden');
    chatMessages.push({ role: 'ai', content: 'Network or server error.' });
    renderChatMessages();
  }
}

// Add function to extract code changes from AI response
function extractCodeChanges(reply) {
  console.log('Extracting code changes from:', reply);
  const changes = [];
  // Look for code blocks with file paths and optional line numbers
  const fileRegex = /File: (.*?)(?:\nLines: (\d+-\d+))?\n```(?:[a-zA-Z0-9]*)\n([\s\S]*?)```/g;
  let match;
  while ((match = fileRegex.exec(reply)) !== null) {
    console.log('Found code change:', match);
    changes.push({
      filePath: match[1].trim(),
      lineRange: match[2] ? match[2].trim() : null,
      newContent: match[3].trim()
    });
  }
  console.log('Extracted changes:', changes);
  return changes;
}

// Add function to apply AI-suggested changes
function applyCodeChanges(filePath, newContent) {
  console.log('Applying changes to:', filePath);
  console.log('New content:', newContent);
  
  const fileIndex = generatedFiles.findIndex(f => f.path === filePath);
  if (fileIndex !== -1) {
    console.log('Found file at index:', fileIndex);
    console.log('Current content:', generatedFiles[fileIndex].content);
    
    // Instead of replacing the entire content, we'll try to merge the changes
    const currentContent = generatedFiles[fileIndex].content;
    const mergedContent = mergeCodeChanges(currentContent, newContent);
    
    console.log('Merged content:', mergedContent);
    
    // Update the file content
    generatedFiles[fileIndex].content = mergedContent;
    
    // If this is the currently selected file, update the editor
    if (selectedFilePath === filePath && monacoEditor) {
      console.log('Updating Monaco editor');
      monacoEditor.setValue(mergedContent);
    }
    
    // Update preview if in preview mode
    if (isPreviewMode) {
      console.log('Updating preview');
      showPreview();
    }
    return true;
  }
  console.log('File not found:', filePath);
  return false;
}

// Add function to merge code changes intelligently
function mergeCodeChanges(currentContent, newContent) {
  console.log('Merging code changes');
  console.log('Current content length:', currentContent.length);
  console.log('New content length:', newContent.length);
  
  // If the new content is empty or just whitespace, keep the current content
  if (!newContent.trim()) {
    console.log('New content is empty, keeping current content');
    return currentContent;
  }

  // If the new content is a complete file replacement (contains imports, exports, etc.)
  if (newContent.includes('import') || newContent.includes('export') || 
      newContent.includes('<!DOCTYPE') || newContent.includes('<html>')) {
    console.log('Detected complete file replacement');
    return newContent;
  }

  // Try to find the section that changed
  const currentLines = currentContent.split('\n');
  const newLines = newContent.split('\n');
  
  console.log('Current lines:', currentLines.length);
  console.log('New lines:', newLines.length);
  
  // If the new content is shorter than the current content, it's likely a partial change
  if (newLines.length < currentLines.length) {
    console.log('Detected partial change');
    // Find the first and last changed lines
    let startIndex = -1;
    let endIndex = -1;
    
    for (let i = 0; i < currentLines.length; i++) {
      if (currentLines[i] !== newLines[0]) continue;
      
      // Found potential start of changes
      startIndex = i;
      let matches = true;
      
      // Check if the next few lines match
      for (let j = 0; j < newLines.length; j++) {
        if (currentLines[i + j] !== newLines[j]) {
          matches = false;
          break;
        }
      }
      
      if (matches) {
        endIndex = i + newLines.length;
        break;
      }
    }
    
    console.log('Found matching section:', { startIndex, endIndex });
    
    // If we found a matching section, replace just that section
    if (startIndex !== -1 && endIndex !== -1) {
      const before = currentLines.slice(0, startIndex).join('\n');
      const after = currentLines.slice(endIndex).join('\n');
      const result = before + '\n' + newContent + '\n' + after;
      console.log('Successfully merged changes');
      return result;
    }
  }
  
  console.log('Could not find matching section, appending changes');
  // If we couldn't find a matching section, append the changes with a comment
  return currentContent + '\n\n/* AI-suggested changes: */\n' + newContent;
}

if (chatInput) {
  chatInput.onkeydown = function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };
}

window.openPreviewInNewTab = function() {
  const html = assembleStaticPreviewHtml();
  if (!html) return;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 10000); // Revoke after 10s
}

function updateSidebarUser(username, email) {
  const profileEmail = document.getElementById('sidebarUserEmail');
  const profileName = document.getElementById('sidebarUserName');
  const profileInitial = document.getElementById('sidebarUserInitial');
  if (profileEmail) profileEmail.textContent = email;
  if (profileName) profileName.textContent = username;
  if (profileInitial && username) profileInitial.textContent = username[0].toUpperCase();
  // Also update editor nav button
  const editorInitial = document.getElementById('editorUserInitial');
  if (editorInitial && username) editorInitial.textContent = username[0].toUpperCase();
}

// On page load, set sidebar user from localStorage if present
const storedEmail = localStorage.getItem('codexUserEmail');
const storedUsername = localStorage.getItem('codexUserName');
if (storedEmail && storedUsername) {
  updateSidebarUser(storedUsername, storedEmail);
}

// Make editor nav button open sidebar
const editorSidebarBtn = document.getElementById('editorSidebarBtn');
if (editorSidebarBtn && typeof openSidebarBtn !== 'undefined') {
  editorSidebarBtn.onclick = function() {
    openSidebarBtn.click();
  };
} 