
import { useState, useEffect } from 'react';
import { FacebookStatus, FacebookGroup, FacebookGroupStatus, TestPostResponse, TestPostOptions, LogEntry } from '@/types/facebook';
import { toast } from '@/hooks/use-toast';

// Local storage key for cached groups
const STORED_GROUPS_KEY = 'facebook_groups_cache';
const GROUPS_CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Check if running in a Chrome extension environment
const isChromeExtension = () => {
  return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
};

// Hook for Chrome extension functionality
export const useChromeExtension = () => {
  const [isExtension, setIsExtension] = useState<boolean>(false);
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

    // Check for cached groups first
    const cachedGroups = loadCachedGroups();
    if (cachedGroups.length > 0) {
      setAvailableGroups(cachedGroups);
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
          processAndStoreGroups(typedGroups);
          
          if (typedGroups.length > 0) {
            toast({
              title: "קבוצות נטענו בהצלחה",
              description: `נמצאו ${typedGroups.length} קבוצות פייסבוק`,
            });
          }
        }
      } else if (message.type === 'FACEBOOK_GROUPS_DATA') {
        if (message.data && Array.isArray(message.data)) {
          // Process groups data from content script
          const processedGroups: FacebookGroup[] = message.data.map((group: any, index: number) => ({
            id: `group-${index}-${Date.now()}`,
            name: group.name || 'קבוצה ללא שם',
            url: group.href || '',
            status: 'active',
            lastChecked: new Date().toISOString()
          }));
          
          if (processedGroups.length > 0) {
            processAndStoreGroups(processedGroups);
            
            toast({
              title: "קבוצות נטענו בהצלחה",
              description: `נמצאו ${processedGroups.length} קבוצות פייסבוק`,
            });
          } else {
            setIsLoading(false);
            toast({
              title: "לא נמצאו קבוצות",
              description: "נסה לגלול בדף הקבוצות של פייסבוק ולנסות שוב",
              variant: "destructive",
            });
          }
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

  // Store groups in localStorage with timestamp
  const processAndStoreGroups = (groups: FacebookGroup[]) => {
    // Ensure that the groups are valid before processing
    const validGroups = groups.filter(group => 
      group && 
      group.name && 
      group.url && 
      group.url.includes('facebook.com')
    );
    
    if (validGroups.length === 0) {
      console.warn('No valid groups to process');
      return;
    }
    
    console.log(`Processing ${validGroups.length} valid groups`);
    
    // Merge with existing groups to avoid duplicates
    const existingGroups = loadCachedGroups();
    
    // Create a map of existing groups by URL for quick lookup
    const groupMap = new Map<string, FacebookGroup>();
    
    // Add existing groups to map
    existingGroups.forEach(group => {
      if (group && group.url) {
        groupMap.set(group.url, group);
      }
    });
    
    // Add or update with new groups
    validGroups.forEach(group => {
      // Only add if URL is valid
      if (group.url && group.url.includes('facebook.com')) {
        groupMap.set(group.url, {
          ...group,
          lastChecked: new Date().toISOString()
        });
      }
    });
    
    // Convert map back to array
    const mergedGroups = Array.from(groupMap.values());
    
    // Store groups with timestamp
    const storageData = {
      groups: mergedGroups,
      timestamp: Date.now()
    };
    
    try {
      localStorage.setItem(STORED_GROUPS_KEY, JSON.stringify(storageData));
      console.log(`Stored ${mergedGroups.length} groups in localStorage`);
      
      // Update state
      setAvailableGroups(mergedGroups);
      setIsLoading(false);
      
      addLogEntry(
        'קבוצות נשמרו במטמון', 
        'success', 
        `נשמרו ${mergedGroups.length} קבוצות פייסבוק במטמון המקומי`
      );
    } catch (error) {
      console.error('Error storing groups in localStorage:', error);
      addLogEntry('שגיאה בשמירת קבוצות', 'error', 'לא ניתן היה לשמור את הקבוצות במטמון המקומי');
    }
  };

  // Load groups from localStorage
  const loadCachedGroups = (): FacebookGroup[] => {
    try {
      const cachedData = localStorage.getItem(STORED_GROUPS_KEY);
      if (!cachedData) return [];
      
      const { groups, timestamp } = JSON.parse(cachedData);
      
      // Check if cache is expired
      if (Date.now() - timestamp > GROUPS_CACHE_EXPIRY) {
        console.log('Cached groups expired, clearing cache');
        localStorage.removeItem(STORED_GROUPS_KEY);
        return [];
      }
      
      console.log(`Loaded ${groups.length} groups from localStorage cache`);
      
      // Update state with cached groups
      if (groups && groups.length > 0) {
        setAvailableGroups(groups);
        
        addLogEntry(
          'נטענו קבוצות מהמטמון', 
          'info', 
          `נטענו ${groups.length} קבוצות פייסבוק מהמטמון המקומי`
        );
      }
      
      return groups || [];
    } catch (error) {
      console.error('Error loading groups from localStorage:', error);
      addLogEntry('שגיאה בטעינת קבוצות', 'error', 'לא ניתן היה לטעון את הקבוצות מהמטמון המקומי');
      return [];
    }
  };

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
        
        processAndStoreGroups(typedGroups);
        
        if (typedGroups.length > 0) {
          toast({
            title: "קבוצות נטענו בהצלחה",
            description: `נמצאו ${typedGroups.length} קבוצות פייסבוק`,
          });
        } else {
          // Try to get groups from Facebook directly
          injectFacebookGroupsScript();
        }
      } else {
        addLogEntry('נכשל בטעינת קבוצות', 'error', response?.error || 'נכשל בטעינת קבוצות פייסבוק');
        
        // Try to get groups from Facebook directly
        injectFacebookGroupsScript();
      }
    });
  };

  // Function to inject script to extract Facebook groups
  const injectFacebookGroupsScript = () => {
    if (!chrome || !chrome.tabs) {
      console.error('Chrome tabs API not available');
      addLogEntry('שגיאת API', 'error', 'Chrome tabs API אינו זמין');
      return;
    }
    
    // Use the specific URL requested by the user
    const facebookGroupsUrl = "https://www.facebook.com/groups/joins/?nav_source=tab&ordering=viewer_added";
    
    // First check if there's already a Facebook tab open
    chrome.tabs.query({ url: "*://*.facebook.com/*" }, (tabs) => {
      if (tabs.length > 0) {
        // We have Facebook tabs open - try to inject script to get groups
        let activeTabId: number | undefined;
        
        // First try to find a tab that's already on the groups page
        const groupsTab = tabs.find(tab => tab.url?.includes('/groups/joins/'));
        
        if (groupsTab && groupsTab.id) {
          activeTabId = groupsTab.id;
          
          // Activate this tab to ensure it's in view
          chrome.tabs.update(activeTabId, { active: true }, () => {
            injectScriptToTab(activeTabId);
          });
        } else {
          // If not found, use the first Facebook tab and navigate it to the groups page
          activeTabId = tabs[0].id;
          
          if (activeTabId) {
            chrome.tabs.update(activeTabId, { 
              active: true,
              url: facebookGroupsUrl
            }, () => {
              // Wait for navigation to complete
              setTimeout(() => {
                injectScriptToTab(activeTabId);
              }, 3000);
            });
          }
        }
      } else {
        // No Facebook tabs open - open one to the specific URL
        createNewFacebookTab();
      }
    });
    
    // Function to create a new Facebook tab
    function createNewFacebookTab() {
      try {
        toast({
          title: "פותח דף פייסבוק",
          description: "פותח דף קבוצות פייסבוק לחילוץ נתונים",
        });
        
        chrome.tabs.create({ url: facebookGroupsUrl, active: false }, (tab) => {
          if (!tab || !tab.id) {
            addLogEntry('נכשל בפתיחת דף פייסבוק', 'error', 'לא ניתן היה לפתוח לשונית פייסבוק חדשה');
            setIsLoading(false);
            return;
          }
          
          addLogEntry('נפתח דף קבוצות פייסבוק', 'info', 'נפתח דף קבוצות פייסבוק לחילוץ נתונים');
          
          // Wait for the page to load then inject script
          setTimeout(() => {
            injectScriptToTab(tab.id);
          }, 3000);
        });
      } catch (error) {
        console.error('Error creating tab:', error);
        addLogEntry('שגיאת פתיחת לשונית', 'error', 'לא ניתן היה לפתוח לשונית פייסבוק חדשה');
        setIsLoading(false);
      }
    }
    
    // Function to inject script to a specific tab
    function injectScriptToTab(tabId: number | undefined) {
      if (!tabId) {
        console.error('No valid tab ID provided');
        setIsLoading(false);
        return;
      }
      
      try {
        toast({
          title: "מחלץ קבוצות",
          description: "מחלץ קבוצות מדף פייסבוק",
        });

        chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: extractAndSendGroups
        });
        
        addLogEntry('מחלץ קבוצות', 'info', `מחלץ קבוצות מדף פייסבוק`);
      } catch (error) {
        console.error('Error executing script:', error);
        addLogEntry('שגיאת הרצת סקריפט', 'error', 'נכשל בהרצת סקריפט איסוף קבוצות');
        setIsLoading(false);
      }
    }
  };

  // This function runs in the context of the Facebook tab
  function extractAndSendGroups() {
    console.log('Starting Facebook group extraction...');
    
    // Find elements matching groups
    const groupElements = Array.from(document.querySelectorAll([
      // Group items in the joined groups page
      'a[href*="/groups/"][role="link"]',
      'div[role="article"] a[href*="/groups/"]',
      // Group name headers
      'h2 a[href*="/groups/"]',
      // Any other link to a group
      'a[href*="/groups/"][aria-label]',
      'a[href*="/groups/"]:not([href*="feed"])',
      // Specific to the groups/joins page
      'div[data-visualcompletion="ignore-dynamic"] a[href*="/groups/"]',
      // Additional selectors
      'a[href^="https://www.facebook.com/groups/"]',
      'a[href^="/groups/"]',
      // More aggressive selectors
      '[role="main"] a[href*="/groups/"]',
      '[role="feed"] a[href*="/groups/"]'
    ].join(', ')));
    
    // Filter and process groups
    const groups = groupElements
      .map(link => {
        const href = link.getAttribute('href');
        if (!href) return null;
        
        // Only get real group links (exclude group feeds, etc)
        if (href.match(/facebook\.com\/groups\/[0-9a-zA-Z\.\-]+\/?$/) || 
            href.match(/\/groups\/[0-9a-zA-Z\.\-]+\/?$/) ||
            // Additional patterns to match more groups
            href.match(/facebook\.com\/groups\/[0-9a-zA-Z\.\-]+/) ||
            href.match(/\/groups\/[0-9a-zA-Z\.\-]+/)) {
          
          // Get group name from nearby elements
          let name = '';
          
          // Try to get from aria-label
          const ariaLabel = link.getAttribute('aria-label');
          if (ariaLabel) {
            name = ariaLabel;
          } else {
            // Try to find text within the link
            const spanElements = link.querySelectorAll('span');
            for (const span of spanElements) {
              const text = span.textContent?.trim();
              if (text && text.length > 2) {
                name = text;
                break;
              }
            }
            
            // If still no name, try parent elements
            if (!name) {
              // Look for headings or strong text in parent elements
              let parent = link.parentElement;
              for (let i = 0; i < 3 && parent && !name; i++) {
                const heading = parent.querySelector('h1, h2, h3, h4, strong');
                if (heading && heading.textContent) {
                  name = heading.textContent.trim();
                }
                parent = parent.parentElement;
              }
            }
          }
          
          // Fallback to link text if no name found
          if (!name) {
            name = link.textContent?.trim() || 'קבוצה ללא שם';
          }
          
          const fullHref = href.startsWith('http') 
            ? href 
            : `https://www.facebook.com${href.startsWith('/') ? '' : '/'}${href}`;
            
          return { 
            name, 
            href: fullHref,
            // Add additional metadata that might be useful
            extracted: true,
            timestamp: new Date().toISOString()
          };
        }
        return null;
      })
      .filter(Boolean);
    
    // Remove duplicates based on href
    const uniqueGroups = groups.reduce((acc: any[], group: any) => {
      if (!acc.some(g => g.href === group.href)) {
        acc.push(group);
      }
      return acc;
    }, []);
    
    console.log(`Found ${uniqueGroups.length} Facebook groups`);
    
    // Send to background script
    chrome.runtime.sendMessage({
      type: 'FACEBOOK_GROUPS_DATA',
      data: uniqueGroups
    });
    
    // Set up observer to catch dynamically loaded content
    const observer = new MutationObserver(() => {
      const newGroups = extractGroups();
      if (newGroups.length > 0) {
        chrome.runtime.sendMessage({
          type: 'FACEBOOK_GROUPS_DATA',
          data: newGroups
        });
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Auto-scroll to load more content
    let scrollCount = 0;
    const maxScrolls = 10;
    
    const scrollInterval = setInterval(() => {
      window.scrollTo(0, document.body.scrollHeight);
      scrollCount++;
      console.log(`Auto-scroll ${scrollCount}/${maxScrolls}`);
      
      // Extract groups after each scroll
      setTimeout(() => {
        const newGroups = extractGroups();
        if (newGroups.length > 0) {
          console.log(`Found ${newGroups.length} more groups after scroll ${scrollCount}`);
          chrome.runtime.sendMessage({
            type: 'FACEBOOK_GROUPS_DATA',
            data: newGroups
          });
        }
      }, 1000);
      
      if (scrollCount >= maxScrolls) {
        clearInterval(scrollInterval);
        console.log('Finished auto-scrolling');
        
        // One final extraction
        setTimeout(() => {
          const finalGroups = extractGroups();
          if (finalGroups.length > 0) {
            chrome.runtime.sendMessage({
              type: 'FACEBOOK_GROUPS_DATA',
              data: finalGroups
            });
          }
          observer.disconnect();
        }, 2000);
      }
    }, 2000);
    
    // Helper function to extract groups
    function extractGroups() {
      // Add more aggressive selectors
      const allLinks = Array.from(document.querySelectorAll('a[href*="/groups/"]'));
      
      const newGroups = allLinks
        .map(link => {
          const href = link.getAttribute('href');
          if (!href) return null;
          
          // Filter for valid group URLs
          if (href.includes('/groups/') && 
              !href.includes('/feed') && 
              !href.includes('/multiadmin') && 
              !href.includes('/about') && 
              !href.includes('/members')) {
            
            let name = '';
            
            // Try different strategies to find the name
            const ariaLabel = link.getAttribute('aria-label');
            if (ariaLabel) {
              name = ariaLabel;
            } else if (link.textContent) {
              name = link.textContent.trim();
            } else {
              // Look in parent elements
              let parent = link.parentElement;
              for (let i = 0; i < 3 && parent && !name; i++) {
                if (parent.textContent) {
                  name = parent.textContent.trim();
                }
                parent = parent.parentElement;
              }
            }
            
            if (!name || name.length < 2) {
              name = 'קבוצה ללא שם';
            }
            
            const fullHref = href.startsWith('http') 
              ? href 
              : `https://www.facebook.com${href.startsWith('/') ? '' : '/'}${href}`;
              
            return { 
              name, 
              href: fullHref,
              extracted: true,
              timestamp: new Date().toISOString()
            };
          }
          return null;
        })
        .filter(Boolean);
      
      // Remove duplicates
      const knownUrls = new Set<string>();
      const uniqueNewGroups = newGroups.filter((group: any) => {
        if (knownUrls.has(group.href)) {
          return false;
        }
        knownUrls.add(group.href);
        return true;
      });
      
      return uniqueNewGroups;
    }
    
    return uniqueGroups.length;
  }

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
    
    chrome.tabs.query({ active: true }, (tabs) => {
      if (tabs.length > 0 && tabs[0].id) {
        // Send message to content script
        chrome.tabs.sendMessage(tabs[0].id, { type: 'CHECK_GROUP_STATUS' });
        
        const url = tabs[0].url || '';
        const inFacebookGroup = url && url.includes('facebook.com/groups/');
        
        setFacebookStatus({
          inFacebookGroup,
          url: url || ''
        });
        
        addLogEntry('חיבור נמצא', 'info', `נמצאה לשונית פייסבוק פעילה ב-${url || 'כתובת לא ידועה'}`);
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
            addLogEntry('אין חיבור', 'info', 'לא נמצאה לשונית פייסבוק פעילה או קבוצות מאוחסנות');
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
