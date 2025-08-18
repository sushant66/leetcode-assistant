// UI Manager for injecting and managing the assistant interface on LeetCode pages

class LeetCodeUIManager {
  constructor() {
    this.assistantPanel = null;
    this.isInitialized = false;
    this.isPanelVisible = false;
    this.hintLevel = 1; // Track progressive hint level (1-5) - will be updated from settings
    this.defaultHintLevel = 1; // Default hint level from settings
    this.currentProblemUrl = null; // Track current problem to reset hint level
    this.chatHistory = []; // Store last 3 conversation pairs {user: "", assistant: ""}
    this.maxHistoryPairs = 3; // Limit to control token costs
    this.settings = {
      panelPosition: 'right',
      panelWidth: '350px'
    };
  }

  // Initialize the UI manager
  async init() {
    if (this.isInitialized) return;

    try {
      await this.loadSettings();
      this.injectAssistantToggle();
      this.setupEventListeners();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize UI Manager:', error);
    }
  }

  // Load user settings
  async loadSettings() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (response) => {
        if (response && response.success) {
          this.settings = { ...this.settings, ...response.data };
          // Set default hint level from settings
          this.defaultHintLevel = this.settings.hintLevel || 1;
          this.hintLevel = this.defaultHintLevel;
        }
        resolve();
      });
    });
  }

  // Inject the assistant toggle button
  injectAssistantToggle() {
    // Remove existing toggle if present
    const existingToggle = document.getElementById('leetcode-ai-toggle');
    if (existingToggle) {
      existingToggle.remove();
    }

    // Create toggle button
    const toggle = document.createElement('div');
    toggle.id = 'leetcode-ai-toggle';
    toggle.className = 'leetcode-ai-toggle';
    toggle.innerHTML = `
      <div class="toggle-icon">🤖</div>
      <div class="toggle-text">AI Assistant</div>
    `;

    // Add styles
    toggle.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      background: #1a1a1a;
      color: white;
      border: 2px solid #00d4aa;
      border-radius: 8px;
      padding: 10px 15px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      transition: all 0.3s ease;
      user-select: none;
    `;

    // Add hover effects
    toggle.addEventListener('mouseenter', () => {
      toggle.style.background = '#2a2a2a';
      toggle.style.transform = 'translateY(-2px)';
      toggle.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.4)';
    });

    toggle.addEventListener('mouseleave', () => {
      toggle.style.background = '#1a1a1a';
      toggle.style.transform = 'translateY(0)';
      toggle.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
    });

    // Add click handler
    toggle.addEventListener('click', () => {
      this.toggleAssistantPanel();
    });

    // Inject into page
    document.body.appendChild(toggle);
  }

  // Toggle the assistant panel visibility
  toggleAssistantPanel() {
    if (this.isPanelVisible) {
      this.hideAssistantPanel();
    } else {
      this.showAssistantPanel();
    }
  }

  // Show the assistant panel
  showAssistantPanel() {
    if (!this.assistantPanel) {
      this.createAssistantPanel();
    }

    this.assistantPanel.style.setProperty('display', 'block', 'important');
    this.isPanelVisible = true;

    // Update toggle button state
    const toggle = document.getElementById('leetcode-ai-toggle');
    if (toggle) {
      toggle.style.background = '#00d4aa';
      toggle.style.color = '#1a1a1a';
    }

    // Trigger problem analysis if not done yet
    this.triggerProblemAnalysis();
  }

  // Hide the assistant panel
  hideAssistantPanel() {
    if (this.assistantPanel) {
      this.assistantPanel.style.setProperty('display', 'none', 'important');
    }
    this.isPanelVisible = false;

    // Update toggle button state
    const toggle = document.getElementById('leetcode-ai-toggle');
    if (toggle) {
      toggle.style.background = '#1a1a1a';
      toggle.style.color = 'white';
    }
  }

  // Create the assistant panel
  createAssistantPanel() {
    // Remove existing panel if present
    const existingPanel = document.getElementById('leetcode-ai-panel');
    if (existingPanel) {
      existingPanel.remove();
    }

    // Create panel container
    const panel = document.createElement('div');
    panel.id = 'leetcode-ai-panel';
    panel.className = 'leetcode-ai-panel';

    // Set panel position and styles
    const position = this.settings.panelPosition;
    panel.style.cssText = `
      position: fixed !important;
      top: 80px !important;
      ${position}: 20px !important;
      width: ${this.settings.panelWidth} !important;
      height: calc(100vh - 120px) !important;
      background: #1a1a1a !important;
      border: 1px solid #333 !important;
      border-radius: 12px !important;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5) !important;
      z-index: 999999 !important;
      display: none !important;
      overflow: hidden !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    `;

    // Create panel content
    panel.innerHTML = `
      <div class="panel-header">
        <h3>🤖 AI Assistant</h3>
        <button class="close-btn">×</button>
      </div>
      <div class="panel-content">
        <div class="problem-analysis" id="problem-analysis">
          <div class="loading">Analyzing problem...</div>
        </div>
        <div class="chat-container" id="chat-container">
          <div class="chat-messages" id="chat-messages">
            <div class="assistant-message">
              Hi! I'm here to help you solve this LeetCode problem. I'll provide hints and guidance without giving away the solution. How can I assist you?
            </div>
          </div>
          <div class="chat-input-container">
            <input type="text" id="chat-input" placeholder="Ask for a hint or explanation..." />
            <button id="send-btn">Send</button>
          </div>
        </div>
        <div class="quick-actions">
          <button class="action-btn" data-action="hint">💡 Get Hint</button>
          <button class="action-btn" data-action="review">🔍 Review Code</button>
          <button class="action-btn" data-action="explain">📚 Explain Concept</button>
          <button class="action-btn" data-action="direct-help">🎯 Direct Help</button>
        </div>
      </div>
    `;

    // Add panel styles
    this.addPanelStyles(panel);

    // Add event listeners
    this.setupPanelEventListeners(panel);

    // Inject into page
    document.body.appendChild(panel);
    this.assistantPanel = panel;
  }

  // Add styles to the panel
  addPanelStyles(panel) {
    const style = document.createElement('style');
    style.textContent = `
      .leetcode-ai-panel .panel-header {
        background: #2a2a2a;
        padding: 15px 20px;
        border-bottom: 1px solid #333;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .leetcode-ai-panel .panel-header h3 {
        margin: 0;
        color: #00d4aa;
        font-size: 16px;
        font-weight: 600;
      }
      
      .leetcode-ai-panel .close-btn {
        background: none;
        border: none;
        color: #999;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .leetcode-ai-panel .close-btn:hover {
        color: #fff;
        background: #333;
        border-radius: 4px;
      }
      
      .leetcode-ai-panel .panel-content {
        height: calc(100% - 60px);
        display: flex;
        flex-direction: column;
      }
      
      .leetcode-ai-panel .problem-analysis {
        padding: 15px;
        border-bottom: 1px solid #333;
        background: #252525;
        display: none;
      }
      
      .leetcode-ai-panel .loading {
        color: #999;
        font-style: italic;
      }
      
      .leetcode-ai-panel .chat-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
      }
      
      .leetcode-ai-panel .chat-messages {
        flex: 1;
        padding: 15px;
        overflow-y: auto;
        overflow-x: hidden;
        min-height: 0;
        max-height: none;
        scrollbar-width: thin;
        scrollbar-color: #444 #1a1a1a;
      }
      
      .leetcode-ai-panel .chat-messages::-webkit-scrollbar {
        width: 6px;
      }
      
      .leetcode-ai-panel .chat-messages::-webkit-scrollbar-track {
        background: #1a1a1a;
      }
      
      .leetcode-ai-panel .chat-messages::-webkit-scrollbar-thumb {
        background: #444;
        border-radius: 3px;
      }
      
      .leetcode-ai-panel .chat-messages::-webkit-scrollbar-thumb:hover {
        background: #555;
      }
      
      .leetcode-ai-panel .assistant-message,
      .leetcode-ai-panel .user-message {
        margin-bottom: 15px;
        padding: 10px 12px;
        border-radius: 8px;
        line-height: 1.4;
        font-size: 14px;
      }
      
      .leetcode-ai-panel .assistant-message {
        background: #2a2a2a;
        color: #e0e0e0;
        border-left: 3px solid #00d4aa;
      }
      
      .leetcode-ai-panel .user-message {
        background: #1e3a5f;
        color: #b3d9ff;
        margin-left: 20px;
      }
      
      .leetcode-ai-panel .chat-input-container {
        padding: 15px;
        border-top: 1px solid #333;
        display: flex;
        gap: 10px;
      }
      
      .leetcode-ai-panel #chat-input {
        flex: 1;
        background: #2a2a2a;
        border: 1px solid #444;
        border-radius: 6px;
        padding: 8px 12px;
        color: white;
        font-size: 14px;
      }
      
      .leetcode-ai-panel #chat-input:focus {
        outline: none;
        border-color: #00d4aa;
      }
      
      .leetcode-ai-panel #send-btn {
        background: #00d4aa;
        border: none;
        border-radius: 6px;
        padding: 8px 16px;
        color: #1a1a1a;
        font-weight: 500;
        cursor: pointer;
        font-size: 14px;
      }
      
      .leetcode-ai-panel #send-btn:hover {
        background: #00b894;
      }
      
      .leetcode-ai-panel .quick-actions {
        padding: 15px;
        border-top: 1px solid #333;
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      
      .leetcode-ai-panel .action-btn {
        background: #333;
        border: 1px solid #444;
        border-radius: 6px;
        padding: 6px 10px;
        color: #e0e0e0;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .leetcode-ai-panel .action-btn:hover {
        background: #444;
        border-color: #00d4aa;
      }
    `;
    
    if (!document.getElementById('leetcode-ai-styles')) {
      style.id = 'leetcode-ai-styles';
      document.head.appendChild(style);
    }
  }

  // Setup event listeners for the panel
  setupPanelEventListeners(panel) {
    // Close button
    const closeBtn = panel.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
      this.hideAssistantPanel();
    });

    // Chat input
    const chatInput = panel.querySelector('#chat-input');
    const sendBtn = panel.querySelector('#send-btn');
    
    const sendMessage = () => {
      const message = chatInput.value.trim();
      if (message) {
        this.sendChatMessage(message);
        chatInput.value = '';
      }
    };

    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });

    // Quick action buttons
    const actionBtns = panel.querySelectorAll('.action-btn');
    actionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        this.handleQuickAction(action);
      });
    });
  }

  // Setup general event listeners
  setupEventListeners() {
    // Listen for escape key to close panel
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isPanelVisible) {
        this.hideAssistantPanel();
      }
    });
  }

  // Trigger problem analysis
  triggerProblemAnalysis() {
    const problemParser = window.problemParser;
    if (!problemParser) return;

    const problemData = problemParser.getCurrentProblem();
    if (!problemData) return;

    // Send problem data to background for analysis
    chrome.runtime.sendMessage({
      type: 'ANALYZE_PROBLEM',
      data: problemData
    }, (response) => {
      this.displayProblemAnalysis(response);
    });
  }

  // Display problem analysis results
  displayProblemAnalysis(response) {
    const analysisContainer = document.getElementById('problem-analysis');
    if (!analysisContainer) return;

    if (response && response.success) {
      // Hide the analysis container since we're not displaying any analysis fields
      analysisContainer.style.display = 'none';
    } else {
      analysisContainer.innerHTML = `
        <div class="error">Failed to analyze problem: ${response?.error || 'Unknown error'}</div>
      `;
    }
  }

  // Add user message to chat
  addUserMessage(message) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = 'user-message';
    messageDiv.textContent = message;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Add assistant message to chat
  addAssistantMessage(message) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = 'assistant-message';
    messageDiv.textContent = message;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Send chat message (unified function for both regular chat and hint requests)
  sendChatMessage(message, isHintRequest = false) {
    // Add user message to chat
    this.addUserMessage(message);
    
    this.handleUserMessage(message, isHintRequest);
  }

  // Handle user messages
  handleUserMessage(message, isHintRequest = false) {
    // Get current problem data
    const problemParser = window.problemParser;
    if (!problemParser) {
      this.addAssistantMessage("Sorry, I couldn't access the problem data. Please try again.");
      return;
    }

    const problemData = problemParser.getCurrentProblem();
    if (!problemData) {
      this.addAssistantMessage("Please make sure you're on a LeetCode problem page.");
      return;
    }

    // Check if we switched problems and clear history if needed
    this.checkAndClearHistoryForNewProblem(problemData);

    // Send chat message to background service with conversation history
    chrome.runtime.sendMessage({
      type: 'CHAT_MESSAGE',
      data: {
        message: message,
        problemData: problemData,
        chatHistory: this.chatHistory,
        isHintRequest: isHintRequest,
        timestamp: Date.now()
      }
    }, (response) => {
      if (response && response.success) {
        const responseData = response.data;
        const assistantResponse = responseData.response || responseData.hint || "I'm here to help! Ask me for hints or explanations.";
        
        // Check if this is a scored response
        if (responseData.understandingScore !== undefined) {
          const score = responseData.understandingScore;
          
          // Add score indicator to the message for high scores
          let finalResponse = assistantResponse;
          if (score >= 91) {
            finalResponse = `🎉 ${assistantResponse}`;
          } else if (score >= 81) {
            finalResponse = `⭐ ${assistantResponse}`;
          }
          
          this.addAssistantMessage(finalResponse);
          
          // Optional: Log score for debugging (can be removed in production)
          if (responseData.reasoning) {
            console.log(`Understanding Score: ${score}/100 - ${responseData.reasoning}`);
          }
        } else {
          this.addAssistantMessage(assistantResponse);
        }
        
        // Add this exchange to chat history
        this.addToHistory(message, assistantResponse);
      } else {
        this.addAssistantMessage("Sorry, I couldn't process your request right now. " + (response?.error || "Please try again."));
      }
    });
  }

  // Add exchange to chat history (maintain last 3 pairs)
  addToHistory(userMessage, assistantResponse) {
    // Add new pair to history
    this.chatHistory.push({
      user: userMessage,
      assistant: assistantResponse
    });

    // Keep only last 3 pairs to control token costs
    if (this.chatHistory.length > this.maxHistoryPairs) {
      this.chatHistory.shift(); // Remove oldest pair
    }
  }

  // Check if we switched problems and clear history if needed
  checkAndClearHistoryForNewProblem(problemData) {
    const currentUrl = window.location.href;
    
    // If we switched to a different problem, clear chat history
    if (this.currentProblemUrl && this.currentProblemUrl !== currentUrl) {
      this.chatHistory = [];
      this.hintLevel = this.defaultHintLevel; // Reset to default hint level
    }
    
    this.currentProblemUrl = currentUrl;
  }

  // Handle quick actions
  handleQuickAction(action) {
    switch (action) {
      case 'hint':
        this.requestHint();
        break;
      case 'review':
        this.reviewCode();
        break;
      case 'explain':
        this.explainConcept();
        break;
      case 'direct-help':
        this.requestDirectHelp();
        break;
    }
  }

  // Request a hint using the unified chat system
  requestHint() {
    const problemParser = window.problemParser;
    if (!problemParser) {
      this.addAssistantMessage("Sorry, I couldn't access the problem data. Please try again.");
      return;
    }

    const problemData = problemParser.getCurrentProblem();
    if (!problemData) {
      this.addAssistantMessage("Please make sure you're on a LeetCode problem page.");
      return;
    }

    // Progressive hint request messages
    const hintRequestMessages = [
      "Can you give me a hint for this problem?",
      "I need another hint, I'm still stuck.",
      "Can you give me a more specific hint?", 
      "I really need more help with this problem.",
      "Can you help me understand the approach to solve this?"
    ];
    
    // Count previous hint requests in chat history
    const hintExchanges = this.chatHistory.filter(exchange => 
      exchange.user.toLowerCase().includes('hint')
    ).length;
    
    const messageIndex = Math.min(hintExchanges, hintRequestMessages.length - 1);
    const hintMessage = hintRequestMessages[messageIndex];
    
    // Send hint request through the unified chat system
    this.sendChatMessage(hintMessage, true); // true indicates this is a hint request
  }

  // Review current code
  reviewCode() {
    const problemParser = window.problemParser;
    if (!problemParser) {
      this.addAssistantMessage("Sorry, I couldn't access the problem parser. Please try again.");
      return;
    }

    const problemData = problemParser.getCurrentProblem();
    if (!problemData) {
      this.addAssistantMessage("Please make sure you're on a LeetCode problem page.");
      return;
    }

    // Extract current code from the editor
    let currentCode = problemParser.extractCurrentCode();
    
    // If no code found, try to get from clipboard as last resort
    if (!currentCode || currentCode.trim() === '' || currentCode.length < 50) {
      this.addAssistantMessage("Trying to access your clipboard for code. Please make sure you've copied your code (Ctrl+A, Ctrl+C).");
      
      // Try to read from clipboard
      if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard.readText()
          .then(clipboardText => {
            if (clipboardText && clipboardText.length > 50 && 
                (clipboardText.includes('function') || clipboardText.includes('class') || 
                 clipboardText.includes('def ') || clipboardText.includes('return'))) {
              
              this.addAssistantMessage("Found code in clipboard! Reviewing...");
              this.performCodeReview(problemData, clipboardText);
            } else {
              this.addAssistantMessage("Please select all your code (Ctrl+A), copy it (Ctrl+C), then try 'Review Code' again.");
            }
          })
          .catch(err => {
            this.addAssistantMessage("Couldn't access clipboard. Please select all your code (Ctrl+A), copy it (Ctrl+C), then try again.");
          });
        return;
      } else {
        this.addAssistantMessage("Please select all your code (Ctrl+A), copy it (Ctrl+C), then try 'Review Code' again.");
        return;
      }
    }
    
    this.performCodeReview(problemData, currentCode);
  }

  // Perform the actual code review
  performCodeReview(problemData, currentCode) {
    // Add user message to show what's happening
    this.addUserMessage("Please review my code for this problem.");

    // Send code review request with actual code
    chrome.runtime.sendMessage({
      type: 'REVIEW_CODE',
      data: {
        problemData: problemData,
        currentCode: currentCode,
        timestamp: Date.now()
      }
    }, (response) => {
      if (response && response.success) {
        const reviewData = response.data;
        let reviewMessage = "";
        
        // Handle the natural conversational response
        if (reviewData.response) {
          reviewMessage = reviewData.response;
        } else if (reviewData.type === 'text') {
          reviewMessage = reviewData.response;
        } else {
          // Fallback to old structured format if new format isn't available
          if (reviewData.issues && reviewData.issues.length > 0) {
            reviewMessage += "Issues: " + reviewData.issues.join("; ") + "\n";
          }
          if (reviewData.suggestions && reviewData.suggestions.length > 0) {
            reviewMessage += "Suggestions: " + reviewData.suggestions.join("; ") + "\n";
          }
          if (reviewData.complexity) {
            reviewMessage += "Complexity: " + reviewData.complexity;
          }
        }
        
        this.addAssistantMessage(reviewMessage || "Your code looks good!");
      } else {
        this.addAssistantMessage("Sorry, I couldn't review your code right now. " + (response?.error || "Please try again."));
      }
    });
  }

  // Explain concept
  explainConcept() {
    this.sendChatMessage("Can you explain the key concepts for this problem?");
  }

  // Request direct help (bypass Socratic method)
  requestDirectHelp() {
    this.sendChatMessage("Please give me direct help with this problem.");
  }


  // Cleanup
  cleanup() {
    if (this.assistantPanel) {
      this.assistantPanel.remove();
      this.assistantPanel = null;
    }
    
    const toggle = document.getElementById('leetcode-ai-toggle');
    if (toggle) {
      toggle.remove();
    }

    const styles = document.getElementById('leetcode-ai-styles');
    if (styles) {
      styles.remove();
    }

    this.isInitialized = false;
    this.isPanelVisible = false;
  }
}

// Export for use in content script
window.LeetCodeUIManager = LeetCodeUIManager;