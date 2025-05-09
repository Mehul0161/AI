// Sidebar functionality
// const baseUrl = 'https://ai-codex-server.vercel.app';
const baseUrl = 'http://localhost:4000';
 
document.addEventListener('DOMContentLoaded', function() {
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const openSidebarBtn = document.getElementById('openSidebarBtn');
  const closeSidebarBtn = document.getElementById('closeSidebar');
  
  if (openSidebarBtn) {
    openSidebarBtn.addEventListener('click', () => {
      sidebar.classList.remove('translate-x-full');
      sidebarOverlay.classList.remove('hidden');
    });
  }
  
  if (closeSidebarBtn) {
    closeSidebarBtn.addEventListener('click', () => {
      sidebar.classList.add('translate-x-full');
      sidebarOverlay.classList.add('hidden');
    });
  }
});

// Close sidebar if overlay is clicked
window.closeSidebarOnOverlay = function(event) {
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
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
  // Clear all auth data
  localStorage.removeItem('codexToken');
  localStorage.removeItem('codexUserEmail');
  localStorage.removeItem('codexUserName');
  
  // Reset UI
  updateSidebarUser('', '');
  updateGenerateButtonState();
  
  // Close sidebar
  if (sidebar) sidebar.classList.add('translate-x-full');
  if (sidebarOverlay) sidebarOverlay.classList.add('hidden');
};

// Sign In Modal logic
window.openSignInModal = function() {
  document.getElementById('signInModal').classList.remove('hidden');
  // Reset to login view by default
  switchToLoginView();
};

window.closeSignInModal = function() {
  document.getElementById('signInModal').classList.add('hidden');
};

// Add these new functions for handling the login/signup toggle
function switchToLoginView() {
  const loginTab = document.getElementById('loginTab');
  const signupTab = document.getElementById('signupTab');
  const usernameField = document.getElementById('usernameField');
  const submitButtonText = document.getElementById('submitButtonText');
  
  loginTab.classList.add('text-white', 'border-b-2', 'border-blue-500');
  loginTab.classList.remove('text-gray-400');
  signupTab.classList.add('text-gray-400');
  signupTab.classList.remove('text-white', 'border-b-2', 'border-blue-500');
  
  usernameField.classList.add('hidden');
  submitButtonText.textContent = 'Login';
}

function switchToSignupView() {
  const loginTab = document.getElementById('loginTab');
  const signupTab = document.getElementById('signupTab');
  const usernameField = document.getElementById('usernameField');
  const submitButtonText = document.getElementById('submitButtonText');
  
  signupTab.classList.add('text-white', 'border-b-2', 'border-blue-500');
  signupTab.classList.remove('text-gray-400');
  loginTab.classList.add('text-gray-400');
  loginTab.classList.remove('text-white', 'border-b-2', 'border-blue-500');
  
  usernameField.classList.remove('hidden');
  submitButtonText.textContent = 'Sign Up';
}

// Add event listeners for the tabs
document.addEventListener('DOMContentLoaded', function() {
  const loginTab = document.getElementById('loginTab');
  const signupTab = document.getElementById('signupTab');
  
  if (loginTab) {
    loginTab.addEventListener('click', switchToLoginView);
  }
  
  if (signupTab) {
    signupTab.addEventListener('click', switchToSignupView);
  }
});

// Custom Alert Function
window.showAlert = function(message, type = 'info', title = 'Alert', confirmType = false) {
  const alertModal = document.getElementById('customAlert');
  const alertIcon = document.getElementById('alertIcon');
  const alertTitle = document.getElementById('alertTitle');
  const alertMessage = document.getElementById('alertMessage');
  const alertConfirmBtn = document.getElementById('alertConfirmBtn');
  let alertCancelBtn = document.getElementById('alertCancelBtn');

  // Set icon based on type
  let iconHtml = '';
  let iconBg = '';
  switch(type) {
    case 'success':
      iconHtml = '<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>';
      iconBg = 'bg-green-500';
      break;
    case 'error':
      iconHtml = '<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>';
      iconBg = 'bg-red-500';
      break;
    case 'warning':
      iconHtml = '<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>';
      iconBg = 'bg-yellow-500';
      break;
    default:
      iconHtml = '<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
      iconBg = 'bg-blue-500';
  }

  alertIcon.innerHTML = iconHtml;
  alertIcon.className = `w-8 h-8 rounded-full flex items-center justify-center ${iconBg}`;
  alertTitle.textContent = title;
  alertMessage.textContent = message;

  // Handle confirm/cancel buttons
  if (confirmType) {
    if (!alertCancelBtn) {
      alertCancelBtn = document.createElement('button');
      alertCancelBtn.id = 'alertCancelBtn';
      alertCancelBtn.className = 'px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition mr-2';
      alertCancelBtn.textContent = 'Cancel';
      alertConfirmBtn.parentNode.insertBefore(alertCancelBtn, alertConfirmBtn);
    } else {
      alertCancelBtn.style.display = '';
    }
    alertConfirmBtn.textContent = (type === 'warning' || type === 'error') ? 'Delete' : 'OK';
    alertConfirmBtn.className = 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition';
  } else {
    if (alertCancelBtn) alertCancelBtn.style.display = 'none';
    alertConfirmBtn.textContent = 'OK';
    alertConfirmBtn.className = 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition';
  }

  alertModal.classList.remove('hidden');

  return new Promise((resolve) => {
    const handleConfirm = () => {
      alertModal.classList.add('hidden');
      alertConfirmBtn.removeEventListener('click', handleConfirm);
      if (alertCancelBtn) alertCancelBtn.removeEventListener('click', handleCancel);
      resolve(true);
    };
    const handleCancel = () => {
      alertModal.classList.add('hidden');
      alertConfirmBtn.removeEventListener('click', handleConfirm);
      if (alertCancelBtn) alertCancelBtn.removeEventListener('click', handleCancel);
      resolve(false);
    };
    alertConfirmBtn.addEventListener('click', handleConfirm);
    if (confirmType && alertCancelBtn) {
      alertCancelBtn.addEventListener('click', handleCancel);
    }
  });
};

// Update the sign in form handler
const signInForm = document.getElementById('signInForm');
if (signInForm) {
  signInForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const name = document.getElementById('signInUsername').value.trim();
    const email = document.getElementById('signInEmail').value.trim();
    const password = document.getElementById('signInPassword').value;

    try {
      const endpoint = name ? '/auth/register' : '/auth/login';
      const body = name ? { name, email, password } : { email, password };

      console.log('Sending request to:', baseUrl + endpoint);
      console.log('Request body:', body);

      const res = await fetch(baseUrl + endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      console.log('Response:', data);

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }
      
      if (data.token) {
        if (name) {
          await showAlert('Account created successfully! Please login.', 'success', 'Success');
          switchToLoginView();
          this.reset();
        } else {
          localStorage.setItem('codexToken', data.token);
          localStorage.setItem('codexUserEmail', data.user.email);
          localStorage.setItem('codexUserName', data.user.name);
          
          updateSidebarUser(data.user.name, data.user.email);
          updateGenerateButtonState();
          closeSignInModal();
          
          await showAlert('Signed in successfully!', 'success', 'Success');
        }
      } else {
        await showAlert(data.error || 'Authentication failed', 'error', 'Error');
      }
    } catch (err) {
      console.error('Auth error:', err);
      await showAlert(err.message || 'Network error occurred', 'error', 'Error');
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
    const response = await fetch(baseUrl + '/enhance', {
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

// Update the generate code function to save projects
let isGenerating = false;

// Add this variable at the top of the file with other global variables
let currentWorkspacePreviewUrl = null;

// Add this function to check if user is logged in
function isUserLoggedIn() {
  return localStorage.getItem('codexToken') !== null;
}

// Add this function to update vite.config.js with preview URL
async function updateViteConfigWithPreviewUrl(previewUrl) {
  try {
    // Extract host from preview URL
    const previewHost = new URL(previewUrl).host;
    
    // Find vite.config.js in generatedFiles
    const viteConfigFile = generatedFiles.find(f => f.path === 'vite.config.js');
    if (!viteConfigFile) {
      console.error('vite.config.js not found in generated files');
      return;
    }

    // Update the allowedHosts array to include the preview host
    let configContent = viteConfigFile.content;
    const allowedHostsMatch = configContent.match(/allowedHosts:\s*\[([\s\S]*?)\]/);
    
    if (allowedHostsMatch) {
      const currentHosts = allowedHostsMatch[1].split(',').map(h => h.trim().replace(/['"]/g, ''));
      if (!currentHosts.includes(previewHost)) {
        const newHosts = [...currentHosts, `'${previewHost}'`];
        configContent = configContent.replace(
          allowedHostsMatch[0],
          `allowedHosts: [${newHosts.join(', ')}]`
        );
        viteConfigFile.content = configContent;
        console.log('Updated vite.config.js with preview host:', previewHost);
      }
    }
  } catch (error) {
    console.error('Error updating vite.config.js:', error);
  }
}

// Update the generate button click handler
generateBtn?.addEventListener('click', async function() {
  if (!isUserLoggedIn()) {
    await showAlert('Please sign in or create an account to generate code', 'warning', 'Authentication Required');
    openSignInModal();
    return;
  }

  if (isGenerating) return;
  
  const prompt = document.getElementById('prompt')?.value;
  const tech = document.getElementById('tech')?.value;
  const model = document.getElementById('model')?.value;
  
  if (!prompt || prompt.trim() === '') {
    await showAlert('Please enter a prompt', 'error', 'Error');
    return;
  }
  
  isGenerating = true;
  currentModel = model;
  
  this.disabled = true;
  this.innerHTML = 'Generating <span class="animate-spin ml-2 inline-block">↻</span>';
  
  generatedFiles = [];
  currentWorkspacePreviewUrl = null;
  
  try {
    const response = await fetch(baseUrl + '/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('codexToken')}`
      },
      body: JSON.stringify({ prompt, technology: tech, model })
    });
    
    const data = await response.json();
    
    if (data.error) {
      await showAlert('Error: ' + data.error, 'error', 'Error');
      return;
    }
    
    generatedFiles = data.files;
    projectName = data.projectName || 'Project';
    selectedFilePath = generatedFiles[0]?.path || null;
    
    // Store the preview URL for non-static projects
    if (tech !== 'static' && data.workspace?.previewUrl) {
      currentWorkspacePreviewUrl = data.workspace.previewUrl;
      // Update vite.config.js with the preview URL host
      await updateViteConfigWithPreviewUrl(currentWorkspacePreviewUrl);
    }
    
    // Save the project to the database
    const token = localStorage.getItem('codexToken');
    if (token) {
      try {
        const saveResponse = await fetch(baseUrl + '/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: projectName,
            technology: tech,
            files: generatedFiles
          })
        });
        
        const saveData = await saveResponse.json();
        if (saveData.error) {
          console.error('Error saving project:', saveData.error);
        }
      } catch (error) {
        console.error('Error saving project:', error);
      }
    }
    
    // Update project name in navbar
    const projectNameEls = document.querySelectorAll('.project-name');
    projectNameEls.forEach(el => el.textContent = projectName);
    
    switchToEditorView();
  } catch (error) {
    console.error('Error generating code:', error);
    await showAlert('Error: ' + (error.message || 'Failed to generate code'), 'error', 'Error');
  } finally {
    isGenerating = false;
    this.disabled = false;
    this.innerHTML = 'Generate';
  }
});

// Add this to update generate button state when auth state changes
function updateGenerateButtonState() {
  const generateBtn = document.getElementById('generateBtn');
  if (generateBtn) {
    if (!isUserLoggedIn()) {
      generateBtn.disabled = true;
      generateBtn.classList.add('opacity-50', 'cursor-not-allowed');
      generateBtn.title = 'Please sign in to generate code';
    } else {
      generateBtn.disabled = false;
      generateBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      generateBtn.title = 'Generate code';
    }
  }
}

// Call this when the page loads
document.addEventListener('DOMContentLoaded', function() {
  updateGenerateButtonState();
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

// Add these utility functions at the top of the file
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const retryWithBackoff = async (fn, maxRetries = 5, initialDelay = 1000) => {
  let retries = 0;
  let delay = initialDelay;

  while (retries < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      retries++;
      if (retries === maxRetries) throw error;
      await sleep(delay);
      delay *= 2; // Exponential backoff
    }
  }
};

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
  if (!mainHtml) {
    console.error('No main HTML file found');
    return null;
  }
  
  console.log('Main HTML file found:', mainHtml.path);
  let html = mainHtml.content;
  
  // Inject CSS files
  const cssFiles = generatedFiles.filter(f => f.path.endsWith('.css'));
  console.log('Found CSS files:', cssFiles.map(f => f.path));
  if (cssFiles.length > 0) {
    const styles = cssFiles.map(f => `<style>\n${f.content}\n</style>`).join('\n');
    // Try to inject before </head>, if not found, inject at the start
    if (html.includes('</head>')) {
      html = html.replace('</head>', `${styles}\n</head>`);
    } else {
      html = `<head>${styles}</head>${html}`;
    }
  }
  
  // Inject JS files
  const jsFiles = generatedFiles.filter(f => f.path.endsWith('.js'));
  console.log('Found JS files:', jsFiles.map(f => f.path));
  if (jsFiles.length > 0) {
    const scripts = jsFiles.map(f => `<script>\n${f.content}\n</script>`).join('\n');
    // Try to inject before </body>, if not found, inject at the end
    if (html.includes('</body>')) {
      html = html.replace('</body>', `${scripts}\n</body>`);
    } else {
      html = `${html}\n${scripts}`;
    }
  }

  // Ensure we have a complete HTML document
  if (!html.includes('<!DOCTYPE html>')) {
    html = `<!DOCTYPE html>\n<html>\n${html}\n</html>`;
  }

  console.log('Assembled HTML length:', html.length);
  return html;
}

// Add this new function for checking workspace readiness
async function checkWorkspaceReady(url, maxRetries = 30, delay = 2000) {
    console.log('[Preview] Starting workspace readiness check...');
    console.log('[Preview] Target URL:', url);
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            console.log(`[Preview] Attempt ${i + 1}/${maxRetries} to check workspace...`);
            const response = await fetch(url, {
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-cache'
            });
            
            console.log('[Preview] Workspace is ready!');
            return true;
        } catch (error) {
            console.log(`[Preview] Workspace not ready yet (attempt ${i + 1}/${maxRetries})`);
            if (i === maxRetries - 1) {
                console.error('[Preview] Workspace failed to start within timeout period');
                throw new Error('Workspace failed to start within the timeout period');
            }
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    return false;
}

async function showPreview() {
    console.log('[Preview] Starting preview display...');
    const previewContainer = document.getElementById('previewContainer');
    const previewFrame = document.getElementById('previewFrame');
    const previewUnavailable = document.getElementById('previewUnavailable');

    // Show loading state
    previewUnavailable.textContent = 'Loading preview...';
    previewUnavailable.style.display = 'flex';
    previewFrame.style.display = 'none';

    try {
        if (currentWorkspacePreviewUrl) {
            // Handle workspace preview
            console.log('[Preview] Using workspace preview URL:', currentWorkspacePreviewUrl);
            await checkWorkspaceReady(currentWorkspacePreviewUrl);
            previewFrame.sandbox = 'allow-same-origin allow-scripts allow-popups allow-forms allow-downloads allow-modals';
            previewFrame.src = currentWorkspacePreviewUrl;
        } else {
            // Handle static preview
            console.log('[Preview] Using static preview');
            const html = assembleStaticPreviewHtml();
            if (!html) {
                throw new Error('No HTML content available for preview');
            }
            
            // Create blob URL for the static preview
            const blob = new Blob([html], { type: 'text/html' });
            const blobUrl = URL.createObjectURL(blob);
            
            // Configure iframe for static preview
            previewFrame.sandbox = 'allow-scripts allow-same-origin';
            previewFrame.src = blobUrl;
            
            // Clean up blob URL after iframe loads
            previewFrame.onload = () => {
                URL.revokeObjectURL(blobUrl);
                previewUnavailable.style.display = 'none';
                previewFrame.style.display = 'block';
            };
        }

        // Handle iframe load
        previewFrame.onload = () => {
            console.log('[Preview] Iframe loaded successfully');
            previewUnavailable.style.display = 'none';
            previewFrame.style.display = 'block';
        };

        // Handle iframe errors
        previewFrame.onerror = () => {
            console.error('[Preview] Failed to load iframe');
            previewUnavailable.textContent = 'Failed to load preview. Please try again.';
            previewUnavailable.style.display = 'flex';
        };

    } catch (error) {
        console.error('[Preview] Error during preview setup:', error);
        previewUnavailable.textContent = 'Failed to start preview. Please try again.';
        previewUnavailable.style.display = 'flex';
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
    let endpoint = baseUrl + '/chat';
    let requestBody = {
      message: value,
      history: chatMessages.filter(m => m.role === 'user' || m.role === 'assistant')
    };

    // If we're in the editor view, use the code assistant API instead
    if (document.getElementById('editorView').style.display !== 'none') {
      endpoint = baseUrl + '/code-assistant';
      requestBody = {
        message: value,
        files: generatedFiles,
        model: currentModel || 'gemini-2.0-flash',
        history: chatMessages.filter(m => m.role === 'user' || m.role === 'assistant')
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
              role: 'assistant', 
              content: `I've updated ${change.filePath} with the suggested changes while preserving existing code.` 
            });
          } else {
            chatMessages.push({ 
              role: 'assistant', 
              content: `Failed to apply changes to ${change.filePath}. Please try again.` 
            });
          }
        });
      } else {
        chatMessages.push({ role: 'assistant', content: data.reply });
      }
      renderChatMessages();
    } else {
      chatMessages.push({ role: 'assistant', content: 'AI did not reply.' });
      renderChatMessages();
    }
  } catch (err) {
    console.error('Chat error:', err);
    if (chatTyping) chatTyping.classList.add('hidden');
    chatMessages.push({ role: 'assistant', content: 'Network or server error.' });
    renderChatMessages();
  }
}

// Add function to extract code changes from AI response
function extractCodeChanges(reply) {
  console.log('Extracting code changes from:', reply);
  const changes = [];
  // Look for code blocks with file paths
  const fileRegex = /File: (.*?)\n```(?:[a-zA-Z0-9]*)\n([\s\S]*?)```/g;
  let match;
  while ((match = fileRegex.exec(reply)) !== null) {
    console.log('Found code change:', match);
    changes.push({
      filePath: match[1].trim(),
      newContent: match[2].trim()
    });
  }
  console.log('Extracted changes:', changes);
  return changes;
}

// Function to verify file compatibility
function verifyFileCompatibility(filePath, newContent, allFiles) {
  console.log('Verifying compatibility for:', filePath);
  
  // Get the current file
  const currentFile = allFiles.find(f => f.path === filePath);
  if (!currentFile) return false;
  
  // Check if all imports are preserved
  const currentImports = extractImports(currentFile.content);
  const newImports = extractImports(newContent);
  const missingImports = currentImports.filter(imp => !newImports.includes(imp));
  
  if (missingImports.length > 0) {
    console.error('Missing imports:', missingImports);
    return false;
  }
  
  // Check if all exports are preserved
  const currentExports = extractExports(currentFile.content);
  const newExports = extractExports(newContent);
  const missingExports = currentExports.filter(exp => !newExports.includes(exp));
  
  if (missingExports.length > 0) {
    console.error('Missing exports:', missingExports);
    return false;
  }
  
  // Check if all function signatures are preserved
  const currentFunctions = extractFunctionSignatures(currentFile.content);
  const newFunctions = extractFunctionSignatures(newContent);
  const missingFunctions = currentFunctions.filter(fn => !newFunctions.includes(fn));
  
  if (missingFunctions.length > 0) {
    console.error('Missing function signatures:', missingFunctions);
    return false;
  }
  
  return true;
}

// Helper function to extract imports
function extractImports(content) {
  const imports = [];
  const importRegex = /(?:import|require)\s*\(?['"]([^'"]+)['"]\)?/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  return imports;
}

// Helper function to extract exports
function extractExports(content) {
  const exports = [];
  const exportRegex = /export\s+(?:default\s+)?(?:const|let|var|function|class)\s+(\w+)/g;
  let match;
  while ((match = exportRegex.exec(content)) !== null) {
    exports.push(match[1]);
  }
  return exports;
}

// Helper function to extract function signatures
function extractFunctionSignatures(content) {
  const functions = [];
  const functionRegex = /(?:function|const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)/g;
  let match;
  while ((match = functionRegex.exec(content)) !== null) {
    functions.push(match[1]);
  }
  return functions;
}

// Function to apply code changes
function applyCodeChanges(filePath, newContent) {
  console.log('Applying changes to file:', filePath);
  console.log('New content:', newContent);
  
  // Find the file in generatedFiles
  const fileIndex = generatedFiles.findIndex(f => f.path === filePath);
  if (fileIndex === -1) {
    console.error('File not found:', filePath);
    return false;
  }
  
  // Verify compatibility before applying changes
  if (!verifyFileCompatibility(filePath, newContent, generatedFiles)) {
    console.error('Compatibility check failed for:', filePath);
    return false;
  }
  
  // Update the file content
  generatedFiles[fileIndex].content = newContent;
  
  // Update editor if this file is currently open
  if (selectedFilePath === filePath && monacoEditor) {
    console.log('Updating Monaco editor');
    monacoEditor.setValue(newContent);
  }
  
  // Update preview if this is an HTML file
  if (filePath.endsWith('.html') && previewFrame) {
    console.log('Updating preview');
    showPreview();
  }
  
  return true;
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
    if (currentWorkspacePreviewUrl) {
        // For workspace previews, open the workspace URL
        window.open(currentWorkspacePreviewUrl, '_blank');
    } else {
        // For static previews, create and open a blob URL
        const html = assembleStaticPreviewHtml();
        if (!html) {
            console.error('No HTML content available for preview');
            return;
        }
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 10000); // Revoke after 10s
    }
}

// Update the updateSidebarUser function to handle UI state
function updateSidebarUser(username, email) {
  const profileEmail = document.getElementById('sidebarUserEmail');
  const profileName = document.getElementById('sidebarUserName');
  const profileInitial = document.getElementById('sidebarUserInitial');
  const sidebarSignIn = document.getElementById('sidebarSignIn');
  const sidebarSettings = document.getElementById('sidebarSettings');
  const sidebarAppearance = document.getElementById('sidebarAppearance');
  const sidebarHelp = document.getElementById('sidebarHelp');
  const sidebarInvite = document.getElementById('sidebarInvite');
  const sidebarSignout = document.getElementById('sidebarSignout');
  const sidebarProjects = document.getElementById('sidebarProjects');
  
  if (username && email) {
    // User is logged in
    if (profileEmail) profileEmail.textContent = email;
    if (profileName) profileName.textContent = username;
    if (profileInitial) profileInitial.textContent = username[0].toUpperCase();
    
    // Show authenticated buttons
    if (sidebarSignIn) sidebarSignIn.style.display = 'none';
    if (sidebarSettings) sidebarSettings.style.display = '';
    if (sidebarAppearance) sidebarAppearance.style.display = '';
    if (sidebarHelp) sidebarHelp.style.display = '';
    if (sidebarInvite) sidebarInvite.style.display = '';
    if (sidebarSignout) sidebarSignout.style.display = '';
    if (sidebarProjects) sidebarProjects.style.display = ''; // Show projects button when logged in
  } else {
    // User is not logged in
    if (profileEmail) profileEmail.textContent = '';
    if (profileName) profileName.textContent = '';
    if (profileInitial) profileInitial.textContent = '';
    
    // Show login button, hide other buttons
    if (sidebarSignIn) sidebarSignIn.style.display = '';
    if (sidebarSettings) sidebarSettings.style.display = 'none';
    if (sidebarAppearance) sidebarAppearance.style.display = 'none';
    if (sidebarHelp) sidebarHelp.style.display = 'none';
    if (sidebarInvite) sidebarInvite.style.display = 'none';
    if (sidebarSignout) sidebarSignout.style.display = 'none';
    if (sidebarProjects) sidebarProjects.style.display = 'none'; // Hide projects button when logged out
  }
  
  // Update editor nav button
  const editorInitial = document.getElementById('editorUserInitial');
  if (editorInitial) {
    if (username) {
      editorInitial.textContent = username[0].toUpperCase();
      editorInitial.style.display = '';
    } else {
      editorInitial.style.display = 'none';
    }
  }
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

// Add this function to handle project modal
window.openProjectsModal = function() {
  // Check if user is logged in
  const token = localStorage.getItem('codexToken');
  if (!token) {
    showAlert('Please sign in to view your projects', 'warning', 'Authentication Required');
    openSignInModal();
    return;
  }
  
  // Open the modal
  const projectsModal = document.getElementById('projectsModal');
  if (projectsModal) {
    projectsModal.classList.remove('hidden');
    // Load projects when modal opens
    loadUserProjects();
  }
}

// Add this after the other sidebar action functions
window.closeProjectsModal = function() {
  const projectsModal = document.getElementById('projectsModal');
  if (projectsModal) {
    projectsModal.classList.add('hidden');
  }
};

// Add this function to load user projects
async function loadUserProjects() {
  const projectsList = document.getElementById('projectsList');
  const projectsLoading = document.getElementById('projectsLoading');
  const projectsEmpty = document.getElementById('projectsEmpty');
  
  if (projectsLoading) projectsLoading.classList.remove('hidden');
  if (projectsList) projectsList.innerHTML = '';
  if (projectsEmpty) projectsEmpty.classList.add('hidden');

  try {
    const token = localStorage.getItem('codexToken');
    if (!token) {
      if (projectsEmpty) {
        projectsEmpty.textContent = 'Please sign in to view your projects';
        projectsEmpty.classList.remove('hidden');
      }
      return;
    }

    const response = await fetch(baseUrl + '/projects', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();

    if (projectsLoading) projectsLoading.classList.add('hidden');

    if (!data.projects || data.projects.length === 0) {
      if (projectsEmpty) {
        projectsEmpty.textContent = 'No projects found';
        projectsEmpty.classList.remove('hidden');
      }
      return;
    }

    if (projectsList) {
      // Create a grid container
      const gridContainer = document.createElement('div');
      gridContainer.className = 'grid grid-cols-1 md:grid-cols-2 gap-4';
      
      data.projects.forEach((project, idx) => {
        const projectCard = document.createElement('div');
        projectCard.className = `bg-gradient-to-br from-[#23272e]/80 to-[#18181b]/90 rounded-2xl p-5 mb-3 flex items-center justify-between shadow-xl border border-[#23272e] relative group transition-all duration-300 ease-out transform hover:scale-[1.025] hover:-translate-y-1 hover:shadow-2xl animate-fade-in`;
        projectCard.style.animationDelay = `${idx * 60}ms`;
        
        // Format date
        const date = new Date(project.createdAt);
        const formattedDate = date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
        
        // Get technology icon
        const techIcon = getTechnologyIcon(project.technology);
        
        projectCard.innerHTML = `
          <div class="flex items-center gap-4">
            <div class="bg-gradient-to-tr from-blue-500/20 to-blue-400/10 p-3 rounded-xl flex items-center justify-center shadow-inner">
              ${techIcon}
            </div>
            <div>
              <h3 class="text-white font-bold text-lg leading-tight tracking-wide">${project.name}</h3>
              <p class="text-gray-400 text-xs mt-1 tracking-wide">${project.technology}</p>
            </div>
          </div>
          <div class="flex flex-col items-end gap-2 min-w-[120px]">
            <span class="text-xs text-gray-400 bg-[#23272e] px-2 py-1 rounded mb-1 shadow">${formattedDate}</span>
            <div class="flex gap-2">
              <button onclick="event.stopPropagation(); loadProject('${project._id}')" 
                class="flex items-center gap-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-md transition-all duration-200">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
                Open
              </button>
              <button onclick="event.stopPropagation(); deleteProject('${project._id}')" 
                class="flex items-center gap-1 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-md transition-all duration-200">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                Delete
              </button>
            </div>
          </div>
        `;
        projectsList.appendChild(projectCard);
      });
    }
  } catch (error) {
    console.error('Error loading projects:', error);
    if (projectsEmpty) {
      projectsEmpty.textContent = 'Error loading projects';
      projectsEmpty.classList.remove('hidden');
    }
  } finally {
    if (projectsLoading) projectsLoading.classList.add('hidden');
  }
}

// Add function to get technology icon
function getTechnologyIcon(technology) {
  const icons = {
    'React': `<svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
    </svg>`,
    'Vue': `<svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"/>
    </svg>`,
    'Angular': `<svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/>
    </svg>`,
    'default': `<svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
    </svg>`
  };
  return icons[technology] || icons.default;
}

// Add function to load a specific project
window.loadProject = async function(projectId) {
  try {
    const token = localStorage.getItem('codexToken');
    if (!token) {
      await showAlert('Please sign in to load projects', 'warning', 'Authentication Required');
      return;
    }

    const response = await fetch(baseUrl + `/projects/${projectId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();

    if (data.error) {
      await showAlert('Error loading project: ' + data.error, 'error', 'Error');
      return;
    }

    // Set the project data
    generatedFiles = data.files;
    projectName = data.name;
    selectedFilePath = generatedFiles[0]?.path || null;

    // Update UI
    const projectNameEls = document.querySelectorAll('.project-name');
    projectNameEls.forEach(el => el.textContent = projectName);

    // Switch to editor view
    switchToEditorView();
    closeProjectsModal();

    // Initialize Monaco editor with the first file
    if (monacoEditor && generatedFiles.length > 0) {
      const firstFile = generatedFiles[0];
      monacoEditor.setValue(firstFile.content);
      const lang = guessLanguage(firstFile.path);
      monaco.editor.setModelLanguage(monacoEditor.getModel(), lang);
    }

    // Update file explorer
    renderFileExplorer();
  } catch (error) {
    console.error('Error loading project:', error);
    await showAlert('Error loading project: ' + error.message, 'error', 'Error');
  }
}

// Add function to delete a project
window.deleteProject = async function(projectId) {
  try {
    const confirmed = await showAlert('Are you sure you want to delete this project?', 'warning', 'Confirm Delete');
    if (!confirmed) return;

    const token = localStorage.getItem('codexToken');
    if (!token) {
      await showAlert('Please sign in to delete projects', 'warning', 'Authentication Required');
      return;
    }

    // Show loading state
    const projectsList = document.getElementById('projectsList');
    if (projectsList) {
      projectsList.innerHTML = '<div class="text-center py-4"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div><p class="text-gray-400 mt-2">Deleting project...</p></div>';
    }

    const response = await fetch(baseUrl + `/projects/${projectId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete project');
    }

    // Show success message
    await showAlert('Project deleted successfully', 'success', 'Success');
    
    // Reload projects list
    await loadUserProjects();
    
    // If we're currently viewing the deleted project, switch back to generator view
    if (document.getElementById('editorView').style.display !== 'none') {
      switchToGeneratorView();
    }
  } catch (error) {
    console.error('Error deleting project:', error);
    await showAlert('Error deleting project: ' + error.message, 'error', 'Error');
    // Reload projects list even if there was an error
    await loadUserProjects();
  }
}

// Add this near the top of the file with other global variables
let currentWorkspaceId = null;

// Add this function to handle workspace cleanup
async function cleanupWorkspace() {
    if (!currentWorkspaceId) return;
    
    try {
        console.log(`[Scripts] Cleaning up workspace: ${currentWorkspaceId}`);
        const response = await fetch(`/api/workspace/${currentWorkspaceId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to clean up workspace');
        }
        
        console.log(`[Scripts] Workspace ${currentWorkspaceId} cleaned up successfully`);
    } catch (error) {
        console.error('[Scripts] Error cleaning up workspace:', error);
    }
}

// Add event listeners for page unload
window.addEventListener('beforeunload', cleanupWorkspace);
window.addEventListener('unload', cleanupWorkspace);

// Update the handleGenerateResponse function to store the workspace ID
function handleGenerateResponse(response) {
    // ... existing code ...
    
    if (response.workspace) {
        currentWorkspaceId = response.workspace.id;
        // ... rest of the existing workspace handling code ...
    }
    
    // ... rest of the existing code ...
}