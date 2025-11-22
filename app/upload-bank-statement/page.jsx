'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import FileUploadArea from '@/components/FileUploadArea';
import { fileUploadRequest } from '@/lib/api';
import { showToast } from '@/components/ToastContainer';
import { Loader2 } from 'lucide-react';

export default function UploadBankStatementPage() {  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [responseMessage, setResponseMessage] = useState(null);

  const handleFileSelect = (file) => {
    const validExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
      setErrorMessage('Please select an Excel file (.xlsx or .xls)');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setErrorMessage('');
    setResponseMessage(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setResponseMessage(null);
    setErrorMessage('');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const data = await fileUploadRequest('POST', 'statement/upload', formData);

      if (data.count > 0) {
        setResponseMessage({
          type: 'success',
          title: 'Upload Successful',
          message: `Successfully uploaded ${data.count} items.`
        });
        showToast('success', 'Success', `Successfully uploaded ${data.count} items.`);
      } else {
        setResponseMessage({
          type: 'error',
          title: 'Upload Failed',
          message: 'No items were uploaded. Please check your file and try again.'
        });
        showToast('warning', 'Warning', 'No items were uploaded.');
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage('Error uploading file: ' + error.message);
      showToast('error', 'Error', 'Failed to upload file: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Upload Bank Statement">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-2xl md:text-3xl font-bold text-center text-gray-800 mb-8">
              Upload Your Bank Statement
            </h1>

            <FileUploadArea
              onFileSelect={handleFileSelect}
              acceptedFormats=".xlsx,.xls"
              selectedFile={selectedFile}
            />

            <button
              onClick={handleUpload}
              disabled={!selectedFile || loading}
              className="w-full max-w-xs mx-auto block bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-all hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Uploading...
                </span>
              ) : (
                'Upload Statement'
              )}
            </button>

            {errorMessage && (
              <div className="mt-6 text-center text-red-600 font-medium">
                {errorMessage}
              </div>
            )}

            {loading && (
              <div className="mt-8 text-center">
                <div className="inline-block">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-4" />
                  <p className="text-gray-600">Uploading file, please wait...</p>
                </div>
              </div>
            )}

            {responseMessage && (
              <div
                className={`mt-8 p-6 rounded-lg ${
                  responseMessage.type === 'success'
                    ? 'bg-green-50 border-l-4 border-green-600'
                    : 'bg-red-50 border-l-4 border-red-600'
                }`}
              >
                <h3
                  className={`font-semibold mb-2 ${
                    responseMessage.type === 'success' ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {responseMessage.title}
                </h3>
                <div className="bg-white p-4 rounded text-sm text-gray-700">
                  {responseMessage.message}
                </div>
              </div>
            )}
          </div>
    </DashboardLayout>
  );
}
