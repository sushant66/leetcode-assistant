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
    try {
      // Try to get code from Monaco Editor's view-lines (current LeetCode approach)
      const viewLines = document.querySelector('.view-lines[role="presentation"]');
      if (viewLines) {
        try {
          // Extract text from Monaco editor's view lines
          const lines = viewLines.querySelectorAll('.view-line');
          if (lines.length > 0) {
            const codeLines = [];
            lines.forEach(line => {
              // Get the text content from each line, excluding line numbers and decorations
              const spans = line.querySelectorAll('span');
              let lineText = '';
              spans.forEach(span => {
                // Skip Monaco's syntax highlighting containers and get actual text
                if (span.textContent && !span.classList.contains('mtk')) {
                  lineText += span.textContent;
                } else if (span.textContent) {
                  lineText += span.textContent;
                }
              });
              if (!lineText) {
                lineText = line.textContent || '';
              }
              codeLines.push(lineText);
            });
            const code = codeLines.join('\n').trim();
            if (code && code.length > 10) { // Ensure we have substantial code
              return code;
            }
          }
        } catch (e) {
          // Skip Monaco view-lines extraction
        }
      }

      // Try to get code from Monaco Editor textarea (fallback)
      const monacoEditor = document.querySelector('.monaco-editor textarea');
      if (monacoEditor && monacoEditor.value) {
        return monacoEditor.value;
      }

      // Try getting from Monaco editor's model (if accessible)
      if (window.monaco && window.monaco.editor) {
        try {
          const editors = window.monaco.editor.getEditors();
          if (editors && editors.length > 0) {
            const code = editors[0].getValue();
            if (code && code.trim()) {
              return code;
            }
          }
        } catch (e) {
          // Skip Monaco editor model
        }
      }

      // Try CodeMirror
      const codeMirror = document.querySelector('.CodeMirror');
      if (codeMirror && codeMirror.CodeMirror) {
        return codeMirror.CodeMirror.getValue();
      }

      // Try other code editor selectors
      const codeSelectors = [
        'textarea[data-mode]',           // Code editor textareas with mode attribute
        'textarea[autocomplete="off"]', // Common for code editors
        '.ace_text-input',              // ACE editor
        '[class*="code-editor"] textarea',
        '.editor textarea',
        'textarea[spellcheck="false"]', // Often used for code
        '.monaco-editor .inputarea'     // Monaco input area
      ];

      for (const selector of codeSelectors) {
        try {
          const element = document.querySelector(selector);
          if (element && element.value && element.value.trim()) {
            return element.value;
          }
        } catch (e) {
          // Skip failed selector
        }
      }

      // Last resort: try to find any textarea that looks like code
      const textareas = document.querySelectorAll('textarea');
      for (const textarea of textareas) {
        try {
          if (textarea.value && textarea.value.trim() && 
              (textarea.value.includes('function') || 
               textarea.value.includes('class') ||
               textarea.value.includes('def ') ||
               textarea.value.includes('public ') ||
               textarea.value.includes('{') ||
               textarea.value.includes('return'))) {
            return textarea.value;
          }
        } catch (e) {
          // Skip textarea heuristic
        }
      }

      return '';
    } catch (error) {
      return '';
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