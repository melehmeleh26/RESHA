
// Background script for GroupsFlow
console.log('GroupsFlow Background Script Loaded');

// Listen for messages from the popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background script received message:', message);
  
  if (message.type === 'TEST_POST') {
    console.log('Initiating test post for:', message.data);
    
    // Forward the message to the content script in the active Facebook tab
    chrome.tabs.query({ active: true, url: "*://*.facebook.com/*" }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, { 
          type: 'EXECUTE_TEST_POST',
          data: message.data
        });
        sendResponse({ success: true, message: 'Test initiated on Facebook tab' });
      } else {
        sendResponse({ success: false, message: 'No active Facebook tab found' });
      }
    });
    
    return true; // Indicate async response
  }
});

// Track Facebook navigation for potential testing opportunities
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('facebook.com')) {
    chrome.tabs.sendMessage(tabId, { type: 'PAGE_UPDATED', url: tab.url });
  }
});
