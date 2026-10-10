import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {error: Error | null}> {
  state = {error: null as Error | null};
  static getDerivedStateFromError(error: Error) {
    return {error};
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{minHeight: '100vh', padding: 24, background: '#09090b', color: '#fca5a5', fontFamily: 'monospace'}}>
        <h2 style={{color: '#fff'}}>حدث خطأ في التطبيق / App crashed</h2>
        <pre style={{whiteSpace: 'pre-wrap'}}>{String(this.state.error.stack || this.state.error.message)}</pre>
        <button onClick={() => location.reload()} style={{marginTop: 12, padding: '8px 16px'}}>Reload</button>
      </div>
    );
  }
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
