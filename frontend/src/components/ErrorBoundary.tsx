import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you might want to log to an error reporting service
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          padding: 40,
          textAlign: 'center',
          background: 'var(--card-bg)',
          borderRadius: 12,
          border: '1px solid var(--border)',
          margin: 20,
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ marginTop: 0, marginBottom: 12 }}>Something went wrong</h2>
          <p style={{ color: 'var(--sub)', marginBottom: 20 }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{
              textAlign: 'left',
              background: 'var(--bg)',
              padding: 16,
              borderRadius: 8,
              marginBottom: 20,
              fontSize: 12,
              fontFamily: 'monospace',
              maxHeight: 300,
              overflow: 'auto',
            }}>
              <summary style={{ cursor: 'pointer', marginBottom: 8, fontWeight: 500 }}>
                Error Details (Development Only)
              </summary>
              <div style={{ color: '#ef4444' }}>
                <div style={{ marginBottom: 8 }}>
                  <strong>Error:</strong> {this.state.error.toString()}
                </div>
                {this.state.errorInfo && (
                  <div style={{ marginBottom: 8 }}>
                    <strong>Component Stack:</strong>
                    <pre style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                )}
                {this.state.error.stack && (
                  <div>
                    <strong>Stack Trace:</strong>
                    <pre style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>
                      {this.state.error.stack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn" onClick={this.handleReset}>
              Try Again
            </button>
            <button
              className="btn muted"
              onClick={() => {
                window.location.href = '/';
              }}
            >
              Go Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

