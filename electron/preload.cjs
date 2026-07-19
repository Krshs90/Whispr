const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Overlay IPC
  onShowIsland: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('show-island', handler);
    return () => ipcRenderer.removeListener('show-island', handler);
  },
  onHideIsland: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('hide-island', handler);
    return () => ipcRenderer.removeListener('hide-island', handler);
  },
  onWindowBlur: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('window-blur', handler);
    return () => ipcRenderer.removeListener('window-blur', handler);
  },
  hideOverlay: () => ipcRenderer.send('hide-overlay'),
  setIgnoreMouseEvents: (ignore, options) => ipcRenderer.send('set-ignore-mouse-events', ignore, options),

  // AI API
  chatRequest: (data) => ipcRenderer.send('chat-request', data),
  onChatToken: (cb) => {
    const handler = (e, t) => cb(t);
    ipcRenderer.on('chat-token', handler);
    return () => ipcRenderer.removeListener('chat-token', handler);
  },
  onChatTool: (cb) => {
    const handler = (e, tool) => cb(tool);
    ipcRenderer.on('chat-tool', handler);
    return () => ipcRenderer.removeListener('chat-tool', handler);
  },
  onChatToolResult: (cb) => {
    const handler = (e, result) => cb(result);
    ipcRenderer.on('chat-tool-result', handler);
    return () => ipcRenderer.removeListener('chat-tool-result', handler);
  },
  onChatEnd: (cb) => {
    const handler = () => cb();
    ipcRenderer.on('chat-end', handler);
    return () => ipcRenderer.removeListener('chat-end', handler);
  },
  stopChat: () => ipcRenderer.send('chat-stop'),
  onChatSlowWarning: (cb) => {
    const handler = (e, speedInfo) => cb(speedInfo);
    ipcRenderer.on('chat-slow-warning', handler);
    return () => ipcRenderer.removeListener('chat-slow-warning', handler);
  },

  // Silent Tool Execution
  executeTool: (name, args, apiKeys) => ipcRenderer.invoke('execute-tool', name, args, apiKeys),
  getNowPlaying: () => ipcRenderer.invoke('get-now-playing'),
  mediaControl: (action) => ipcRenderer.invoke('media-control', action),

  // Main app IPC
  openMainApp: () => ipcRenderer.send('open-main-app'),

  // Window controls for frameless main window
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  
  // Settings & OS bindings
  setAutoStart: (enabled) => ipcRenderer.send('set-auto-start', enabled),
  updateShortcut: (shortcut) => ipcRenderer.send('update-shortcut', shortcut),
  updateApiKeys: (keys) => ipcRenderer.send('update-api-keys', keys),

  // Orchestrator and logic hooks
  openExternal: (url) => ipcRenderer.send('open-external', url),

  // Resize overlay (expand/collapse)
  resizeOverlay: (expanded) => ipcRenderer.send('resize-overlay', expanded),

  // Diagnostics API
  onSystemHealth: (cb) => {
    const handler = (e, status) => cb(status);
    ipcRenderer.on('system-health', handler);
    return () => ipcRenderer.removeListener('system-health', handler);
  },

  // Native hardware APIs
  scanHardware: () => ipcRenderer.invoke('scan-hardware'),
  getInstalledModels: () => ipcRenderer.invoke('get-installed-models'),
  pullModel: (modelName) => ipcRenderer.send('pull-model', modelName),
  onPullProgress: (cb) => {
    const handler = (e, data) => cb(data);
    ipcRenderer.on('pull-model-progress', handler);
    return () => ipcRenderer.removeListener('pull-model-progress', handler);
  },
  onPullError: (cb) => {
    const handler = (e, msg) => cb(msg);
    ipcRenderer.on('pull-model-error', handler);
    return () => ipcRenderer.removeListener('pull-model-error', handler);
  },
  updateShortcut: (shortcut) => ipcRenderer.send('update-shortcut', shortcut),
  getMonitors: () => ipcRenderer.invoke('get-monitors')
});
