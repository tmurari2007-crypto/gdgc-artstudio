import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingState = ({ message = 'Loading studio details...' }) => (
  <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
    <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 12px auto', color: 'var(--terracotta)' }} />
    <p style={{ fontSize: '1rem', fontStyle: 'italic' }}>{message}</p>
  </div>
);

export const EmptyState = ({ title = 'No records found', message, actionText, onAction }) => (
  <div style={{
    padding: '48px 24px',
    textAlign: 'center',
    background: 'var(--bg-subtle)',
    borderRadius: 'var(--radius-md)',
    border: '1px dashed var(--border-light)',
    margin: '24px 0'
  }}>
    <h3 style={{ marginBottom: '8px', fontSize: '1.25rem' }}>{title}</h3>
    {message && <p style={{ color: 'var(--text-muted)', marginBottom: actionText ? '20px' : 0 }}>{message}</p>}
    {actionText && onAction && (
      <button onClick={onAction} className="btn btn-primary" style={{ marginTop: '12px' }}>
        {actionText}
      </button>
    )}
  </div>
);

export const ErrorState = ({ message = 'An unexpected error occurred.', onRetry }) => (
  <div style={{
    padding: '32px 24px',
    textAlign: 'center',
    background: 'var(--danger-bg)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid #FFCDD2',
    margin: '24px 0',
    color: 'var(--danger)'
  }}>
    <h3 style={{ marginBottom: '8px', fontSize: '1.2rem' }}>Something went wrong</h3>
    <p style={{ marginBottom: onRetry ? '16px' : 0 }}>{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="btn btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
        Try Again
      </button>
    )}
  </div>
);
