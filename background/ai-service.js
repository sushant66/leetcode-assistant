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


  // Review user's code
  async reviewCode(codeData, settings) {
    const prompt = this.createCodeReviewPrompt(codeData);
    console.log("CODE REVIEW PROMPT-->", prompt);
    return await this.makeAIRequest(prompt, settings, 'code_review', 4000);
  }

  // Generate a chat response for user interaction
  async generateChatResponse(chatData, settings) {
    const prompt = this.createChatPrompt(chatData, settings);
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


  // Get hint guidance based on type (1 or 3) and progressive level (1-5)
  getHintGuidance(hintType, progressiveLevel) {
    // Map the two hint levels to appropriate guidance
    // Level 1: Conceptual (combines high-level and algorithm)
    // Level 3: Implementation (combines implementation and detailed)
    
    if (hintType === 1 || hintType === '1') {
      return this.getConceptualGuidance(progressiveLevel);
    } else if (hintType === 3 || hintType === '3') {
      return this.getImplementationDetailedGuidance(progressiveLevel);
    }
    
    // Default to conceptual if type is not recognized
    return this.getConceptualGuidance(progressiveLevel);
  }

  // Merged Conceptual Guidance: Combines high-level approach with algorithm suggestions
  getConceptualGuidance(level) {
    const templates = {
      1: {
        style: "Conceptual introduction",
        guidance: "Give a very high-level conceptual hint about the problem approach.",
        rules: "- Focus on the big picture and problem category\n- Use conceptual language, not technical terms\n- Ask thought-provoking questions about the problem nature\n- Avoid mentioning specific algorithms or data structures"
      },
      2: {
        style: "Conceptual direction",
        guidance: "Give clearer direction about the approach and problem category.",
        rules: "- Point toward the general problem category\n- Can mention broad concepts like 'searching', 'organizing', 'tracking'\n- Suggest the type of algorithmic thinking needed\n- Still avoid naming specific algorithms"
      },
      3: {
        style: "Algorithm categories",
        guidance: "Guide toward specific algorithm families and approaches.",
        rules: "- Mention broad algorithmic categories (e.g., 'dynamic programming approach', 'greedy strategy')\n- Describe the general structure of the solution\n- Can mention algorithm families like 'divide-and-conquer'\n- Guide toward the right algorithmic thinking"
      },
      4: {
        style: "Algorithm specific",
        guidance: "Suggest specific algorithms or data structure choices.",
        rules: "- Can mention specific algorithms by name\n- Suggest appropriate data structures\n- Explain why certain algorithms fit this problem\n- Mention time/space complexity considerations"
      },
      5: {
        style: "Algorithm comprehensive",
        guidance: "Give complete algorithmic guidance with strategic overview.",
        rules: "- Provide full algorithmic solution strategy\n- Explain complexity analysis\n- Suggest optimizations and alternative approaches\n- Give complete conceptual and algorithmic understanding"
      }
    };
    
    return templates[level] || templates[1];
  }

  // Merged Implementation & Detailed Guidance: Combines code structure with detailed guidance
  getImplementationDetailedGuidance(level) {
    const templates = {
      1: {
        style: "Implementation structure",
        guidance: "Give hints about how to structure the implementation.",
        rules: "- Focus on code organization and structure\n- Suggest general implementation patterns\n- Guide toward the right code flow\n- Describe what the solution needs to accomplish"
      },
      2: {
        style: "Implementation approach",
        guidance: "Suggest specific implementation patterns and code organization.",
        rules: "- Mention specific programming patterns\n- Suggest data structure usage in code\n- Break down the solution into logical steps\n- Guide toward implementation strategy"
      },
      3: {
        style: "Implementation detailed",
        guidance: "Give specific implementation guidance with code structure hints.",
        rules: "- Suggest specific code patterns and constructs\n- Mention variable types and loop structures\n- Provide detailed algorithm steps in code terms\n- Include specific technical implementation details"
      },
      4: {
        style: "Implementation comprehensive",
        guidance: "Provide comprehensive implementation guidance with near-code details.",
        rules: "- Give specific variable and function suggestions\n- Mention exact conditions and error handling\n- Include all edge cases and validation logic\n- Provide near-complete implementation roadmap"
      },
      5: {
        style: "Implementation expert",
        guidance: "Give expert-level implementation guidance that's almost complete code.",
        rules: "- Provide step-by-step implementation with specific logic\n- Include advanced optimizations and techniques\n- Give multiple solution approaches with trade-offs\n- Stop just short of writing the complete function"
      }
    };
    
    return templates[level] || templates[1];
  }


  // Create prompt for code review
  createCodeReviewPrompt(codeData) {
    const { problemData, currentCode } = codeData;

    // Truncate description if too long to save tokens
    const truncatedDescription = problemData.description && problemData.description.length > 300
      ? problemData.description.substring(0, 300) + '...'
      : problemData.description;

    return `You are an expert code reviewer for LeetCode problems. Analyze this solution comprehensively:

PROBLEM CONTEXT:
Title: ${problemData.title}
Difficulty: ${problemData.difficulty}
Description: ${truncatedDescription}

STUDENT'S CODE:
${currentCode}

ANALYSIS REQUIREMENTS:
1. **Correctness**: Does the code actually solve the given problem? Check if it handles the problem requirements correctly.
2. **Completeness**: Is this a complete solution or just a partial/helper function?
3. **Logic Issues**: Look for bugs, infinite loops, incorrect conditions, or missing logic.
4. **Time/Space Complexity**: Analyze the current complexity and identify if it's optimal for this specific problem.
5. **Edge Cases**: Identify cases the code might not handle (empty input, edge values, etc.).
6. **Optimization**: Suggest more efficient algorithms or approaches if they exist.
7. **Alternative Solutions**: Mention fundamentally different approaches if applicable.

CRITICAL INSTRUCTIONS:
- KEEP IT SHORT: Maximum 3-4 sentences (50-60 words total)
- BE DIRECT: Point out the main issue immediately 
- If incomplete/wrong, say so in the first sentence
- Give ONE key next step

Format your response as JSON:
{
  "response": "Very brief, honest assessment. Maximum 3-4 sentences. Focus on the main issue and one improvement."
}`;
  }

  // Create prompt for chat response (unified system with hint types)
  createChatPrompt(chatData, settings) {
    const { message, problemData, chatHistory = [], isHintRequest = false } = chatData;
    const hintType = settings.hintLevel || 1; // User's preferred hint type (1 or 3)
    
    const truncatedDescription = problemData.description && problemData.description.length > 150
      ? problemData.description.substring(0, 150) + '...'
      : problemData.description;

    // Build conversation history context
    let conversationContext = '';
    if (chatHistory.length > 0) {
      conversationContext = '\nPrevious conversation:\n';
      chatHistory.forEach(exchange => {
        conversationContext += `Student: "${exchange.user}"\n`;
        conversationContext += `Assistant: "${exchange.assistant}"\n`;
      });
      conversationContext += '\n';
    }

    // Determine progressive level based on conversation history and request type
    let progressiveLevel;
    if (isHintRequest) {
      // For hint requests, count previous hint exchanges
      const hintExchanges = chatHistory.filter(exchange => 
        exchange.user.toLowerCase().includes('hint') || 
        exchange.assistant.toLowerCase().includes('hint')
      ).length;
      progressiveLevel = Math.min(hintExchanges + 1, 5);
    } else {
      // For regular chat, use conversation length but cap at 3
      progressiveLevel = Math.min(chatHistory.length + 1, 3);
    }

    // Get the appropriate guidance and rules based on hint type and progressive level
    const { guidance, rules, style } = this.getHintGuidance(hintType, progressiveLevel);
    
    return `You are a coding mentor for LeetCode problems. A student is asking for help with:

Problem: ${problemData.title}
Description: ${truncatedDescription}${conversationContext}Student's current question: "${message}"

${isHintRequest ? `This is a HINT REQUEST (level ${progressiveLevel}/5) in ${style} style.` : `This is a general question. Use ${style} style guidance.`}

${guidance}

RULES:
${rules}
- Use the conversation history to avoid repeating yourself
- Keep responses concise (1-3 sentences)
- If this is a hint request, follow the progressive hint system

Respond in JSON format:
{
  "response": "your response following the ${style} approach"
}`;
  }

  // Make API request to the appropriate AI provider
  async makeAIRequest(prompt, settings, requestType, maxTokens = 1500) {
    const { apiKey, aiProvider } = settings;
    
    if (!apiKey) {
      throw new Error('API key not configured');
    }

    const provider = this.supportedProviders[aiProvider];
    if (!provider) {
      throw new Error(`Unsupported AI provider: ${aiProvider}`);
    }

    try {
      const requestBody = this.formatRequest(prompt, provider, aiProvider, maxTokens);
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
  formatRequest(prompt, provider, aiProvider, maxTokens = 1500) {
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
        max_tokens: maxTokens,
        temperature: 0.7,
        response_format: { type: "json_object" }
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
          maxOutputTokens: maxTokens,
          temperature: 0.7,
          responseMimeType: "application/json"
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