import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import MainApp from './MainApp.tsx'
import { WhisprErrorBoundary } from './components/ErrorBoundary.tsx'
import './index.css'

// ═══ PRE-RENDER SAFETY CHECK ═══
// Validate localStorage integrity before React mounts.
// If the data is totally corrupted, clear it so the app doesn't blank-screen.
try {
  const raw = localStorage.getItem('whispr_sessions');
  if (raw) {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.warn('[Whispr Boot] Sessions data is not an array, clearing...');
      localStorage.removeItem('whispr_sessions');
      localStorage.removeItem('whispr_active_chat');
    }
  }
} catch (e) {
  console.error('[Whispr Boot] Corrupted sessions in localStorage, clearing:', e);
  localStorage.removeItem('whispr_sessions');
  localStorage.removeItem('whispr_active_chat');
}

// Determine which UI to render based on URL query param
const params = new URLSearchParams(window.location.search);
const mode = params.get('mode');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WhisprErrorBoundary>
      {mode === 'main' ? <MainApp /> : <App />}
    </WhisprErrorBoundary>
  </React.StrictMode>,
)
