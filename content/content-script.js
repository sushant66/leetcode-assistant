// Main content script for LeetWhisper
// Orchestrates problem parsing, UI management, and communication with background script

// Global instances
let problemParser = null;
let uiManager = null;

// Initialize the extension when DOM is ready
function initializeExtension() {
  try {
    // Check if we're on a LeetCode problem page
    if (!isLeetCodeProblemPage()) {
      return;
    }

    // Initialize problem parser
    problemParser = new LeetCodeProblemParser();
    window.problemParser = problemParser; // Make accessible to UI manager

    // Initialize UI manager
    uiManager = new LeetCodeUIManager();

    // Set up the extension
    setupExtension();
    
  } catch (error) {
    console.error('Failed to initialize LeetWhisper:', error);
  }
}

// Setup the extension functionality
async function setupExtension() {
  // Parse the current problem
  const problemData = problemParser.parseProblem();

  // Setup observers for dynamic content
  problemParser.setupObservers();

  // Initialize UI
  await uiManager.init();

  // Setup navigation listeners for SPA behavior
  setupNavigationListeners();

  // Setup communication with background script
  setupMessageListeners();
}

// Check if we're on a LeetCode problem page
function isLeetCodeProblemPage() {
  return window.location.hostname.includes('leetcode.com') && 
         window.location.pathname.includes('/problems/');
}

// Setup navigation listeners for single-page app behavior
function setupNavigationListeners() {
  let currentUrl = window.location.href;

  // Listen for URL changes (SPA navigation)
  const observer = new MutationObserver(() => {
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;
      handlePageNavigation();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Also listen for popstate events
  window.addEventListener('popstate', handlePageNavigation);
}

// Handle page navigation
function handlePageNavigation() {
  if (isLeetCodeProblemPage()) {
    // Re-parse problem after navigation
    setTimeout(() => {
      if (problemParser) {
        const problemData = problemParser.parseProblem();
        if (problemData) {
          // Reset UI state if needed
          if (uiManager && uiManager.isPanelVisible) {
            uiManager.triggerProblemAnalysis();
          }
        }
      }
    }, 1000); // Wait for page content to load
  } else {
    // Clean up if we're no longer on a problem page
    if (uiManager) {
      uiManager.hideAssistantPanel();
    }
  }
}

// Setup message listeners for communication with background script
function setupMessageListeners() {
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
      case 'GET_CURRENT_PROBLEM':
        const currentProblem = problemParser ? problemParser.getCurrentProblem() : null;
        sendResponse({ success: true, data: currentProblem });
        break;
        
      case 'GET_CURRENT_CODE':
        if (problemParser) {
          problemParser.extractCurrentCode()
            .then(currentCode => {
              sendResponse({ success: true, data: currentCode || '' });
            })
            .catch(error => {
              console.error('Error getting current code:', error);
              sendResponse({ success: false, error: 'Failed to extract code' });
            });
        } else {
          sendResponse({ success: true, data: '' });
        }
        return true; // Indicate async response
        
      case 'TOGGLE_ASSISTANT':
        if (uiManager) {
          uiManager.toggleAssistantPanel();
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'UI Manager not initialized' });
        }
        break;
        
      case 'SHOW_ASSISTANT_AND_HINT':
        if (uiManager) {
          uiManager.showAssistantPanel();
          setTimeout(() => {
            uiManager.requestHint();
          }, 100); // Small delay to ensure panel is visible
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'UI Manager not initialized' });
        }
        break;
        
      case 'SHOW_ASSISTANT_AND_ANALYZE':
        if (uiManager) {
          uiManager.showAssistantPanel();
          setTimeout(() => {
            uiManager.triggerProblemAnalysis();
          }, 100); // Small delay to ensure panel is visible
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'UI Manager not initialized' });
        }
        break;
        
      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }
    
    return true; // Keep message channel open
  });
}

// Utility functions for debugging and development
async function debugExtension() {
  const currentCode = problemParser ? await problemParser.extractCurrentCode() : null;
  
  const info = {
    url: window.location.href,
    isProblemPage: isLeetCodeProblemPage(),
    parserInitialized: !!problemParser,
    uiInitialized: !!uiManager,
    currentProblem: problemParser ? problemParser.getCurrentProblem() : null,
    currentCode: currentCode,
    panelVisible: uiManager ? uiManager.isPanelVisible : false
  };
  
  console.log('=== LeetWhisper Debug Info ===', info);
  return info;
}

// Cleanup function
function cleanupExtension() {
  if (problemParser) {
    problemParser.cleanup();
    problemParser = null;
  }
  
  if (uiManager) {
    uiManager.cleanup();
    uiManager = null;
  }
  
  window.problemParser = null;
}

// Auto-initialization when content script loads
document.addEventListener('DOMContentLoaded', initializeExtension);

// Also try to initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
  // DOM is still loading, wait for DOMContentLoaded
  document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
  // DOM is already loaded, initialize immediately
  initializeExtension();
}

// Cleanup on page unload
window.addEventListener('beforeunload', cleanupExtension);

// Make debug function available globally for development
window.debugLeetCodeAssistant = debugExtension;

// Export functions for testing
window.LeetCodeAssistant = {
  initialize: initializeExtension,
  cleanup: cleanupExtension,
  debug: debugExtension,
  isLeetCodeProblemPage,
  getProblemParser: () => problemParser,
  getUIManager: () => uiManager
};