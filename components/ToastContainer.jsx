'use client';

import { useState, useCallback } from 'react';
import Toast from './Toast';

let addToastCallback;

export function useToast() {
  return useCallback((type, title, message, duration) => {
    if (addToastCallback) {
      addToastCallback(type, title, message, duration);
    }
  }, []);
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, title, message, duration = 5000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, title, message, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  addToastCallback = addToast;

  return (
    <div className="fixed top-5 right-5 z-[9999] max-w-md pointer-events-none">
      <div className="pointer-events-auto">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            type={toast.type}
            title={toast.title}
            message={toast.message}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
}

export function showToast(type, title, message, duration = 5000) {
  if (addToastCallback) {
    addToastCallback(type, title, message, duration);
  }
}
