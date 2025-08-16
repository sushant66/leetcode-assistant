# LeetCode AI Assistant

A Chrome extension that provides AI-powered assistance for LeetCode problem solving with a guided learning approach, similar to leeco.ai.

## 🚀 Features

- **Smart Hint System**: Get contextual hints without spoiling the solution
- **Problem Analysis**: Automatic analysis of LeetCode problems
- **Code Review**: AI-powered feedback on your code attempts
- **Guided Learning**: Socratic method approach to help you learn
- **Non-intrusive UI**: Clean, floating panel that doesn't interfere with LeetCode

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
   - Enter your OpenAI API key in the popup
   - Save the settings

### Prerequisites

- Chrome browser
- API key from one of the supported providers:
  - **OpenAI**: Get from [OpenAI Platform](https://platform.openai.com/api-keys)
  - **Google Gemini**: Get from [Google AI Studio](https://aistudio.google.com/app/apikey)

## 🛠️ Development Status

### ✅ Phase 1: Foundation (Completed)
- Chrome extension structure with Manifest V3
- LeetCode page detection and problem parsing
- Basic UI injection into LeetCode pages
- Message passing between content script and background
- Extension popup with settings

### ✅ Phase 2: AI Integration (Completed)
- **Multi-Provider Support**: OpenAI (GPT-4, GPT-3.5) and Google Gemini (Pro, Flash)
- **Problem Analysis**: AI-powered categorization and approach suggestions
- **Hint Generation**: Progressive hint system with 4 levels of detail
- **Code Review**: AI feedback on user's solution attempts
- **Error Handling**: Graceful fallbacks and validation

### 📋 Phase 3: Smart Features (Planned)
- Intelligent hint progression
- Advanced code analysis
- Context-aware assistance
- Problem categorization

### 🎨 Phase 4: Polish (Planned)
- UI/UX improvements
- Performance optimization
- Comprehensive testing
- Chrome Web Store preparation

## 🏗️ Architecture

```
leetcode-assistant/
├── manifest.json              # Extension manifest (Manifest V3)
├── background/
│   ├── service-worker.js      # Background service worker
│   └── ai-service.js          # AI API integration (planned)
├── content/
│   ├── content-script.js      # Main content script
│   ├── problem-parser.js      # LeetCode problem parsing
│   └── ui-manager.js          # UI injection and management
├── popup/
│   ├── popup.html             # Extension popup
│   ├── popup.js               # Popup functionality
│   └── popup.css              # Popup styling
├── styles/
│   └── content.css            # LeetCode page integration styles
└── icons/                     # Extension icons (to be added)
```

## 🔧 Technical Details

### Chrome Extension Components

- **Background Service Worker**: Handles AI API calls and storage management
- **Content Script**: Interacts with LeetCode pages and manages UI
- **Problem Parser**: Extracts problem data from LeetCode pages
- **UI Manager**: Creates and manages the assistant interface
- **Popup**: Extension settings and quick actions

### Key Features Implemented

1. **Problem Detection**: Automatically detects when you're on a LeetCode problem page
2. **Problem Parsing**: Extracts title, description, examples, constraints, and difficulty
3. **Code Monitoring**: Tracks changes in the code editor
4. **UI Integration**: Non-intrusive floating panel with toggle button
5. **Settings Management**: Secure API key storage and user preferences
6. **Message Passing**: Communication between different extension components

### Supported LeetCode Features

- Problem page detection
- Problem metadata extraction
- Code editor monitoring
- Dynamic content updates (SPA navigation)
- Multiple LeetCode layouts

## 🎯 Usage

1. **Navigate to a LeetCode problem**: The extension will automatically detect it
2. **Click the AI Assistant toggle**: Shows the floating assistant panel
3. **Get problem analysis**: Automatic analysis when panel is opened
4. **Request hints**: Use quick action buttons or chat interface
5. **Review code**: Get feedback on your current solution attempt

## ⚙️ Configuration

### Settings Available:
- **API Key**: Your API key (OpenAI or Google Gemini)
- **AI Provider**: Choose between OpenAI GPT-4, GPT-3.5, Gemini Pro, or Gemini Flash
- **Hint Level**: Default level of hint detail (1-4)
- **Panel Position**: Left or right side of the screen
- **Auto-analyze**: Automatically analyze problems when detected
- **Show hints**: Display hint buttons in the interface

## 🐛 Known Issues

- Icon placeholders need actual icons
- Some edge cases in problem parsing may need refinement
- Rate limiting could be enhanced for production use
- UI could be further polished for mobile responsiveness

## 🚧 Development

### Running Locally

1. Make changes to the code
2. Go to `chrome://extensions/`
3. Click the refresh icon for the extension
4. Test your changes on LeetCode

### Testing

Currently manual testing on LeetCode problem pages. Test coverage includes:
- Problem detection and parsing
- UI injection and interaction
- Settings management
- Message passing between components

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on different LeetCode problems
5. Submit a pull request

## 📄 License

[Add your license here]

## 🙏 Acknowledgments

- Inspired by leeco.ai's approach to guided learning
- Built for the LeetCode community
- Uses OpenAI for AI-powered assistance

---

**Note**: This extension is currently in Phase 1 of development. AI features will be implemented in Phase 2.