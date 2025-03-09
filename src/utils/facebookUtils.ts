
/**
 * Facebook Utilities 
 * Helper functions for working with Facebook in the extension
 */

/**
 * Validates if current page is a Facebook page with expected elements
 * @returns {boolean} True if all validations pass
 */
export const validateFacebookPage = (): boolean => {
  // Check if we're on facebook.com domain
  if (!window.location.hostname.includes('facebook.com')) {
    console.error('This script can only run on Facebook domains');
    return false;
  }
  
  // Check if the main content area is found
  if (!document.querySelector('[role="main"]')) {
    console.error('Facebook main content area not found');
    return false;
  }

  return true;
};

/**
 * Extracts group information from Facebook DOM elements
 * @returns Array of group objects with name and URL
 */
export const extractFacebookGroups = (): {name: string, href: string}[] => {
  if (!validateFacebookPage()) {
    return [];
  }

  try {
    // Find all links that might be Facebook groups
    const groupLinks = Array.from(
      document.querySelectorAll('a[href*="/groups/"]')
    ) as HTMLAnchorElement[];

    // Filter and extract group data
    const groups = groupLinks
      .map(link => {
        const href = link.href;
        // Match true group URLs (avoids navigation elements)
        if (href.match(/facebook\.com\/groups\/[0-9a-zA-Z\.\-_]+\/?(?:\?|$)/)) {
          const nameElement = link.querySelector('span, div') || link;
          const name = nameElement.textContent?.trim();
          return name && name.length > 0 ? { name, href } : null;
        }
        return null;
      })
      .filter(Boolean) as {name: string, href: string}[];

    // Return only unique groups by URL
    return groups.filter((group, index, self) => 
      index === self.findIndex((g) => g.href === group.href)
    );
  } catch (error) {
    console.error('Error extracting Facebook groups:', error);
    return [];
  }
};

/**
 * Find a "Create Post" element on a Facebook group page
 * @returns The post creation element or null if not found
 */
export const findPostCreationElement = (): HTMLElement | null => {
  // Common selectors for Facebook's post creation box
  const selectors = [
    '[aria-label="צור פוסט"]', // Hebrew
    '[aria-label="Create Post"]', // English
    '[aria-label="פוסט חדש"]',    // Alternative Hebrew
    '[role="button"][tabindex="0"]:not([aria-label]):not([aria-expanded])'
  ];
  
  // Try each selector
  for (const selector of selectors) {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) return element;
  }
  
  // Try to find by common class patterns or parent elements
  const possibleContainers = document.querySelectorAll('[role="main"] div[role="button"]');
  for (const container of possibleContainers) {
    const text = container.textContent?.toLowerCase().trim();
    if (text && (text.includes('פוסט') || text.includes('post') || text.includes('על מה'))) {
      return container as HTMLElement;
    }
  }
  
  return null;
};

/**
 * Posts content to a Facebook group
 * @param content The text content to post
 * @returns Promise with success status and message
 */
export const postToFacebookGroup = async (content: string): Promise<{success: boolean, message: string}> => {
  if (!validateFacebookPage()) {
    return { success: false, message: 'אינך נמצא בדף פייסבוק תקין' };
  }
  
  // Find post creation element
  const postBox = findPostCreationElement();
  if (!postBox) {
    return { success: false, message: 'לא נמצא אלמנט יצירת פוסט בדף' };
  }
  
  try {
    // Click to open post dialog
    postBox.click();
    
    // Wait for the dialog to open
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Find text area for post content
    const textArea = document.querySelector('[contenteditable="true"][role="textbox"]') as HTMLElement;
    if (!textArea) {
      return { success: false, message: 'לא נמצא שדה טקסט להזנת תוכן הפוסט' };
    }
    
    // Set post content
    textArea.focus();
    document.execCommand('insertText', false, content);
    
    // Find publish button
    const publishButton = Array.from(document.querySelectorAll('div[role="button"]')).find(
      button => {
        const text = button.textContent?.toLowerCase();
        return text && (text.includes('פרסם') || text.includes('publish') || text.includes('post'));
      }
    ) as HTMLElement;
    
    if (!publishButton) {
      return { success: false, message: 'לא נמצא כפתור פרסום' };
    }
    
    // Click publish button
    publishButton.click();
    
    // Wait for publish to complete
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    return { success: true, message: 'הפוסט פורסם בהצלחה' };
  } catch (error) {
    console.error('Error posting to Facebook:', error);
    return { 
      success: false, 
      message: `שגיאה בפרסום הפוסט: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`
    };
  }
};
