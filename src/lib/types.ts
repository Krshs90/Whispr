export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: { title: string; url: string; icon?: string }[];
  pill?: string;
  pillData?: any;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: string;
  pinned?: boolean;
}

export interface SystemHealthStatus {
  online: boolean;
  ollama: boolean;
}

export interface SlowWarningInfo {
  activeModel: string;
  fastModel: string;
  tps: string;
}

export interface ElectronAPI {
  onShowIsland: (callback: () => void) => () => void;
  onHideIsland: (callback: () => void) => () => void;
  onWindowBlur: (callback: () => void) => () => void;
  hideOverlay: () => void;
  shortcutReleased?: () => void;
  setIgnoreMouseEvents: (ignore: boolean, options?: { forward?: boolean }) => void;

  chatRequest: (data: {
    messages: { role: string; content: string }[];
    defaultModel?: string;
    model?: string;
    prefs?: Record<string, any>;
    apiKeys?: Record<string, any>;
    userData?: Record<string, any>;
  }) => void;
  onChatToken: (cb: (token: string) => void) => () => void;
  onChatTool: (cb: (tool: { toolName: string; args: any }) => void) => () => void;
  onChatToolResult: (cb: (result: { toolName: string; resultStr: string }) => void) => () => void;
  onChatEnd: (cb: () => void) => () => void;
  stopChat: () => void;
  onChatSlowWarning: (cb: (speedInfo: SlowWarningInfo) => void) => () => void;

  executeTool: (name: string, args: any, apiKeys?: Record<string, any>) => Promise<any>;
  getNowPlaying: () => Promise<any>;
  mediaControl: (action: string) => Promise<boolean>;

  openMainApp: () => void;
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;

  setAutoStart: (enabled: boolean) => void;
  updateShortcut: (shortcut: string) => void;
  updateApiKeys: (keys: Record<string, string>) => void;
  openExternal: (url: string) => void;
  resizeOverlay: (expanded: boolean) => void;

  onSystemHealth: (cb: (status: SystemHealthStatus) => void) => () => void;

  scanHardware: () => Promise<any>;
  getInstalledModels: () => Promise<any[]>;
  pullModel: (modelName: string) => void;
  onPullProgress: (cb: (data: { modelName: string; status: string; completed?: number; total?: number; percent?: number }) => void) => () => void;
  onPullError: (cb: (msg: { modelName: string; error: string }) => void) => () => void;
  getMonitors: () => Promise<any[]>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

