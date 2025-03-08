
// Content script for GroupsFlow
console.log('GroupsFlow Content Script Loaded');

// Track if we're in a Facebook group
let inFacebookGroup = false;

// Helper function to wait for an element to appear
const waitForElement = (selector, timeout = 10000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkElement = () => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }
      
      if (Date.now() - startTime > timeout) {
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
        return;
      }
      
      setTimeout(checkElement, 100);
    };
    
    checkElement();
  });
};

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);
  
  if (message.type === 'EXECUTE_TEST_POST') {
    executeTestPost(message.data)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Indicate async response
  }
  
  if (message.type === 'PAGE_UPDATED') {
    const url = message.url;
    inFacebookGroup = url.includes('/groups/');
    
    if (inFacebookGroup) {
      console.log('Detected Facebook group page');
      // Notify the extension popup that we're in a group page
      chrome.runtime.sendMessage({ 
        type: 'PAGE_STATUS', 
        data: { inFacebookGroup: true, url }
      });
    }
  }
});

// Function to execute a test post in a Facebook group
async function executeTestPost(data) {
  try {
    if (!inFacebookGroup) {
      throw new Error('Not currently in a Facebook group page');
    }
    
    console.log('Attempting to create a post with data:', data);
    
    // Find the post composer
    const postComposer = await waitForElement('[role="button"][aria-label*="post"], [role="button"][aria-label*="פוסט"]');
    postComposer.click();
    
    // Wait for the composer to open and the text area to appear
    const textArea = await waitForElement('[contenteditable="true"][role="textbox"]');
    
    // Focus and add content
    textArea.focus();
    
    // Insert text (this is a simplified approach, we'd need more complex logic for formatting)
    const postContent = data.content || 'Test post from GroupsFlow';
    textArea.innerHTML = postContent;
    
    // Dispatch events to make Facebook recognize the text input
    textArea.dispatchEvent(new Event('input', { bubbles: true }));
    textArea.dispatchEvent(new Event('change', { bubbles: true }));
    
    console.log('Text content added to post composer');
    
    // For testing purposes, we don't actually submit the post
    // We'd need to uncomment this code for actual posting:
    /*
    // Look for the post button
    const postButton = await waitForElement('div[aria-label="Post"], div[aria-label="פרסם"]');
    postButton.click();
    */
    
    return { status: 'Test completed', message: 'Post composer filled with test content' };
  } catch (error) {
    console.error('Error during test post:', error);
    throw error;
  }
}

// Initialize - check if we're in a group
const currentUrl = window.location.href;
inFacebookGroup = currentUrl.includes('/groups/');
if (inFacebookGroup) {
  console.log('Initialized in a Facebook group page');
}
