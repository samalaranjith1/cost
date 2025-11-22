'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import MultiSelect from '@/components/MultiSelect';
import { apiRequest } from '@/lib/api';
import * as XLSX from 'xlsx';
import { showToast } from '@/components/ToastContainer';

export default function ManageSupplierPaymentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [dateFilter, setDateFilter] = useState('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const [paymentsData, setPaymentsData] = useState([]);
  const [supplierSummary, setSupplierSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);

  useEffect(() => {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

    const suppliersParam = searchParams.get('suppliers');
    const startDtParam = searchParams.get('startdt');
    const endDtParam = searchParams.get('enddt');

    if (startDtParam && endDtParam) {
      setDateFilter('custom');
      setStartDate(startDtParam);
      setEndDate(endDtParam);
    } else {
      setStartDate(today);
      setEndDate(today);
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
    setPaymentsData([]);
    setSupplierSummary([]);

    const queryParams = {
      startdt: startDate,
      enddt: endDate,
      suppliers: selectedSuppliers.join(',')
    };

    try {
      const [summaryData, inventoryData] = await Promise.all([
        apiRequest('GET', 'suppliers/payments/list', queryParams),
        apiRequest('GET', 'suppliers/payment/history', queryParams)
      ]);

      if (summaryData?.list) {
        setSupplierSummary(summaryData.list);
      }

      if (inventoryData?.list) {
        setPaymentsData(inventoryData.list);
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
      const response = await apiRequest('POST', 'suppliers/payment/delete', { id });

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

  const handleApply = async (id, taxAmount, paymentAmount) => {
    try {
      const response = await apiRequest('POST', 'suppliers/payment/upsert', {
        id,
        taxAmount: parseFloat(taxAmount),
        paymentAmount: parseFloat(paymentAmount)
      });

      if (response.count >= 1) {
        showToast('success', 'Updated', 'Payment updated successfully');
        loadInventory();
      } else {
        showToast('error', 'Error', 'Failed to update payment');
      }
    } catch (error) {
      console.error('Error updating:', error);
      showToast('error', 'Error', 'Failed to update payment');
    }
  };

  const exportToExcel = () => {
    if (paymentsData.length === 0) return;

    const exportData = paymentsData.map(row => ({
      'Date': row.dt,
      'supplier Name': row.supplier?.name || '',
      'Purchase Type': row.purchaseTypeId === 2 ? 'Fixed/Other Expense' : 'COGS Expense',
      'Payment Amount': row.paymentAmount,
      'Tax Amount': row.taxAmount,
      'Invoice': row.invoiceNumber || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Payments');

    const now = new Date();
    const timestamp = now.toISOString().slice(0, 19).replace(/[-T:]/g, '');
    const fileName = `supplier_payments_${timestamp}.xlsx`;

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

  const totalItems = paymentsData.length;
  const totalCost = paymentsData.reduce((sum, row) => {
    return sum + (parseFloat(row.totalPaymentAmount) || 0);
  }, 0);

  return (
    <DashboardLayout title="Payments Dashboard">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-t-2xl p-10 mb-8 shadow-lg">
            <h1 className="text-white text-3xl md:text-4xl font-bold mb-2">Payments Dashboard</h1>
            <p className="text-blue-50 text-lg">Record all payments made towards COGS/Suppliers, Fixed Expenses, and Other Expenses.</p>
            <p className="text-blue-50 text-sm mt-2">If payment details were already entered during expense entry, there's no need to update them again.</p>
          </div>

          <div className="flex justify-end mb-6">
            <button
              onClick={() => router.push('/add-supplier-payment')}
              className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm"
            >
              ➕ Add Payment
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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
                    const taxAmount = parseFloat(supplier.payment?.taxAmount) || 0;
                    const paymentAmount = parseFloat(supplier.payment?.paymentAmount) || 0;
                    const totalAmount = parseFloat(supplier.payment?.totalAmount) || 0;

                    return (
                      <div
                        key={supplier.id}
                        className="carousel-item flex-shrink-0 w-1/4 bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">{supplier.supplier?.name}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <span className="text-xs text-gray-600">Payment</span>
                            <div className="text-base font-semibold">₹{Math.round(paymentAmount).toLocaleString()}</div>
                          </div>
                          <div>
                            <span className="text-xs text-gray-600">Tax</span>
                            <div className="text-base font-semibold">₹{Math.round(taxAmount).toLocaleString()}</div>
                          </div>
                          <div>
                            <span className="text-xs text-gray-600">Total</span>
                            <div className="text-base font-semibold">₹{Math.round(totalAmount).toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {!loading && paymentsData.length > 0 && (
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
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">supplier Name</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Purchase Type</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Payment Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Tax Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Invoice</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {paymentsData.map((row) => (
                        <PaymentRow
                          key={row.id}
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

          {!loading && paymentsData.length === 0 && (
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

function PaymentRow({ row, onDelete, onApply }) {
  const [paymentAmount, setPaymentAmount] = useState(row.paymentAmount);
  const [taxAmount, setTaxAmount] = useState(row.taxAmount);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setHasChanges(
      paymentAmount !== row.paymentAmount || taxAmount !== row.taxAmount
    );
  }, [paymentAmount, taxAmount, row.paymentAmount, row.taxAmount]);

  if (!row.supplier) {
    return null;
  }

  const purchaseType = row.purchaseTypeId === 2 ? 'Fixed/Other Expense' : 'COGS Expense';

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-4 text-sm text-gray-900">{row.dt}</td>
      <td className="px-4 py-4 text-sm text-gray-900">{row.supplier.name}</td>
      <td className="px-4 py-4 text-sm text-gray-900">{purchaseType}</td>
      <td className="px-4 py-4">
        <input
          type="number"
          value={paymentAmount}
          onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </td>
      <td className="px-4 py-4">
        <input
          type="number"
          value={taxAmount}
          onChange={(e) => setTaxAmount(parseFloat(e.target.value) || 0)}
          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </td>
      <td className="px-4 py-4 text-sm text-gray-900">{row.invoiceNumber || '-'}</td>
      <td className="px-4 py-4">
        <div className="flex gap-2">
          {hasChanges && (
            <button
              onClick={() => onApply(row.id, taxAmount, paymentAmount)}
              className="bg-gradient-to-br from-green-500 to-green-600 text-white px-3 py-1 rounded text-xs font-semibold hover:from-green-600 hover:to-green-700 transition-all"
            >
              Apply
            </button>
          )}
          <button
            onClick={() => onDelete(row.id)}
            className="bg-gradient-to-br from-red-500 to-red-600 text-white px-3 py-1 rounded text-xs font-semibold hover:from-red-600 hover:to-red-700 transition-all"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
