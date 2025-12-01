import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          background: 'var(--color-ocean-dark)',
          color: 'var(--color-text)',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <h1 style={{ color: 'var(--color-error)', marginBottom: '20px' }}>⚠️ Erreur</h1>
          <p style={{ marginBottom: '20px' }}>Une erreur s'est produite. Veuillez rafraîchir la page.</p>
          <p style={{ fontSize: '12px', color: 'var(--color-text-dim)', marginBottom: '20px' }}>
            {this.state.error?.message}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            style={{
              padding: '12px 24px',
              background: 'var(--color-gold)',
              color: 'var(--color-ocean-dark)',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Rafraîchir la page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

