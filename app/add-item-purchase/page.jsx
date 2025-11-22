'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { showToast } from '@/components/ToastContainer';

export default function AddItemPurchasePage() {
  const router = useRouter();
  const [date, setDate] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    setDate(today);

    loadDropdownData();
  }, [router]);

  const loadDropdownData = async () => {
    try {
      const [supplierData, itemData] = await Promise.all([
        apiRequest('GET', 'suppliers/list'),
        apiRequest('GET', 'items/list')
      ]);

      setSuppliers(supplierData.list || []);
      setItems(itemData.list || []);
      addRow();
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      showToast('error', 'Error', 'Failed to load dropdown options');
    } finally {
      setLoading(false);
    }
  };

  const addRow = () => {
    const newRows = [];
    for (let i = 0; i < 3; i++) {
      newRows.push({
        id: Date.now() + i,
        supplierId: '',
        itemId: '',
        quantity: '',
        totalPrice: '',
        unitQuantity: 1,
        unit: ''
      });
    }
    setRows([...rows, ...newRows]);
  };

  const updateRow = (id, field, value) => {
    setRows(rows.map(row => {
      if (row.id === id) {
        const updated = { ...row, [field]: value };

        if (field === 'itemId') {
          const selectedItem = items.find(item => item.id === parseInt(value));
          if (selectedItem) {
            updated.unitQuantity = selectedItem.unitQuantity || 1;
            updated.unit = selectedItem.unit || '';
          }
        }

        return updated;
      }
      return row;
    }));
  };

  const calculateItemPrice = (row) => {
    if (row.quantity > 0 && row.totalPrice > 0 && row.unitQuantity) {
      return ((row.totalPrice * row.unitQuantity) / row.quantity).toFixed(2);
    }
    return '-';
  };

  const isFormValid = () => {
    if (!date) return false;
    return rows.some(row =>
      row.supplierId && row.itemId && row.quantity > 0 && row.totalPrice > 0
    );
  };

  const handleSubmit = async () => {
    const validRows = rows.filter(row =>
      row.supplierId && row.itemId && row.quantity > 0 && row.totalPrice > 0
    );

    if (validRows.length === 0) {
      showToast('error', 'Error', 'Please fill all fields before submitting');
      return;
    }

    setSubmitting(true);

    const payload = {
      list: validRows.map(row => ({
        dt: date,
        supplierId: parseInt(row.supplierId),
        itemId: parseInt(row.itemId),
        quantity: parseFloat(row.quantity),
        totalPrice: parseFloat(row.totalPrice),
        unitQuantity: parseInt(row.unitQuantity)
      }))
    };

    try {
      const response = await apiRequest('POST', 'items/purchase/upsert', payload);

      if (response.count >= 1) {
        showToast('success', 'Success', 'Purchase data submitted successfully!');

        const today = new Date().toISOString().split('T')[0];
        setDate(today);
        setRows([]);
        addRow();
      } else {
        showToast('error', 'Error', 'Failed to submit data');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('error', 'Error', 'Failed to submit data');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f2f4f7] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f4f7] p-4 md:p-8">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-semibold text-gray-900 mb-2">
              Enter Store Purchase Details
            </h2>
            <p className="text-gray-500 text-sm">Record your store inventory purchases</p>
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="mb-4">
          <div className="flex items-center">
            <span className="text-gray-500 text-sm font-medium">Purchase Items</span>
            <div className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
              Enter items and quantities
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          {rows.map((row) => (
            <div
              key={row.id}
              className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Supplier</label>
                  <select
                    value={row.supplierId}
                    onChange={(e) => updateRow(row.id, 'supplierId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select supplier</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Item</label>
                  <select
                    value={row.itemId}
                    onChange={(e) => updateRow(row.id, 'itemId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Item</option>
                    {items.map(item => (
                      <option key={item.id} value={item.id}>{item.alias}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={row.quantity}
                      onChange={(e) => updateRow(row.id, 'quantity', e.target.value)}
                      placeholder="Enter Quantity"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {row.unit && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                        {row.unit}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Total Price</label>
                  <input
                    type="number"
                    value={row.totalPrice}
                    onChange={(e) => updateRow(row.id, 'totalPrice', e.target.value)}
                    placeholder="Enter Total Price"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {row.quantity > 0 && row.totalPrice > 0 && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-700">
                      Item Price: <span className="font-medium">₹{calculateItemPrice(row)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <button
            onClick={addRow}
            className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-md"
          >
            Add More Rows
          </button>
        </div>
      </div>
    </div>
  );
}
