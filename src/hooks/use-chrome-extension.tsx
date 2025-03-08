
import { useState, useEffect } from 'react';

// Define types for the extension responses
interface FacebookStatus {
  inFacebookGroup: boolean;
  url: string;
}

interface TestPostResponse {
  success: boolean;
  message?: string;
  result?: any;
  error?: string;
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
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    // Query active tabs to check Facebook status
    chrome.tabs.query({ active: true, url: "*://*.facebook.com/*" }, (tabs) => {
      if (tabs.length > 0) {
        const url = tabs[0].url || '';
        setFacebookStatus({
          inFacebookGroup: url.includes('/groups/'),
          url
        });
      }
    });

    return () => {
      // Clean up listener when component unmounts
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  // Function to send a test post request
  const sendTestPost = async (postData: any): Promise<TestPostResponse> => {
    if (!isExtension) {
      console.error('Cannot send test post: Not running as Chrome extension');
      return { success: false, message: 'Not running as Chrome extension' };
    }

    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { type: 'TEST_POST', data: postData },
        (response: TestPostResponse) => {
          resolve(response || { success: false, message: 'No response from extension' });
        }
      );
    });
  };

  return {
    isExtension,
    facebookStatus,
    sendTestPost
  };
};
