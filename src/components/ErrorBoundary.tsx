import { Component, ErrorInfo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[MarkDriller ErrorBoundary Caught Exception]:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      try {
        this.props.onReset();
      } catch (err) {
        console.error('[ErrorBoundary onReset Error]:', err);
      }
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            minHeight: '100dvh',
            backgroundColor: 'var(--paper, #fdfbf7)',
            color: 'var(--ink, #14181c)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            fontFamily: 'var(--font-sans, system-ui, -apple-system, sans-serif)',
          }}
        >
          <div
            style={{
              maxWidth: '540px',
              width: '100%',
              backgroundColor: 'var(--white, #ffffff)',
              border: '2px solid var(--paper-line, #e2ded5)',
              borderRadius: '8px',
              padding: 'clamp(24px, 5vw, 40px)',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.12)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(194, 65, 12, 0.12)',
                color: 'var(--rust, #c2410c)',
                fontSize: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              ⚠
            </div>

            <h2
              style={{
                fontSize: 'clamp(20px, 3.5vw, 24px)',
                fontWeight: 700,
                margin: '0 0 12px',
                color: 'var(--ink, #14181c)',
                lineHeight: 1.3,
              }}
            >
              {this.props.fallbackTitle || 'Display Notice'}
            </h2>

            <p
              style={{
                fontSize: '14.5px',
                color: 'var(--ink-soft, #5a6472)',
                lineHeight: 1.6,
                margin: '0 0 24px',
              }}
            >
              {this.props.fallbackMessage ||
                'An unexpected display issue occurred while rendering this component. You can retry rendering or return to the student portal to continue.'}
            </p>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                alignItems: 'stretch',
              }}
            >
              <button
                type="button"
                onClick={this.handleReset}
                className="btn-custom btn-custom-primary"
                style={{
                  justifyContent: 'center',
                  padding: '12px 20px',
                  fontSize: '14.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                🔄 Refresh Session View
              </button>

              <Link
                to="/portal/cbt"
                className="btn-custom btn-custom-secondary"
                style={{
                  justifyContent: 'center',
                  padding: '12px 20px',
                  fontSize: '14.5px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                ← Return to CBT Portal
              </Link>

              <Link
                to="/dashboard"
                className="btn-custom btn-custom-ghost"
                style={{
                  justifyContent: 'center',
                  padding: '10px 20px',
                  fontSize: '14px',
                  textDecoration: 'none',
                }}
              >
                ← Student Dashboard
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
