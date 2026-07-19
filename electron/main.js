import { app, BrowserWindow, globalShortcut, ipcMain, screen, shell, desktopCapturer } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import fs from 'fs';
import { ensureOllamaRunning, getAvailableModels } from './ai/ollamaManager.js';
import { processChatStream, abortChatStream } from './ai/llm.js';
import { startHealthMonitor } from './ai/health.js';
import { detectNowPlaying } from './ai/mediaDetector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Prevent GPU process crashes on Windows by disabling hardware acceleration
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('no-sandbox');
app.disableHardwareAcceleration();

// ═══ PRODUCTION SAFETY: Global error handlers ═══
// Prevent the entire Electron process from crashing on unhandled errors
process.on('uncaughtException', (err) => {
  console.error('[Whispr Fatal] Uncaught exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Whispr Fatal] Unhandled promise rejection:', reason);
});

let overlayWindow = null;
let mainWindow = null;

function getConfig() {
  const configPath = path.join(app.getPath('userData'), 'config.json');
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (e) {}
  return { shortcut: 'CommandOrControl+I' };
}

function saveConfig(config) {
  const configPath = path.join(app.getPath('userData'), 'config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

const isDev = !app.isPackaged;

function createOverlayWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  const winWidth = 720;
  // Give the canvas plenty of invisible vertical room to animate without hitting OS bounds
  const winHeight = Math.min(650, screenHeight - 20);

  overlayWindow = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    x: Math.round(screenWidth / 2 - winWidth / 2),
    y: screenHeight - winHeight,
    transparent: true,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    thickFrame: false,
    show: false,
    focusable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Security: Content Security Policy
  overlayWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          isDev
            ? "default-src 'self' http://localhost:5173; script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:5173; style-src 'self' 'unsafe-inline' http://localhost:5173; img-src 'self' data: https: http:; connect-src 'self' ws://localhost:5173 http://localhost:5173 http://127.0.0.1:11434 https:; font-src 'self' data: https:;"
            : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: http:; connect-src 'self' http://127.0.0.1:11434 https:; font-src 'self' data: https:;"
        ]
      }
    });
  });

  if (isDev) {
    overlayWindow.loadURL('http://localhost:5173');
  } else {
    overlayWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Make the window click-through by default, but allow hover detection
  overlayWindow.setIgnoreMouseEvents(true, { forward: true });

  overlayWindow.on('blur', () => {
    if (overlayWindow && overlayWindow.isVisible()) {
      overlayWindow.webContents.send('window-blur');
    }
  });
}

function createMainWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    mainWindow.focus();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 800,
    minHeight: 500,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#1A1A1A',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
      devTools: isDev
    },
  });

  // Security: Content Security Policy
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          isDev
            ? "default-src 'self' http://localhost:5173; script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:5173; style-src 'self' 'unsafe-inline' http://localhost:5173; img-src 'self' data: https: http:; connect-src 'self' ws://localhost:5173 http://localhost:5173 http://127.0.0.1:11434 https:; font-src 'self' data: https:;"
            : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: http:; connect-src 'self' http://127.0.0.1:11434 https:; font-src 'self' data: https:;"
        ]
      }
    });
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173?mode=main');
  } else {
    // For production, we'd load the built HTML with query param
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'), { query: { mode: 'main' } });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // ═══ PRODUCTION SAFETY: Renderer crash recovery ═══
  // Limit retries to prevent an infinite crash-reload loop
  let crashReloadCount = 0;
  const MAX_CRASH_RELOADS = 3;
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('[Whispr Fatal] Main window renderer crashed:', details.reason);
    if (crashReloadCount >= MAX_CRASH_RELOADS) {
      console.error(`[Whispr Fatal] Renderer crashed ${MAX_CRASH_RELOADS} times. Giving up auto-reload.`);
      return;
    }
    crashReloadCount++;
    if (mainWindow && !mainWindow.isDestroyed()) {
      // Reload the window after a short delay
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.reload();
        }
      }, 1000);
    }
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error(`[Whispr] Main window failed to load: ${errorCode} ${errorDescription}`);
  });

  // Security: Stop all native navigations and new windows
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!isDev) {
      event.preventDefault();
      if (url.startsWith('http://') || url.startsWith('https://')) shell.openExternal(url);
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) shell.openExternal(url);
    return { action: 'deny' };
  });
}

function toggleOverlay() {
  if (!overlayWindow) return;

  if (overlayWindow.isVisible()) {
    overlayWindow.webContents.send('hide-island');
    // Give the full closing animation time to play (pill->orb->slide down)
    setTimeout(() => {
      if (overlayWindow) overlayWindow.hide();
    }, 900);
  } else {
    // Reposition to bottom center before showing
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
    const winWidth = 720;
    const winHeight = Math.min(650, screenHeight - 20);
    overlayWindow.setPosition(
      Math.round(screenWidth / 2 - winWidth / 2),
      Math.max(primaryDisplay.workArea.y, screenHeight - winHeight)
    );
    overlayWindow.show();
    overlayWindow.focus();
    overlayWindow.webContents.send('show-island');
  }
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    // Ensures Ollama is running in background if possible
    await ensureOllamaRunning();
    
    createOverlayWindow();
    createMainWindow(); // We create it but don't show it immediately!
    
    // Start Background Diagnostics Engine
    startHealthMonitor(mainWindow, overlayWindow);

    // Register Global Shortcut
    const config = getConfig();
    const formattedInitialShortcut = config.shortcut.replace('Win', 'Super').replace('Ctrl', 'CommandOrControl').replace(/\s+/g, '');
    const registered = globalShortcut.register(formattedInitialShortcut, () => {
      toggleOverlay();
    });

    if (!registered) {
      console.error(`Failed to register global shortcut ${formattedInitialShortcut}`);
    }

    // IPC: renderer requests to hide the overlay
    ipcMain.on('hide-overlay', () => {
      if (overlayWindow && overlayWindow.isVisible()) {
        overlayWindow.hide();
      }
    });

    // IPC: dynamic hitboxes
    ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (win) win.setIgnoreMouseEvents(ignore, options);
    });

    // IPC: update API keys for background systems (e.g. Health Monitor)
    ipcMain.on('update-api-keys', async (event, keys) => {
      const { setHealthApiKeys } = await import('./ai/health.js');
      setHealthApiKeys(keys);
    });

    // IPC: update global shortcut
    ipcMain.on('update-shortcut', (event, newShortcut) => {
      globalShortcut.unregisterAll();
      const config = getConfig();
      config.shortcut = newShortcut;
      saveConfig(config);
      
      const formattedShortcut = newShortcut.replace('Win', 'Super').replace('Ctrl', 'CommandOrControl').replace(/\s+/g, '');
      const registered = globalShortcut.register(formattedShortcut, () => {
        toggleOverlay();
      });
      if (!registered) {
        console.error(`Failed to register new shortcut: ${newShortcut}`);
      }
    });

    // IPC: Chat Execution logic
    // CRITICAL: Broadcast to ALL windows so Dynamic Bar + Main App stay perfectly synced
    const broadcastToAll = (channel, data) => {
      const windows = [overlayWindow, mainWindow];
      for (const win of windows) {
        if (win && !win.isDestroyed()) {
          try {
            if (!win.webContents.isCrashed()) {
              win.webContents.send(channel, data);
            }
          } catch (e) { /* window may be mid-navigation or frame disposed */ }
        }
      }
    };

    let activeRequestId = 0;

    ipcMain.on('chat-request', async (event, { messages, defaultModel, apiKeys, userData }) => {
      const currentRequestId = ++activeRequestId;
      
      const onToken = (t) => {
        if (currentRequestId !== activeRequestId) return;
        broadcastToAll('chat-token', t);
      };
      
      const onTool = (toolName, args) => {
        if (currentRequestId !== activeRequestId) return;
        broadcastToAll('chat-tool', { toolName, args });
      };
      
      const onToolResult = (toolName, resultStr) => {
        if (currentRequestId !== activeRequestId) return;
        broadcastToAll('chat-tool-result', { toolName, resultStr });
      };

      const onSlowWarning = (warning) => {
        if (currentRequestId !== activeRequestId) return;
        broadcastToAll('chat-slow-warning', warning);
      };

      try {
        const { processChatStream } = await import('./ai/llm.js');
        await processChatStream(messages, defaultModel, onToken, onTool, onToolResult, apiKeys || {}, onSlowWarning, userData);
        if (currentRequestId === activeRequestId) {
          broadcastToAll('chat-end', null);
        }
      } catch (err) {
        console.error('[IPC Main] Chat stream failed', err);
      }
    });

    ipcMain.on('chat-stop', () => {
      abortChatStream();
    });

    // IPC: renderer requests to open the main app window
    ipcMain.on('open-main-app', () => {
      createMainWindow();
      // Also dismiss the overlay
      if (overlayWindow && overlayWindow.isVisible()) {
        overlayWindow.hide();
      }
    });

    // IPC: close/minimize/maximize for frameless main window
    ipcMain.on('window-minimize', () => {
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.minimize();
    });
    ipcMain.on('window-maximize', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        if (mainWindow.isMaximized()) {
          mainWindow.unmaximize();
        } else {
          mainWindow.maximize();
        }
      }
    });
    ipcMain.on('window-close', () => {
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.close();
    });

    ipcMain.on('set-auto-start', (event, autoStart) => {
      app.setLoginItemSettings({
        openAtLogin: autoStart,
        path: app.getPath('exe'),
        args: ['--hidden']
      });
    });

    // Whispr Vision
    ipcMain.handle('get-monitors', async () => {
      try {
        const sources = await desktopCapturer.getSources({ types: ['screen'] });
        return sources.map(s => ({ id: s.id, name: s.name }));
      } catch (e) {
        console.error('Failed to get monitors:', e);
        return [];
      }
    });

    ipcMain.on('open-external', (event, url) => {
      // Security: Only allow http/https to prevent command injection or file:// access
      if (url.startsWith('http://') || url.startsWith('https://')) {
        shell.openExternal(url);
      } else {
        console.warn(`Blocked attempt to open malicious/unsupported URI protocol: ${url}`);
      }
    });

    // IPC: Resize overlay window (expand/collapse)
    ipcMain.on('resize-overlay', (event, expanded) => {
      // Intentionally bypassed. 
      // The transparent desktop window now stays fixed at a large size (720x650)
      // while Framer Motion handles the interior resize. This completely
      // eliminates Windows DWM flickering "glitches" whenever the DOM changes bounds!
    });

    // IPC: Now Playing media detection
    ipcMain.handle('get-now-playing', async () => {
      return await detectNowPlaying();
    });

    // IPC: Hardware Scanner
    ipcMain.handle('scan-hardware', async () => {
      const ramGB = os.totalmem() / (1024 ** 3);
      let diskGB = 0;
      try {
        const stat = fs.statfsSync(os.homedir());
        diskGB = (stat.bfree * stat.bsize) / (1024 ** 3);
      } catch (e) {
        console.warn('Could not read statfs', e);
      }
      return {
        ramGB,
        cores: os.cpus().length,
        diskFreeGB: diskGB
      };
    });

    // IPC: Get Installed Models
    ipcMain.handle('get-installed-models', async () => {
      try {
        return await getAvailableModels();
      } catch (e) {
        return [];
      }
    });



    // IPC: Pull Ollama Model Strategy
    ipcMain.on('pull-model', async (event, modelName) => {
      try {
        const res = await fetch(`http://127.0.0.1:11434/api/pull`, {
          method: 'POST',
          body: JSON.stringify({ name: modelName, stream: true }),
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!res.ok) throw new Error('Failed to reach local Ollama');
        
        for await (const chunk of res.body) {
          const lines = Buffer.from(chunk).toString('utf-8').split('\n').filter(Boolean);
          for (const line of lines) {
            try {
              const json = JSON.parse(line);
              event.sender.send('pull-model-progress', json);
            } catch(e) {}
          }
        }
      } catch(e) {
        event.sender.send('pull-model-error', e.message);
      }
    });

    // Global security handler for ALL created web contents
    app.on('web-contents-created', (event, contents) => {
      contents.on('will-navigate', (event, navigationUrl) => {
        // Allow local dev reloads
        if (isDev && navigationUrl.includes('localhost:5173')) return;
        
        event.preventDefault();
        console.warn(`Blocked global navigation to: ${navigationUrl}`);
      });

      contents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('http://') || url.startsWith('https://')) {
          shell.openExternal(url);
        }
        return { action: 'deny' };
      });
    });

    if (!isDev) {
      app.on('browser-window-created', (event, window) => {
        window.webContents.on('before-input-event', (event, input) => {
          // Disable devtools shortcuts in production
          if (input.control && input.shift && input.key.toLowerCase() === 'i') {
            event.preventDefault();
          }
          if (input.key === 'F12') {
            event.preventDefault();
          }
        });
      });
    }

    ipcMain.handle('media-control', async (event, action) => {
      // Security: Only allow whitelisted media control actions
      const ALLOWED_ACTIONS = ['playpause', 'next', 'prev'];
      if (!ALLOWED_ACTIONS.includes(action)) {
        console.warn(`[Security] Blocked unauthorized media-control action: ${action}`);
        return false;
      }

      try {
        const KEYCODE_MAP = {
          'playpause': '[char]179',
          'next': '[char]176',
          'prev': '[char]177',
        };
        const keycode = KEYCODE_MAP[action];
        
        if (keycode) {
          const { execFile } = await import('child_process');
          const { promisify } = await import('util');
          const execFilePromise = promisify(execFile);
          await execFilePromise('powershell', [
            '-NoProfile',
            '-NonInteractive',
            '-c',
            `(new-object -com wscript.shell).sendkeys('${keycode}')`
          ]);
        }
        return true;
      } catch (e) {
        return false;
      }
    });

    // Security: Tool execution with allowlist validation
    const ALLOWED_TOOLS = [
      'get_weather', 'search_web', 'play_music', 'get_sports', 'get_stocks',
      'get_news', 'check_system_health', 'get_system_stats', 'get_currency',
      'get_translation', 'open_calculator', 'get_calendar', 'get_flights',
      'get_tasks', 'get_location'
    ];

    ipcMain.handle('execute-tool', async (event, name, args, apiKeys) => {
      if (!ALLOWED_TOOLS.includes(name)) {
        console.warn(`[Security] Blocked unauthorized tool execution attempt: ${name}`);
        return JSON.stringify({ error: `Tool '${name}' is not allowed.` });
      }
      const { executeDynamicTool } = await import('./ai/tools.js');
      return await executeDynamicTool(name, args, apiKeys);
    });
  });

  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
  });

  app.on('window-all-closed', () => {
    // Don't quit when main window closes — overlay stays alive in background
  });
}
