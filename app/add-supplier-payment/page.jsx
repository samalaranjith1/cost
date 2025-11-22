'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { apiRequest } from '@/lib/api';
import { showToast } from '@/components/ToastContainer';

export default function AddSupplierPaymentPage() {  const [date, setDate] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [rows, setRows] = useState([{ id: 1, supplierId: '', payment: '', tax: '' }]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    setDate(today);
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const data = await apiRequest('GET', 'suppliers/list');
      setSuppliers(data.list || []);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      showToast('error', 'Error', 'Failed to load suppliers');
    }
  };

  const addRows = () => {
    const newRows = [];
    const lastId = rows.length > 0 ? rows[rows.length - 1].id : 0;
    for (let i = 1; i <= 3; i++) {
      newRows.push({ id: lastId + i, supplierId: '', payment: '', tax: '' });
    }
    setRows([...rows, ...newRows]);
  };

  const updateRow = (id, field, value) => {
    setRows(rows.map(row => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const isFormValid = () => {
    if (!date) return false;
    return rows.some(row => row.supplierId && row.payment > 0);
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      showToast('error', 'Error', 'Please fill all required fields');
      return;
    }

    setSubmitting(true);

    const data = rows
      .filter(row => row.supplierId && row.payment)
      .map(row => ({
        dt: date,
        supplierId: row.supplierId,
        taxAmount: parseFloat(row.tax) || 0,
        paymentAmount: parseFloat(row.payment)
      }));

    try {
      const response = await apiRequest('POST', 'suppliers/payment/upsert/list', { list: data });

      if (response.count >= 1) {
        showToast('success', 'Success', 'Payment data submitted successfully!');
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        setDate(today);
        setRows([{ id: 1, supplierId: '', payment: '', tax: '' }]);
      } else {
        showToast('error', 'Error', 'Failed to submit data');
      }
    } catch (error) {
      console.error('Error submitting:', error);
      showToast('error', 'Error', 'Failed to submit data');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Add Vendor Payment">

        <div className="max-w-5xl mx-auto p-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-semibold text-gray-900 mb-2">
                  Enter Payment Details
                </h2>
                <p className="text-gray-500 text-sm">Record payments</p>
              </div>
              <button
                onClick={handleSubmit}
                disabled={!isFormValid() || submitting}
                className={`w-full md:w-auto mt-4 md:mt-0 px-6 py-3 rounded-lg font-semibold text-white shadow-md transition-all ${
                  isFormValid() && !submitting
                    ? 'bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 cursor-pointer'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>

            <div className="mb-8">
              <label className="block text-gray-700 text-sm font-medium mb-2">Payment Date:</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            <div className="mb-4">
              <div className="flex items-center">
                <span className="text-gray-500 text-sm font-medium">Payment Details</span>
                <div className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  Enter payment details
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              {rows.map((row) => (
                <div
                  key={row.id}
                  className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Vendor</label>
                      <select
                        value={row.supplierId}
                        onChange={(e) => updateRow(row.id, 'supplierId', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      >
                        <option value="">Select Vendor</option>
                        {suppliers.map(supplier => (
                          <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Payment Amount</label>
                      <input
                        type="number"
                        value={row.payment}
                        onChange={(e) => updateRow(row.id, 'payment', e.target.value)}
                        min="0"
                        placeholder="Enter Payment Amount"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tax Amount</label>
                      <input
                        type="number"
                        value={row.tax}
                        onChange={(e) => updateRow(row.id, 'tax', e.target.value)}
                        min="0"
                        placeholder="Enter Tax Amount"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <button
                onClick={addRows}
                className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm"
              >
                Add More Rows
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
  );

}
