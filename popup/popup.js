// Popup script for LeetWhisper
// Handles settings, status display, and quick actions

// DOM elements
let elements = {};

// Current settings
let currentSettings = {
  apiKey: '',
  aiProvider: 'gpt-4-1-mini',
  hintLevel: 1,
  panelPosition: 'right'
};

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', initializePopup);

async function initializePopup() {
  try {
    // Get DOM elements
    cacheElements();
    
    // Load current settings
    await loadSettings();
    
    // Update UI with settings
    updateUIFromSettings();
    
    // Check extension status
    await checkExtensionStatus();
    
    // Setup event listeners
    setupEventListeners();
    
  } catch (error) {
    console.error('Failed to initialize popup:', error);
    showStatus('Failed to initialize popup', 'error');
  }
}

// Cache DOM elements
function cacheElements() {
  elements = {
    // Status elements
    extensionStatus: document.getElementById('extension-status'),
    currentProblem: document.getElementById('current-problem'),
    
    // Configuration elements
    apiKey: document.getElementById('api-key'),
    toggleKeyVisibility: document.getElementById('toggle-key-visibility'),
    aiProvider: document.getElementById('ai-provider'),
    hintLevel: document.getElementById('hint-level'),
    
    // Settings elements
    panelPosition: document.getElementById('panel-position')
  };
}

// Load settings from Chrome storage
async function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get({
      apiKey: '',
      aiProvider: 'gpt-4-1-mini',
      hintLevel: 1,
      panelPosition: 'right'
    }, (settings) => {
      currentSettings = settings;
      resolve();
    });
  });
}

// Update UI elements with current settings
function updateUIFromSettings() {
  elements.apiKey.value = currentSettings.apiKey || '';
  elements.aiProvider.value = currentSettings.aiProvider || 'openai';
  elements.hintLevel.value = currentSettings.hintLevel || 1;
  elements.panelPosition.value = currentSettings.panelPosition || 'right';
  
  // Update provider-specific UI
  updateProviderUI();
}

// Check extension status
async function checkExtensionStatus() {
  try {
    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      updateStatus('No active tab', 'error');
      return;
    }
    
    // Check if we're on LeetCode
    if (!tab.url.includes('leetcode.com')) {
      updateStatus('Not on LeetCode', 'inactive');
      updateProblemStatus('Navigate to a LeetCode problem');
      return;
    }
    
    // Check if we're on a problem page
    if (!tab.url.includes('/problems/')) {
      updateStatus('Connected', 'connected');
      updateProblemStatus('Navigate to a problem page');
      return;
    }
    
    // Try to get current problem info
    try {
      const response = await sendMessageToTab(tab.id, { type: 'GET_CURRENT_PROBLEM' });
      
      if (response && response.success && response.data) {
        updateStatus('Active', 'connected');
        updateProblemStatus(response.data.title || 'Problem detected');
      } else {
        updateStatus('Loading...', 'loading');
        updateProblemStatus('Problem loading...');
      }
    } catch (error) {
      updateStatus('Loading...', 'loading');
      updateProblemStatus('Extension loading...');
    }
    
  } catch (error) {
    console.error('Failed to check extension status:', error);
    updateStatus('Error', 'error');
  }
}

// Send message to content script
function sendMessageToTab(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

// Update status display
function updateStatus(text, type) {
  elements.extensionStatus.textContent = text;
  elements.extensionStatus.className = `status-value ${type}`;
}

// Update problem status
function updateProblemStatus(text) {
  elements.currentProblem.textContent = text;
}

// Setup event listeners
function setupEventListeners() {
  // API key visibility toggle
  elements.toggleKeyVisibility.addEventListener('click', toggleApiKeyVisibility);
  
  // Settings change handlers
  elements.apiKey.addEventListener('input', debounce(saveSettings, 500));
  elements.aiProvider.addEventListener('change', () => {
    updateProviderUI();
    saveSettings();
  });
  elements.hintLevel.addEventListener('change', saveSettings);
  elements.panelPosition.addEventListener('change', saveSettings);
}

// Toggle API key visibility
function toggleApiKeyVisibility() {
  const isPassword = elements.apiKey.type === 'password';
  elements.apiKey.type = isPassword ? 'text' : 'password';
  elements.toggleKeyVisibility.textContent = isPassword ? '🙈' : '👁️';
}

// Save settings to Chrome storage
async function saveSettings() {
  try {
    const newSettings = {
      apiKey: elements.apiKey.value.trim(),
      aiProvider: elements.aiProvider.value,
      hintLevel: parseInt(elements.hintLevel.value),
      panelPosition: elements.panelPosition.value
    };
    
    await chrome.storage.sync.set(newSettings);
    currentSettings = newSettings;
    
    showSaveStatus('Settings saved', 'success');
    
  } catch (error) {
    console.error('Failed to save settings:', error);
    showSaveStatus('Save failed', 'error');
  }
}

// Show save status message
function showSaveStatus(message, type) {
  // Create a temporary notification
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.className = `temp-notification ${type}`;
  notification.style.cssText = `
    position: fixed;
    bottom: 10px;
    right: 10px;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
    ${type === 'success' ? 'background: #10b981; color: white;' : 'background: #ef4444; color: white;'}
  `;
  
  // Add animation styles if not already present
  if (!document.getElementById('temp-notification-styles')) {
    const style = document.createElement('style');
    style.id = 'temp-notification-styles';
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateY(100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(notification);
  
  // Remove notification after 3 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 3000);
}

// Update UI based on selected AI provider
function updateProviderUI() {
  const provider = elements.aiProvider.value;
  const apiKeyLabel = document.getElementById('api-key-label');
  const apiHelpText = document.getElementById('api-help-text');
  const apiKeyInput = elements.apiKey;
  
  switch (provider) {
    case 'gpt-4-1-mini':
      apiKeyLabel.textContent = 'OpenAI API Key:';
      apiKeyInput.placeholder = 'sk-...';
      apiHelpText.innerHTML = 'Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank">OpenAI</a>';
      break;
      
    case 'gemini-2-5-flash':
      apiKeyLabel.textContent = 'Google AI API Key:';
      apiKeyInput.placeholder = 'AIza...';
      apiHelpText.innerHTML = 'Get your API key from <a href="https://aistudio.google.com/app/apikey" target="_blank">Google AI Studio</a>';
      break;
      
    default:
      apiKeyLabel.textContent = 'API Key:';
      apiKeyInput.placeholder = 'Enter your API key...';
      apiHelpText.textContent = 'Get your API key from the provider\'s dashboard';
  }
}


// Utility function for debouncing
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Refresh status periodically
setInterval(checkExtensionStatus, 5000);

// Show status helper
function showStatus(message, type) {
  showSaveStatus(message, type);
}