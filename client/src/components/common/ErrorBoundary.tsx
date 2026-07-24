import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      const isDev = import.meta.env?.DEV;
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-primary, #0d0d0d)',
          color: 'var(--text-primary, #f5f0e8)',
          fontFamily: 'Inter, sans-serif',
          padding: '24px',
        }}>
          <div style={{ maxWidth: 520, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Something went wrong</h2>
            <p style={{ color: 'var(--text-secondary, #a39e93)', fontSize: 14, marginBottom: 24 }}>
              {this.state.error.message || 'An unexpected error occurred.'}
            </p>
            {isDev && (
              <pre style={{
                textAlign: 'left',
                fontSize: 12,
                color: 'var(--danger, #e94560)',
                backgroundColor: 'var(--bg-secondary, #1a1a1a)',
                padding: 16,
                borderRadius: 8,
                overflow: 'auto',
                maxHeight: 200,
                marginBottom: 24,
              }}>
                {this.state.error.stack}
              </pre>
            )}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '10px 24px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: 'var(--accent-primary, #d4a574)',
                  color: '#0d0d0d',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Reload
              </button>
              <button
                onClick={() => { window.location.href = '/'; }}
                style={{
                  padding: '10px 24px',
                  borderRadius: 8,
                  border: '1px solid var(--border, rgba(255,255,255,0.08))',
                  backgroundColor: 'transparent',
                  color: 'var(--text-primary, #f5f0e8)',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
