
// Background script for the GroupsFlow Chrome Extension

// Handle messages from the popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background script received message:', message);

  // Handle test post requests from the popup
  if (message.type === 'TEST_POST') {
    // Forward the test post request to the active tab with Facebook open
    chrome.tabs.query({ active: true, url: "*://*.facebook.com/*" }, (tabs) => {
      if (tabs.length === 0) {
        sendResponse({ 
          success: false, 
          message: 'לא נמצא דף פייסבוק פעיל. אנא פתח קבוצת פייסבוק בלשונית פעילה.' 
        });
        return;
      }
      
      // Forward message to content script in the Facebook tab
      chrome.tabs.sendMessage(tabs[0].id, message, (response) => {
        console.log('Received response from content script:', response);
        // Forward response back to the sender
        sendResponse(response || { 
          success: false, 
          message: 'לא התקבלה תגובה מהתוסף בדף הפייסבוק' 
        });
      });
    });
    
    // Return true to indicate we'll respond asynchronously
    return true;
  }
});

// Listen for tab updates to detect when user navigates to Facebook groups
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('facebook.com/groups')) {
    // Send message to content script to check the Facebook group status
    chrome.tabs.sendMessage(tabId, { type: 'CHECK_GROUP_STATUS' });
  }
});
