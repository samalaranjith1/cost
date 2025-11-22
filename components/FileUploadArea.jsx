'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';

export default function FileUploadArea({ onFileSelect, acceptedFormats = '.xlsx,.xls', selectedFile }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files.length) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files.length) {
      onFileSelect(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-all duration-300 mb-6 ${
        isDragging
          ? 'bg-blue-50 border-blue-500'
          : 'bg-gray-50 border-gray-300 hover:bg-gray-100 hover:border-blue-500'
      }`}
    >
      <div className="flex flex-col items-center">
        <Upload className="w-12 h-12 text-blue-500 mb-4" />
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-1">
            Drag & Drop your XLS/XLSX file here
          </h3>
          <p className="text-gray-500">or</p>
        </div>
        <label className="inline-block bg-blue-500 text-white px-6 py-2.5 rounded cursor-pointer transition-all hover:bg-blue-600 font-medium">
          Browse Files
          <input
            type="file"
            accept={acceptedFormats}
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
        {selectedFile && (
          <div className="mt-4 text-sm text-gray-600 font-medium">
            Selected file: {selectedFile.name} ({formatFileSize(selectedFile.size)})
          </div>
        )}
      </div>
    </div>
  );
}
