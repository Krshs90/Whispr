import React from 'react';
import { clearSessions } from '../lib/sessionStore';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global Error Boundary for Whispr.
 * Catches render crashes from corrupted data and provides a recovery mechanism.
 */
export class WhisprErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[WhisprErrorBoundary] Render crash caught:', error, errorInfo);
  }

  handleRecovery = () => {
    clearSessions();
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed', inset: 0,
          background: '#0D0D0D',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          color: '#FFFFEB',
        }}>
          <div style={{
            maxWidth: 480, textAlign: 'center', padding: 40,
            background: '#1A1A1A', borderRadius: 20,
            border: '1px solid #2A2A2A',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'rgba(255, 59, 48, 0.15)',
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              margin: '0 auto 20px',
              fontSize: 28,
            }}>
              ⚠️
            </div>
            <h2 style={{ margin: '0 0 12px', fontSize: 22, fontWeight: 600 }}>
              Whispr encountered an error
            </h2>
            <p style={{ color: '#888', fontSize: 14, lineHeight: 1.6, margin: '0 0 8px' }}>
              A corrupted chat session caused the app to crash. 
              Click below to clear the corrupted data and restart.
            </p>
            <p style={{ color: '#555', fontSize: 11, fontFamily: 'monospace', marginBottom: 24 }}>
              {this.state.error?.message || 'Unknown error'}
            </p>
            <button
              onClick={this.handleRecovery}
              style={{
                background: '#FFFFEB', color: '#0D0D0D',
                border: 'none', padding: '14px 28px', borderRadius: 12,
                fontSize: 15, fontWeight: 600, cursor: 'pointer',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Clear Data & Restart
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
