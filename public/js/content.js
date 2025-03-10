// Content script for Facebook interaction
console.log('GroupsFlow content script loaded');

// Enhanced helper function to wait for an element to appear and be interactive
const waitForElement = (selector, timeout = 10000, checkInteractive = true) => {
  return new Promise((resolve, reject) => {
    // First try to find element immediately
    const element = document.querySelector(selector);
    if (element && (!checkInteractive || element.offsetParent !== null)) {
      return resolve(element);
    }

    // Set up mutation observer
    const observer = new MutationObserver((mutations) => {
      const foundElement = document.querySelector(selector);
      if (foundElement && (!checkInteractive || foundElement.offsetParent !== null)) {
        observer.disconnect();
        resolve(foundElement);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Set timeout
    const timeoutId = setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);

    // Also check for permission dialogs
    const permissionObserver = new MutationObserver(() => {
      const permissionDialog = document.querySelector('[role="dialog"]');
      if (permissionDialog) {
        // Try to find and click the "Continue" button
        const continueButton = permissionDialog.querySelector('div[role="button"]');
        if (continueButton) {
          continueButton.click();
          console.log('Clicked permission dialog continue button');
        }
      }
    });

    permissionObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
};

// Extract Facebook group data from the current page
const extractGroupData = () => {
  try {
    // Try to get group info
    const groupNameElement = document.querySelector('h1, [role="heading"]');
    const groupName = groupNameElement ? groupNameElement.textContent : 'Unknown Group';
    
    // Extract group ID from URL
    const url = window.location.href;
    const groupIdMatch = url.match(/groups\/([^\/]+)/);
    const groupId = groupIdMatch ? groupIdMatch[1] : '';
    
    // Return extracted data
    return {
      id: groupId,
      name: groupName,
      url: url,
      status: 'active',
      lastChecked: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error extracting group data:', error);
    return null;
  }
};

// Check if we're in a Facebook group
const checkFacebookGroupStatus = () => {
  const url = window.location.href;
  const inFacebookGroup = url.includes('/groups/');
  
  // Try to extract group ID and name if we're in a group
  let groupData = {};
  
  if (inFacebookGroup) {
    // Try to get group info
    const extractedData = extractGroupData();
    
    if (extractedData) {
      groupData = extractedData;
      
      // Store group data for future use
      chrome.storage.local.get('facebookGroups', (data) => {
        const groups = data.facebookGroups || [];
        
        // Check if group already exists
        const existingGroupIndex = groups.findIndex(g => g.id === extractedData.id);
        
        if (existingGroupIndex === -1) {
          // Add new group
          groups.push(extractedData);
        } else {
          // Update existing group
          groups[existingGroupIndex] = {
            ...groups[existingGroupIndex],
            name: extractedData.name,
            url: extractedData.url,
            status: 'active',
            lastVisited: new Date().toISOString()
          };
        }
        
        // Save updated groups list
        chrome.storage.local.set({ facebookGroups: groups }, () => {
          console.log('Saved group data to storage:', groups);
          // Notify the extension that we've updated groups
          chrome.runtime.sendMessage({
            type: 'FACEBOOK_GROUPS_LIST',
            data: { groups }
          });
        });
      });
    }
  }
  
  // Send status back to the extension
  chrome.runtime.sendMessage({
    type: 'PAGE_STATUS',
    data: {
      inFacebookGroup,
      url,
      ...groupData
    }
  });
  
  return { inFacebookGroup, url, ...groupData };
};

// Get all user's Facebook groups
const getAllFacebookGroups = () => {
  // Try to extract user's groups from the page or use stored ones
  chrome.storage.local.get('facebookGroups', (data) => {
    const groups = data.facebookGroups || [];
    
    // Send available groups to extension
    chrome.runtime.sendMessage({
      type: 'FACEBOOK_GROUPS_LIST',
      data: { groups }
    });
    
    console.log('Sent groups list to extension:', groups);
  });
};

// Handle requests to fill a post in the group
const fillPostForm = async (content) => {
  try {
    console.log('Attempting to fill post form with:', content);
    
    // First wait a moment for Facebook to fully load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Click on the "Write something" or "Create Post" area
    // Try different selectors based on Facebook's changing UI
    const possibleSelectors = [
      'div[role="button"]:not([aria-hidden="true"]):not([aria-disabled="true"]):not([data-visualcompletion]):not([aria-haspopup])',
      'div[aria-label="Create Post"]',
      'div[aria-label="Write Post"]',
      'div[role="button"][tabindex="0"]:not([aria-hidden="true"])',
      '[aria-label="Create post"]',
      '[data-testid="creation_composer_post_button"]'
    ];
    
    let postArea = null;
    
    // Try each selector until one works
    for (const selector of possibleSelectors) {
      try {
        postArea = await waitForElement(selector, 3000);
        postArea.click();
        console.log('Clicked on post area with selector:', selector);
        break;
      } catch (e) {
        console.log(`Selector ${selector} not found, trying next one...`);
      }
    }
    
    if (!postArea) {
      // Maybe we're already in the post form, try looking for the textbox directly
      const postInputSelector = 'div[role="textbox"][contenteditable="true"]';
      try {
        postArea = await waitForElement(postInputSelector, 3000);
        console.log('Found post textbox directly');
      } catch (e) {
        throw new Error('Could not find post input field');
      }
    }
    
    // Wait for the post input field to appear and fill it
    const postInputSelector = 'div[role="textbox"][contenteditable="true"]';
    const postInput = await waitForElement(postInputSelector, 5000);
    
    // Set post content
    postInput.focus();
    
    // Use execCommand to insert text (works better with contenteditable elements)
    document.execCommand('insertText', false, content);
    
    console.log('Post content filled successfully');
    
    return { success: true, message: 'תוכן הפוסט מולא בהצלחה' };
  } catch (error) {
    console.error('Error filling post form:', error);
    return { 
      success: false, 
      message: 'לא ניתן היה למלא את טופס הפוסט', 
      error: error.message 
    };
  }
};

// Submit the post
const submitPost = async () => {
  try {
    // Look for possible post buttons with different selectors
    const possibleButtonSelectors = [
      'div[aria-label="Post"][role="button"]',
      'div[aria-label="פרסם"][role="button"]',
      'button[type="submit"]',
      '[data-testid="post-button"]',
      'div[aria-label="פוסט"]',
      'button:not([aria-hidden="true"]):not([aria-disabled="true"]) span:contains("Post")',
      'button:not([aria-hidden="true"]):not([aria-disabled="true"]) span:contains("פרסם")'
    ];
    
    let postButton = null;
    
    // Try each selector until one works
    for (const selector of possibleButtonSelectors) {
      try {
        postButton = await waitForElement(selector, 2000);
        break;
      } catch (e) {
        console.log(`Button selector ${selector} not found, trying next one...`);
      }
    }
    
    if (!postButton) {
      throw new Error('Could not find post button');
    }
    
    // Click the post button
    postButton.click();
    
    console.log('Post submitted successfully');
    return { success: true, message: 'הפוסט פורסם בהצלחה' };
  } catch (error) {
    console.error('Error submitting post:', error);
    return { 
      success: false, 
      message: 'לא ניתן היה לפרסם את הפוסט', 
      error: error.message 
    };
  }
};

// Enhanced test post handler with permission checks
const handleTestPost = async (postData) => {
  console.log('Handling test post request:', postData);
  
  try {
    // Check if we're in a Facebook group
    const { inFacebookGroup } = checkFacebookGroupStatus();
    if (!inFacebookGroup) {
      throw new Error('Not in a Facebook group');
    }

    // Wait for page to be fully loaded and interactive
    await waitForElement('body', 10000, true);

    // Check for permission dialogs
    const permissionDialog = await waitForElement('[role="dialog"]', 3000)
      .catch(() => null); // Ignore if no dialog
    
    if (permissionDialog) {
      // Try to find and click the "Continue" button
      const continueButton = permissionDialog.querySelector('div[role="button"]');
      if (continueButton) {
        continueButton.click();
        console.log('Clicked permission dialog continue button');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for dialog to close
      }
    }

    // Fill the post form with content
    const fillResult = await fillPostForm(postData.content);
    if (!fillResult.success) {
      return fillResult;
    }
    
    // If mode is "post", actually submit the post
    if (postData.mode === 'post') {
      return await submitPost();
    }
    
    return fillResult;
  } catch (error) {
    console.error('Error handling test post:', error);
    return { 
      success: false, 
      message: 'אירעה שגיאה בעת ביצוע הבדיקה', 
      error: error.message 
    };
  }
};

// Navigate to specific Facebook group
const navigateToGroup = async (groupId) => {
  if (groupId) {
    window.location.href = `https://www.facebook.com/groups/${groupId}`;
    return { success: true, message: 'Navigating to group' };
  }
  return { success: false, message: 'No group ID provided' };
};

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);
  
  if (message.type === 'TEST_POST') {
    // Handle the test post request
    handleTestPost(message.data).then(result => {
      sendResponse(result);
    }).catch(error => {
      sendResponse({ 
        success: false, 
        message: 'אירעה שגיאה בעת ביצוע הבדיקה', 
        error: error.message 
      });
    });
    
    // Return true to indicate we'll respond asynchronously
    return true;
  }
  
  if (message.type === 'CHECK_GROUP_STATUS') {
    // Check and report the current Facebook group status
    const status = checkFacebookGroupStatus();
    sendResponse(status);
    return true;
  }
  
  if (message.type === 'GET_GROUP_INFO') {
    // Extract and return current group info
    const groupData = extractGroupData();
    sendResponse({ success: true, data: groupData });
    return true;
  }
  
  if (message.type === 'FILL_POST_FORM') {
    // Fill the post form and optionally submit
    handleTestPost(message.data).then(result => {
      sendResponse(result);
    }).catch(error => {
      sendResponse({ 
        success: false, 
        message: 'אירעה שגיאה בעת מילוי טופס הפוסט', 
        error: error.message 
      });
    });
    
    return true;
  }
  
  if (message.type === 'NAVIGATE_TO_GROUP') {
    // Navigate to specific group
    navigateToGroup(message.data.groupId).then(result => {
      sendResponse(result);
    }).catch(error => {
      sendResponse({
        success: false,
        message: 'אירעה שגיאה בעת ניסיון ניווט לקבוצה',
        error: error.message
      });
    });
    
    return true;
  }
});

// Modify the background script to better handle group fetching:

// Run initial check
checkFacebookGroupStatus();

// Set up periodic checks to keep content script alive
setInterval(() => {
  checkFacebookGroupStatus();
}, 60000); // Check every minute
