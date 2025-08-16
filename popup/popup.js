// Popup script for LeetCode AI Assistant
// Handles settings, status display, and quick actions

// DOM elements
let elements = {};

// Current settings
let currentSettings = {
  apiKey: '',
  aiProvider: 'gpt-4-1-mini',
  hintLevel: 1,
  panelPosition: 'right',
  autoAnalyze: true,
  showHints: true
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
    
    // Action buttons
    toggleAssistant: document.getElementById('toggle-assistant'),
    analyzeProblem: document.getElementById('analyze-problem'),
    getHint: document.getElementById('get-hint'),
    
    // Settings elements
    panelPosition: document.getElementById('panel-position'),
    autoAnalyze: document.getElementById('auto-analyze'),
    showHints: document.getElementById('show-hints'),
    
    // Footer elements
    saveStatus: document.getElementById('save-status'),
    helpLink: document.getElementById('help-link'),
    feedbackLink: document.getElementById('feedback-link')
  };
}

// Load settings from Chrome storage
async function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get({
      apiKey: '',
      aiProvider: 'gpt-4-1-mini',
      hintLevel: 1,
      panelPosition: 'right',
      autoAnalyze: true,
      showHints: true
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
  elements.autoAnalyze.checked = currentSettings.autoAnalyze !== false;
  elements.showHints.checked = currentSettings.showHints !== false;
  
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
      disableActions(true);
      return;
    }
    
    // Check if we're on a problem page
    if (!tab.url.includes('/problems/')) {
      updateStatus('Connected', 'connected');
      updateProblemStatus('Navigate to a problem page');
      disableActions(true);
      return;
    }
    
    // Try to get current problem info
    try {
      const response = await sendMessageToTab(tab.id, { type: 'GET_CURRENT_PROBLEM' });
      
      if (response && response.success && response.data) {
        updateStatus('Active', 'connected');
        updateProblemStatus(response.data.title || 'Problem detected');
        disableActions(false);
      } else {
        updateStatus('Loading...', 'loading');
        updateProblemStatus('Problem loading...');
        disableActions(true);
      }
    } catch (error) {
      updateStatus('Loading...', 'loading');
      updateProblemStatus('Extension loading...');
      disableActions(true);
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

// Enable/disable action buttons
function disableActions(disabled) {
  elements.toggleAssistant.disabled = disabled;
  elements.analyzeProblem.disabled = disabled;
  elements.getHint.disabled = disabled;
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
  elements.autoAnalyze.addEventListener('change', saveSettings);
  elements.showHints.addEventListener('change', saveSettings);
  
  // Action button handlers
  elements.toggleAssistant.addEventListener('click', handleToggleAssistant);
  elements.analyzeProblem.addEventListener('click', handleAnalyzeProblem);
  elements.getHint.addEventListener('click', handleGetHint);
  
  // Footer link handlers
  elements.helpLink.addEventListener('click', handleHelpLink);
  elements.feedbackLink.addEventListener('click', handleFeedbackLink);
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
      panelPosition: elements.panelPosition.value,
      autoAnalyze: elements.autoAnalyze.checked,
      showHints: elements.showHints.checked
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
  elements.saveStatus.textContent = message;
  elements.saveStatus.className = `save-status ${type}`;
  
  // Clear message after 3 seconds
  setTimeout(() => {
    elements.saveStatus.textContent = '';
    elements.saveStatus.className = 'save-status';
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

// Handle toggle assistant button
async function handleToggleAssistant() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;
    
    const response = await sendMessageToTab(tab.id, { type: 'TOGGLE_ASSISTANT' });
    
    if (response && response.success) {
      showSaveStatus('Assistant toggled', 'success');
    } else {
      showSaveStatus('Toggle failed', 'error');
    }
    
  } catch (error) {
    showSaveStatus('Toggle failed', 'error');
  }
}

// Handle analyze problem button
async function handleAnalyzeProblem() {
  try {
    if (!currentSettings.apiKey) {
      showSaveStatus('Please set API key first', 'error');
      return;
    }
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;
    
    // Get current problem
    const problemResponse = await sendMessageToTab(tab.id, { type: 'GET_CURRENT_PROBLEM' });
    
    if (!problemResponse || !problemResponse.success || !problemResponse.data) {
      showSaveStatus('No problem detected', 'error');
      return;
    }
    
    // Send to background for analysis
    chrome.runtime.sendMessage({
      type: 'ANALYZE_PROBLEM',
      data: problemResponse.data
    }, (response) => {
      if (response && response.success) {
        showSaveStatus('Problem analyzed', 'success');
      } else {
        showSaveStatus('Analysis failed', 'error');
      }
    });
    
  } catch (error) {
    showSaveStatus('Analysis failed', 'error');
  }
}

// Handle get hint button
async function handleGetHint() {
  try {
    if (!currentSettings.apiKey) {
      showSaveStatus('Please set API key first', 'error');
      return;
    }
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;
    
    // Get current problem and code
    const [problemResponse, codeResponse] = await Promise.all([
      sendMessageToTab(tab.id, { type: 'GET_CURRENT_PROBLEM' }),
      sendMessageToTab(tab.id, { type: 'GET_CURRENT_CODE' })
    ]);
    
    if (!problemResponse || !problemResponse.success || !problemResponse.data) {
      showSaveStatus('No problem detected', 'error');
      return;
    }
    
    const requestData = {
      problemData: problemResponse.data,
      currentCode: codeResponse?.data || '',
      hintLevel: currentSettings.hintLevel
    };
    
    // Send to background for hint generation
    chrome.runtime.sendMessage({
      type: 'GET_HINT',
      data: requestData
    }, (response) => {
      if (response && response.success) {
        showSaveStatus('Hint generated', 'success');
      } else {
        showSaveStatus('Hint failed', 'error');
      }
    });
    
  } catch (error) {
    showSaveStatus('Hint failed', 'error');
  }
}

// Handle help link
function handleHelpLink() {
  chrome.tabs.create({
    url: 'https://github.com/your-username/leetcode-assistant#readme'
  });
}

// Handle feedback link
function handleFeedbackLink() {
  chrome.tabs.create({
    url: 'https://github.com/your-username/leetcode-assistant/issues'
  });
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