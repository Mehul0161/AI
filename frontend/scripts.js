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

// Editor functionality
let currentFileIndex = 0;
const editorView = document.getElementById('editorView');
const generatorView = document.getElementById('generatorView');
const fileTabs = document.getElementById('fileTabs');
const editorContent = document.getElementById('editorContent');
const backToGeneratorBtn = document.getElementById('backToGenerator');
const mainHeader = document.getElementById('mainHeader');

let monacoEditor = null;
let monacoLoaded = false;
let selectedFilePath = null;
let projectName = 'Project'; // Default

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
      if (ext === 'tsx') icon = '<svg class="w-4 h-4 mr-2 text-blue-300" fill="currentColor" viewBox="0 0 24 24"><rect width="24" height="24" rx="4"/><text x="3" y="18" font-size="12" fill="#fff">TSX</text></svg>';
      if (ext === 'json') icon = '<svg class="w-4 h-4 mr-2 text-green-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><text x="7" y="17" font-size="10" fill="#22c55e">{}</text></svg>';
      if (ext === 'html') icon = '<svg class="w-4 h-4 mr-2 text-pink-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><text x="7" y="17" font-size="10" fill="#ec4899">&lt;/&gt;</text></svg>';
      if (ext === 'css') icon = '<svg class="w-4 h-4 mr-2 text-blue-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><text x="7" y="17" font-size="10" fill="#3b82f6">CSS</text></svg>';
      if (ext === 'md') icon = '<svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><text x="7" y="17" font-size="10" fill="#a3a3a3">MD</text></svg>';
      if (ext === 'cjs') icon = '<svg class="w-4 h-4 mr-2 text-orange-400" fill="currentColor" viewBox="0 0 24 24"><rect width="24" height="24" rx="4"/><text x="3" y="18" font-size="12" fill="#fff">CJS</text></svg>';
      if (ext === 'py') icon = '<svg class="w-4 h-4 mr-2 text-yellow-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><text x="7" y="17" font-size="10" fill="#fde68a">PY</text></svg>';
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
      readOnly: true,
      fontSize: 15,
      minimap: { enabled: false },
      automaticLayout: true,
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      smoothScrolling: true,
      lineNumbers: 'on',
    });
    // Open first file if available
    if (generatedFiles && generatedFiles.length > 0) {
      openFileInMonaco(0);
    }
  });
}

function switchToEditorView() {
  if (mainHeader) mainHeader.classList.add('hidden');
  document.body.classList.remove('bg-gradient-to-b', 'from-gray-900', 'via-blue-900', 'to-orange-400');
  document.body.classList.add('bg-black');
  if (generatorView) generatorView.style.display = 'none';
  if (editorView) {
    editorView.classList.remove('hidden');
    editorView.style.opacity = '0';
    editorView.style.transform = 'translateY(20px)';
    setTimeout(() => {
      editorView.style.transition = 'all 0.3s ease-out';
      editorView.style.opacity = '1';
      editorView.style.transform = 'translateY(0)';
    }, 50);
  }
  renderFileExplorer();
  setTimeout(() => {
    initMonacoEditor();
  }, 100);
}

function switchToGeneratorView() {
  if (mainHeader) mainHeader.classList.remove('hidden');
  // Restore body background gradient for generator
  document.body.classList.remove('bg-black');
  document.body.classList.add('bg-gradient-to-b', 'from-gray-900', 'via-blue-900', 'to-orange-400');
  if (editorView) {
    editorView.style.transition = 'all 0.3s ease-out';
    editorView.style.opacity = '0';
    editorView.style.transform = 'translateY(20px)';
    setTimeout(() => {
      editorView.classList.add('hidden');
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
}

let generatedFiles = [];

// Update the generate button click handler
if (generateBtn) generateBtn.addEventListener('click', async () => {
  const promptInput = document.getElementById('prompt');
  const techSelect = document.getElementById('tech');
  const modelSelect = document.getElementById('model');
  const prompt = promptInput.value.trim();
  const technology = techSelect.value;
  const model = modelSelect.value;
  
  if (!prompt) {
    alert('Please enter a prompt.');
    return;
  }

  generateBtn.disabled = true;
  generateBtn.innerHTML = `
    <span class="flex items-center gap-2">
      <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Generating...
    </span>
  `;

  try {
    const response = await fetch('http://localhost:4000/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, technology, model })
    });
    const data = await response.json();
    
    if (data.files && Array.isArray(data.files)) {
      generatedFiles = data.files;
      projectName = data.projectName || 'Project';
      selectedFilePath = generatedFiles[0]?.path || null;
      renderFileExplorer();
      switchToEditorView();
      setTimeout(() => {
        initMonacoEditor();
      }, 100);
      // Update project name in navbar
      const projectNameEls = document.querySelectorAll('.project-name');
      projectNameEls.forEach(el => el.textContent = projectName);
    } else if (data.error) {
      alert('Error: ' + data.error);
    } else {
      alert('Unknown error occurred.');
    }
  } catch (err) {
    console.error('Network error:', err);
    alert('Network error: ' + err.message);
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = 'Generate';
  }
});

// Add back to generator button handler
if (backToGeneratorBtn) {
  backToGeneratorBtn.addEventListener('click', switchToGeneratorView);
}

// Toggle code/preview logic
const togglePreviewBtn = document.getElementById('togglePreviewBtn');
const monacoContainer = document.getElementById('monacoContainer');
const previewContainer = document.getElementById('previewContainer');
const togglePreviewIcon = document.getElementById('togglePreviewIcon');
const togglePreviewText = document.getElementById('togglePreviewText');
const openPreviewInNewTabBtn = document.getElementById('openPreviewInNewTabBtn');

let isPreviewMode = false;
let currentPreviewBlobUrl = null;

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
    if (chatEmptyState) chatEmptyState.style.display = '';
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

// Chat functionality
window.sendChatMessage = async function() {
  const value = chatInput.value.trim();
  if (!value) return;
  chatMessages.push({ role: 'user', content: value });
  renderChatMessages();
  chatInput.value = '';
  if (chatTyping) chatTyping.classList.remove('hidden');
  try {
    const response = await fetch('http://localhost:4000/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: value,
        history: chatMessages.filter(m => m.role === 'user' || m.role === 'ai')
      })
    });
    const data = await response.json();
    if (chatTyping) chatTyping.classList.add('hidden');
    if (data.reply) {
      chatMessages.push({ role: 'ai', content: data.reply });
      renderChatMessages();
    } else {
      chatMessages.push({ role: 'ai', content: 'AI did not reply.' });
      renderChatMessages();
    }
  } catch (err) {
    if (chatTyping) chatTyping.classList.add('hidden');
    chatMessages.push({ role: 'ai', content: 'Network or server error.' });
    renderChatMessages();
  }
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