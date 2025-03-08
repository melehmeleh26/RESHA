// Content script for Facebook interaction
console.log('GroupsFlow content script loaded');

// Helper function to wait for an element to appear on the page
const waitForElement = (selector, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }
    
    const observer = new MutationObserver((mutations) => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        resolve(document.querySelector(selector));
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Set timeout to avoid waiting forever
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
};

// Check if we're in a Facebook group
const checkFacebookGroupStatus = () => {
  const url = window.location.href;
  const inFacebookGroup = url.includes('/groups/');
  
  // Send status back to the extension
  chrome.runtime.sendMessage({
    type: 'PAGE_STATUS',
    data: {
      inFacebookGroup,
      url
    }
  });
  
  return { inFacebookGroup, url };
};

// Handle requests to fill a post in the group
const fillPostForm = async (content) => {
  try {
    console.log('Attempting to fill post form with:', content);
    
    // Click on the "Write something" or "Create Post" area
    // First try finding the "Create Post" button
    let postAreaSelector = 'div[role="button"]:not([aria-hidden="true"]):not([aria-disabled="true"]):not([data-visualcompletion]):not([aria-haspopup])';
    
    try {
      const postArea = await waitForElement(postAreaSelector, 3000);
      postArea.click();
      console.log('Clicked on post area');
    } catch (error) {
      console.log('Could not find initial post area, trying alternative', error);
      
      // Try alternative selector if first attempt fails
      postAreaSelector = 'div[role="textbox"][contenteditable="true"]';
      const postArea = await waitForElement(postAreaSelector, 3000);
      
      // If we directly found the textbox, we might already be in the post form
      console.log('Found post textbox directly');
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
    // Look for the "Post" button
    const postButtonSelector = 'div[role="button"]:not([aria-hidden="true"]):not([aria-disabled="true"]) > span:contains("Post"), button[type="submit"]';
    
    // Wait for post button and click it
    const postButton = await waitForElement(postButtonSelector, 5000);
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

// Handle test post requests
const handleTestPost = async (postData) => {
  console.log('Handling test post request:', postData);
  
  // Check if we're in a Facebook group
  const { inFacebookGroup } = checkFacebookGroupStatus();
  
  if (!inFacebookGroup) {
    return { 
      success: false, 
      message: 'נא לפתוח קבוצת פייסבוק כדי לבצע בדיקה' 
    };
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
  
  // Otherwise just return the success of filling
  return fillResult;
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
});

// Run initial check
checkFacebookGroupStatus();
