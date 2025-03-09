
// Chrome Extension API type definitions
declare namespace chrome {
  export const runtime: Runtime;
  export const tabs: Tabs;
  export const storage: Storage;
  export const action: Action;
  export const scripting: Scripting;
  export const alarms: Alarms;

  export interface Runtime {
    id?: string;
    onMessage: {
      addListener: (callback: (message: any, sender: any, sendResponse: (response?: any) => void) => void) => void;
      removeListener: (callback: (message: any, sender: any, sendResponse: (response?: any) => void) => void) => void;
    };
    sendMessage: (message: any, callback?: (response: any) => void) => void;
  }

  export interface Tabs {
    query: (queryInfo: {
      active?: boolean;
      url?: string;
    }, callback: (tabs: Tab[]) => void) => void;
    sendMessage: (tabId: number, message: any, callback?: (response: any) => void) => void;
    create: (properties: {
      url?: string;
      active?: boolean;
    }) => Promise<Tab>;
  }

  export interface Tab {
    id?: number;
    url?: string;
    title?: string;
  }

  export interface Storage {
    local: {
      get: (keys: string | string[] | null, callback: (items: { [key: string]: any }) => void) => void;
      set: (items: { [key: string]: any }, callback?: () => void) => void;
      remove: (keys: string | string[], callback?: () => void) => void;
    };
    onChanged: {
      addListener: (callback: (changes: { [key: string]: any }, areaName: string) => void) => void;
      removeListener: (callback: (changes: { [key: string]: any }, areaName: string) => void) => void;
    };
  }

  export interface Action {
    onClicked: {
      addListener: (callback: (tab: Tab) => void) => void;
    };
  }

  export interface Scripting {
    executeScript: (injection: {
      target: { tabId: number };
      func: () => any;
    }) => Promise<any>;
  }

  export interface Alarms {
    create: (name: string, alarmInfo: { periodInMinutes?: number, delayInMinutes?: number }) => void;
    onAlarm: {
      addListener: (callback: (alarm: Alarm) => void) => void;
    };
    clearAll: (callback?: (wasCleared: boolean) => void) => void;
  }

  export interface Alarm {
    name: string;
  }
}
