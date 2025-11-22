'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { apiRequest } from '@/lib/api';
import { showToast } from '@/components/ToastContainer';

export default function AddClosingStockPage() {  const [date, setDate] = useState('');
  const [items, setItems] = useState([]);
  const [rows, setRows] = useState([{ id: 1, itemId: '', quantity: '', unit: '' }]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    setDate(today);
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const data = await apiRequest('GET', 'items/list');
      setItems(data.list || []);
    } catch (error) {
      console.error('Error loading items:', error);
      showToast('error', 'Error', 'Failed to load items');
    }
  };

  const addRows = () => {
    const newRows = [];
    const lastId = rows.length > 0 ? rows[rows.length - 1].id : 0;
    for (let i = 1; i <= 3; i++) {
      newRows.push({ id: lastId + i, itemId: '', quantity: '', unit: '' });
    }
    setRows([...rows, ...newRows]);
  };

  const updateRow = (id, field, value) => {
    setRows(rows.map(row => {
      if (row.id === id) {
        if (field === 'itemId') {
          const selectedItem = items.find(item => item.id === value);
          return { ...row, itemId: value, unit: selectedItem?.unit || '' };
        }
        return { ...row, [field]: value };
      }
      return row;
    }));
  };

  const getItemPrice = (itemId, quantity) => {
    const item = items.find(i => i.id === itemId);
    if (!item || !quantity) return { unitPrice: '-', totalPrice: '-' };

    const unitQuantity = item.unitQuantity || 1;
    const unitPrice = item.unitPrice || 0;
    const totalPrice = ((quantity / unitQuantity) * unitPrice).toFixed(2);

    return { unitPrice: unitPrice.toFixed(2), totalPrice };
  };

  const isFormValid = () => {
    if (!date) return false;
    return rows.some(row => row.itemId && row.quantity > 0);
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      showToast('error', 'Error', 'Please fill all required fields');
      return;
    }

    setSubmitting(true);

    const data = rows
      .filter(row => row.itemId && row.quantity)
      .map(row => ({
        dt: date,
        itemId: row.itemId,
        quantity: parseFloat(row.quantity)
      }));

    try {
      const response = await apiRequest('POST', 'items/purchase/closing/upsert', { list: data });

      if (response.count >= 1) {
        showToast('success', 'Success', 'Closing stock submitted successfully!');
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        setDate(today);
        setRows([{ id: 1, itemId: '', quantity: '', unit: '' }]);
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
    <DashboardLayout title="Add Store Closing Stock">

        <div className="max-w-5xl mx-auto p-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-semibold text-gray-900 mb-2">
                  Enter Store Closing Stock
                </h2>
                <p className="text-gray-500 text-sm">Record end-of-day inventory quantities</p>
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
              <label className="block text-gray-700 text-sm font-medium mb-2">Select Date:</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
              />
            </div>

            <div className="mb-4">
              <div className="flex items-center">
                <span className="text-gray-500 text-sm font-medium">Stock Items</span>
                <div className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  Enter items and quantities
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              {rows.map((row) => (
                <div
                  key={row.id}
                  className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Item</label>
                      <select
                        value={row.itemId}
                        onChange={(e) => updateRow(row.id, 'itemId', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                      >
                        <option value="">Select Item</option>
                        {items.map(item => (
                          <option key={item.id} value={item.id}>{item.alias}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={row.quantity}
                          onChange={(e) => updateRow(row.id, 'quantity', e.target.value)}
                          min="0"
                          placeholder="Enter Quantity"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                        />
                        {row.unit && (
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                            {row.unit}
                          </span>
                        )}
                      </div>

                      {row.itemId && row.quantity > 0 && (
                        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg flex gap-4 text-xs">
                          <div className="text-green-700 font-medium">
                            Unit Price: <span className="text-green-800">{getItemPrice(row.itemId, row.quantity).unitPrice}</span>
                          </div>
                          <div className="text-green-700 font-medium">
                            Total Price: <span className="text-green-800">{getItemPrice(row.itemId, row.quantity).totalPrice}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <button
                onClick={addRows}
                className="bg-gradient-to-br from-green-500 to-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-sm"
              >
                Add More Rows
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
  );

}
