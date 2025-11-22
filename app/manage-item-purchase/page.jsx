'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import MultiSelect from '@/components/MultiSelect';
import { apiRequest } from '@/lib/api';
import * as XLSX from 'xlsx';
import { showToast } from '@/components/ToastContainer';

export default function ManageItemPurchasePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
const [loading, setLoading] = useState(false);

  const [dateFilter, setDateFilter] = useState('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [vendors, setVendors] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedVendors, setSelectedVendors] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);

  const [vendorSummary, setVendorSummary] = useState([]);
  const [purchaseData, setPurchaseData] = useState([]);
  const [carouselPosition, setCarouselPosition] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const itemsParam = searchParams.get('items') || '';
    const vendorsParam = searchParams.get('vendors') || '';
    const startDtParam = searchParams.get('startdt') || '';
    const endDtParam = searchParams.get('enddt') || '';

    if (startDtParam && endDtParam) {
      setDateFilter('custom');
      setStartDate(startDtParam);
      setEndDate(endDtParam);
    } else {
      setStartDate(today);
      setEndDate(today);
    }

    loadVendors(vendorsParam);
    loadItems(itemsParam);
  }, [router, searchParams]);

  const loadVendors = async (vendorsParam) => {
    try {
      const data = await apiRequest('GET', 'suppliers/list');
      setVendors(data.list || []);
      if (vendorsParam) {
        setSelectedVendors(vendorsParam.split(','));
      }
    } catch (error) {
      console.error('Failed to load vendors:', error);
    }
  };

  const loadItems = async (itemsParam) => {
    try {
      const data = await apiRequest('GET', 'items/list');
      setItems(data.list || []);
      if (itemsParam) {
        setSelectedItems(itemsParam.split(','));
      }
    } catch (error) {
      console.error('Failed to load items:', error);
    }
  };

  const handleDateFilterChange = (value) => {
    setDateFilter(value);
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

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
    setPurchaseData([]);
    setVendorSummary([]);

    const queryParams = {
      startdt: startDate,
      enddt: endDate,
      vendors: selectedVendors.join(','),
      items: selectedItems.join(',')
    };

    try {
      const [summaryData, inventoryData] = await Promise.all([
        apiRequest('GET', 'suppliers/usage/itempurchase', queryParams),
        apiRequest('GET', 'items/purchase/history', queryParams)
      ]);

      if (summaryData?.list) setVendorSummary(summaryData.list);
      if (inventoryData?.list) setPurchaseData(inventoryData.list);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('error', 'Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemId, supplierId, dt, itemType) => {
    if (itemType === 'Base Item') {
      showToast('error', 'Cannot Delete', 'Base items must be deleted from Base Item Recipe dashboard');
      return;
    }

    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await apiRequest('POST', 'items/purchase/delete', { dt, supplierId, itemId });
      showToast('success', 'Deleted', 'Item deleted successfully');
      loadInventory();
    } catch (error) {
      console.error('Delete failed:', error);
      showToast('error', 'Error', 'Failed to delete item');
    }
  };

  const handleApply = async (itemId, supplierId, dt, quantity, totalPrice, unitQuantity, itemType) => {
    if (itemType === 'Base Item') {
      showToast('error', 'Cannot Update', 'Base items must be updated from Base Item Recipe dashboard');
      return;
    }

    try {
      await apiRequest('POST', 'items/purchase/apply', {
        list: [{ dt, supplierId, itemId, quantity, totalPrice, unitQuantity }]
      });
      showToast('success', 'Updated', 'Changes applied successfully');
      loadInventory();
    } catch (error) {
      console.error('Apply failed:', error);
      showToast('error', 'Error', 'Failed to apply changes');
    }
  };

  const exportToExcel = () => {
    const exportData = purchaseData.map(row => ({
      Date: row.dt,
      'Item ID': row.itemId,
      'Vendor Name': row.supplier.name,
      'Item Name': row.item.name,
      Quantity: row.quantity,
      'Total Price': row.totalPrice,
      'Item Price': row.itemPrice
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'StorePurchase');

    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    XLSX.writeFile(wb, `store_purchase_${timestamp}.xlsx`);
    showToast('success', 'Exported', 'Data exported successfully');
  };

  const moveCarousel = (direction) => {
    const newPosition = Math.max(0, Math.min(carouselPosition + direction, vendorSummary.length - 4));
    setCarouselPosition(newPosition);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <DashboardHeader onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="pt-[70px] pb-8 px-4 md:px-8">
        <div className="max-w-[90rem] mx-auto">
          <div className="bg-gradient-to-br from-[#4f46e5] to-[#3b82f6] rounded-t-2xl p-10 mb-8 shadow-lg">
            <h1 className="text-white text-3xl md:text-4xl font-bold mb-2">Store Purchase Dashboard</h1>
            <p className="text-blue-100 text-lg">Track and manage your store purchases efficiently</p>
          </div>

          <div className="flex justify-end mb-6">
            <button
              onClick={() => window.open('/add-item-purchase', '_blank')}
              className="bg-gradient-to-br from-[#4f46e5] to-[#3b82f6] text-white px-6 py-3 rounded-lg font-semibold hover:from-[#4338ca] hover:to-[#2563eb] transition-all shadow-md"
            >
              ➕ Add Store Purchase
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Date Range</label>
                <select
                  value={dateFilter}
                  onChange={(e) => handleDateFilterChange(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/10 outline-none bg-white"
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
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/10 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/10 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Vendors</label>
                <MultiSelect
                  options={vendors.map(v => ({ value: v.id, label: v.name }))}
                  selected={selectedVendors}
                  onChange={setSelectedVendors}
                  placeholder="Select Vendors"
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
                  className="flex-1 bg-gradient-to-br from-[#4f46e5] to-[#3b82f6] text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:from-[#4338ca] hover:to-[#2563eb] transition-all shadow-sm"
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

          {!loading && vendorSummary.length > 0 && (
            <div className="relative mb-8 px-12">
              <button
                onClick={() => moveCarousel(-1)}
                disabled={carouselPosition === 0}
                className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed z-10"
              >
                ←
              </button>

              <div className="overflow-hidden">
                <div
                  className="flex gap-6 transition-transform duration-500"
                  style={{ transform: `translateX(-${carouselPosition * 25}%)` }}
                >
                  {vendorSummary.map((supplier, idx) => (
                    <div
                      key={idx}
                      className="flex-shrink-0 w-1/4 bg-white rounded-xl p-6 shadow-md border-t-4 border-blue-500 cursor-pointer hover:shadow-lg transition-all"
                      onClick={() => window.open(`/vendor-summary?vendors=${supplier.id}&startdt=${startDate}&enddt=${endDate}`, '_blank')}
                    >
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">{supplier.supplier.name}</h3>
                      <div className="flex justify-between text-sm text-gray-600 mb-4">
                        <span>Total Items</span>
                        <span className="font-medium">{supplier.purchase.itemCount}</span>
                      </div>
                      <div className="pt-4 border-t border-gray-200">
                        <span className="text-sm font-medium text-gray-700">Total Purchase: </span>
                        <span className="text-lg font-bold text-blue-600">₹{supplier.purchase.totalPrice.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => moveCarousel(1)}
                disabled={carouselPosition >= vendorSummary.length - 4}
                className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed z-10"
              >
                →
              </button>
            </div>
          )}

          <div className="flex justify-between items-center mb-6">
            <div className="text-gray-700 font-medium">
              Total Items: {purchaseData.length}
              {purchaseData.length > 0 && (
                <span> | Total: ₹{purchaseData.reduce((sum, item) => sum + parseFloat(item.totalPrice || 0), 0).toLocaleString()}</span>
              )}
            </div>
            <button
              onClick={exportToExcel}
              disabled={purchaseData.length === 0}
              className="bg-gradient-to-br from-gray-600 to-gray-700 text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:from-gray-700 hover:to-gray-800 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📂 Export
            </button>
          </div>

          {purchaseData.length === 0 && !loading && (
            <div className="text-center py-16 bg-white rounded-xl">
              <svg className="h-12 w-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900">No data available</h3>
              <p className="mt-1 text-gray-500">Try adjusting your filters or selecting a different date range</p>
            </div>
          )}

          {purchaseData.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Item ID</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Vendor Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Item Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Quantity</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Total Price</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Item Price</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {purchaseData.map((row, idx) => (
                      <PurchaseRow
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
          )}
        </div>
      </main>
    </div>
  );
}

function PurchaseRow({ row, onDelete, onApply }) {
  const [quantity, setQuantity] = useState(row.quantity);
  const [totalPrice, setTotalPrice] = useState(row.totalPrice);
  const [hasChanges, setHasChanges] = useState(false);
  const [itemPrice, setItemPrice] = useState(row.itemPrice);

  const isBaseItem = row.itemType === 'Base Item';

  useEffect(() => {
    const changed = quantity !== row.quantity || totalPrice !== row.totalPrice;
    setHasChanges(changed);

    if (quantity > 0 && totalPrice > 0) {
      const unitQuantity = row.item?.unitQuantity || 1;
      const calculated = ((totalPrice * unitQuantity) / quantity).toFixed(2);
      setItemPrice(calculated);
    }
  }, [quantity, totalPrice, row]);

  if (!row.supplier || !row.item) {
    return null;
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-4 text-sm text-gray-900">{row.dt}</td>
      <td className="px-4 py-4 text-sm text-gray-900">{row.itemId}</td>
      <td className="px-4 py-4 text-sm text-gray-900">{row.supplier.name}</td>
      <td className="px-4 py-4 text-sm text-blue-600 cursor-pointer hover:underline">
        {row.item.name}
      </td>
      <td className="px-4 py-4">
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
          disabled={isBaseItem}
          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </td>
      <td className="px-4 py-4">
        <input
          type="number"
          value={totalPrice}
          onChange={(e) => setTotalPrice(parseFloat(e.target.value) || 0)}
          disabled={isBaseItem}
          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </td>
      <td className="px-4 py-4 text-sm text-gray-900">{itemPrice}</td>
      <td className="px-4 py-4">
        <div className="flex gap-2">
          {hasChanges && !isBaseItem && (
            <button
              onClick={() => onApply(row.itemId, row.supplierId, row.dt, quantity, totalPrice, row.item?.unitQuantity || 1, row.itemType)}
              className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-3 py-1 rounded text-xs font-semibold hover:from-blue-600 hover:to-blue-700 transition-all"
            >
              Apply
            </button>
          )}
          <button
            onClick={() => onDelete(row.itemId, row.supplierId, row.dt, row.itemType)}
            className="bg-gradient-to-br from-red-500 to-red-600 text-white px-3 py-1 rounded text-xs font-semibold hover:from-red-600 hover:to-red-700 transition-all"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
