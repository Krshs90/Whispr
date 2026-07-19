import { exec, spawn } from 'child_process';
import os from 'os';
import path from 'path';

export const OLLAMA_HOST = 'http://127.0.0.1:11434';

/**
 * Pings Ollama to check if it's running. 
 * If not, attempts to start it in the background.
 */
export async function ensureOllamaRunning() {
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/tags`, { method: 'GET' });
    if (res.ok) {
      console.log('[AI Engine] Ollama is already running natively.');
      return true;
    }
  } catch (error) {
    console.log('[AI Engine] Ollama not responding. Attempting to start in background...', error.message);
  }

  return new Promise((resolve) => {
    // Attempt to start Ollama
    // On Windows, the default command is usually just `ollama serve` if in PATH
    let cmd = 'ollama';
    let args = ['serve'];

    if (os.platform() === 'win32') {
      // In many cases on Windows, ollama might not be in the immediate command line path for UI electron apps
      // But we can try relying on cmd /c
      const p = spawn('cmd.exe', ['/c', 'ollama serve'], {
        detached: true,
        stdio: 'ignore', // Let it run quietly in background
        windowsHide: true
      });
      p.unref(); // Detach the child process

      // Wait a few seconds for it to bind the port
      setTimeout(async () => {
        try {
          const res = await fetch(`${OLLAMA_HOST}/api/tags`);
          if (res.ok) {
            console.log('[AI Engine] Successfully started Ollama in background.');
            resolve(true);
          } else {
            resolve(false);
          }
        } catch {
          console.warn('[AI Engine] Failed to confirm Ollama startup. User may need to install it.');
          resolve(false);
        }
      }, 3000);
    } else {
      // Mac/Linux
      const p = spawn('ollama', ['serve'], { detached: true, stdio: 'ignore' });
      p.unref();
      setTimeout(() => resolve(true), 3000); // optimistic
    }
  });
}

/**
 * Fetches all installed models natively from local Ollama.
 */
export async function getAvailableModels() {
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/tags`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.models.map(m => m.name);
  } catch (err) {
    console.error('[AI Engine] Failed fetching models:', err);
    return [];
  }
}

/**
 * Pulls a model from the Ollama registry securely via API.
 * Uses a callback to stream progress back to the UI.
 */
export async function pullModel(modelName, onProgress) {
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: modelName, stream: true })
    });
    
    if (!res.ok) throw new Error(`Ollama Pull Error: ${res.statusText}`);
    
    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          onProgress(data);
        } catch (e) {
          // ignore parse errors on incomplete chunk pieces
        }
      }
    }
    return true;
  } catch (err) {
    console.error(`[AI Engine] Failed pulling model ${modelName}:`, err);
    return false;
  }
}
