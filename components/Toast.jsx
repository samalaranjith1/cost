'use client';

import { useEffect } from 'react';

export default function Toast({ type = 'error', title, message, onClose, duration = 5000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const iconSymbols = {
    error: '✗',
    success: '✓',
    warning: '⚠',
    info: 'ℹ'
  };

  const borderColors = {
    error: 'border-l-red-500',
    success: 'border-l-green-500',
    warning: 'border-l-orange-500',
    info: 'border-l-blue-500'
  };

  const iconBgColors = {
    error: 'bg-red-500',
    success: 'bg-green-500',
    warning: 'bg-orange-500',
    info: 'bg-blue-500'
  };

  return (
    <div
      className={`bg-gradient-to-br from-white to-gray-50 border border-gray-200 border-l-4 ${borderColors[type]} rounded-xl p-4 mb-3 shadow-lg flex items-start gap-3 animate-slide-in relative`}
    >
      <div className={`w-6 h-6 rounded-full ${iconBgColors[type]} flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5`}>
        {iconSymbols[type]}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-base font-semibold text-gray-900 mb-1">
          {title}
        </div>
        <div className="text-sm text-gray-600">
          {message}
        </div>
      </div>

      <button
        onClick={onClose}
        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded transition-all"
      >
        ×
      </button>

      <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-[#306dff] to-[#5a8fff] rounded-b-xl animate-progress"></div>
    </div>
  );
}
