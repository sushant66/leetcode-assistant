# LeetWhisper

A Chrome extension that provides AI-powered assistance for LeetCode problem solving with a guided learning approach, similar to leeco.ai.

## 🚀 Features

- **Progressive Hint System**: 4 hint types with 5 progressive levels each (High-level, Algorithm, Implementation, Detailed)
- **Multi-AI Provider Support**: Works with OpenAI GPT-4.1 Mini and Google Gemini 2.5 Flash
- **Smart Code Review**: Comprehensive code analysis with brief, actionable feedback
- **Interactive Chat Interface**: Conversational AI mentor with chat history
- **Problem Analysis**: Automatic categorization and approach suggestions
- **Non-intrusive UI**: Clean, floating panel that doesn't interfere with LeetCode
- **Progressive Learning**: Adapts hint detail based on conversation context

## 📦 Installation

### Development Setup

1. Clone this repository:
   ```bash
   git clone <your-repo-url>
   cd leetcode-assistant
   ```

2. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the project directory

3. Configure your API key:
   - Click the extension icon in Chrome
   - Enter your API key from one of the supported providers
   - Select your preferred AI provider
   - Save the settings

### Prerequisites

- Chrome browser
- API key from one of the supported providers:
  - **OpenAI GPT-4.1 Mini**: Get from [OpenAI Platform](https://platform.openai.com/api-keys)
  - **Google Gemini 2.5 Flash**: Get from [Google AI Studio](https://aistudio.google.com/app/apikey)

## 🛠️ Development Status

### ✅ Phase 1: Foundation (Completed)
- Chrome extension structure with Manifest V3
- LeetCode page detection and problem parsing with modern selectors
- Advanced Monaco editor code extraction via injected scripts
- Message passing between content script and background
- Extension popup with settings

### ✅ Phase 2: AI Integration (Completed)
- **Multi-Provider Support**: OpenAI GPT-4.1 Mini and Google Gemini 2.5 Flash
- **Advanced Hint System**: 4 hint types × 5 progressive levels = 20 different guidance approaches
- **Interactive Chat**: Conversational interface with chat history (last 3 exchanges)
- **Smart Code Review**: Brief, actionable feedback focused on main issues
- **Problem Analysis**: AI-powered categorization with concepts and edge cases
- **Error Handling**: Comprehensive validation and graceful fallbacks

### ✅ Phase 3: Smart Features (Completed)
- Progressive hint system that adapts based on conversation context
- Context-aware assistance with chat history
- Problem switching detection with automatic history reset
- Token optimization and cost management

### 🎨 Phase 4: Polish (Completed)
- Enhanced UI/UX with modern styling
- Real-time loading indicators and animations
- Comprehensive error handling with user-friendly messages
- Performance optimization for token usage

## 🏗️ Architecture

```
leetcode-assistant/
├── manifest.json              # Extension manifest (Manifest V3)
├── background/
│   ├── service-worker.js      # Background service worker with message handling
│   └── ai-service.js          # Advanced AI API integration with multiple providers
├── content/
│   ├── content-script.js      # Main content script coordinator
│   ├── problem-parser.js      # Advanced LeetCode problem parsing with modern selectors
│   ├── ui-manager.js          # Comprehensive UI injection and chat management
│   └── monaco-extractor.js    # Injected script for Monaco editor code extraction
├── popup/
│   ├── popup.html             # Extension popup
│   ├── popup.js               # Popup functionality
│   └── popup.css              # Popup styling
├── styles/
│   └── content.css            # LeetCode page integration styles
└── icons/                     # Extension icons
```

## 🔧 Technical Details

### Chrome Extension Components

- **Background Service Worker**: Handles AI API calls, storage management, and request routing
- **AI Service**: Advanced AI integration supporting OpenAI and Google Gemini with different models
- **Content Script**: Coordinates problem parsing and UI management
- **Problem Parser**: Robust extraction of problem data with fallback selectors for modern LeetCode
- **UI Manager**: Complete chat interface with conversation history and progressive hints
- **Monaco Extractor**: Injected script for reliable code extraction from Monaco editor

### Advanced AI Features

1. **Progressive Hint System**: 
   - 4 hint types: High-level, Algorithm, Implementation, Detailed
   - 5 progressive levels per type (1-5) based on conversation context
   - 20 total guidance approaches for personalized learning

2. **Smart Chat Management**:
   - Maintains last 3 conversation pairs for context
   - Automatically resets when switching problems
   - Token optimization to minimize API costs

3. **Multi-Provider Support**:
   - OpenAI GPT-4.1 Mini with structured JSON responses
   - Google Gemini 2.5 Flash with error handling
   - Automatic API key validation per provider

### Robust Problem Parsing

- **Modern Selector Support**: Updated for 2024-2025 LeetCode layouts
- **Fallback Strategies**: Multiple selectors for each data type
- **Dynamic Content Handling**: SPA navigation detection and re-parsing
- **Advanced Code Extraction**: Monaco editor integration via injected scripts

### User Experience

- **Non-intrusive Design**: Floating panel that doesn't interfere with LeetCode
- **Real-time Feedback**: Loading animations and progress indicators  
- **Error Recovery**: Graceful fallbacks and user-friendly error messages
- **Responsive Interface**: Clean, modern UI with smooth animations

## 🎯 Usage

1. **Navigate to a LeetCode problem**: The extension will automatically detect it
2. **Click the AI Assistant toggle**: Shows the floating assistant panel in the top-right
3. **Interactive chat**: Ask questions naturally or use quick action buttons
4. **Progressive hints**: Each hint request becomes more specific based on context
5. **Code review**: Click "Review Code" to get feedback on your Monaco editor solution
6. **Problem analysis**: Request analysis to understand problem category and approach

### Quick Actions Available:
- **💡 Get Hint**: Progressive hints that become more detailed with each request
- **🔍 Review Code**: Analyze your current code in the Monaco editor
- **📚 Explain Concept**: Get conceptual explanations of problem fundamentals  
- **🎯 Direct Help**: Request more direct assistance when stuck

## ⚙️ Configuration

### Settings Available:
- **API Key**: Your API key (OpenAI GPT-4.1 Mini or Google Gemini 2.5 Flash)
- **AI Provider**: Choose between supported models
- **Hint Level**: Default hint type (1=High-level, 2=Algorithm, 3=Implementation, 4=Detailed)
- **Panel Position**: Left or right side of the screen

## 🧠 AI Hint System Details

The extension uses a sophisticated 4×5 hint matrix:

### Hint Types (User Setting):
1. **High-level**: Conceptual approach and big-picture thinking
2. **Algorithm**: Specific algorithms and data structures
3. **Implementation**: Code structure and programming patterns
4. **Detailed**: Comprehensive guidance with near-complete solutions

### Progressive Levels (Automatic):
- **Level 1**: Gentle introduction and thought-provoking questions
- **Level 2**: More specific guidance and direction
- **Level 3**: Concrete suggestions and specific approaches
- **Level 4**: Detailed explanations with implementation details
- **Level 5**: Comprehensive guidance with advanced optimizations

## 🐛 Known Issues & Limitations

- Monaco editor code extraction requires script injection (handled automatically)
- Token costs scale with conversation length (limited to 3 exchange pairs)
- Some LeetCode UI changes may require selector updates
- API rate limiting depends on your provider's plan

## 🚧 Development

### Running Locally

1. Make changes to the code
2. Go to `chrome://extensions/`
3. Click the refresh icon for the extension
4. Test your changes on LeetCode problem pages

### Testing Checklist

Manual testing covers:
- **Problem Detection**: Various LeetCode problem layouts and URL patterns
- **AI Integration**: Both OpenAI and Gemini providers with different scenarios
- **Code Extraction**: Monaco editor integration across different problem types  
- **Progressive Hints**: All 4 hint types and 5 progressive levels
- **Chat History**: Conversation management and problem switching
- **Error Handling**: API failures, invalid keys, network issues
- **UI Responsiveness**: Panel positioning, animations, and interactions

### Code Structure

Key files to understand:
- `ai-service.js`: Core AI integration with progressive hint logic
- `problem-parser.js`: Modern LeetCode parsing with fallback selectors
- `ui-manager.js`: Complete chat interface and user interaction handling
- `service-worker.js`: Background message routing and storage management

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following the existing code style
4. Test thoroughly on different LeetCode problems with both AI providers
5. Ensure all error scenarios are handled gracefully
6. Submit a pull request with a clear description of changes

### Development Guidelines

- Maintain backward compatibility with existing settings
- Add fallback selectors for new LeetCode UI elements
- Keep token usage optimized for cost efficiency
- Preserve the progressive learning philosophy
- Test with both supported AI providers

## 📄 License

[Add your license here]

## 🙏 Acknowledgments

- Inspired by leeco.ai's guided learning approach
- Built for the LeetCode community to enhance learning
- Powered by OpenAI GPT-4.1 Mini and Google Gemini 2.5 Flash
- Thanks to the Chrome Extensions community for best practices

---

**Current Status**: Full-featured AI assistant with advanced hint system, multi-provider support, and comprehensive problem parsing. Ready for production use.