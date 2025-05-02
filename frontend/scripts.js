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
if (enhanceBtn) enhanceBtn.addEventListener('click', () => {
  alert('Enhance prompt feature coming soon!');
});
const generateBtn = document.getElementById('generateBtn');
const generatedCodeDiv = document.getElementById('generatedCode');
if (generateBtn) generateBtn.addEventListener('click', async () => {
  // Get form values
  const promptInput = document.getElementById('prompt');
  const techSelect = document.getElementById('tech');
  const modelSelect = document.getElementById('model');
  const prompt = promptInput.value.trim();
  const technology = techSelect.value;
  const model = modelSelect.value;
  if (!prompt) {
    generatedCodeDiv.textContent = 'Please enter a prompt.';
    generatedCodeDiv.classList.remove('hidden');
    return;
  }
  generatedCodeDiv.textContent = 'Generating code...';
  generatedCodeDiv.classList.remove('hidden');
  const payload = { prompt, technology, model };
  console.log('Sending to backend:', payload);
  try {
    const response = await fetch('http://localhost:4000/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    console.log('Received from backend:', data);
    if (data.files && Array.isArray(data.files)) {
      generatedCodeDiv.innerHTML = data.files.map(file =>
        `<div style="margin-bottom:1.5em;">
          <div style="font-weight:bold;color:#93c5fd;">${file.path}</div>
          <pre style="background:#22223b;color:#a3e635;padding:1em;border-radius:8px;overflow-x:auto;">${file.content.replace(/</g, '&lt;')}</pre>
          <div style="font-size:0.85em;color:#aaa;">Provider: ${file.provider}, Model: ${file.model}, Tech: ${file.technology}</div>
        </div>`
      ).join('');
      generatedCodeDiv.classList.remove('hidden');
    } else if (data.error) {
      generatedCodeDiv.textContent = 'Error: ' + data.error;
    } else {
      generatedCodeDiv.textContent = 'Unknown error.';
    }
  } catch (err) {
    console.error('Network error:', err);
    generatedCodeDiv.textContent = 'Network error: ' + err.message;
  }
}); 