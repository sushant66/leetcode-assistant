// AI Service for handling different AI providers
// Supports OpenAI and Google Gemini APIs

class AIService {
  constructor() {
    this.supportedProviders = {
      'gpt-4-1-mini': {
        name: 'OpenAI GPT-4.1 Mini',
        apiUrl: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-4.1-mini',
        headers: (apiKey) => ({
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        })
      },
      'gemini-2-5-flash': {
        name: 'Google Gemini 2.5 Flash',
        apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
        model: 'gemini-2.5-flash',
        headers: (apiKey) => ({
          'Content-Type': 'application/json'
        })
      }
    };
  }

  // Analyze a LeetCode problem using the specified AI provider
  async analyzeProblem(problemData, settings) {
    const prompt = this.createProblemAnalysisPrompt(problemData);
    return await this.makeAIRequest(prompt, settings, 'problem_analysis');
  }

  // Generate a hint for the user
  async generateHint(requestData, settings) {
    const prompt = this.createHintPrompt(requestData);
    return await this.makeAIRequest(prompt, settings, 'hint_generation');
  }

  // Review user's code
  async reviewCode(codeData, settings) {
    const prompt = this.createCodeReviewPrompt(codeData);
    return await this.makeAIRequest(prompt, settings, 'code_review');
  }

  // Generate a chat response for user interaction
  async generateChatResponse(chatData, settings) {
    const prompt = this.createChatPrompt(chatData);
    return await this.makeAIRequest(prompt, settings, 'chat_response');
  }

  // Create prompt for problem analysis
  createProblemAnalysisPrompt(problemData) {
    // Truncate description to reduce token usage
    const truncatedDescription = problemData.description && problemData.description.length > 200 
      ? problemData.description.substring(0, 200) + '...' 
      : problemData.description;
    
    return `Analyze this LeetCode problem briefly:

Title: ${problemData.title}
Description: ${truncatedDescription}
Difficulty: ${problemData.difficulty}

Respond in JSON format:
{
  "category": "Array/Tree/Graph etc",
  "concepts": ["key concepts"],
  "approach": "brief high-level approach",
  "edgeCases": ["main edge cases"]
}`;
  }

  // Create prompt for hint generation
  createHintPrompt(requestData) {
    const { problemData, currentCode, hintLevel = 1 } = requestData;
    
    let hintLevelGuidance = '';
    let rules = '';
    
    switch (hintLevel) {
      case 1:
        hintLevelGuidance = 'a very small, thought-provoking hint (1 sentence max)';
        rules = `- Be extremely vague and Socratic
- Use only questions to guide thinking
- Never mention algorithms, data structures, or approaches
- Make them discover everything themselves`;
        break;
      case 2:
        hintLevelGuidance = 'a gentle nudge towards the right direction without naming the approach';
        rules = `- Still be Socratic but slightly more specific
- Can hint at the type of problem (searching, organizing, etc.)
- Still use mostly questions
- Don't name specific techniques`;
        break;
      case 3:
        hintLevelGuidance = 'a more specific hint that gives some direction';
        rules = `- Can mention general concepts (like "fast lookups" or "keeping track")
- Mix of questions and gentle guidance
- Still avoid naming specific algorithms
- Give clearer direction`;
        break;
      case 4:
        hintLevelGuidance = 'detailed guidance with specific suggestions';
        rules = `- Can mention specific data structures or techniques
- Give more concrete advice
- Still avoid complete step-by-step solutions
- Be more helpful and direct`;
        break;
      case 5:
        hintLevelGuidance = 'very helpful guidance that nearly explains the approach';
        rules = `- Be very specific about the approach
- Can mention exact algorithms or data structures
- Give clear implementation hints
- Stop just short of writing the code for them`;
        break;
    }

    const truncatedCode = currentCode && currentCode.length > 150 
      ? currentCode.substring(0, 150) + '...' 
      : currentCode;

    return `You are a coding mentor. This is hint level ${hintLevel}/5 for: ${problemData.title}
Current code: ${truncatedCode || 'None'}

Give ${hintLevelGuidance}

RULES FOR LEVEL ${hintLevel}:
${rules}

JSON response:
{
  "hint": "your hint appropriate for level ${hintLevel}",
  "followUp": "${hintLevel <= 2 ? 'a thought-provoking question' : 'next step or clarification'}"
}`;
  }

  // Create prompt for code review
  createCodeReviewPrompt(codeData) {
    const { problemData, currentCode } = codeData;

    return `Review this LeetCode code BRIEFLY (max 100 words total):

Problem: ${problemData.title}
Code:
${currentCode}

RULES:
- Be extremely concise (1-2 sentences per section)
- Focus only on major issues or improvements
- Don't explain obvious things
- Skip sections if nothing important to say

JSON format:
{
  "issues": ["major bugs only"],
  "suggestions": ["key improvements only"], 
  "edgeCases": ["critical edge cases only"],
  "complexity": "brief O(n) analysis"
}`;
  }

  // Create prompt for chat response
  createChatPrompt(chatData) {
    const { message, problemData } = chatData;
    
    const truncatedDescription = problemData.description && problemData.description.length > 150
      ? problemData.description.substring(0, 150) + '...'
      : problemData.description;

    return `You are a Socratic coding mentor for LeetCode problems. A student is asking for help with:

Problem: ${problemData.title}
Description: ${truncatedDescription}
Student's question: "${message}"

IMPORTANT RULES:
- Give ONLY small, focused hints (1-2 sentences max)
- Never reveal the algorithm or data structure directly
- Use guiding questions instead of explanations
- Don't give step-by-step approaches
- Focus on making the student think, not giving answers
- If they ask for a hint, give just the smallest nudge in the right direction

Example good responses:
- "What happens if you pick the first number? What would you need to find next?"
- "Think about what data structure helps with fast lookups."
- "Have you considered what you're really searching for?"

Example bad responses (DON'T do these):
- Long explanations of the approach
- Mentioning specific algorithms like "hash map" or "two pointers"
- Giving multiple hints at once
- Explaining the complete logic

Respond in JSON format:
{
  "response": "your brief, Socratic response to guide the student's thinking"
}`;
  }

  // Make API request to the appropriate AI provider
  async makeAIRequest(prompt, settings, requestType) {
    const { apiKey, aiProvider } = settings;
    
    if (!apiKey) {
      throw new Error('API key not configured');
    }

    const provider = this.supportedProviders[aiProvider];
    if (!provider) {
      throw new Error(`Unsupported AI provider: ${aiProvider}`);
    }

    try {
      const requestBody = this.formatRequest(prompt, provider, aiProvider);
      const headers = provider.headers(apiKey);

      const response = await fetch(provider.apiUrl + (aiProvider.includes('gemini') ? `?key=${apiKey}` : ''), {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`AI API request failed: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      return this.parseResponse(data, aiProvider);

    } catch (error) {
      throw error;
    }
  }

  // Format request based on provider
  formatRequest(prompt, provider, aiProvider) {
    if (aiProvider.includes('gpt')) {
      return {
        model: provider.model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful coding mentor who guides students through LeetCode problems without giving away solutions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.7
      };
    } else if (aiProvider.includes('gemini')) {
      return {
        contents: [
          {
            parts: [
              {
                text: `You are a helpful coding mentor who guides students through LeetCode problems without giving away solutions.\n\n${prompt}`
              }
            ]
          }
        ],
        generationConfig: {
          maxOutputTokens: 1500,
          temperature: 0.7
        }
      };
    }
  }

  // Parse response based on provider
  parseResponse(data, aiProvider) {
    try {
      if (aiProvider.includes('gpt')) {
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
          throw new Error('Invalid OpenAI response structure');
        }
        const content = data.choices[0].message.content;
        return this.parseJSONResponse(content);
      } else if (aiProvider.includes('gemini')) {
        // Gemini API response structure: data.candidates[0].content.parts[0].text
        if (!data.candidates || !data.candidates[0]) {
          throw new Error('Invalid Gemini response - no candidates');
        }
        
        const candidate = data.candidates[0];
        
        // Check if response was truncated due to token limits
        if (candidate.finishReason === 'MAX_TOKENS') {
          return {
            error: 'Response truncated due to token limit. Please try a shorter request.',
            finishReason: 'MAX_TOKENS'
          };
        }
        
        if (!candidate.content || !candidate.content.parts || !candidate.content.parts[0]) {
          throw new Error('Invalid Gemini response - no content parts');
        }
        
        const content = candidate.content.parts[0].text;
        if (!content) {
          throw new Error('Invalid Gemini response - no text content');
        }
        
        return this.parseJSONResponse(content);
      }
      
      throw new Error(`Unsupported provider for response parsing: ${aiProvider}`);
    } catch (error) {
      throw new Error(`Failed to parse AI response: ${error.message}`);
    }
  }

  // Parse JSON response from AI
  parseJSONResponse(content) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: return as plain text
        return {
          response: content,
          type: 'text'
        };
      }
    } catch (error) {
      // If JSON parsing fails, return as plain text
      return {
        response: content,
        type: 'text'
      };
    }
  }

  // Validate API key format
  validateApiKey(apiKey, provider) {
    if (!apiKey) return false;
    
    switch (provider) {
      case 'gpt-4-1-mini':
        return apiKey.startsWith('sk-');
      case 'gemini-2-5-flash':
        return apiKey.startsWith('AIza');
      default:
        return apiKey.length > 10; // Basic length check
    }
  }

  // Get provider information
  getProviderInfo(providerId) {
    return this.supportedProviders[providerId];
  }

  // List all supported providers
  getSupportedProviders() {
    return Object.keys(this.supportedProviders).map(id => ({
      id,
      name: this.supportedProviders[id].name
    }));
  }
}

// AIService is now available globally via importScripts