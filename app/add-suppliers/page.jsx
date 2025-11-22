'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { apiRequest } from '@/lib/api';
import { showToast } from '@/components/ToastContainer';
import { Plus, Trash2 } from 'lucide-react';

export default function AddSuppliersPage() {  const [rows, setRows] = useState([{ id: Date.now(), name: '' }]);

  const addRows = () => {
    const newRows = [];
    for (let i = 0; i < 3; i++) {
      newRows.push({ id: Date.now() + i, name: '' });
    }
    setRows([...rows, ...newRows]);
  };

  const deleteRow = (id) => {
    setRows(rows.filter((row) => row.id !== id));
  };

  const updateRow = (id, field, value) => {
    setRows(rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const isFormValid = () => {
    return rows.some((row) => row.name.trim() !== '');
  };

  const handleSubmit = async () => {
    const validData = rows.filter((row) => row.name.trim() !== '').map((row) => ({ name: row.name.trim() }));

    if (validData.length === 0) {
      showToast('warning', 'Warning', 'Please fill all fields before submitting.');
      return;
    }

    try {
      const response = await apiRequest('POST', 'delicia-meta/vendor/upsert', { list: validData });

      if (response.count >= 1) {
        showToast('success', 'Success', 'Data submitted successfully!');
        setRows([{ id: Date.now(), name: '' }]);
      } else {
        showToast('error', 'Error', 'Failed to submit data.');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('error', 'Error', 'Failed to submit data.');
    }
  };

  return (
    <DashboardLayout title="Add Suppliers">

        <div className="max-w-5xl mx-auto p-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
              <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-4 md:mb-0">
                Enter Vendors
              </h2>
              <button
                onClick={handleSubmit}
                disabled={!isFormValid()}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-all hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed w-full md:w-auto"
              >
                Submit
              </button>
            </div>

            <div className="space-y-4">
              {rows.map((row) => (
                <div
                  key={row.id}
                  className="flex flex-col md:flex-row gap-4 p-4 bg-gray-50 rounded-lg border border-blue-400"
                >
                  <div className="flex-1">
                    <input
                      type="text"
                      value={row.name}
                      onChange={(e) => updateRow(row.id, 'name', e.target.value)}
                      placeholder="Enter Vendor Name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <button
                    onClick={() => deleteRow(row.id)}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-gray-700 border border-gray-400 rounded-md hover:bg-red-600 hover:text-white transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-6">
              <button
                onClick={addRows}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-all hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" />
                Add Rows
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
  );

}
