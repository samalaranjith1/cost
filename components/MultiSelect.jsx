'use client';

import { useState, useRef, useEffect } from 'react';

export default function MultiSelect({ options = [], selected = [], onChange, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const safeSelected = Array.isArray(selected) ? selected : [];

  const toggleOption = (value) => {
    const newSelected = safeSelected.includes(value)
      ? safeSelected.filter(v => v !== value)
      : [...safeSelected, value];
    onChange(newSelected);
  };

  const clearAll = (e) => {
    e.stopPropagation();
    onChange([]);
  };

  const selectAll = () => {
    onChange(options.map(opt => opt.value.toString()));
  };

  const selectedItems = options.filter(opt => safeSelected.includes(opt.value.toString()));
  const displayText = selectedItems.length === 0
    ? placeholder
    : selectedItems.length === 1
      ? selectedItems[0].label
      : `${selectedItems.length} selected`;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-left focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/10 outline-none bg-white flex items-center justify-between hover:border-gray-300 transition-colors"
      >
        <span className={`flex-1 truncate ${selectedItems.length === 0 ? 'text-gray-400' : 'text-gray-900'}`}>
          {displayText}
        </span>
        <div className="flex items-center gap-1">
          {selectedItems.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="p-0.5 hover:bg-gray-200 rounded transition-colors"
              title="Clear selection"
            >
              <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <svg
            className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {options.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">No options available</div>
          ) : (
            <>
              <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-4 py-2 flex justify-between items-center">
                <span className="text-xs font-medium text-gray-600">
                  {safeSelected.length} of {options.length} selected
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Select All
                  </button>
                  {safeSelected.length > 0 && (
                    <button
                      type="button"
                      onClick={() => onChange([])}
                      className="text-xs text-gray-600 hover:text-gray-700 font-medium"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {options.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-0"
                  >
                    <input
                      type="checkbox"
                      checked={safeSelected.includes(option.value.toString())}
                      onChange={() => toggleOption(option.value.toString())}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="ml-3 text-sm text-gray-900">{option.label}</span>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
