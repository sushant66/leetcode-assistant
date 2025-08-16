# Installation Guide

## Quick Start

### 1. Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right corner)
3. Click **"Load unpacked"**
4. Select the `leetcode-assistant` directory
5. The extension should now appear in your extensions list

### 2. Verify Installation

1. Navigate to any LeetCode problem (e.g., https://leetcode.com/problems/two-sum/)
2. You should see a **🤖 AI Assistant** toggle button in the top right corner
3. Click the extension icon in Chrome toolbar to open settings popup

### 3. Configure API Key (For Future AI Features)

1. Click the extension icon in Chrome toolbar
2. Enter your OpenAI API key in the settings
3. Choose your preferred AI provider and hint level
4. Save settings

## Testing the Extension

### Basic Functionality Test

1. **Go to a LeetCode problem page**
   - Example: https://leetcode.com/problems/two-sum/
   - Verify the AI Assistant toggle appears

2. **Click the AI Assistant toggle**
   - Panel should slide in from the right side
   - You should see problem analysis (placeholder for now)
   - Chat interface should be functional

3. **Test problem parsing**
   - Open browser console (F12)
   - Type: `debugLeetCodeAssistant()`
   - Verify problem data is being extracted correctly

4. **Test settings**
   - Click extension icon to open popup
   - Verify status shows "Active" on LeetCode problem pages
   - Try changing panel position from right to left

### Expected Behavior

- ✅ Extension loads without errors
- ✅ Toggle button appears on LeetCode problem pages
- ✅ Panel opens/closes smoothly
- ✅ Settings save and persist
- ✅ Problem parsing extracts title, description, etc.
- ✅ No interference with LeetCode's normal functionality

### Troubleshooting

**Extension not loading:**
- Check if all files are present (run `node verify-setup.js`)
- Verify manifest.json is valid JSON
- Check Chrome developer console for errors

**Toggle button not appearing:**
- Ensure you're on a LeetCode problem page (URL contains `/problems/`)
- Check browser console for JavaScript errors
- Try refreshing the page

**Settings not saving:**
- Check Chrome storage permissions
- Verify popup.js is loading correctly
- Check browser console for errors

**Panel not opening:**
- Check content script is injected properly
- Verify UI manager is initialized
- Check browser console for errors

## Development Commands

```bash
# Verify setup
node verify-setup.js

# Check all files are present
ls -la background/ content/ popup/ styles/ icons/

# View manifest
cat manifest.json
```

## Browser Compatibility

- ✅ Chrome (Recommended)
- ✅ Chromium-based browsers (Edge, Brave, etc.)
- ❌ Firefox (uses different extension API)
- ❌ Safari (uses different extension API)

## File Structure Verification

Your directory should look like this:
```
leetcode-assistant/
├── manifest.json
├── plan.md
├── README.md
├── INSTALLATION.md
├── verify-setup.js
├── background/
│   └── service-worker.js
├── content/
│   ├── content-script.js
│   ├── problem-parser.js
│   └── ui-manager.js
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── styles/
│   └── content.css
├── icons/
│   └── README.md
└── ui/
    (for future use)
```

## Next Steps

Once basic functionality is verified:

1. **Phase 2**: Implement AI integration
   - Add OpenAI API calls
   - Create hint generation system
   - Implement code review features

2. **Phase 3**: Add smart features
   - Intelligent hint progression
   - Advanced problem analysis
   - Context-aware assistance

3. **Phase 4**: Polish and publish
   - Create proper icons
   - Comprehensive testing
   - Chrome Web Store submission

## Need Help?

- Check browser console for error messages
- Review the README.md for detailed documentation
- Verify all files are present with the verification script
- Ensure you're testing on actual LeetCode problem pages