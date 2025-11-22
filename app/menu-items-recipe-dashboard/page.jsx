'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import MultiSelect from '@/components/MultiSelect';
import { apiRequest } from '@/lib/api';
import { showToast } from '@/components/ToastContainer';

export default function MenuItemsRecipeDashboardPage() {
  const router = useRouter();

  const [departments, setDepartments] = useState([]);
  const [masterItems, setMasterItems] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedMasterItems, setSelectedMasterItems] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    green: 0,
    orange: 0,
    red: 0,
    withoutRecipe: 0
  });

  useEffect(() => {
    loadDepartments();
    loadMasterItems();
    loadMenu();
  }, []);

  const loadDepartments = async () => {
    try {
      const data = await apiRequest('GET', 'departments/list');
      setDepartments(data.list || []);
    } catch (error) {
      console.error('Error loading departments:', error);
      showToast('error', 'Error', 'Failed to load departments');
    }
  };

  const loadMasterItems = async () => {
    try {
      const data = await apiRequest('GET', 'masterproducts/list');
      setMasterItems(data.list || []);
    } catch (error) {
      console.error('Error loading master items:', error);
      showToast('error', 'Error', 'Failed to load master items');
    }
  };

  const loadMenu = async () => {
    setLoading(true);
    try {
      const params = {
        departments: selectedDepartments.join(','),
        masterproducts: selectedMasterItems.join(',')
      };
      const data = await apiRequest('GET', 'products/makingcost/list', params);

      const items = data.list || [];
      setMenuItems(items);

      let total = 0, green = 0, orange = 0, red = 0, withRecipe = 0;

      items.forEach(entry => {
        total++;
        if (entry.product?.makingCost > 0) withRecipe++;

        const efficiency = entry.product?.efficiency || 0;
        if (efficiency > 40) red++;
        else if (efficiency > 30) orange++;
        else if (efficiency > 0) green++;
      });

      setStats({
        total,
        green,
        orange,
        red,
        withoutRecipe: total - withRecipe
      });
    } catch (error) {
      console.error('Error loading menu:', error);
      showToast('error', 'Error', 'Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  const getRowClass = (efficiency) => {
    if (efficiency > 40) return 'bg-red-50';
    if (efficiency > 30) return 'bg-orange-50';
    if (efficiency > 0) return 'bg-green-50';
    return 'bg-gray-50';
  };

  return (
    <DashboardLayout title="Menu Items Recipe Dashboard">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <h1 className="text-2xl md:text-3xl font-semibold text-center mb-6 text-gray-900">
              Menu Items Recipe Dashboard
            </h1>

            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Departments</label>
                  <MultiSelect
                    options={departments.map(d => ({ value: d.id, label: d.name }))}
                    selected={selectedDepartments}
                    onChange={setSelectedDepartments}
                    placeholder="Select Departments"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Master Menu Items</label>
                  <MultiSelect
                    options={masterItems.map(m => ({ value: m.id, label: m.name }))}
                    selected={selectedMasterItems}
                    onChange={setSelectedMasterItems}
                    placeholder="Select Master Menu Items"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={loadMenu}
                  className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 shadow-sm">
              <p className="text-sm font-semibold text-blue-700 mb-1">Total Items</p>
              <p className="text-2xl md:text-3xl font-bold text-blue-900">{stats.total}</p>
            </div>
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 shadow-sm">
              <p className="text-sm font-semibold text-green-700 mb-1">Cost less than 30%</p>
              <p className="text-2xl md:text-3xl font-bold text-green-900">{stats.green}</p>
            </div>
            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6 shadow-sm">
              <p className="text-sm font-semibold text-orange-700 mb-1">Cost between 30%-40%</p>
              <p className="text-2xl md:text-3xl font-bold text-orange-900">{stats.orange}</p>
            </div>
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 shadow-sm">
              <p className="text-sm font-semibold text-red-700 mb-1">Cost more than 40%</p>
              <p className="text-2xl md:text-3xl font-bold text-red-900">{stats.red}</p>
            </div>
            <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 shadow-sm">
              <p className="text-sm font-semibold text-gray-700 mb-1">Items Without Recipe</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900">{stats.withoutRecipe}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Department</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Master Product</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Price</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Making Cost</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Cost%</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Monthly Sales</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Monthly Cost</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Has Recipe</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">View Recipe</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Update Recipe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {menuItems.map((entry, idx) => (
                      <tr key={idx} className={`${getRowClass(entry.product?.efficiency || 0)} transition-colors`}>
                        <td className="px-4 py-3 text-sm cursor-pointer text-blue-600 hover:underline">
                          {entry.product?.departmentName}
                        </td>
                        <td className="px-4 py-3 text-sm cursor-pointer text-blue-600 hover:underline">
                          {entry.product?.masterProductName}
                        </td>
                        <td className="px-4 py-3 text-sm cursor-pointer text-blue-600 hover:underline">
                          {entry.product?.name}
                        </td>
                        <td className="px-4 py-3 text-sm">₹{entry.product?.price}</td>
                        <td className="px-4 py-3 text-sm">₹{entry.product?.makingCost}</td>
                        <td className="px-4 py-3 text-sm font-semibold">
                          {entry.product?.efficiency?.toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 text-sm">
                          ₹{entry.sales?.netSales?.toLocaleString() || 0}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          ₹{entry.totalMakingCost?.toLocaleString() || 0}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {entry.product?.makingCost ? (
                            <button
                              onClick={() => router.push(`/clone-product-recipe?items=${entry.productId}`)}
                              className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white px-3 py-1 rounded text-xs font-semibold hover:from-yellow-600 hover:to-yellow-700 transition-all"
                            >
                              📋 Clone
                            </button>
                          ) : (
                            <span className="text-red-600">✗ No</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => router.push(`/product-recipe-detail?items=${entry.productId}`)}
                            className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-3 py-1 rounded text-xs font-semibold hover:from-blue-600 hover:to-blue-700 transition-all"
                          >
                            View
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => router.push(`/update-product-recipe?items=${entry.productId}`)}
                            className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-3 py-1 rounded text-xs font-semibold hover:from-blue-600 hover:to-blue-700 transition-all"
                          >
                            ✎ Update
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {menuItems.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-600">No menu items found</p>
                  </div>
                )}
              </div>
            )}
          </div>
    </DashboardLayout>
  );
}
