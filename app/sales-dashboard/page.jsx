'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { apiRequest, getUserDepartments, getRoleId } from '@/lib/api';
import { showToast } from '@/components/ToastContainer';
import { Loader2, TrendingUp } from 'lucide-react';
import MultiSelect from '@/components/MultiSelect';

export default function SalesDashboardPage() {  const searchParams = useSearchParams();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [departments, setDepartments] = useState([]);
  const [masterItems, setMasterItems] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedMasterItems, setSelectedMasterItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalItemsSold: 0,
    totalDiscount: 0
  });

  useEffect(() => {
    initializeDates();
    loadDropdownData();
  }, []);

  const initializeDates = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const startDtParam = searchParams.get('startdt');
    const endDtParam = searchParams.get('enddt');

    setStartDate(startDtParam || yesterdayStr);
    setEndDate(endDtParam || yesterdayStr);
  };

  const loadDropdownData = async () => {
    try {
      const [deptData, masterItemData, itemData] = await Promise.all([
        apiRequest('GET', 'departments/list'),
        apiRequest('GET', 'masterproducts/list'),
        apiRequest('GET', 'products/list')
      ]);

      setDepartments(deptData.list || []);
      setMasterItems(masterItemData.list || []);
      setItems(itemData.list || []);

      const deptParam = searchParams.get('departments');
      const masterItemsParam = searchParams.get('masteritems');
      const itemsParam = searchParams.get('items');

      if (deptParam) {
        setSelectedDepartments(deptParam.split(','));
      }
      if (masterItemsParam) {
        setSelectedMasterItems(masterItemsParam.split(','));
      }
      if (itemsParam) {
        setSelectedItems(itemsParam.split(','));
      }
    } catch (error) {
      console.error('Error loading dropdown data:', error);
      showToast('error', 'Error', 'Failed to load filters');
    }
  };

  const loadSalesData = async () => {
    if (!startDate || !endDate) {
      showToast('warning', 'Warning', 'Please select both start and end dates');
      return;
    }

    setLoading(true);

    try {
      const params = {
        startdt: startDate,
        enddt: endDate,
        departments: selectedDepartments.join(','),
        masterproducts: selectedMasterItems.join(','),
        products: selectedItems.join(',')
      };

      const data = await apiRequest('GET', 'sales/products/daily/list', params);
      const salesList = data.list || [];
      setSalesData(salesList);

      calculateSummary(salesList);
      showToast('success', 'Success', 'Data loaded successfully');
    } catch (error) {
      console.error('Error loading sales data:', error);
      showToast('error', 'Error', 'Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (data) => {
    let totalSales = 0;
    let totalOrders = 0;
    let totalItemsSold = 0;
    let totalDiscount = 0;

    data.forEach((entry) => {
      const sales = entry.sales || {};
      totalSales += parseInt(sales.netSales || 0);
      totalOrders += parseInt(sales.orders || 0);
      totalItemsSold += parseInt(sales.itemsSold || 0);
      totalDiscount += parseInt(sales.discount || 0);
    });

    setSummary({ totalSales, totalOrders, totalItemsSold, totalDiscount });
  };

  const clearFilters = () => {
    setSelectedDepartments([]);
    setSelectedMasterItems([]);
    setSelectedItems([]);
    loadSalesData();
  };

  const formatCurrency = (value) => {
    return `₹${parseInt(value || 0).toLocaleString('en-IN')}`;
  };

  return (
    <DashboardLayout title="Sales Dashboard">
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-t-2xl p-8 mb-8 shadow-lg">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Sales Dashboard</h1>
            <p className="text-green-100 text-lg">Track and analyze your sales data efficiently</p>
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

              <MultiSelect
                options={departments.map((d) => ({ value: d.id.toString(), label: d.name }))}
                value={selectedDepartments}
                onChange={setSelectedDepartments}
                placeholder="Select Departments"
              />

              <MultiSelect
                options={masterItems.map((m) => ({ value: m.id.toString(), label: m.name }))}
                value={selectedMasterItems}
                onChange={setSelectedMasterItems}
                placeholder="Select Master Menu Items"
              />

              <MultiSelect
                options={items.map((i) => ({ value: i.id.toString(), label: i.name }))}
                value={selectedItems}
                onChange={setSelectedItems}
                placeholder="Select Menu Items"
              />
            </div>

            <div className="flex justify-end gap-4">
              <button
                onClick={loadSalesData}
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

          <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-lg font-semibold mb-2 opacity-90">Total Sales</div>
              <div className="text-2xl md:text-3xl font-bold mb-1">{formatCurrency(summary.totalSales)}</div>
              <div className="text-sm opacity-80">Total Revenue</div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-lg font-semibold mb-2 opacity-90">Orders</div>
              <div className="text-2xl md:text-3xl font-bold mb-1">{summary.totalOrders.toLocaleString()}</div>
              <div className="text-sm opacity-80">Total Orders</div>
            </div>

            <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-lg font-semibold mb-2 opacity-90">Items Sold</div>
              <div className="text-2xl md:text-3xl font-bold mb-1">{summary.totalItemsSold.toLocaleString()}</div>
              <div className="text-sm opacity-80">Units Sold</div>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-lg font-semibold mb-2 opacity-90">Discount</div>
              <div className="text-2xl md:text-3xl font-bold mb-1">{formatCurrency(summary.totalDiscount)}</div>
              <div className="text-sm opacity-80">Total Discounts</div>
            </div>
          </div>

          {salesData.length > 0 ? (
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-2.5 md:px-4 md:py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                      <th className="px-3 py-2.5 md:px-4 md:py-3 text-left text-sm font-semibold text-gray-700">Department</th>
                      <th className="px-3 py-2.5 md:px-4 md:py-3 text-left text-sm font-semibold text-gray-700">Item</th>
                      <th className="px-3 py-2.5 md:px-4 md:py-3 text-left text-sm font-semibold text-gray-700">Master Item</th>
                      <th className="px-3 py-2.5 md:px-4 md:py-3 text-right text-sm font-semibold text-gray-700">Orders</th>
                      <th className="px-3 py-2.5 md:px-4 md:py-3 text-right text-sm font-semibold text-gray-700">Items Sold</th>
                      <th className="px-3 py-2.5 md:px-4 md:py-3 text-right text-sm font-semibold text-gray-700">Price</th>
                      <th className="px-3 py-2.5 md:px-4 md:py-3 text-right text-sm font-semibold text-gray-700">Net Sales</th>
                      <th className="px-3 py-2.5 md:px-4 md:py-3 text-right text-sm font-semibold text-gray-700">Discount</th>
                      <th className="px-3 py-2.5 md:px-4 md:py-3 text-right text-sm font-semibold text-gray-700">Tax</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {salesData.map((entry, index) => {
                      const sales = entry.sales || {};
                      return (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-2.5 md:px-4 md:py-3 text-sm text-gray-700">{entry.dt}</td>
                          <td className="px-3 py-2.5 md:px-4 md:py-3 text-sm text-gray-700">{entry.product?.departmentName}</td>
                          <td className="px-3 py-2.5 md:px-4 md:py-3 text-sm text-gray-700">{entry.product?.name}</td>
                          <td className="px-3 py-2.5 md:px-4 md:py-3 text-sm text-gray-700">{entry.product?.masterProductName}</td>
                          <td className="px-3 py-2.5 md:px-4 md:py-3 text-sm text-gray-700 text-right">{(sales.orders || 0).toLocaleString()}</td>
                          <td className="px-3 py-2.5 md:px-4 md:py-3 text-sm text-gray-700 text-right">{(sales.itemsSold || 0).toLocaleString()}</td>
                          <td className="px-3 py-2.5 md:px-4 md:py-3 text-sm text-gray-700 text-right">{entry.product?.price}</td>
                          <td className="px-3 py-2.5 md:px-4 md:py-3 text-sm font-semibold text-gray-900 text-right">{formatCurrency(sales.netSales)}</td>
                          <td className="px-3 py-2.5 md:px-4 md:py-3 text-sm text-gray-700 text-right">{formatCurrency(sales.discount)}</td>
                          <td className="px-3 py-2.5 md:px-4 md:py-3 text-sm text-gray-700 text-right">{formatCurrency(sales.tax)}</td>
                        </tr>
                      );
                    })}
                    <tr className="bg-gray-50 font-semibold border-t-2 border-gray-300">
                      <td colSpan="4" className="px-3 py-2.5 md:px-4 md:py-3 text-sm text-gray-900">Totals</td>
                      <td className="px-3 py-2.5 md:px-4 md:py-3 text-sm text-gray-900 text-right">{summary.totalOrders.toLocaleString()}</td>
                      <td className="px-3 py-2.5 md:px-4 md:py-3 text-sm text-gray-900 text-right">{summary.totalItemsSold.toLocaleString()}</td>
                      <td className="px-3 py-2.5 md:px-4 md:py-3 text-sm text-gray-900 text-right"></td>
                      <td className="px-3 py-2.5 md:px-4 md:py-3 text-sm text-gray-900 text-right">{formatCurrency(summary.totalSales)}</td>
                      <td className="px-3 py-2.5 md:px-4 md:py-3 text-sm text-gray-900 text-right">{formatCurrency(summary.totalDiscount)}</td>
                      <td className="px-3 py-2.5 md:px-4 md:py-3 text-sm text-gray-900 text-right"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            !loading && (
              <div className="text-center py-16 text-gray-500 bg-white rounded-xl shadow-md">
                <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-medium mb-2">No data available</h3>
                <p className="text-gray-400">Try adjusting your filters or selecting a different date range</p>
              </div>
            )
          )}
    </DashboardLayout>
  );
}
