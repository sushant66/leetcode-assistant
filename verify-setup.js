#!/usr/bin/env node

// Verification script for LeetWhisper Chrome Extension
// Run this script to verify all required files are in place

const fs = require('fs');
const path = require('path');

function log(message) {
  console.log(message);
}

log('🔍 Verifying LeetWhisper Chrome Extension Setup...\n');

// Required files and directories
const requiredFiles = [
  'manifest.json',
  'plan.md',
  'README.md',
  'background/service-worker.js',
  'content/content-script.js',
  'content/problem-parser.js',
  'content/ui-manager.js',
  'popup/popup.html',
  'popup/popup.css',
  'popup/popup.js',
  'styles/content.css',
  'icons/README.md'
];

const requiredDirectories = [
  'background',
  'content', 
  'popup',
  'styles',
  'icons',
  'ui' // Will be used in future phases
];

let allFilesExist = true;
let allDirsExist = true;

// Check directories
log('📁 Checking directories:');
requiredDirectories.forEach(dir => {
  const exists = fs.existsSync(dir);
  const status = exists ? '✅' : '❌';
  log(`   ${status} ${dir}/`);
  if (!exists) allDirsExist = false;
});

log('');

// Check files
log('📄 Checking required files:');
requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  const status = exists ? '✅' : '❌';
  log(`   ${status} ${file}`);
  if (!exists) allFilesExist = false;
});

log('');

// Check manifest.json validity
log('🔧 Checking manifest.json:');
try {
  const manifestContent = fs.readFileSync('manifest.json', 'utf8');
  const manifest = JSON.parse(manifestContent);
  
  log(`   ✅ Valid JSON format`);
  log(`   ✅ Manifest version: ${manifest.manifest_version}`);
  log(`   ✅ Extension name: ${manifest.name}`);
  log(`   ✅ Version: ${manifest.version}`);
  
  // Check required permissions
  const requiredPermissions = ['storage', 'activeTab', 'scripting'];
  const hasAllPermissions = requiredPermissions.every(perm => 
    manifest.permissions && manifest.permissions.includes(perm)
  );
  
  if (hasAllPermissions) {
    log(`   ✅ Required permissions present`);
  } else {
    log(`   ❌ Missing required permissions`);
  }
  
  // Check host permissions
  if (manifest.host_permissions && manifest.host_permissions.includes('https://leetcode.com/*')) {
    log(`   ✅ LeetCode host permission present`);
  } else {
    log(`   ❌ Missing LeetCode host permission`);
  }
  
  // Check content scripts
  if (manifest.content_scripts && manifest.content_scripts.length > 0) {
    log(`   ✅ Content scripts configured`);
  } else {
    log(`   ❌ Content scripts not configured`);
  }
  
} catch (error) {
  log(`   ❌ Invalid manifest.json: ${error.message}`);
}

log('');

// File size check
log('📊 File sizes:');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const stats = fs.statSync(file);
    const sizeKB = (stats.size / 1024).toFixed(1);
    log(`   📄 ${file}: ${sizeKB} KB`);
  }
});

log('');

// Summary
log('📋 Setup Summary:');
log(`   Directories: ${allDirsExist ? '✅ All present' : '❌ Some missing'}`);
log(`   Files: ${allFilesExist ? '✅ All present' : '❌ Some missing'}`);

log('');

if (allFilesExist && allDirsExist) {
  log('🎉 Setup verification complete! Extension is ready for development.');
  log('');
  log('Next steps:');
  log('1. Load the extension in Chrome (chrome://extensions/)');
  log('2. Enable Developer mode');
  log('3. Click "Load unpacked" and select this directory');
  log('4. Test on a LeetCode problem page');
  log('5. Configure your OpenAI API key in the extension popup');
} else {
  log('❌ Setup incomplete. Please check the missing files and directories.');
}

log('');
log('For Phase 2 (AI Integration), implement:');
log('- background/ai-service.js');
log('- OpenAI API integration');
log('- Prompt engineering for hints and analysis');
log('- Error handling and rate limiting');
