'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import MultiSelect from '@/components/MultiSelect';
import { apiRequest } from '@/lib/api';
import * as XLSX from 'xlsx';
import { showToast } from '@/components/ToastContainer';

export default function ManageItemConsumptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [dateFilter, setDateFilter] = useState('yesterday');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [departments, setDepartments] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [consumptionData, setConsumptionData] = useState([]);
  const [departmentSummary, setDepartmentSummary] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

    const deptParam = searchParams.get('departments');
    const itemsParam = searchParams.get('items');
    const startDtParam = searchParams.get('startdt');
    const endDtParam = searchParams.get('enddt');

    if (startDtParam && endDtParam) {
      setDateFilter('custom');
      setStartDate(startDtParam);
      setEndDate(endDtParam);
    } else {
      setStartDate(yesterdayStr);
      setEndDate(yesterdayStr);
    }

    loadDepartments(deptParam);
    loadItems(itemsParam);
  }, [searchParams]);

  const loadDepartments = async (deptParam) => {
    try {
      const data = await apiRequest('GET', 'departments/list');
      setDepartments(data.list || []);

      if (deptParam) {
        setSelectedDepartments(deptParam.split(','));
      }
    } catch (error) {
      console.error('Error loading departments:', error);
      showToast('error', 'Error', 'Failed to load departments');
    }
  };

  const loadItems = async (itemsParam) => {
    try {
      const data = await apiRequest('GET', 'items/list');
      setItems(data.list || []);

      if (itemsParam) {
        setSelectedItems(itemsParam.split(','));
      }

      loadInventory();
    } catch (error) {
      console.error('Error loading items:', error);
      showToast('error', 'Error', 'Failed to load items');
    }
  };

  const handleDateFilterChange = (value) => {
    setDateFilter(value);
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

    if (value === 'today') {
      setStartDate(today);
      setEndDate(today);
    } else if (value === 'yesterday') {
      setStartDate(yesterdayStr);
      setEndDate(yesterdayStr);
    }
  };

  const loadInventory = async () => {
    setLoading(true);
    setConsumptionData([]);
    setDepartmentSummary([]);

    const queryParams = {
      startdt: startDate,
      enddt: endDate,
      departments: selectedDepartments.join(','),
      items: selectedItems.join(',')
    };

    try {
      const [summaryData, inventoryData] = await Promise.all([
        apiRequest('GET', 'departments/consumption/list', queryParams),
        apiRequest('GET', 'items/consumption/history', queryParams)
      ]);

      if (summaryData?.list) {
        setDepartmentSummary(summaryData.list);
      }

      if (inventoryData?.list) {
        setConsumptionData(inventoryData.list);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('error', 'Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemId, departmentId, dt, baseItemId) => {
    if (baseItemId && baseItemId !== '0') {
      showToast('error', 'Error', 'Cannot delete ingredients used in base item from this dashboard');
      return;
    }

    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await apiRequest('POST', 'items/consumption/delete', { dt, departmentId, itemId, baseItemId: 0 });
      showToast('success', 'Deleted', 'Item deleted successfully');
      loadInventory();
    } catch (error) {
      console.error('Error deleting:', error);
      showToast('error', 'Error', 'Failed to delete item');
    }
  };

  const handleApply = async (itemId, departmentId, dt, quantity, baseItemId) => {
    if (baseItemId && baseItemId !== '0') {
      showToast('error', 'Error', 'Cannot update quantity of base item ingredients from this dashboard');
      return;
    }

    try {
      const response = await apiRequest('POST', 'items/consumption/upsert', {
        list: [{ dt, departmentId, itemId, baseItemId: 0, quantity: parseFloat(quantity) }]
      });

      if (response.count >= 1) {
        showToast('success', 'Updated', 'Quantity updated successfully');
        loadInventory();
      } else {
        showToast('error', 'Error', 'Failed to update quantity');
      }
    } catch (error) {
      console.error('Error updating:', error);
      showToast('error', 'Error', 'Failed to update quantity');
    }
  };

  const exportToExcel = () => {
    if (consumptionData.length === 0) return;

    const exportData = consumptionData.map(row => ({
      'Date': row.dt,
      'Item ID': row.itemId,
      'Department': row.department?.name || '',
      'Item Name': row.item?.alias || '',
      'Quantity': row.quantity,
      'Item Price': row.unitPrice,
      'Total Price': row.totalPrice,
      'Base Item': row.baseItem?.name || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'KitchenPurchase');

    const now = new Date();
    const timestamp = now.toISOString().slice(0, 19).replace(/[-T:]/g, '');
    const fileName = `kitchen_purchase_${timestamp}.xlsx`;

    XLSX.writeFile(wb, fileName);
    showToast('success', 'Success', 'Export successful!');
  };

  const totalItems = consumptionData.length;
  const totalCost = consumptionData.reduce((sum, row) => sum + (parseFloat(row.totalPrice) || 0), 0);

  return (
    <DashboardLayout title="Kitchen Purchase Dashboard">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-t-2xl p-10 mb-8 shadow-lg">
            <h1 className="text-white text-3xl md:text-4xl font-bold mb-2">Kitchen Purchase Dashboard</h1>
            <p className="text-blue-50 text-lg">Track and manage your kitchen purchases efficiently</p>
          </div>

          <div className="flex justify-end mb-6">
            <button
              onClick={() => router.push('/add-item-consumption')}
              className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm"
            >
              ➕ Add Purchase
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Date Range</label>
                <select
                  value={dateFilter}
                  onChange={(e) => handleDateFilterChange(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none bg-white"
                >
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Departments</label>
                <MultiSelect
                  options={departments.map(d => ({ value: d.id, label: d.name }))}
                  selected={selectedDepartments}
                  onChange={setSelectedDepartments}
                  placeholder="Select Departments"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Items</label>
                <MultiSelect
                  options={items.map(i => ({ value: i.id, label: i.alias }))}
                  selected={selectedItems}
                  onChange={setSelectedItems}
                  placeholder="Select Items"
                />
              </div>

              <div className="flex items-end gap-2">
                <button
                  onClick={loadInventory}
                  className="flex-1 bg-gradient-to-br from-blue-500 to-blue-600 text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm"
                >
                  Fetch Data
                </button>
                <button
                  onClick={loadInventory}
                  className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-gray-200 transition-all"
                >
                  🔄
                </button>
              </div>
            </div>
          </div>

          {loading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {!loading && departmentSummary.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {departmentSummary.map((dept) => (
                <div
                  key={dept.id}
                  className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{dept.department?.name}</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Opening</span>
                      <span className="font-semibold">₹{dept.consumptionOpeningValue || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Consumption</span>
                      <span className="font-semibold">₹{dept.consumptionValue || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Closing</span>
                      <span className="font-semibold">₹{dept.consumptionClosingValue || 0}</span>
                    </div>
                    <div className="pt-3 border-t border-gray-200 flex justify-between">
                      <span className="text-sm font-medium text-gray-700">Net</span>
                      <span className="font-bold text-blue-600">₹{dept.netConsumptionValue || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && consumptionData.length > 0 && (
            <>
              <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div className="flex gap-6">
                  <div className="text-gray-700 font-medium">Total Items: {totalItems}</div>
                  <div className="text-gray-700 font-medium">Total Cost: ₹{totalCost.toFixed(2)}</div>
                </div>
                <button
                  onClick={exportToExcel}
                  className="bg-gradient-to-br from-gray-600 to-gray-700 text-white px-6 py-2.5 rounded-lg font-semibold hover:from-gray-700 hover:to-gray-800 transition-all shadow-sm"
                >
                  📂 Export
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Item ID</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Department</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Item Name</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Quantity</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Item Price</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Total Price</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Base Item</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {consumptionData.map((row, idx) => (
                        <ConsumptionRow
                          key={idx}
                          row={row}
                          onDelete={handleDelete}
                          onApply={handleApply}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {!loading && consumptionData.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900">No data available</h3>
              <p className="mt-1 text-gray-500">Try adjusting your filters or selecting a different date range</p>
            </div>
          )}
    </DashboardLayout>
  );
}

function ConsumptionRow({ row, onDelete, onApply }) {
  const [quantity, setQuantity] = useState(row.quantity);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setHasChanges(quantity !== row.quantity);
  }, [quantity, row.quantity]);

  if (!row.item || !row.department) {
    return null;
  }

  const isBaseItem = row.baseItemId && row.baseItemId !== '0';

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-4 text-sm text-gray-900">{row.dt}</td>
      <td className="px-4 py-4 text-sm text-gray-900">{row.itemId}</td>
      <td className="px-4 py-4 text-sm text-gray-900">{row.department.name}</td>
      <td className="px-4 py-4 text-sm text-gray-900">{row.item.alias}</td>
      <td className="px-4 py-4">
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
          disabled={isBaseItem}
          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </td>
      <td className="px-4 py-4 text-sm text-gray-600">{row.unitPrice}</td>
      <td className="px-4 py-4 text-sm font-semibold text-gray-900">{row.totalPrice}</td>
      <td className="px-4 py-4 text-sm text-gray-600">{row.baseItem?.name || '-'}</td>
      <td className="px-4 py-4">
        <div className="flex gap-2">
          {hasChanges && !isBaseItem && (
            <button
              onClick={() => onApply(row.itemId, row.departmentId, row.dt, quantity, row.baseItemId)}
              className="bg-gradient-to-br from-green-500 to-green-600 text-white px-3 py-1 rounded text-xs font-semibold hover:from-green-600 hover:to-green-700 transition-all"
            >
              Apply
            </button>
          )}
          <button
            onClick={() => onDelete(row.itemId, row.departmentId, row.dt, row.baseItemId)}
            className="bg-gradient-to-br from-red-500 to-red-600 text-white px-3 py-1 rounded text-xs font-semibold hover:from-red-600 hover:to-red-700 transition-all"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
