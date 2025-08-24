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
      this.setupStorageListener();
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
      <div class="toggle-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L13.09 8.26L19 9L13.09 9.74L12 14L10.91 9.74L5 9L10.91 8.26L12 2Z" fill="currentColor"/>
          <circle cx="12" cy="12" r="2.5" fill="currentColor" opacity="0.8"/>
          <path d="M8 16.5C8 16.5 9.5 18 12 18C14.5 18 16 16.5 16 16.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <circle cx="9" cy="12" r="1" fill="currentColor" opacity="0.6"/>
          <circle cx="15" cy="12" r="1" fill="currentColor" opacity="0.6"/>
        </svg>
      </div>
      <div class="toggle-text">LeetWhisper</div>
    `;

    // Add styles
    toggle.style.cssText = `
      position: fixed;
      top: 50%;
      right: 20px;
      transform: translateY(-50%);
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
      toggle.style.transform = 'translateY(-50%) translateY(-2px)';
      toggle.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.4)';
    });

    toggle.addEventListener('mouseleave', () => {
      toggle.style.background = '#1a1a1a';
      toggle.style.transform = 'translateY(-50%)';
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

    // Update problem context when panel is shown
    this.updateProblemContext();
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
      top: 10px !important;
      ${position}: 10px !important;
      width: ${this.settings.panelWidth} !important;
      height: calc(100vh - 20px) !important;
      background: #1a1a1a !important;
      border: 1px solid #333 !important;
      border-radius: 12px !important;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5) !important;
      z-index: 999999 !important;
      display: none !important;
      overflow: hidden !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    `;

    // Create modern panel content with SaaS-style interface
    panel.innerHTML = `
      <div class="modern-panel-header">
        <div class="header-content">
          <div class="ai-avatar">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" fill="currentColor"/>
              <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.7"/>
            </svg>
          </div>
          <div class="header-text">
            <h3 class="assistant-title">LeetWhisper</h3>
            <span class="assistant-status">Ready to help</span>
          </div>
        </div>
        <div class="header-actions">
          <button class="close-btn" title="Close">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
      </div>
      
      <div class="modern-panel-content">
        <div class="problem-context" id="problem-context">
          <div class="context-header">
            <span class="context-label">Current Problem</span>
            <div class="problem-difficulty-badge" id="problem-diff-badge">Medium</div>
          </div>
          <div class="context-title" id="context-problem-title">Loading problem...</div>
        </div>
        
        <div class="chat-interface" id="chat-interface">
          <div class="chat-messages-container" id="chat-messages">
            <div class="welcome-message">
              <div class="message-avatar">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              </div>
              <div class="message-content">
                <div class="message-text">
                  Hello! I'm your AI coding assistant. I'm here to guide you through this LeetCode problem step by step.
                  <br><br>
                  I can help you with:
                  <ul>
                    <li>Understanding the problem approach</li>
                    <li>Analyzing your code</li>
                    <li>Explaining algorithms and concepts</li>
                    <li>Providing progressive hints</li>
                  </ul>
                  What would you like to start with?
                </div>
                <div class="message-time">Just now</div>
              </div>
            </div>
          </div>
          
          <div class="quick-actions-grid">
            <button class="modern-action-btn" data-action="hint">
              <div class="action-icon">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              </div>
              <span>Smart Hint</span>
            </button>
            
            <button class="modern-action-btn" data-action="review">
              <div class="action-icon">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <span>Review Code</span>
            </button>
            
            <button class="modern-action-btn" data-action="explain">
              <div class="action-icon">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
                </svg>
              </div>
              <span>Explain</span>
            </button>
            
            <button class="modern-action-btn" data-action="analyze">
              <div class="action-icon">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                  <path fill-rule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6.586l2.707 2.707A1 1 0 0118 17v-3.586l-2-2V5a4 4 0 00-4-4H8a4 4 0 00-4 4v9a4 4 0 004 4h8a4 4 0 004-4v-3.86l-2-2V14a2 2 0 01-2 2H8a2 2 0 01-2-2V5z" clip-rule="evenodd"/>
                </svg>
              </div>
              <span>Analyze</span>
            </button>
          </div>
          
          <div class="chat-input-section">
            <div class="input-container">
              <input type="text" id="chat-input" placeholder="Ask me anything about this problem..." />
              <button id="send-btn" class="send-button">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
                </svg>
              </button>
            </div>
          </div>
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
      /* Modern SaaS UI Variables */
      :root {
        --panel-primary: #6366f1;
        --panel-primary-hover: #4f46e5;
        --panel-success: #10b981;
        --panel-warning: #f59e0b;
        --panel-error: #ef4444;
        --panel-bg: #0f172a;
        --panel-card: #1e293b;
        --panel-card-hover: #334155;
        --panel-input: #334155;
        --panel-border: #334155;
        --panel-text-primary: #f8fafc;
        --panel-text-secondary: #cbd5e1;
        --panel-text-muted: #94a3b8;
        --panel-radius-sm: 4px;
        --panel-radius: 8px;
        --panel-radius-md: 12px;
        --panel-radius-lg: 16px;
        --panel-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
        --panel-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        --panel-shadow-md: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        --panel-shadow-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      }
      
      /* Base Panel Styles */
      .leetcode-ai-panel {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        line-height: 1.5 !important;
        -webkit-font-smoothing: antialiased !important;
        -moz-osx-font-smoothing: grayscale !important;
        border-radius: var(--panel-radius-lg) !important;
        overflow: hidden !important;
        border: 1px solid var(--panel-border) !important;
        box-shadow: var(--panel-shadow-lg) !important;
      }
      
      /* Modern Panel Header */
      .leetcode-ai-panel .modern-panel-header {
        background: var(--panel-card) !important;
        padding: 16px !important;
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        border-bottom: 1px solid var(--panel-border) !important;
      }
      
      .leetcode-ai-panel .header-content {
        display: flex !important;
        align-items: center !important;
        gap: 12px !important;
      }
      
      .leetcode-ai-panel .ai-avatar {
        width: 36px !important;
        height: 36px !important;
        background: linear-gradient(135deg, var(--panel-primary) 0%, var(--panel-primary-hover) 100%) !important;
        border-radius: var(--panel-radius) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        color: white !important;
        flex-shrink: 0 !important;
      }
      
      .leetcode-ai-panel .ai-avatar svg {
        width: 20px !important;
        height: 20px !important;
      }
      
      .leetcode-ai-panel .header-text {
        display: flex !important;
        flex-direction: column !important;
      }
      
      .leetcode-ai-panel .assistant-title {
        font-size: 16px !important;
        font-weight: 600 !important;
        color: var(--panel-text-primary) !important;
        margin: 0 !important;
        line-height: 1.2 !important;
      }
      
      .leetcode-ai-panel .assistant-status {
        font-size: 12px !important;
        color: var(--panel-text-muted) !important;
      }
      
      .leetcode-ai-panel .header-actions {
        display: flex !important;
        gap: 8px !important;
      }
      
      .leetcode-ai-panel .close-btn {
        background: transparent !important;
        border: none !important;
        width: 28px !important;
        height: 28px !important;
        border-radius: var(--panel-radius-sm) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        color: var(--panel-text-muted) !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
      }
      
      .leetcode-ai-panel .close-btn:hover {
        background: var(--panel-card-hover) !important;
        color: var(--panel-text-primary) !important;
      }
      
      .leetcode-ai-panel .close-btn svg {
        width: 16px !important;
        height: 16px !important;
      }
      
      /* Modern Panel Content */
      .leetcode-ai-panel .modern-panel-content {
        display: flex !important;
        flex-direction: column !important;
        height: calc(100% - 68px) !important;
        background: var(--panel-bg) !important;
      }
      
      /* Problem Context */
      .leetcode-ai-panel .problem-context {
        padding: 16px !important;
        border-bottom: 1px solid var(--panel-border) !important;
        background: var(--panel-card) !important;
      }
      
      .leetcode-ai-panel .context-header {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        margin-bottom: 8px !important;
      }
      
      .leetcode-ai-panel .context-label {
        font-size: 12px !important;
        font-weight: 500 !important;
        color: var(--panel-text-muted) !important;
        text-transform: uppercase !important;
        letter-spacing: 0.5px !important;
      }
      
      .leetcode-ai-panel .problem-difficulty-badge {
        font-size: 11px !important;
        font-weight: 600 !important;
        color: white !important;
        padding: 2px 8px !important;
        border-radius: 12px !important;
        text-transform: uppercase !important;
      }
      
      .leetcode-ai-panel .problem-difficulty-badge.difficulty-easy {
        background: #10b981 !important;
      }
      
      .leetcode-ai-panel .problem-difficulty-badge.difficulty-medium {
        background: #f59e0b !important;
      }
      
      .leetcode-ai-panel .problem-difficulty-badge.difficulty-hard {
        background: #ef4444 !important;
      }
      
      .leetcode-ai-panel .context-title {
        font-size: 14px !important;
        font-weight: 500 !important;
        color: var(--panel-text-primary) !important;
        word-break: break-word !important;
      }
      
      /* Chat Interface */
      .leetcode-ai-panel .chat-interface {
        display: flex !important;
        flex-direction: column !important;
        flex: 1 !important;
        min-height: 0 !important;
      }
      
      .leetcode-ai-panel .chat-messages-container {
        flex: 1 !important;
        overflow-y: auto !important;
        padding: 16px !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 16px !important;
        scrollbar-width: thin !important;
        scrollbar-color: var(--panel-border) transparent !important;
      }
      
      .leetcode-ai-panel .chat-messages-container::-webkit-scrollbar {
        width: 6px !important;
      }
      
      .leetcode-ai-panel .chat-messages-container::-webkit-scrollbar-track {
        background: transparent !important;
      }
      
      .leetcode-ai-panel .chat-messages-container::-webkit-scrollbar-thumb {
        background-color: var(--panel-border) !important;
        border-radius: 20px !important;
      }
      
      /* Welcome Message */
      .leetcode-ai-panel .welcome-message {
        display: flex !important;
        gap: 12px !important;
        animation: fadeInUp 0.5s ease-out !important;
      }
      
      .leetcode-ai-panel .message-avatar {
        width: 32px !important;
        height: 32px !important;
        background: var(--panel-primary) !important;
        border-radius: var(--panel-radius) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        color: white !important;
        flex-shrink: 0 !important;
      }
      
      .leetcode-ai-panel .message-avatar svg {
        width: 16px !important;
        height: 16px !important;
      }
      
      .leetcode-ai-panel .message-content {
        flex: 1 !important;
        background: var(--panel-card) !important;
        border-radius: var(--panel-radius-lg) !important;
        padding: 16px !important;
        position: relative !important;
      }
      
      .leetcode-ai-panel .message-content::before {
        content: '' !important;
        position: absolute !important;
        left: -6px !important;
        top: 14px !important;
        width: 12px !important;
        height: 12px !important;
        background: var(--panel-card) !important;
        transform: rotate(45deg) !important;
      }
      
      .leetcode-ai-panel .message-text {
        color: var(--panel-text-primary) !important;
        font-size: 14px !important;
        line-height: 1.5 !important;
      }
      
      .leetcode-ai-panel .message-text ul {
        margin-top: 8px !important;
        margin-bottom: 8px !important;
        padding-left: 24px !important;
      }
      
      .leetcode-ai-panel .message-text li {
        margin-bottom: 4px !important;
      }
      
      /* Inline code styling */
      .leetcode-ai-panel .message-text code.inline-code {
        background: rgba(99, 102, 241, 0.1) !important;
        color: #a855f7 !important;
        padding: 2px 6px !important;
        border-radius: 4px !important;
        font-family: 'SF Mono', 'Monaco', 'Consolas', 'Courier New', monospace !important;
        font-size: 13px !important;
        font-weight: 500 !important;
        border: 1px solid rgba(99, 102, 241, 0.2) !important;
      }
      
      /* Code block styling */
      .leetcode-ai-panel .message-text pre.code-block {
        background: #1a1a1a !important;
        border: 1px solid var(--panel-border) !important;
        border-radius: var(--panel-radius) !important;
        padding: 12px !important;
        margin: 8px 0 !important;
        overflow-x: auto !important;
        font-family: 'SF Mono', 'Monaco', 'Consolas', 'Courier New', monospace !important;
        font-size: 13px !important;
        line-height: 1.4 !important;
      }
      
      .leetcode-ai-panel .message-text pre.code-block code {
        background: transparent !important;
        color: #e2e8f0 !important;
        padding: 0 !important;
        border: none !important;
        font-family: inherit !important;
        font-size: inherit !important;
      }
      
      .leetcode-ai-panel .message-time {
        font-size: 11px !important;
        color: var(--panel-text-muted) !important;
        margin-top: 8px !important;
      }
      
      /* Message Bubbles */
      .leetcode-ai-panel .user-message {
        align-self: flex-end !important;
        background: var(--panel-primary) !important;
        color: white !important;
        border-radius: var(--panel-radius-lg) !important;
        border-bottom-right-radius: 4px !important;
        padding: 12px 16px !important;
        max-width: 85% !important;
        margin-left: auto !important;
        box-shadow: var(--panel-shadow-sm) !important;
        animation: fadeInRight 0.3s ease-out !important;
      }
      
      .leetcode-ai-panel .assistant-message {
        display: flex !important;
        gap: 12px !important;
        animation: fadeInLeft 0.3s ease-out !important;
      }
      
      /* Compact Quick Actions Grid */
      .leetcode-ai-panel .quick-actions-grid {
        display: grid !important;
        grid-template-columns: repeat(4, 1fr) !important;
        gap: 6px !important;
        padding: 8px 12px !important;
        border-top: 1px solid var(--panel-border) !important;
        background: var(--panel-card) !important;
      }
      
      .leetcode-ai-panel .modern-action-btn {
        background: var(--panel-bg) !important;
        border: 1px solid var(--panel-border) !important;
        border-radius: var(--panel-radius) !important;
        padding: 6px 4px !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 3px !important;
        transition: all 0.2s ease !important;
        cursor: pointer !important;
        min-height: 50px !important;
      }
      
      .leetcode-ai-panel .modern-action-btn:hover {
        background: var(--panel-card-hover) !important;
        border-color: var(--panel-primary) !important;
        transform: translateY(-1px) !important;
      }
      
      .leetcode-ai-panel .action-icon {
        width: 16px !important;
        height: 16px !important;
        color: var(--panel-primary) !important;
        flex-shrink: 0 !important;
      }
      
      .leetcode-ai-panel .modern-action-btn span {
        font-size: 10px !important;
        font-weight: 500 !important;
        color: var(--panel-text-secondary) !important;
        text-align: center !important;
        line-height: 1.2 !important;
      }
      
      /* Chat Input Section */
      .leetcode-ai-panel .chat-input-section {
        padding: 16px !important;
        border-top: 1px solid var(--panel-border) !important;
      }
      
      .leetcode-ai-panel .input-container {
        display: flex !important;
        gap: 8px !important;
      }
      
      .leetcode-ai-panel #chat-input {
        flex: 1 !important;
        background: var(--panel-input) !important;
        border: 1px solid var(--panel-border) !important;
        border-radius: var(--panel-radius) !important;
        padding: 10px 12px !important;
        color: var(--panel-text-primary) !important;
        font-size: 14px !important;
        transition: all 0.2s ease !important;
      }
      
      .leetcode-ai-panel #chat-input:focus {
        outline: none !important;
        border-color: var(--panel-primary) !important;
        box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2) !important;
      }
      
      .leetcode-ai-panel .send-button {
        background: var(--panel-primary) !important;
        border: none !important;
        border-radius: var(--panel-radius) !important;
        width: 36px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        color: white !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
      }
      
      .leetcode-ai-panel .send-button:hover {
        background: var(--panel-primary-hover) !important;
        transform: translateY(-1px) !important;
      }
      
      .leetcode-ai-panel .send-button svg {
        width: 16px !important;
        height: 16px !important;
      }
      
      /* Loading Indicator */
      .leetcode-ai-panel .loading-message {
        display: flex !important;
        gap: 12px !important;
        animation: fadeInLeft 0.3s ease-out !important;
      }
      
      .leetcode-ai-panel .loading-dots {
        margin-left: 36px !important;
        background: var(--panel-card) !important;
        border-radius: var(--panel-radius-lg) !important;
        padding: 16px !important;
        display: flex !important;
        align-items: center !important;
        gap: 12px !important;
      }
      
      .leetcode-ai-panel .loading-text {
        color: var(--panel-text-secondary) !important;
        font-weight: 500 !important;
      }
      
      .leetcode-ai-panel .dots {
        display: flex !important;
        gap: 4px !important;
      }
      
      .leetcode-ai-panel .dots span {
        width: 8px !important;
        height: 8px !important;
        background: var(--panel-primary) !important;
        border-radius: 50% !important;
        animation: bounce 1.4s infinite ease-in-out both !important;
      }
      
      .leetcode-ai-panel .dots span:nth-child(1) {
        animation-delay: -0.32s !important;
      }
      
      .leetcode-ai-panel .dots span:nth-child(2) {
        animation-delay: -0.16s !important;
      }
      
      /* Animations */
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes fadeInLeft {
        from {
          opacity: 0;
          transform: translateX(-10px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      
      @keyframes fadeInRight {
        from {
          opacity: 0;
          transform: translateX(10px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      
      @keyframes bounce {
        0%, 80%, 100% {
          transform: scale(0);
        }
        40% {
          transform: scale(1);
        }
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

    // Modern action buttons
    const actionBtns = panel.querySelectorAll('.modern-action-btn');
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

  // Setup storage listener for settings changes
  setupStorageListener() {
    // Listen for storage changes to update panel position immediately
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync' && changes.panelPosition) {
        const newPosition = changes.panelPosition.newValue;
        const oldPosition = changes.panelPosition.oldValue;
        
        if (newPosition !== oldPosition) {
          // Update settings
          this.settings.panelPosition = newPosition;
          
          // Update panel position if it exists and is visible
          if (this.assistantPanel && this.isPanelVisible) {
            this.updatePanelPosition(newPosition);
          }
        }
      }
    });
  }

  // Update panel position without recreating the entire panel
  updatePanelPosition(newPosition) {
    if (!this.assistantPanel) return;
    
    // Remove old position styles and apply new ones
    this.assistantPanel.style.removeProperty('left');
    this.assistantPanel.style.removeProperty('right');
    this.assistantPanel.style.setProperty(newPosition, '10px', 'important');
  }

  // Update problem context in the panel
  updateProblemContext() {
    const problemParser = window.problemParser;
    if (!problemParser) {
      return;
    }

    const problemData = problemParser.getCurrentProblem();
    if (!problemData) {
      return;
    }

    // Update problem title
    const titleElement = document.getElementById('context-problem-title');
    if (titleElement) {
      titleElement.textContent = problemData.title || 'Unknown Problem';
    }

    // Update difficulty badge
    const difficultyBadge = document.getElementById('problem-diff-badge');
    if (difficultyBadge && problemData.difficulty) {
      difficultyBadge.textContent = problemData.difficulty.toUpperCase();
      
      // Remove existing difficulty classes
      difficultyBadge.className = 'problem-difficulty-badge';
      
      // Add appropriate difficulty class
      const difficultyClass = 'difficulty-' + problemData.difficulty.toLowerCase();
      difficultyBadge.classList.add(difficultyClass);
    }
  }

  // Get color for difficulty badge
  getDifficultyColor(difficulty) {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return '#10b981'; // green
      case 'medium':
        return '#f59e0b'; // orange
      case 'hard':
        return '#ef4444'; // red
      default:
        return '#f59e0b'; // default orange
    }
  }

  // Trigger problem analysis
  triggerProblemAnalysis() {
    const problemParser = window.problemParser;
    if (!problemParser) return;

    const problemData = problemParser.getCurrentProblem();
    if (!problemData) return;

    // Add user message to show what's happening
    this.addUserMessage("Analyze the problem");

    // Add loading indicator
    this.addLoadingIndicator();

    // Send problem data to background for analysis
    chrome.runtime.sendMessage({
      type: 'ANALYZE_PROBLEM',
      data: problemData
    }, (response) => {
      // Remove loading indicator
      this.removeLoadingIndicator();
      
      this.displayProblemAnalysis(response);
    });
  }

  // Display problem analysis results
  displayProblemAnalysis(response) {
    if (response && response.success && response.data) {
      // Display analysis results in the chatbox
      const analysisData = response.data;
      let analysisMessage = "📊 Problem Analysis\n\n";
      
      if (analysisData.category) {
        analysisMessage += `🏷️ Category:\n${analysisData.category}\n\n`;
      }
      
      if (analysisData.concepts && Array.isArray(analysisData.concepts)) {
        analysisMessage += `💡 Key Concepts:\n${analysisData.concepts.join(', ')}\n\n`;
      }
      
      if (analysisData.approach) {
        analysisMessage += `🎯 Approach:\n${analysisData.approach}\n\n`;
      }
      
      if (analysisData.edgeCases && Array.isArray(analysisData.edgeCases)) {
        analysisMessage += `⚠️ Edge Cases:\n${analysisData.edgeCases.join(', ')}`;
      }
      
      this.addAssistantMessage(analysisMessage);
    } else {
      this.addAssistantMessage(`❌ Failed to analyze the problem: ${response?.error || 'Unknown error'}. Please try again.`);
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
    messageDiv.innerHTML = `
      <div class="message-avatar">
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      </div>
      <div class="message-content">
        <div class="message-text">${this.formatMarkdown(message)}</div>
        <div class="message-time">Just now</div>
      </div>
    `;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Add loading indicator to chat
  addLoadingIndicator() {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;

    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-message';
    loadingDiv.id = 'ai-loading-indicator';
    loadingDiv.innerHTML = `
      <div class="loading-dots">
        <div class="loading-text">AI is thinking</div>
        <div class="dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    `;
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Remove loading indicator from chat
  removeLoadingIndicator() {
    const loadingIndicator = document.getElementById('ai-loading-indicator');
    if (loadingIndicator) {
      loadingIndicator.remove();
    }
  }

  // Add formatted assistant message with line breaks
  addFormattedAssistantMessage(message) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = 'assistant-message';
    messageDiv.style.whiteSpace = 'pre-line'; // Preserves line breaks
    messageDiv.textContent = message;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Send chat message (unified function for both regular chat and hint requests)
  sendChatMessage(message, isHintRequest = false) {
    // Add user message to chat
    this.addUserMessage(message);
    
    // Add loading indicator
    this.addLoadingIndicator();
    
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
      // Remove loading indicator
      this.removeLoadingIndicator();
      
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
      case 'analyze':
        this.triggerProblemAnalysis();
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
  async reviewCode() {
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

    try {
      // Extract current code from the editor (now async)
      const currentCode = await problemParser.extractCurrentCode();
      
      // Check if code was found
      if (!currentCode || currentCode.trim() === '') {
        this.addAssistantMessage("No code found in the Monaco editor. Please make sure you have code written in the editor.");
        return;
      }
      
      this.performCodeReview(problemData, currentCode);
    } catch (error) {
      console.error('Error extracting code:', error);
      this.addAssistantMessage("Failed to extract code from the editor. Please try again.");
    }
  }

  // Perform the actual code review
  performCodeReview(problemData, currentCode) {
    // Add user message to show what's happening
    this.addUserMessage("Please review my code for this problem.");

    // Add loading indicator
    this.addLoadingIndicator();

    // Send code review request with actual code
    chrome.runtime.sendMessage({
      type: 'REVIEW_CODE',
      data: {
        problemData: problemData,
        currentCode: currentCode,
        timestamp: Date.now()
      }
    }, (response) => {
      // Remove loading indicator
      this.removeLoadingIndicator();
      
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

  // Format markdown-style code in message text
  formatMarkdown(text) {
    // First escape HTML to prevent XSS, but preserve backticks for processing
    let formatted = this.escapeHtml(text);
    
    // Convert line breaks to HTML breaks
    formatted = formatted.replace(/\n/g, '<br>');
    
    // Convert inline code (single backticks) to styled spans
    formatted = formatted.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    
    // Convert code blocks (triple backticks) to styled pre blocks
    formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre class="code-block"><code>$1</code></pre>');
    
    return formatted;
  }

  // Escape HTML to prevent XSS
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
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