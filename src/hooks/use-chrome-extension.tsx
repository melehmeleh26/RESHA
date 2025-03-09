import { useState, useEffect } from 'react';
import { FacebookStatus, FacebookGroup, FacebookGroupStatus, TestPostResponse, TestPostOptions, LogEntry } from '@/types/facebook';
import { toast } from '@/hooks/use-toast';

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
          setIsLoading(false);
          addLogEntry('קבוצות התקבלו', 'info', `נמצאו ${typedGroups.length} קבוצות פייסבוק`);
          
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
            setAvailableGroups(processedGroups);
            setIsLoading(false);
            addLogEntry('קבוצות התקבלו', 'success', `נמצאו ${processedGroups.length} קבוצות פייסבוק`);
            
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
        setIsLoading(false);
        addLogEntry('קבוצות התקבלו', 'success', `התקבלו ${typedGroups.length} קבוצות פייסבוק`);
        
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
    
    chrome.tabs.query({ active: true, url: "*://*.facebook.com/*" }, (tabs) => {
      if (tabs.length > 0) {
        // We have Facebook tabs open - try to inject script to get groups
        tabs.forEach(tab => {
          if (tab.id) {
            try {
              toast({
                title: "מנסה למשוך קבוצות",
                description: "מנסה לחלץ קבוצות מדף פייסבוק הפתוח",
              });

              chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                  function extractAndSendGroups() {
                    console.log('Starting Facebook group extraction...');
                    
                    // Find elements matching groups
                    const groupElements = Array.from(document.querySelectorAll('a[href*="/groups/"]'));
                    
                    // Filter and process groups
                    const groups = groupElements
                      .map(link => {
                        const href = link.getAttribute('href');
                        if (!href) return null;
                        
                        // Only get real group links (exclude group feeds, etc)
                        if (href.match(/facebook\.com\/groups\/[0-9a-zA-Z\.\-]+\/?$/) || 
                            href.match(/\/groups\/[0-9a-zA-Z\.\-]+\/?$/)) {
                          
                          // Get group name from nearby elements
                          let name = '';
                          
                          // Try to find text within the link
                          const spanElements = link.querySelectorAll('span');
                          for (const span of spanElements) {
                            const text = span.textContent?.trim();
                            if (text && text.length > 2) {
                              name = text;
                              break;
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
                  }
                  
                  // Try extraction immediately
                  extractAndSendGroups();
                  
                  // Set up observer to catch dynamically loaded content
                  const observer = new MutationObserver(() => {
                    setTimeout(extractAndSendGroups, 500);
                  });
                  
                  observer.observe(document.body, {
                    childList: true,
                    subtree: true
                  });
                  
                  // Set up a periodic check to keep extracting groups
                  // as the user scrolls and more content loads
                  setInterval(extractAndSendGroups, 2000);
                  
                  return true;
                }
              });
              
              addLogEntry('מנסה זיהוי קבוצות מדף פייסבוק', 'info', `מנסה לחלץ קבוצות מדף פייסבוק פתוח`);
            } catch (error) {
              console.error('Error executing script:', error);
              addLogEntry('שגיאת הרצת סקריפט', 'error', 'נכשל בהרצת סקריפט איסוף קבוצות');
              setIsLoading(false);
            }
          }
        });
      } else {
        // No Facebook tabs open - open one and try to get groups
        try {
          toast({
            title: "פותח דף פייסבוק",
            description: "פותח דף קבוצות פייסבוק לחילוץ נתונים",
          });
          
          chrome.tabs.create({ url: "https://www.facebook.com/groups/feed/", active: false }, (tab) => {
            if (!tab || !tab.id) {
              addLogEntry('נכשל בפתיחת דף פייסבוק', 'error', 'לא ניתן היה לפתוח לשונית פייסבוק חדשה');
              setIsLoading(false);
              return;
            }
            
            addLogEntry('נפתח דף קבוצות פייסבוק', 'info', 'נפתח דף קבוצות פייסבוק לחילוץ נתונים');
            
            // Wait for the page to load then inject script
            setTimeout(() => {
              if (tab.id) {
                try {
                  chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: () => {
                      function extractFacebookGroups() {
                        // Find all group elements - focus on elements more specific to group items
                        const groupElements = Array.from(document.querySelectorAll([
                          // Different Facebook selectors to try to find groups
                          'a[href*="/groups/"][role="link"]',
                          'a[href*="/groups/"][aria-label]',
                          'a[href*="/groups/"]',
                          // Try to get groups from the sidebar
                          '[role="navigation"] a[href*="/groups/"]',
                          // Try to get groups from feeds
                          '[role="feed"] a[href*="/groups/"]',
                          // Try to find by content
                          'a[href*="/groups/"]:not([href*="feed"])'
                        ].join(', ')));
                        
                        console.log(`Found ${groupElements.length} potential group elements`);
                        
                        // Extract information from these elements
                        const groups = groupElements
                          .map(link => {
                            const href = link.getAttribute('href');
                            if (!href) return null;
                            
                            // Check if it's a valid group URL
                            if (href.match(/\/groups\/[0-9a-zA-Z\.\-]+\/?$/) || 
                                href.match(/facebook\.com\/groups\/[0-9a-zA-Z\.\-]+\/?$/)) {
                              
                              // Try to extract the name
                              let name = '';
                              
                              // Check for aria-label
                              const ariaLabel = link.getAttribute('aria-label');
                              if (ariaLabel) name = ariaLabel;
                              
                              // Try to find text within spans
                              if (!name) {
                                const spans = link.querySelectorAll('span');
                                for (const span of spans) {
                                  const text = span.textContent?.trim();
                                  if (text && text.length > 2) {
                                    name = text;
                                    break;
                                  }
                                }
                              }
                              
                              // Fallback to link text
                              if (!name) {
                                name = link.textContent?.trim() || 'קבוצה ללא שם';
                              }
                              
                              // Build full URL
                              const fullHref = href.startsWith('http') 
                                ? href 
                                : `https://www.facebook.com${href.startsWith('/') ? '' : '/'}${href}`;
                              
                              return { 
                                name, 
                                href: fullHref,
                                // Add metadata
                                extracted: true,
                                source: 'facebook-groups-page',
                                timestamp: new Date().toISOString()
                              };
                            }
                            return null;
                          })
                          .filter(Boolean);
                        
                        // Remove duplicates
                        const uniqueGroups = groups.reduce((acc: any[], group: any) => {
                          if (!acc.some(g => g.href === group.href)) {
                            acc.push(group);
                          }
                          return acc;
                        }, []);
                        
                        console.log(`Extracted ${uniqueGroups.length} unique Facebook groups`);
                        
                        // Send to extension
                        chrome.runtime.sendMessage({
                          type: 'FACEBOOK_GROUPS_DATA',
                          data: uniqueGroups
                        });
                        
                        // Scroll to load more content
                        window.scrollTo(0, window.scrollY + 500);
                      }
                      
                      // Run extraction after delay to let page load
                      setTimeout(extractFacebookGroups, 2000);
                      
                      // Set up interval to extract periodically
                      const extractInterval = setInterval(extractFacebookGroups, 3000);
                      
                      // Set up mutation observer for dynamic content
                      const observer = new MutationObserver(() => {
                        extractFacebookGroups();
                      });
                      
                      observer.observe(document.body, {
                        childList: true,
                        subtree: true
                      });
                      
                      // Auto-scroll to load more content
                      const scrollInterval = setInterval(() => {
                        window.scrollTo(0, window.scrollY + 300);
                        // Stop after some time to avoid infinite scrolling
                      }, 2000);
                      
                      // Clean up after 30 seconds
                      setTimeout(() => {
                        clearInterval(extractInterval);
                        clearInterval(scrollInterval);
                        observer.disconnect();
                      }, 30000);
                      
                      return true;
                    }
                  });
                } catch (error) {
                  console.error('Error executing script:', error);
                  addLogEntry('שגיאת הרצת סקריפט', 'error', 'נכשל בהרצת סקריפט איסוף קבוצות');
                  setIsLoading(false);
                }
              }
            }, 3000);
          });
        } catch (error) {
          console.error('Error creating tab:', error);
          addLogEntry('שגיאת פתיחת לשונית', 'error', 'לא ניתן היה לפתוח לשונית פייסבוק חדשה');
          setIsLoading(false);
        }
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
