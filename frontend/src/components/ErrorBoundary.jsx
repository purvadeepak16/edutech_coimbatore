import React from 'react';
import { AlertCircle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("🚨 Error caught by ErrorBoundary:", {
      error: error.toString(),
      componentStack: errorInfo.componentStack
    });
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null 
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '24px',
          margin: '16px 0',
          backgroundColor: '#FEE2E2',
          border: '1px solid #FCA5A5',
          borderRadius: '8px',
          color: '#991B1B'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <AlertCircle size={24} color="#991B1B" />
            <h2 style={{ margin: 0, fontSize: '18px' }}>⚠️ Something Went Wrong</h2>
          </div>
          
          <p style={{ margin: '0 0 12px 0', fontSize: '14px' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>

          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <details style={{ 
              marginBottom: '12px', 
              padding: '8px',
              backgroundColor: '#FECACA',
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                📋 Error Details (Development Only)
              </summary>
              <pre style={{ 
                overflow: 'auto', 
                margin: '8px 0 0 0',
                padding: '8px',
                backgroundColor: '#FCA5A5',
                borderRadius: '4px',
                fontSize: '11px'
              }}>
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}

          <button 
            onClick={this.handleReset}
            style={{
              padding: '8px 16px',
              backgroundColor: '#DC2626',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#B91C1C'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#DC2626'}
          >
            🔄 Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
