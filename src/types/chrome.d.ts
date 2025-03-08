
// Type definitions for Chrome extension API
interface Chrome {
  runtime: {
    id: string;
    onMessage: {
      addListener: (callback: (message: any, sender: any, sendResponse: any) => void) => void;
      removeListener: (callback: (message: any, sender: any, sendResponse: any) => void) => void;
    };
    sendMessage: (message: any, callback?: (response: any) => void) => void;
  };
  tabs: {
    query: (queryInfo: { active: boolean; url?: string }, callback: (tabs: Tab[]) => void) => void;
    sendMessage: (tabId: number, message: any, callback?: (response: any) => void) => void;
  };
}

interface Tab {
  id?: number;
  url?: string;
}

declare const chrome: Chrome;
