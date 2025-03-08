
import { useState, useEffect } from 'react';

// Define types for the extension responses
interface FacebookStatus {
  inFacebookGroup: boolean;
  url: string;
}

interface FacebookGroup {
  id: string;
  name: string;
  url: string;
  status: 'active' | 'inactive';
  lastChecked: string;
}

interface FacebookGroupStatus {
  [groupId: string]: FacebookGroup;
}

interface TestPostResponse {
  success: boolean;
  message?: string;
  result?: any;
  error?: string;
}

interface TestPostOptions {
  content: string;
  mode: string;
  closeTabAfterPost?: boolean;
  targetGroupId?: string;  // Added for targeting specific group
}

interface LogEntry {
  id: string;
  timestamp: string;
  action: string;
  status: 'success' | 'warning' | 'error' | 'info';
  details: string;
}

// Check if running in a Chrome extension environment
const isChromeExtension = () => {
  return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
};

// Hook for Chrome extension functionality
export const useChromeExtension = () => {
  const [isExtension, setIsExtension] = useState(false);
  const [facebookStatus, setFacebookStatus] = useState<FacebookStatus>({
    inFacebookGroup: false,
    url: ''
  });
  const [facebookGroupsStatus, setFacebookGroupsStatus] = useState<FacebookGroupStatus>({});
  const [availableGroups, setAvailableGroups] = useState<FacebookGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    // Check if we're running as an extension
    const extensionEnvironment = isChromeExtension();
    setIsExtension(extensionEnvironment);

    if (!extensionEnvironment) {
      console.log('Not running as a Chrome extension');
      return;
    }

    // Set up listener for messages from content script
    const messageListener = (message: any) => {
      console.log('Extension hook received message:', message);
      
      if (message.type === 'PAGE_STATUS') {
        setFacebookStatus(message.data);
      } else if (message.type === 'LOG_ENTRY') {
        addLogEntry(
          message.data.action, 
          message.data.status, 
          message.data.details
        );
      } else if (message.type === 'FACEBOOK_GROUPS_LIST') {
        if (message.data && Array.isArray(message.data.groups)) {
          // Ensure data is properly typed before setting
          const typedGroups: FacebookGroup[] = message.data.groups.map((group: any) => ({
            id: group.id || '',
            name: group.name || '',
            url: group.url || '',
            status: group.status || 'inactive',
            lastChecked: group.lastChecked || new Date().toISOString()
          }));
          setAvailableGroups(typedGroups);
          addLogEntry('קבוצות התקבלו', 'info', `נמצאו ${typedGroups.length} קבוצות פייסבוק`);
        }
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    // Query active tabs to check Facebook status
    chrome.tabs.query({ active: true, url: "*://*.facebook.com/*" }, (tabs) => {
      if (tabs.length > 0) {
        const url = tabs[0].url || '';
        const inFacebookGroup = url.includes('/groups/');
        
        setFacebookStatus({
          inFacebookGroup,
          url
        });
        
        // Send a message to the content script to check the status
        if (tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'CHECK_GROUP_STATUS' });
        }
      }
    });

    // Get stored Facebook groups status
    chrome.runtime.sendMessage({ type: 'GET_FACEBOOK_STATUS' }, (response) => {
      if (response && response.status) {
        setFacebookGroupsStatus(response.status);
        
        // Convert the object to an array for easier rendering
        if (response.status) {
          const groupsArray = Object.values(response.status) as FacebookGroup[];
          setAvailableGroups(groupsArray);
        }
      }
    });

    // Request list of Facebook groups from the background script
    fetchUserGroups();

    // Get stored logs
    chrome.runtime.sendMessage({ type: 'GET_LOGS' }, (response) => {
      if (response && response.logs) {
        setLogs(response.logs);
      }
    });

    return () => {
      // Clean up listener when component unmounts
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  // Function to fetch user's Facebook groups
  const fetchUserGroups = () => {
    if (!isExtension) {
      console.error('Cannot fetch groups: Not running as Chrome extension');
      addLogEntry('שגיאת טעינת קבוצות', 'error', 'התוסף אינו פעיל');
      return;
    }
    
    setIsLoading(true);
    addLogEntry('טוען קבוצות', 'info', 'מבקש רשימת קבוצות פייסבוק');
    
    console.log('Sending FETCH_FACEBOOK_GROUPS message to background script');
    
    // Message the background script to fetch groups
    chrome.runtime.sendMessage({ type: 'FETCH_FACEBOOK_GROUPS' }, (response) => {
      setIsLoading(false);
      
      console.log('Received response from FETCH_FACEBOOK_GROUPS:', response);
      
      if (response && response.success && response.groups) {
        // Ensure data is properly typed before setting
        const typedGroups: FacebookGroup[] = response.groups.map((group: any) => ({
          id: group.id || '',
          name: group.name || '',
          url: group.url || '',
          status: group.status || 'inactive',
          lastChecked: group.lastChecked || new Date().toISOString()
        }));
        
        setAvailableGroups(typedGroups);
        addLogEntry('קבוצות התקבלו', 'success', `התקבלו ${typedGroups.length} קבוצות פייסבוק`);
      } else {
        addLogEntry('נכשל בטעינת קבוצות', 'error', response?.error || 'נכשל בטעינת קבוצות פייסבוק');
        
        // If we don't have groups from the API, let's attempt to check if there are any active Facebook tabs
        chrome.tabs.query({ url: "*://*.facebook.com/groups/*" }, (tabs) => {
          if (tabs.length > 0) {
            // We have Facebook group tabs open - try to get data from there
            tabs.forEach(tab => {
              if (tab.id) {
                chrome.tabs.sendMessage(tab.id, { type: 'GET_GROUP_INFO' });
              }
            });
            addLogEntry('מנסה זיהוי קבוצות חלופי', 'info', `נמצאו ${tabs.length} לשוניות קבוצות פייסבוק`);
          }
        });
      }
    });
  };

  // Function to send a test post request
  const sendTestPost = async (postData: TestPostOptions): Promise<TestPostResponse> => {
    if (!isExtension) {
      console.error('Cannot send test post: Not running as Chrome extension');
      return { success: false, message: 'התוסף אינו פעיל' };
    }

    setIsLoading(true);
    addLogEntry('בקשת פרסום', 'info', `מנסה לפרסם: "${postData.content.substring(0, 30)}..." במצב: ${postData.mode}${postData.targetGroupId ? ` לקבוצה: ${postData.targetGroupId}` : ''}`);

    try {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { 
            type: 'TEST_POST', 
            data: {
              ...postData,
              closeTabAfterPost: true // Always close the tab after posting
            } 
          },
          (response: TestPostResponse) => {
            setIsLoading(false);
            
            // Add log entry with result
            if (response && response.success) {
              addLogEntry('פרסום הצליח', 'success', response.message || 'הפרסום בוצע בהצלחה');
            } else {
              addLogEntry('פרסום נכשל', 'error', (response && response.message) || 'הפרסום נכשל ללא תגובה');
            }
            
            resolve(response || { success: false, message: 'אין תגובה מהתוסף' });
          }
        );
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLogEntry('שגיאת פרסום', 'error', errorMessage);
      setIsLoading(false);
      return { 
        success: false, 
        message: 'שגיאה בשליחת פרסום', 
        error: errorMessage 
      };
    }
  };

  // Add a log entry
  const addLogEntry = (action: string, status: 'success' | 'warning' | 'error' | 'info', details: string) => {
    const newEntry: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      action,
      status,
      details
    };
    
    setLogs(prevLogs => {
      const updatedLogs = [newEntry, ...prevLogs].slice(0, 100); // Keep only the latest 100 logs
      
      // Send to background script to persist
      if (isExtension) {
        chrome.runtime.sendMessage({ 
          type: 'SAVE_LOG', 
          data: { log: newEntry }
        });
      }
      
      return updatedLogs;
    });
  };

  // Check if currently connected to a Facebook group
  const checkFacebookConnection = () => {
    if (!isExtension) return;
    
    setIsLoading(true);
    addLogEntry('בדיקת חיבור', 'info', 'בודק סטטוס חיבור לפייסבוק');
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0 && tabs[0].id) {
        // Fixed the TypeScript error by properly specifying the object structure
        chrome.tabs.sendMessage(tabs[0].id, { type: 'CHECK_GROUP_STATUS' });
        
        const url = tabs[0].url || '';
        const inFacebookGroup = url && url.includes('facebook.com/groups/');
        
        setFacebookStatus({
          inFacebookGroup,
          url: url || ''
        });
        
        addLogEntry('חיבור נמצא', 'info', `נמצאה לשונית פייסבוק פעילה ב-${tabs[0].url}`);
      } else {
        // Get stored Facebook groups status when no active tab
        chrome.runtime.sendMessage({ type: 'GET_FACEBOOK_STATUS' }, (response) => {
          if (response && response.hasActiveGroups) {
            // We have stored groups we can work with
            setFacebookStatus({
              inFacebookGroup: true,
              url: 'stored-groups'
            });
            addLogEntry('קבוצות מאוחסנות', 'info', 'משתמש בקבוצות פייסבוק מאוחסנות');
          } else {
            setFacebookStatus({
              inFacebookGroup: false,
              url: ''
            });
            addLogEntry('אין חיבור', 'warning', 'לא נמצאה לשונית פייסבוק פעילה או קבוצות מאוחסנות');
          }
        });
      }
    });
    
    // Also refresh the groups list
    fetchUserGroups();
    setIsLoading(false);
  };

  // Clear logs
  const clearLogs = () => {
    setLogs([]);
    if (isExtension) {
      chrome.runtime.sendMessage({ type: 'CLEAR_LOGS' });
    }
    addLogEntry('יומן נוקה', 'info', 'כל הרשומות ביומן נמחקו');
  };

  return {
    isExtension,
    facebookStatus,
    facebookGroupsStatus,
    availableGroups,
    sendTestPost,
    checkFacebookConnection,
    fetchUserGroups,
    isLoading,
    logs,
    addLogEntry,
    clearLogs
  };
};
