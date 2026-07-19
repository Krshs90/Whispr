import { getAvailableModels, OLLAMA_HOST } from './ollamaManager.js';

let statusState = {
  engine: 'offline',
  models: { tools: false, chat: false },
  apis: { weather: 'degraded', knowledge: 'degraded' },
  browser: 'beta' // Early Beta flag
};

export let currentApiKeys = {};

export function setHealthApiKeys(keys) {
  currentApiKeys = { ...currentApiKeys, ...keys };
}

export async function runHealthCheck() {
  try {
    // 1. Check Backend Intelligence Engine (Ollama)
    const ollamaPing = await fetch(`${OLLAMA_HOST}/api/tags`).catch(() => null);
    
    if (ollamaPing && ollamaPing.ok) {
      statusState.engine = 'online';
      const models = await getAvailableModels();
      
      const GENERAL_MODELS = [
        'gemma4', 'gemma3', 'hermes3', 'qwen3', 'qwen2.5:32b',
        'llama4', 'llama3.2', 'llama3.1:8b', 'mistral', 'mistral-nemo',
        'phi4', 'phi4-mini', 'deepseek-r1', 'command-r',
      ];
      
      statusState.models.tools = models.length > 0; // Any model can handle tools via Whispr's orchestrator
      statusState.models.chat = GENERAL_MODELS.some(m => models.some(i => i.toLowerCase().startsWith(m)));
    } else {
      statusState.engine = 'offline';
      statusState.models = { tools: false, chat: false };
    }

    // 2. Real API Endpoint connections
    let weatherStatus = 'degraded';
    let knowledgeStatus = 'degraded';

    try {
      if (currentApiKeys.weather) {
        const wRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=London&appid=${currentApiKeys.weather}`).catch(() => null);
        if (wRes && wRes.ok) weatherStatus = 'online';
      } else {
        weatherStatus = 'offline'; // Needs key
      }
    } catch(e) {}

    try {
      const kRes = await fetch('https://en.wikipedia.org/w/api.php?action=query&format=json&titles=Earth').catch(() => null);
      if (kRes && kRes.ok) knowledgeStatus = 'online';
    } catch(e) {}

    statusState.apis = { 
      weather: weatherStatus, 
      knowledge: knowledgeStatus,
    };

    return statusState;
  } catch (error) {
    console.error('[Health] Failed health check loop:', error);
    return statusState;
  }
}

export function startHealthMonitor(mainWindow, overlayWindow) {
  const safelySend = (win, channel, data) => {
    try {
      if (win && !win.isDestroyed() && win.webContents && !win.webContents.isDestroyed() && !win.webContents.isCrashed()) {
        win.webContents.send(channel, data);
      }
    } catch (e) {
      // Silently swallow — window may be mid-navigation or frame disposed
    }
  };

  const broadcast = (status) => {
    safelySend(mainWindow, 'system-health', status);
    safelySend(overlayWindow, 'system-health', status);
  };

  // Initial check
  runHealthCheck().then(broadcast);

  // Loop every 60 seconds to avoid spamming APIs
  setInterval(async () => {
    const status = await runHealthCheck();
    broadcast(status);
  }, 60000);
}
