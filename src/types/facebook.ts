
export interface FacebookStatus {
  inFacebookGroup: boolean;
  url: string;
}

export interface FacebookGroup {
  id: string;
  name: string;
  url: string;
  status: 'active' | 'inactive';
  lastChecked: string;
}

export interface FacebookGroupStatus {
  [groupId: string]: FacebookGroup;
}

export interface TestPostResponse {
  success: boolean;
  message?: string;
  result?: any;
  error?: string;
}

export interface TestPostOptions {
  content: string;
  mode: string;
  closeTabAfterPost?: boolean;
  targetGroupId?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  action: string;
  status: 'success' | 'warning' | 'error' | 'info';
  details: string;
}
