// Monaco Code Extractor - Runs in main page context where Monaco is available
// This script is injected to extract code from Monaco editor

(function() {
  'use strict';
  
  // Listen for extraction requests
  window.addEventListener('message', function(event) {
    if (event.source !== window || !event.data || event.data.type !== 'EXTRACT_MONACO_CODE') {
      return;
    }
    
    const { id } = event.data;
    
    try {
      // Check if Monaco is available
      if (window.monaco && window.monaco.editor) {
        const models = window.monaco.editor.getModels();
        
        if (models && models.length > 0) {
          const code = models[0].getValue();
          
          // Send the code back
          window.postMessage({
            type: 'MONACO_CODE_RESPONSE',
            id: id,
            code: code || '',
            success: true
          }, '*');
        } else {
          // No models found
          window.postMessage({
            type: 'MONACO_CODE_RESPONSE',
            id: id,
            code: '',
            error: 'No Monaco editor models found',
            success: false
          }, '*');
        }
      } else {
        // Monaco not available
        window.postMessage({
          type: 'MONACO_CODE_RESPONSE',
          id: id,
          code: '',
          error: 'Monaco editor not available in this context',
          success: false
        }, '*');
      }
    } catch (error) {
      // Error occurred
      window.postMessage({
        type: 'MONACO_CODE_RESPONSE',
        id: id,
        code: '',
        error: error.message,
        success: false
      }, '*');
    }
  });
})();