// Background script for the GroupsFlow Chrome Extension

// Store Facebook group status
let facebookGroupsStatus = {};
let logs = [];

// Initialize alarm for periodic checking of Facebook groups
chrome.runtime.onInstalled.addListener(() => {
  console.log('GroupsFlow extension installed');
  
  // Set up alarm to check Facebook groups periodically
  chrome.alarms.create('checkFacebookGroups', {
    periodInMinutes: 30 // Check every 30 minutes
  });
  
  // Initialize logs array if not exists
  chrome.storage.local.get('logs', (data) => {
    if (!data.logs) {
      chrome.storage.local.set({ logs: [] });
    } else {
      logs = data.logs;
    }
  });
  
  // Initialize Facebook groups if not exists
  chrome.storage.local.get('facebookGroups', (data) => {
    if (!data.facebookGroups) {
      chrome.storage.local.set({ facebookGroups: [] });
    }
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

// Save a log entry
const saveLog = (logEntry) => {
  logs.unshift(logEntry);
  // Keep only the last 100 logs
  logs = logs.slice(0, 100);
  chrome.storage.local.set({ logs });
};

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
    chrome.storage.local.get('facebookGroups', (data) => {
      const groups = data.facebookGroups || [];
      sendResponse({
        status: facebookGroupsStatus,
        hasActiveGroups: groups.length > 0
      });
    });
    return true;
  }

  // Handle fetching Facebook groups
  if (message.type === 'FETCH_FACEBOOK_GROUPS') {
    fetchFacebookGroups(sendResponse);
    return true;
  }

  // Handle getting logs
  if (message.type === 'GET_LOGS') {
    chrome.storage.local.get('logs', (data) => {
      sendResponse({ logs: data.logs || [] });
    });
    return true;
  }

  // Handle saving a log
  if (message.type === 'SAVE_LOG') {
    if (message.data && message.data.log) {
      saveLog(message.data.log);
    }
    return true;
  }

  // Handle clearing logs
  if (message.type === 'CLEAR_LOGS') {
    logs = [];
    chrome.storage.local.set({ logs: [] });
    return true;
  }

  // Handle page navigation to create a new post
  if (message.type === 'CREATE_POST') {
    createNewPost(message.data, sendResponse);
    return true;
  }
});

// Function to fetch Facebook groups
const fetchFacebookGroups = async (sendResponse) => {
  try {
    // First try to get stored groups
    chrome.storage.local.get('facebookGroups', async (data) => {
      const storedGroups = data.facebookGroups || [];
      
      // Check if we have any active Facebook tabs to get fresh data
      const facebookTabs = await chrome.tabs.query({ url: "*://*.facebook.com/groups/*" });
      
      if (facebookTabs.length > 0) {
        // We have Facebook group tabs open - try to get fresh data
        let groupDataPromises = facebookTabs.map(tab => {
          return new Promise(resolve => {
            if (tab.id) {
              chrome.tabs.sendMessage(tab.id, { type: 'GET_GROUP_INFO' }, (response) => {
                if (response && response.success && response.data) {
                  resolve(response.data);
                } else {
                  resolve(null);
                }
              });
            } else {
              resolve(null);
            }
          });
        });
        
        // Wait for all tab data to return
        const groupDataResults = await Promise.all(groupDataPromises);
        const newGroups = groupDataResults.filter(Boolean);
        
        // Merge with stored groups, updating existing entries
        let mergedGroups = [...storedGroups];
        
        newGroups.forEach(newGroup => {
          const existingIndex = mergedGroups.findIndex(g => g.id === newGroup.id);
          
          if (existingIndex >= 0) {
            mergedGroups[existingIndex] = {
              ...mergedGroups[existingIndex],
              ...newGroup,
              lastChecked: new Date().toISOString()
            };
          } else {
            mergedGroups.push({
              ...newGroup,
              lastChecked: new Date().toISOString()
            });
          }
        });
        
        // Save merged groups
        chrome.storage.local.set({ facebookGroups: mergedGroups });
        
        // Return the merged groups
        sendResponse({ 
          success: true, 
          groups: mergedGroups,
          message: `Found ${mergedGroups.length} groups (${newGroups.length} from active tabs)` 
        });
      } else if (storedGroups.length > 0) {
        // No active tabs but we have stored groups
        sendResponse({ 
          success: true, 
          groups: storedGroups,
          message: `Using ${storedGroups.length} stored groups` 
        });
      } else {
        // No tabs and no stored groups - try to open a Facebook groups page
        try {
          const newTab = await chrome.tabs.create({ 
            url: "https://www.facebook.com/groups/feed/",
            active: false // Open in background
          });
          
          // Wait a moment for page to load
          setTimeout(() => {
            // Try to get groups from the page
            if (newTab.id) {
              chrome.tabs.sendMessage(newTab.id, { type: 'CHECK_GROUP_STATUS' });
            }
            
            // Close the tab after checking
            setTimeout(() => {
              chrome.tabs.remove(newTab.id);
              
              // Return available groups
              chrome.storage.local.get('facebookGroups', (data) => {
                const availableGroups = data.facebookGroups || [];
                sendResponse({ 
                  success: availableGroups.length > 0,
                  groups: availableGroups,
                  message: availableGroups.length > 0 
                    ? `Found ${availableGroups.length} groups` 
                    : 'No Facebook groups found'
                });
              });
            }, 5000);
          }, 3000);
        } catch (error) {
          console.error('Error opening Facebook groups page:', error);
          sendResponse({ 
            success: false, 
            groups: [],
            error: 'Could not open Facebook to check for groups' 
          });
        }
      }
    });
  } catch (error) {
    console.error('Error fetching Facebook groups:', error);
    sendResponse({ success: false, error: error.message });
  }
};

// Function to handle test posts
const handleTestPost = async (postData, sendResponse) => {
  try {
    console.log('Handling test post with data:', postData);
    
    // If we have a specific group ID, navigate directly to that group
    if (postData.targetGroupId) {
      const groupUrl = `https://www.facebook.com/groups/${postData.targetGroupId}`;
      
      // Check if we have any Facebook tabs open already
      const facebookTabs = await chrome.tabs.query({ url: "*://*.facebook.com/*" });
      
      if (facebookTabs.length > 0) {
        // Update existing tab to go to the target group
        const tabId = facebookTabs[0].id;
        chrome.tabs.update(tabId, { url: groupUrl });
        
        // Wait for the page to load before sending the post command
        setTimeout(() => {
          chrome.tabs.sendMessage(tabId, { 
            type: 'TEST_POST', 
            data: postData 
          }, (response) => {
            if (postData.closeTabAfterPost) {
              chrome.tabs.remove(tabId);
            }
            
            sendResponse(response || { 
              success: false, 
              message: 'לא התקבלה תגובה מהתוסף בדף הפייסבוק' 
            });
          });
        }, 5000);
      } else {
        // Create a new tab with the target group
        const newTab = await chrome.tabs.create({ 
          url: groupUrl,
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
        }, 5000); // Wait 5 seconds for page to load
      }
    } else {
      // No specific group - use any open Facebook tab or create a new one
      const facebookTabs = await chrome.tabs.query({ url: "*://*.facebook.com/*" });
      
      if (facebookTabs.length > 0) {
        // Use existing Facebook tab
        const tabId = facebookTabs[0].id;
        
        // Send message to content script
        chrome.tabs.sendMessage(tabId, { 
          type: 'TEST_POST', 
          data: postData 
        }, (response) => {
          if (postData.closeTabAfterPost) {
            chrome.tabs.remove(tabId);
          }
          
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
        }, 5000); // Wait 5 seconds for page to load
      }
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
    }, 5000); // Wait 5 seconds for page to load
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

// Make sure we have logs initialized
chrome.storage.local.get('logs', (data) => {
  logs = data.logs || [];
});
