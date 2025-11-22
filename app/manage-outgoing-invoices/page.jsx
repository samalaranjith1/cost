'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import MultiSelect from '@/components/MultiSelect';
import { apiRequest } from '@/lib/api';
import { showToast } from '@/components/ToastContainer';
import * as XLSX from 'xlsx';

export default function ManageOutgoingInvoicesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [dateFilter, setDateFilter] = useState('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [changedRows, setChangedRows] = useState(new Set());

  useEffect(() => {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

    const customersParam = searchParams.get('customers');
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

    loadCustomers(customersParam);
  }, [searchParams]);

  const loadCustomers = async (customersParam) => {
    try {
      const data = await apiRequest('GET', 'customers/list');
      setCustomers(data.list || []);

      if (customersParam) {
        setSelectedCustomers(customersParam.split(','));
      }

      loadInvoices();
    } catch (error) {
      console.error('Error loading customers:', error);
      showToast('error', 'Error', 'Failed to load customers');
    }
  };

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const params = {
        startdt: startDate,
        enddt: endDate,
        customers: selectedCustomers.join(','),
        status: statusFilter
      };

      const data = await apiRequest('GET', 'invoices/list', params);
      setInvoices(data.list || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
      showToast('error', 'Error', 'Failed to load invoices');
    } finally {
      setLoading(false);
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

  const handleInvoiceChange = (id, field, value) => {
    setInvoices(invoices.map(inv =>
      inv.id === id ? { ...inv, [field]: value, hasChanges: true } : inv
    ));
    setChangedRows(new Set(changedRows).add(id));
  };

  const handleApply = async (invoice) => {
    try {
      const payload = {
        id: invoice.id,
        dt: invoice.dt,
        customerId: invoice.customerId,
        totalAmount: invoice.totalAmount,
        taxAmount: invoice.taxAmount,
        discountAmount: invoice.discountAmount || 0,
        finalAmount: invoice.finalAmount,
        paymentStatus: invoice.paymentStatus === 'NONE' ? null : invoice.paymentStatus,
        invoiceNumber: invoice.invoiceNumber,
        dueDate: invoice.dueDate
      };

      const response = await apiRequest('POST', 'invoices/upsert', payload);

      if (response.count >= 1) {
        showToast('success', 'Success', 'Changes applied successfully!');
        setInvoices(invoices.map(inv =>
          inv.id === invoice.id ? { ...inv, hasChanges: false } : inv
        ));
        const newChangedRows = new Set(changedRows);
        newChangedRows.delete(invoice.id);
        setChangedRows(newChangedRows);
      } else {
        showToast('error', 'Error', 'Failed to apply changes');
      }
    } catch (error) {
      console.error('Error applying changes:', error);
      showToast('error', 'Error', 'Failed to apply changes');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;

    try {
      const response = await apiRequest('POST', 'invoices/delete', { id });

      if (response.count >= 1) {
        showToast('success', 'Deleted', 'Invoice deleted successfully!');
        setInvoices(invoices.filter(inv => inv.id !== id));
      } else {
        showToast('error', 'Error', 'Failed to delete invoice');
      }
    } catch (error) {
      console.error('Error deleting invoice:', error);
      showToast('error', 'Error', 'Failed to delete invoice');
    }
  };

  const handleExport = () => {
    const exportData = invoices.map(inv => ({
      'Invoice Number': inv.invoiceNumber,
      'Date': inv.dt,
      'Customer Name': inv.customerName,
      'Due Date': inv.dueDate,
      'Total Amount': inv.totalAmount,
      'Tax Amount': inv.taxAmount,
      'Discount Amount': inv.discountAmount || 0,
      'Final Amount': inv.finalAmount,
      'Payment Status': inv.paymentStatus || 'NONE'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invoices');

    const now = new Date();
    const timestamp = now.toISOString().slice(0, 19).replace(/[-T:]/g, '');
    const fileName = `invoices_${timestamp}.xlsx`;

    XLSX.writeFile(wb, fileName);
    showToast('success', 'Success', 'Export successful!');
  };

  const totalItems = invoices.length;
  const totalPrice = invoices.reduce((sum, inv) => sum + parseFloat(inv.finalAmount || 0), 0);

  return (
    <DashboardLayout title="Manage Outgoing Invoices">
          <div className="bg-gradient-to-br from-indigo-600 to-blue-500 rounded-t-2xl p-10 mb-8 shadow-lg">
            <h1 className="text-white text-3xl md:text-4xl font-bold mb-2">Manage Outgoing Invoices</h1>
            <p className="text-indigo-100 text-lg">Manage invoices of your sales</p>
          </div>

          <div className="flex justify-end mb-6">
            <button
              onClick={() => router.push('/create-invoice')}
              className="bg-gradient-to-br from-indigo-600 to-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-blue-600 transition-all shadow-sm"
            >
              ➕ Create Invoice
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
              <div>
                <select
                  value={dateFilter}
                  onChange={(e) => handleDateFilterChange(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none"
                >
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              <div>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none ${dateFilter !== 'custom' ? 'hidden' : ''}`}
                />
              </div>

              <div>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none ${dateFilter !== 'custom' ? 'hidden' : ''}`}
                />
              </div>

              <div>
                <MultiSelect
                  options={customers.map(c => ({ value: c.id, label: c.name }))}
                  selected={selectedCustomers}
                  onChange={setSelectedCustomers}
                  placeholder="Select Customers"
                />
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none"
                >
                  <option value="">Payment Status</option>
                  <option value="none">None</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="Partially Paid">Partially Paid</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={loadInvoices}
                className="bg-gradient-to-br from-indigo-600 to-blue-500 text-white px-6 py-2.5 rounded-lg font-semibold hover:from-indigo-700 hover:to-blue-600 transition-all shadow-sm"
              >
                Fetch Data
              </button>
              <button
                onClick={loadInvoices}
                className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-200 transition-all"
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center mb-6">
            <div className="text-lg font-semibold text-gray-900">
              Total Items: {totalItems}; Total Price: ₹{totalPrice.toLocaleString()}
            </div>
            <button
              onClick={handleExport}
              disabled={totalItems === 0}
              className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
                totalItems === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-br from-gray-600 to-gray-700 text-white hover:from-gray-700 hover:to-gray-800'
              }`}
            >
              📂 Export
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Invoice</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Customer Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Due Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Total Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Tax Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Discount</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Final Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td
                          className="px-4 py-3 text-sm text-blue-600 cursor-pointer hover:underline"
                          onClick={() => router.push(`/create-invoice?invoices=${invoice.id}`)}
                        >
                          {invoice.invoiceNumber}
                        </td>
                        <td className="px-4 py-3 text-sm">{invoice.dt}</td>
                        <td
                          className="px-4 py-3 text-sm text-blue-600 cursor-pointer hover:underline"
                          onClick={() => router.push(`/customer-summary?customers=${invoice.customerId}`)}
                        >
                          {invoice.customerName}
                        </td>
                        <td className="px-4 py-3 text-sm">{invoice.dueDate}</td>
                        <td className="px-4 py-3 text-sm">
                          <input
                            type="number"
                            value={invoice.totalAmount}
                            onChange={(e) => handleInvoiceChange(invoice.id, 'totalAmount', e.target.value)}
                            className="w-24 border border-gray-300 rounded px-2 py-1 text-sm"
                            disabled
                          />
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <input
                            type="number"
                            value={invoice.taxAmount}
                            onChange={(e) => handleInvoiceChange(invoice.id, 'taxAmount', e.target.value)}
                            className="w-24 border border-gray-300 rounded px-2 py-1 text-sm"
                            disabled
                          />
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <input
                            type="number"
                            value={invoice.discountAmount || 0}
                            onChange={(e) => handleInvoiceChange(invoice.id, 'discountAmount', e.target.value)}
                            className="w-24 border border-gray-300 rounded px-2 py-1 text-sm"
                            disabled
                          />
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <input
                            type="number"
                            value={invoice.finalAmount}
                            onChange={(e) => handleInvoiceChange(invoice.id, 'finalAmount', e.target.value)}
                            className="w-24 border border-gray-300 rounded px-2 py-1 text-sm"
                            disabled
                          />
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <select
                            value={invoice.paymentStatus || 'NONE'}
                            onChange={(e) => handleInvoiceChange(invoice.id, 'paymentStatus', e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          >
                            <option value="NONE">NONE</option>
                            <option value="PENDING">PENDING</option>
                            <option value="PAID">PAID</option>
                            <option value="PARTIALLY PAID">PARTIALLY PAID</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDelete(invoice.id)}
                              className="bg-gradient-to-br from-red-500 to-red-600 text-white px-3 py-1 rounded text-xs font-semibold hover:from-red-600 hover:to-red-700"
                            >
                              Delete
                            </button>
                            {invoice.hasChanges && (
                              <button
                                onClick={() => handleApply(invoice)}
                                className="bg-gradient-to-br from-green-500 to-green-600 text-white px-3 py-1 rounded text-xs font-semibold hover:from-green-600 hover:to-green-700"
                              >
                                Apply
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {invoices.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-600">No invoices found</p>
                  </div>
                )}
              </div>
            )}
          </div>
    </DashboardLayout>
  );
}
