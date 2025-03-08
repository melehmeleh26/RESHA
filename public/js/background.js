
// Background script for the GroupsFlow Chrome Extension

// Store Facebook group status
let facebookGroupsStatus = {};

// Initialize alarm for periodic checking of Facebook groups
chrome.runtime.onInstalled.addListener(() => {
  console.log('GroupsFlow extension installed');
  
  // Set up alarm to check Facebook groups periodically
  chrome.alarms.create('checkFacebookGroups', {
    periodInMinutes: 30 // Check every 30 minutes
  });
});

// Listen for alarm events
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkFacebookGroups') {
    checkStoredGroups();
  }
});

// Check stored Facebook groups and their status
const checkStoredGroups = async () => {
  try {
    // Get stored groups from storage
    const data = await chrome.storage.local.get('facebookGroups');
    const groups = data.facebookGroups || [];
    
    if (groups.length === 0) return;
    
    // Update status of each group
    for (const group of groups) {
      // Store status in memory for quick access
      facebookGroupsStatus[group.id] = {
        lastChecked: new Date().toISOString(),
        ...group
      };
    }
    
    // Store updated status back to storage
    chrome.storage.local.set({ facebookGroupsStatus });
    
    console.log('Updated Facebook groups status:', facebookGroupsStatus);
  } catch (error) {
    console.error('Error checking stored groups:', error);
  }
};

// Open extension in a new tab when the extension icon is clicked
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
});

// Handle messages from the popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background script received message:', message);

  // Handle test post requests from the popup
  if (message.type === 'TEST_POST') {
    handleTestPost(message.data, sendResponse);
    return true; // Keep the message channel open for the async response
  }

  // Handle retrieving Facebook status
  if (message.type === 'GET_FACEBOOK_STATUS') {
    sendResponse({
      status: facebookGroupsStatus,
      hasActiveGroups: Object.keys(facebookGroupsStatus).length > 0
    });
    return true;
  }

  // Handle page navigation to create a new post
  if (message.type === 'CREATE_POST') {
    createNewPost(message.data, sendResponse);
    return true;
  }
});

// Function to handle test posts
const handleTestPost = async (postData, sendResponse) => {
  try {
    console.log('Handling test post with data:', postData);
    
    // Check if we have any Facebook tabs open
    const facebookTabs = await chrome.tabs.query({ url: "*://*.facebook.com/*" });
    
    if (facebookTabs.length > 0) {
      // Use existing Facebook tab
      const tabId = facebookTabs[0].id;
      
      // Send message to content script
      chrome.tabs.sendMessage(tabId, { 
        type: 'TEST_POST', 
        data: postData 
      }, (response) => {
        sendResponse(response || { 
          success: false, 
          message: 'לא התקבלה תגובה מהתוסף בדף הפייסבוק' 
        });
      });
    } else {
      // No Facebook tab is open, need to create one
      const newTab = await chrome.tabs.create({ 
        url: "https://www.facebook.com/groups/feed/",
        active: false // Open in background
      });
      
      // Wait for the page to load
      setTimeout(() => {
        // Send message to the new tab
        chrome.tabs.sendMessage(newTab.id, { 
          type: 'TEST_POST', 
          data: postData 
        }, async (response) => {
          // Close the tab after we're done
          if (postData.closeTabAfterPost) {
            await chrome.tabs.remove(newTab.id);
          }
          
          sendResponse(response || { 
            success: true, 
            message: 'בדיקה בוצעה בהצלחה (פייסבוק נסגר אוטומטית)' 
          });
        });
      }, 3000); // Wait 3 seconds for page to load
    }
  } catch (error) {
    console.error('Error handling test post:', error);
    sendResponse({ 
      success: false, 
      message: 'שגיאה בביצוע בדיקה: ' + error.message 
    });
  }
};

// Function to create a new post
const createNewPost = async (postData, sendResponse) => {
  try {
    // Open a Facebook group page in a new tab
    const newTab = await chrome.tabs.create({ 
      url: "https://www.facebook.com/groups/" + postData.groupId + "/buy_sell_discussion",
      active: postData.makeActive || false
    });
    
    // Wait for the page to load
    setTimeout(() => {
      // Send message to create post
      chrome.tabs.sendMessage(newTab.id, { 
        type: 'FILL_POST_FORM', 
        data: postData 
      }, (response) => {
        if (postData.closeTabAfterPost) {
          chrome.tabs.remove(newTab.id);
        }
        
        sendResponse(response || { 
          success: true, 
          message: 'הפוסט נוצר בהצלחה' 
        });
      });
    }, 3000); // Wait 3 seconds for page to load
  } catch (error) {
    console.error('Error creating post:', error);
    sendResponse({ 
      success: false, 
      message: 'שגיאה ביצירת פוסט: ' + error.message 
    });
  }
};

// Listen for tab updates to detect when user navigates to Facebook groups
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('facebook.com/groups')) {
    // Send message to content script to check the Facebook group status
    chrome.tabs.sendMessage(tabId, { type: 'CHECK_GROUP_STATUS' });
  }
});

// Initialize by checking stored groups on startup
checkStoredGroups();
