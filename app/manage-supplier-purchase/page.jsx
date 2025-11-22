'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import MultiSelect from '@/components/MultiSelect';
import { apiRequest } from '@/lib/api';
import * as XLSX from 'xlsx';
import { showToast } from '@/components/ToastContainer';

export default function ManageSupplierPurchasePage() {  const searchParams = useSearchParams();

  const [dateFilter, setDateFilter] = useState('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const [purchaseTypeFilter, setPurchaseTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [purchaseData, setPurchaseData] = useState([]);
  const [supplierSummary, setSupplierSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);

  const [showPopup, setShowPopup] = useState(false);
  const [popupMode, setPopupMode] = useState('add');
  const [popupTitle, setPopupTitle] = useState('Add Purchase');
  const [purchaseTypeId, setPurchaseTypeId] = useState(1);
  const [popupSuppliers, setPopupSuppliers] = useState([]);

  const [formData, setFormData] = useState({
    id: null,
    purchaseDate: '',
    supplierId: '',
    notes: '',
    invoiceNumber: '',
    purchaseAmount: '',
    purchaseTaxAmount: '',
    status: 'PENDING',
    paymentDate: '',
    paymentAmount: '',
    paymentTaxAmount: ''
  });

  useEffect(() => {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

    const suppliersParam = searchParams.get('suppliers');
    const startDtParam = searchParams.get('startdt');
    const endDtParam = searchParams.get('enddt');
    const statusParam = searchParams.get('status');

    if (startDtParam && endDtParam) {
      setDateFilter('custom');
      setStartDate(startDtParam);
      setEndDate(endDtParam);
    } else {
      setStartDate(today);
      setEndDate(today);
    }

    if (statusParam) {
      setStatusFilter(statusParam);
    }

    loadSuppliers(suppliersParam);
  }, [searchParams]);

  const loadSuppliers = async (suppliersParam) => {
    try {
      const data = await apiRequest('GET', 'suppliers/list');
      setSuppliers(data.list || []);

      if (suppliersParam) {
        setSelectedSuppliers(suppliersParam.split(','));
      }

      loadInventory();
    } catch (error) {
      console.error('Error loading suppliers:', error);
      showToast('error', 'Error', 'Failed to load suppliers');
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
    setPurchaseData([]);
    setSupplierSummary([]);

    const queryParams = {
      startdt: startDate,
      enddt: endDate,
      suppliers: selectedSuppliers.join(','),
      status: statusFilter,
      type: purchaseTypeFilter
    };

    try {
      const [summaryData, inventoryData] = await Promise.all([
        apiRequest('GET', 'suppliers/expenses/list', queryParams),
        apiRequest('GET', 'suppliers/expense/history', queryParams)
      ]);

      if (summaryData?.list) {
        setSupplierSummary(summaryData.list);
      }

      if (inventoryData?.list) {
        setPurchaseData(inventoryData.list);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('error', 'Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await apiRequest('POST', 'suppliers/expense/delete', { id });

      if (response.count >= 1) {
        showToast('success', 'Deleted', 'Item deleted successfully');
        loadInventory();
      } else {
        showToast('error', 'Error', 'Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      showToast('error', 'Error', 'Failed to delete item');
    }
  };

  const openAddPurchasePopup = async (typeId) => {
    setPurchaseTypeId(typeId);
    setPopupMode('add');
    setPopupTitle(typeId === 1 ? 'Add COGS Expense' : 'Add Fixed/Other Expense');

    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    setFormData({
      id: null,
      purchaseDate: today,
      supplierId: '',
      notes: '',
      invoiceNumber: '',
      purchaseAmount: '',
      purchaseTaxAmount: '',
      status: 'PENDING',
      paymentDate: '',
      paymentAmount: '',
      paymentTaxAmount: ''
    });

    try {
      const data = await apiRequest('GET', 'suppliers/list', { type: typeId });
      setPopupSuppliers(data.list || []);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }

    setShowPopup(true);
  };

  const openUpdatePopup = async (row) => {
    setPurchaseTypeId(row.purchaseTypeId);
    setPopupMode('update');
    setPopupTitle('Update Expense');

    setFormData({
      id: row.id,
      purchaseDate: row.dt,
      supplierId: row.supplierId,
      notes: row.notes || '',
      invoiceNumber: row.invoiceNumber || '',
      purchaseAmount: row.purchaseAmount,
      purchaseTaxAmount: row.taxAmount,
      status: row.status || 'PENDING',
      paymentDate: '',
      paymentAmount: '',
      paymentTaxAmount: ''
    });

    try {
      const data = await apiRequest('GET', 'suppliers/list', { type: row.purchaseTypeId });
      setPopupSuppliers(data.list || []);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }

    setShowPopup(true);
  };

  const handleSubmitPurchase = async (e) => {
    e.preventDefault();

    const payload = {
      id: formData.id,
      purchaseTypeId: purchaseTypeId,
      purchaseDate: formData.purchaseDate,
      supplierId: parseInt(formData.supplierId),
      notes: formData.notes || null,
      invoiceNumber: formData.invoiceNumber || null,
      purchaseAmount: parseFloat(formData.purchaseAmount) || 0,
      purchaseTaxAmount: parseFloat(formData.purchaseTaxAmount) || 0,
      status: formData.status,
      paymentDate: formData.paymentDate || null,
      paymentAmount: parseFloat(formData.paymentAmount) || 0,
      paymentTaxAmount: parseFloat(formData.paymentTaxAmount) || 0
    };

    try {
      await apiRequest('POST', 'suppliers/expense/upsert', payload);
      showToast('success', 'Success', `Purchase ${popupMode === 'add' ? 'added' : 'updated'} successfully!`);
      setShowPopup(false);
      loadInventory();
    } catch (error) {
      console.error('Error submitting purchase:', error);
      showToast('error', 'Error', 'Failed to submit purchase');
    }
  };

  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    setFormData(prev => {
      const updated = { ...prev, status: newStatus };

      if (newStatus === 'COMPLETED' && prev.status !== 'COMPLETED') {
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        updated.paymentDate = today;
        updated.paymentAmount = prev.purchaseAmount;
        updated.paymentTaxAmount = prev.purchaseTaxAmount;
      }

      return updated;
    });
  };

  const exportToExcel = () => {
    if (purchaseData.length === 0) return;

    const exportData = purchaseData.map(row => ({
      'Date': row.dt,
      'Vendor Name': row.supplier?.name || '',
      'Purchase Type': row.purchaseTypeId === 1 ? 'COGS Expense' : 'Fixed/Other Expense',
      'Purchase Amount': row.purchaseAmount,
      'Tax Amount': row.taxAmount,
      'Payment Status': row.status,
      'Invoice': row.invoiceNumber || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Expenses');

    const now = new Date();
    const timestamp = now.toISOString().slice(0, 19).replace(/[-T:]/g, '');
    const fileName = `expenses_${timestamp}.xlsx`;

    XLSX.writeFile(wb, fileName);
    showToast('success', 'Success', 'Export successful!');
  };

  const moveCarousel = (direction) => {
    const track = document.querySelector('.carousel-track');
    const items = track?.querySelectorAll('.carousel-item');
    if (!items || items.length === 0) return;

    const itemWidth = items[0].offsetWidth + 24;
    const itemsPerView = Math.floor(track.offsetWidth / itemWidth);
    const maxPosition = Math.max(0, items.length - itemsPerView);

    const newPosition = Math.max(0, Math.min(currentPosition + direction, maxPosition));
    setCurrentPosition(newPosition);
  };

  const totalItems = purchaseData.length;
  const totalCost = purchaseData.reduce((sum, row) => {
    return sum + (parseFloat(row.purchaseAmount) || 0) + (parseFloat(row.taxAmount) || 0);
  }, 0);

  return (
    <DashboardLayout title="Expense Dashboard">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-t-2xl p-10 mb-8 shadow-lg">
            <h1 className="text-white text-3xl md:text-4xl font-bold mb-2">Expense Dashboard</h1>
            <p className="text-blue-50 text-lg">Update the bills for COGS/Raw material purchases, fixed expenses, and other operational expenses.</p>
          </div>

          <div className="flex justify-end gap-4 mb-6">
            <button
              onClick={() => openAddPurchasePopup(1)}
              className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm"
            >
              Add COGS Expense
            </button>
            <button
              onClick={() => openAddPurchasePopup(2)}
              className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm"
            >
              Add Fixed/Other Expense
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
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
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Suppliers</label>
                <MultiSelect
                  options={suppliers.map(s => ({ value: s.id, label: s.name }))}
                  selected={selectedSuppliers}
                  onChange={setSelectedSuppliers}
                  placeholder="Select Suppliers"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Purchase Type</label>
                <select
                  value={purchaseTypeFilter}
                  onChange={(e) => setPurchaseTypeFilter(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none bg-white"
                >
                  <option value="">All Types</option>
                  <option value="1">COGS Expense</option>
                  <option value="2">Fixed/Other Expense</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Payment Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none bg-white"
                >
                  <option value="">All Status</option>
                  <option value="none">None</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
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

          {!loading && supplierSummary.length > 0 && (
            <div className="relative mb-8 px-12">
              <button
                onClick={() => moveCarousel(-1)}
                disabled={currentPosition === 0}
                className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed z-10"
              >
                ←
              </button>
              <button
                onClick={() => moveCarousel(1)}
                className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed z-10"
              >
                →
              </button>
              <div className="overflow-hidden">
                <div
                  className="carousel-track flex gap-6 transition-transform duration-500"
                  style={{ transform: `translateX(-${currentPosition * (25 + 1.5)}%)` }}
                >
                  {supplierSummary.map((supplier) => {
                    const purchaseAmount = parseFloat(supplier.expense?.purchaseAmount) || 0;
                    const taxAmount = parseFloat(supplier.expense?.taxAmount) || 0;

                    return (
                      <div
                        key={supplier.id}
                        className="carousel-item flex-shrink-0 w-1/4 bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">{supplier.supplier?.name}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm text-gray-600">Purchase</span>
                            <div className="text-lg font-semibold">₹{Math.round(purchaseAmount).toLocaleString()}</div>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">Tax</span>
                            <div className="text-lg font-semibold">₹{Math.round(taxAmount).toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {!loading && purchaseData.length > 0 && (
            <>
              <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div className="text-gray-700 font-medium">
                  Total Items: {totalItems} | Total Cost: ₹{totalCost.toFixed(2)}
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
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Vendor Name</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Purchase Type</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Purchase Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Tax Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Payment Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Invoice</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {purchaseData.map((row) => (
                        <tr key={row.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 text-sm text-gray-900">{row.dt}</td>
                          <td className="px-4 py-4 text-sm text-gray-900">{row.supplier?.name}</td>
                          <td className="px-4 py-4 text-sm text-gray-900">
                            {row.purchaseTypeId === 1 ? 'COGS Expense' : 'Fixed/Other Expense'}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900">{row.purchaseAmount}</td>
                          <td className="px-4 py-4 text-sm text-gray-900">{row.taxAmount}</td>
                          <td className="px-4 py-4 text-sm text-gray-900">{row.status}</td>
                          <td className="px-4 py-4 text-sm text-gray-900">{row.invoiceNumber || '-'}</td>
                          <td className="px-4 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => openUpdatePopup(row)}
                                className="bg-gradient-to-br from-green-500 to-green-600 text-white px-3 py-1 rounded text-xs font-semibold hover:from-green-600 hover:to-green-700 transition-all"
                              >
                                Update
                              </button>
                              <button
                                onClick={() => handleDelete(row.id)}
                                className="bg-gradient-to-br from-red-500 to-red-600 text-white px-3 py-1 rounded text-xs font-semibold hover:from-red-600 hover:to-red-700 transition-all"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {!loading && purchaseData.length === 0 && (
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
