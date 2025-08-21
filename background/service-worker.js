// Background service worker for LeetWhisper
// Handles AI API calls, storage management, and message passing

// Import AI service
importScripts('ai-service.js');

// Initialize AI service
const aiService = new AIService();

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Set default settings on first install
    chrome.storage.sync.set({
      apiKey: '',
      aiProvider: 'gpt-4-1-mini',
      hintLevel: 1,
      panelPosition: 'right'
    });
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'ANALYZE_PROBLEM':
      handleProblemAnalysis(message.data, sendResponse);
      return true; // Keep message channel open for async response
      
    case 'REVIEW_CODE':
      handleCodeReview(message.data, sendResponse);
      return true;
      
    case 'CHAT_MESSAGE':
      handleChatMessage(message.data, sendResponse);
      return true;
      
    case 'GET_SETTINGS':
      handleGetSettings(sendResponse);
      return true;
      
    case 'UPDATE_SETTINGS':
      handleUpdateSettings(message.data, sendResponse);
      return true;
      
    default:
      sendResponse({ error: 'Unknown message type' });
  }
});

// Handle problem analysis
async function handleProblemAnalysis(problemData, sendResponse) {
  try {
    const settings = await getSettings();
    if (!settings.apiKey) {
      sendResponse({ 
        error: 'API key not configured. Please set your API key in the extension settings.' 
      });
      return;
    }
    
    const analysis = await analyzeProblemWithAI(problemData, settings);
    sendResponse({ success: true, data: analysis });
    
  } catch (error) {
    sendResponse({ 
      error: 'Failed to analyze problem: ' + error.message 
    });
  }
}

// Handle code review
async function handleCodeReview(codeData, sendResponse) {
  try {
    const settings = await getSettings();
    if (!settings.apiKey) {
      sendResponse({ 
        error: 'API key not configured. Please set your API key in the extension settings.' 
      });
      return;
    }
    
    // Validate that we have the required data
    if (!codeData.problemData) {
      sendResponse({
        error: 'Problem data is required for code review'
      });
      return;
    }
    
    if (!codeData.currentCode || codeData.currentCode.trim() === '') {
      sendResponse({
        error: 'No code provided for review'
      });
      return;
    }
    
    const review = await reviewCodeWithAI(codeData, settings);
    sendResponse({ success: true, data: review });
    
  } catch (error) {
    sendResponse({ 
      error: 'Failed to review code: ' + error.message 
    });
  }
}

// Handle chat messages
async function handleChatMessage(chatData, sendResponse) {
  try {
    const settings = await getSettings();
    if (!settings.apiKey) {
      sendResponse({ 
        error: 'API key not configured. Please set your API key in the extension settings.' 
      });
      return;
    }
    
    const response = await generateChatResponseWithAI(chatData, settings);
    sendResponse({ success: true, data: response });
    
  } catch (error) {
    sendResponse({ 
      error: 'Failed to process chat message: ' + error.message 
    });
  }
}

// Handle settings retrieval
async function handleGetSettings(sendResponse) {
  try {
    const settings = await getSettings();
    sendResponse({ success: true, data: settings });
  } catch (error) {
    sendResponse({ error: 'Failed to retrieve settings' });
  }
}

// Handle settings update
async function handleUpdateSettings(newSettings, sendResponse) {
  try {
    await chrome.storage.sync.set(newSettings);
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ error: 'Failed to update settings' });
  }
}

// Utility function to get settings
async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get({
      apiKey: '',
      aiProvider: 'gpt-4-1-mini',
      hintLevel: 1,
      panelPosition: 'right'
    }, (settings) => {
      resolve(settings);
    });
  });
}

// AI API integration functions
async function analyzeProblemWithAI(problemData, settings) {
  try {
    // Validate API key
    if (!aiService.validateApiKey(settings.apiKey, settings.aiProvider)) {
      throw new Error('Invalid API key format for selected provider');
    }
    
    return await aiService.analyzeProblem(problemData, settings);
  } catch (error) {
    // Return fallback response
    return {
      category: 'Unknown',
      difficulty: problemData.difficulty || 'Medium',
      concepts: ['General Problem Solving'],
      approach: 'API unavailable. Try breaking down the problem step by step.',
      error: error.message
    };
  }
}


async function reviewCodeWithAI(codeData, settings) {
  try {
    // Validate API key
    if (!aiService.validateApiKey(settings.apiKey, settings.aiProvider)) {
      throw new Error('Invalid API key format for selected provider');
    }
    
    return await aiService.reviewCode(codeData, settings);
  } catch (error) {
    // Return fallback response
    return {
      issues: ['API unavailable for detailed review'],
      suggestions: ['Check for edge cases', 'Consider time and space complexity'],
      edgeCases: ['Empty inputs', 'Single element cases', 'Large inputs'],
      error: error.message
    };
  }
}

async function generateChatResponseWithAI(chatData, settings) {
  try {
    // Validate API key
    if (!aiService.validateApiKey(settings.apiKey, settings.aiProvider)) {
      throw new Error('Invalid API key format for selected provider');
    }
    
    return await aiService.generateChatResponse(chatData, settings);
  } catch (error) {
    // Return fallback response
    return {
      response: 'I\'m having trouble connecting to the AI service right now. Try asking about specific concepts or approaches for this problem.',
      error: error.message
    };
  }
}