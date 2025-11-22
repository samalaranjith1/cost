'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { apiRequest } from '@/lib/api';
import { showToast } from '@/components/ToastContainer';
import { Loader2, FileText } from 'lucide-react';

export default function StatementDashboardPage() {  const searchParams = useSearchParams();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [transactionType, setTransactionType] = useState('');
  const [statementData, setStatementData] = useState([]);
  const [summaryCards, setSummaryCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [columnFilters, setColumnFilters] = useState({});

  useEffect(() => {
    initializeDates();
  }, []);

  const initializeDates = () => {
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const startDtParam = searchParams.get('startdt');
    const endDtParam = searchParams.get('enddt');
    const typeParam = searchParams.get('transactiontype');

    setStartDate(startDtParam || weekAgo.toISOString().split('T')[0]);
    setEndDate(endDtParam || today.toISOString().split('T')[0]);
    setTransactionType(typeParam || '');
  };

  const loadStatementData = async () => {
    if (!startDate || !endDate) {
      showToast('warning', 'Warning', 'Please select both start and end dates');
      return;
    }

    setLoading(true);

    try {
      const params = {
        startdt: startDate,
        enddt: endDate,
        type: transactionType,
        entities: searchParams.get('entities') || ''
      };

      const [dataResult, summaryResult] = await Promise.all([
        apiRequest('GET', 'statement/list', params),
        apiRequest('GET', 'statement/summary', params)
      ]);

      setStatementData(dataResult.list || []);
      setSummaryCards(summaryResult.list || []);
      showToast('success', 'Success', 'Data loaded successfully');
    } catch (error) {
      console.error('Error loading statement data:', error);
      showToast('error', 'Error', 'Failed to load statement data');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setTransactionType('');
    setColumnFilters({});
    loadStatementData();
  };

  const handleColumnFilter = (column, value) => {
    setColumnFilters((prev) => ({
      ...prev,
      [column]: value.toLowerCase()
    }));
  };

  const filteredData = statementData.filter((row) => {
    return Object.entries(columnFilters).every(([column, filterValue]) => {
      if (!filterValue) return true;
      const cellValue = String(row[column] || '').toLowerCase();
      return cellValue.includes(filterValue);
    });
  });

  const formatCurrency = (value) => {
    return value ? `₹${parseInt(value).toLocaleString('en-IN')}` : '';
  };

  const cardColors = [
    'from-green-500 to-green-600',
    'from-blue-500 to-blue-600',
    'from-red-500 to-red-600',
    'from-amber-500 to-amber-600',
    'from-purple-500 to-purple-600',
    'from-pink-500 to-pink-600',
    'from-teal-500 to-teal-600',
    'from-orange-500 to-orange-600'
  ];

  return (
    <DashboardLayout title="Bank Statement Dashboard">
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-t-2xl p-8 mb-8 shadow-lg">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Bank Statement Dashboard</h1>
            <p className="text-green-100 text-lg">Analyze your bank statement data efficiently</p>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-4">
              <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                />
              </div>

              <select
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:border-green-500 focus:ring-2 focus:ring-green-200"
              >
                <option value="">Transaction Type</option>
                <option value="DEBIT">Debit</option>
                <option value="CREDIT">Credit</option>
              </select>
            </div>

            <div className="flex justify-end gap-4">
              <button
                onClick={loadStatementData}
                className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-2.5 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-md"
              >
                Apply
              </button>
              <button
                onClick={clearFilters}
                className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-200 transition-all border border-gray-300"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {loading && (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-10 h-10 animate-spin text-green-600" />
            </div>
          )}

          {summaryCards.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {summaryCards.map((card, index) => {
                const colorClass = cardColors[index % cardColors.length];
                const formattedValue =
                  typeof card.value === 'number' && (card.name.includes('Amount') || card.name.includes('Credit'))
                    ? formatCurrency(card.value)
                    : card.value?.toLocaleString('en-IN') || card.value;

                return (
                  <div
                    key={index}
                    className={`bg-gradient-to-br ${colorClass} rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow`}
                  >
                    <div className="text-lg font-semibold mb-2 opacity-90">{card.name}</div>
                    <div className="text-2xl md:text-3xl font-bold mb-1">{formattedValue}</div>
                    <div className="text-sm opacity-80">{card.description}</div>
                    <div className="text-xs mt-2 opacity-70">Transactions: {card.count}</div>
                  </div>
                );
              })}
            </div>
          )}

          {filteredData.length > 0 ? (
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        <div>Date</div>
                        <input
                          type="text"
                          placeholder="Filter..."
                          onChange={(e) => handleColumnFilter('dt', e.target.value)}
                          className="mt-1 w-full text-xs border border-gray-300 rounded px-2 py-1 focus:border-green-500 focus:ring-1 focus:ring-green-200"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        <div>Transaction Type</div>
                        <input
                          type="text"
                          placeholder="Filter..."
                          onChange={(e) => handleColumnFilter('transactionType', e.target.value)}
                          className="mt-1 w-full text-xs border border-gray-300 rounded px-2 py-1 focus:border-green-500 focus:ring-1 focus:ring-green-200"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        <div>Transfer Type</div>
                        <input
                          type="text"
                          placeholder="Filter..."
                          onChange={(e) => handleColumnFilter('transferType', e.target.value)}
                          className="mt-1 w-full text-xs border border-gray-300 rounded px-2 py-1 focus:border-green-500 focus:ring-1 focus:ring-green-200"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        <div>Entity</div>
                        <input
                          type="text"
                          placeholder="Filter..."
                          onChange={(e) => handleColumnFilter('entity', e.target.value)}
                          className="mt-1 w-full text-xs border border-gray-300 rounded px-2 py-1 focus:border-green-500 focus:ring-1 focus:ring-green-200"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        <div>UPI Medium</div>
                        <input
                          type="text"
                          placeholder="Filter..."
                          onChange={(e) => handleColumnFilter('upiMedium', e.target.value)}
                          className="mt-1 w-full text-xs border border-gray-300 rounded px-2 py-1 focus:border-green-500 focus:ring-1 focus:ring-green-200"
                        />
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                        <div>Debit</div>
                        <input
                          type="text"
                          placeholder="Filter..."
                          onChange={(e) => handleColumnFilter('debitAmount', e.target.value)}
                          className="mt-1 w-full text-xs border border-gray-300 rounded px-2 py-1 focus:border-green-500 focus:ring-1 focus:ring-green-200"
                        />
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                        <div>Credit</div>
                        <input
                          type="text"
                          placeholder="Filter..."
                          onChange={(e) => handleColumnFilter('creditAmount', e.target.value)}
                          className="mt-1 w-full text-xs border border-gray-300 rounded px-2 py-1 focus:border-green-500 focus:ring-1 focus:ring-green-200"
                        />
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                        <div>Closing Balance</div>
                        <input
                          type="text"
                          placeholder="Filter..."
                          onChange={(e) => handleColumnFilter('closingBalance', e.target.value)}
                          className="mt-1 w-full text-xs border border-gray-300 rounded px-2 py-1 focus:border-green-500 focus:ring-1 focus:ring-green-200"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        <div>Reference Number</div>
                        <input
                          type="text"
                          placeholder="Filter..."
                          onChange={(e) => handleColumnFilter('referenceNumber', e.target.value)}
                          className="mt-1 w-full text-xs border border-gray-300 rounded px-2 py-1 focus:border-green-500 focus:ring-1 focus:ring-green-200"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        <div>Narration</div>
                        <input
                          type="text"
                          placeholder="Filter..."
                          onChange={(e) => handleColumnFilter('narration', e.target.value)}
                          className="mt-1 w-full text-xs border border-gray-300 rounded px-2 py-1 focus:border-green-500 focus:ring-1 focus:ring-green-200"
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredData.map((entry, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-700">{entry.dt || ''}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{entry.transactionType || ''}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{entry.transferType || ''}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{entry.entity || ''}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{entry.upiMedium || ''}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 text-right">{formatCurrency(entry.debitAmount)}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 text-right">{formatCurrency(entry.creditAmount)}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 text-right">{formatCurrency(entry.closingBalance)}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{entry.referenceNumber || ''}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{entry.narration || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            !loading && (
              <div className="text-center py-16 text-gray-500 bg-white rounded-xl shadow-md">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-medium mb-2">No data available</h3>
                <p className="text-gray-400">Try adjusting your filters or selecting a different date range</p>
              </div>
            )
          )}
    </DashboardLayout>
  );
}
