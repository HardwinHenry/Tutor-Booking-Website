import React from 'react';
import { Toaster, toast as hotToast } from 'react-hot-toast';

/**
 * Toast Provider configuring react-hot-toast with project design tokens
 */
export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          background: '#ffffff',
          color: '#1e293b',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          borderRadius: '0.75rem',
          padding: '12px 16px',
          fontSize: '0.875rem',
          border: '1px solid #f1f5f9',
          fontWeight: 500,
        },
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: '#ffffff',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#ffffff',
          },
          duration: 5000,
        },
      }}
    />
  );
}

export const toast = Object.assign(hotToast, {
  info: (message, options = {}) =>
    hotToast(message, {
      icon: 'ℹ️',
      ...options,
    }),
  warning: (message, options = {}) =>
    hotToast(message, {
      icon: '⚠️',
      ...options,
    }),
  warn: (message, options = {}) =>
    hotToast(message, {
      icon: '⚠️',
      ...options,
    }),
});
export default ToastProvider;
