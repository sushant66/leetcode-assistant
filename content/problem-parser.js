// Problem parser for extracting LeetCode problem data
// Handles parsing of problem statements, examples, and constraints

class LeetCodeProblemParser {
  constructor() {
    this.currentProblem = null;
    this.observers = [];
  }

  // Parse the current problem on the page
  parseProblem() {
    try {
      const problemData = {
        title: this.extractTitle(),
        description: this.extractDescription(),
        examples: this.extractExamples(),
        constraints: this.extractConstraints(),
        difficulty: this.extractDifficulty(),
        tags: this.extractTags(),
        url: window.location.href,
        timestamp: Date.now()
      };

      this.currentProblem = problemData;
      return problemData;
      
    } catch (error) {
      // Return basic problem data even if parsing fails
      return {
        title: this.extractTitle() || 'Unknown Problem',
        description: 'Problem parsing failed',
        examples: [],
        constraints: 'Not available',
        difficulty: 'Unknown',
        tags: [],
        url: window.location.href,
        timestamp: Date.now(),
        parseError: true
      };
    }
  }

  // Extract problem title
  extractTitle() {
    try {
      // Try multiple selectors for different LeetCode layouts (2024-2025)
      const selectors = [
        '.text-title-large a', // Current LeetCode layout
        '.text-title-large',   // Fallback to parent
        '[data-cy="question-title"]',
        'h1[data-cy="question-title"]',
        'h1',
        '.question-title'
      ];

      for (const selector of selectors) {
        try {
          const element = document.querySelector(selector);
          if (element && element.textContent && element.textContent.trim()) {
            return element.textContent.trim();
          }
        } catch (e) {
          continue;
        }
      }

      // Fallback: extract from URL
      const urlMatch = window.location.pathname.match(/\/problems\/([^\/]+)/);
      if (urlMatch) {
        return urlMatch[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }

      return 'Unknown Problem';
    } catch (error) {
      return 'Unknown Problem';
    }
  }

  // Extract problem description
  extractDescription() {
    try {
      const selectors = [
        '.elfjS[data-track-load="description_content"]', // Current LeetCode layout
        '.elfjS',                                        // Fallback
        '[data-track-load="description_content"]',
        '.question-content',
        '.content__u3I1',
        '[class*="content"]'
      ];

      for (const selector of selectors) {
        try {
          const element = document.querySelector(selector);
          if (element && element.textContent) {
            // Clean up the description text
            const description = element.textContent.trim();
            if (description.length > 50) { // Ensure it's substantial content
              return description;
            }
          }
        } catch (e) {
          continue;
        }
      }

      return 'Description not found';
    } catch (error) {
      return 'Description not found';
    }
  }

  // Extract problem examples
  extractExamples() {
    try {
      const examples = [];
      
      // Look for example sections with updated selectors
      try {
        const exampleSelectors = [
          '.elfjS pre',     // Examples are in pre tags within the description
          'pre',            // Fallback for any pre tags
          '.example'        // Class-based fallback
        ];
        
        for (const selector of exampleSelectors) {
          try {
            const exampleElements = document.querySelectorAll(selector);
            exampleElements.forEach((element, index) => {
              try {
                if (element && element.textContent) {
                  const text = element.textContent.trim();
                  if (text && text.toLowerCase().includes('input') && text.toLowerCase().includes('output')) {
                    examples.push({
                      id: examples.length + 1,
                      content: text,
                      selector: selector
                    });
                  }
                }
              } catch (e) {
                // Skip failed element processing
              }
            });
          } catch (e) {
            // Skip failed selector
          }
        }
      } catch (e) {
        // Skip failed extraction
      }

      return examples;
    } catch (error) {
      return [];
    }
  }

  // Extract problem constraints
  extractConstraints() {
    try {
      const constraintSelectors = [
        '.elfjS ul',  // Constraints are in ul within the description
        'ul',         // Fallback for any ul
        '.constraints'
      ];

      for (const selector of constraintSelectors) {
        try {
          const element = document.querySelector(selector);
          if (element && element.textContent && element.textContent.toLowerCase().includes('constraint')) {
            return element.textContent.trim();
          }
        } catch (e) {
          continue;
        }
      }

      return 'Constraints not found';
    } catch (error) {
      return 'Constraints not found';
    }
  }

  // Extract difficulty level
  extractDifficulty() {
    try {
      const difficultySelectors = [
        '.text-difficulty-easy',   // Easy difficulty
        '.text-difficulty-medium', // Medium difficulty  
        '.text-difficulty-hard',   // Hard difficulty
        '[class*="text-difficulty"]', // Any difficulty class
        '.bg-fill-secondary',      // Background class from the HTML
        '[class*="difficulty"]'    // Generic difficulty class
      ];

      for (const selector of difficultySelectors) {
        try {
          const element = document.querySelector(selector);
          if (element && element.textContent) {
            const text = element.textContent.toLowerCase();
            if (text.includes('easy')) return 'Easy';
            if (text.includes('medium')) return 'Medium';
            if (text.includes('hard')) return 'Hard';
          }
        } catch (e) {
          continue;
        }
      }

      // Look for difficulty in any text content (safer approach)
      try {
        const bodyText = document.body?.textContent?.toLowerCase() || '';
        if (bodyText.includes('difficulty: easy')) return 'Easy';
        if (bodyText.includes('difficulty: medium')) return 'Medium';
        if (bodyText.includes('difficulty: hard')) return 'Hard';
      } catch (e) {
        // Skip body text search
      }

      return 'Unknown';
    } catch (error) {
      return 'Unknown';
    }
  }

  // Extract problem tags
  extractTags() {
    try {
      const tags = [];
      const tagSelectors = [
        'a[href*="/tag/"]',           // Tags are links with /tag/ in href
        '.bg-fill-secondary',         // Background class for tags
        '[class*="tag"]',             // Generic tag class
        '.topic-tag'                  // Legacy class
      ];

      tagSelectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach(element => {
            try {
              if (element && element.textContent) {
                const tagText = element.textContent.trim();
                // Filter out difficulty indicators and only keep actual tags
                if (tagText && 
                    tagText.length < 30 && 
                    !['Easy', 'Medium', 'Hard'].includes(tagText) &&
                    !tagText.toLowerCase().includes('topics')) {
                  tags.push(tagText);
                }
              }
            } catch (e) {
              // Skip failed tag processing
            }
          });
        } catch (e) {
          // Skip failed tag selector
        }
      });

      return [...new Set(tags)]; // Remove duplicates
    } catch (error) {
      return [];
    }
  }

  // Extract current user code from editor
  extractCurrentCode() {
    console.log('extractCurrentCode called!');
    
    try {
      // Use postMessage to communicate with injected script
      const extractionId = 'monaco-code-' + Date.now();
      
      return new Promise((resolve) => {
        // Listen for the response
        const messageHandler = (event) => {
          if (event.source === window && event.data && event.data.type === 'MONACO_CODE_RESPONSE' && event.data.id === extractionId) {
            window.removeEventListener('message', messageHandler);
            const { code, error } = event.data;
            if (error) {
              console.log('Monaco extraction error:', error);
              resolve('');
            } else {
              console.log('Successfully extracted code:', code ? code.length : 0, 'characters');
              resolve(code || '');
            }
          }
        };
        
        window.addEventListener('message', messageHandler);
        
        // Create and inject script file
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('content/monaco-extractor.js');
        script.onload = () => {
          // Send message to the injected script to extract code
          window.postMessage({
            type: 'EXTRACT_MONACO_CODE',
            id: extractionId
          }, '*');
          script.remove();
        };
        script.onerror = () => {
          window.removeEventListener('message', messageHandler);
          console.log('Failed to load monaco-extractor script');
          resolve('');
        };
        
        document.head.appendChild(script);
        
        // Timeout as fallback
        setTimeout(() => {
          window.removeEventListener('message', messageHandler);
          console.log('Monaco extraction timed out');
          resolve('');
        }, 2000);
      });
      
    } catch (error) {
      console.error('Error in code extraction setup:', error);
      return Promise.resolve('');
    }
  }

  // Check if we're on a LeetCode problem page
  isOnProblemPage() {
    return window.location.pathname.includes('/problems/') && 
           window.location.hostname.includes('leetcode.com');
  }

  // Set up observers for dynamic content changes
  setupObservers() {
    // Observe for problem content changes
    const targetNode = document.body;
    const config = { childList: true, subtree: true };

    const observer = new MutationObserver((mutations) => {
      let shouldReparse = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // Check if problem content has changed
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.querySelector('[data-cy="question-title"]') ||
                  node.classList.contains('question-content') ||
                  node.classList.contains('content__u3I1')) {
                shouldReparse = true;
              }
            }
          });
        }
      });

      if (shouldReparse) {
        setTimeout(() => this.parseProblem(), 500); // Debounce
      }
    });

    observer.observe(targetNode, config);
    this.observers.push(observer);

    // Observe URL changes (for SPA navigation)
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        if (this.isOnProblemPage()) {
          setTimeout(() => this.parseProblem(), 1000);
        }
      }
    }).observe(document, { subtree: true, childList: true });
  }

  // Clean up observers
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  // Get the current parsed problem
  getCurrentProblem() {
    return this.currentProblem;
  }
}

// Export for use in content script
window.LeetCodeProblemParser = LeetCodeProblemParser;