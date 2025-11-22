'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import MultiSelect from '@/components/MultiSelect';
import { apiRequest } from '@/lib/api';
import { showToast } from '@/components/ToastContainer';

export default function ManageBaseItemPurchasePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState('baseItems');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [baseItems, setBaseItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [baseItemsData, setBaseItemsData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showIngredientsPopup, setShowIngredientsPopup] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [popupTitle, setPopupTitle] = useState('');

  useEffect(() => {
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const startDtParam = searchParams.get('startdt');
    const endDtParam = searchParams.get('enddt');
    const itemsParam = searchParams.get('items');

    if (startDtParam && endDtParam) {
      setStartDate(startDtParam);
      setEndDate(endDtParam);
    } else {
      setStartDate(weekAgo.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    }

    loadBaseItems(itemsParam);
  }, [searchParams]);

  const loadBaseItems = async (itemsParam) => {
    try {
      const data = await apiRequest('GET', 'baseitems/list');
      setBaseItems(data.list || []);

      if (itemsParam) {
        setSelectedItems(itemsParam.split(','));
      }

      loadTabData('baseItems');
    } catch (error) {
      console.error('Error loading base items:', error);
      showToast('error', 'Error', 'Failed to load base items');
    }
  };

  const loadTabData = async (tab) => {
    if (tab === 'baseItems') {
      await loadBaseItemsList();
    } else if (tab === 'history') {
      await loadHistory();
    }
  };

  const loadBaseItemsList = async () => {
    setLoading(true);
    try {
      const params = { items: selectedItems.join(',') };
      const data = await apiRequest('GET', 'baseitems/list', params);
      setBaseItemsData(data.list || []);
    } catch (error) {
      console.error('Error loading base items list:', error);
      showToast('error', 'Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    setLoading(true);
    try {
      const params = {
        startdt: startDate,
        enddt: endDate,
        items: selectedItems.join(','),
        limit: 500
      };
      const data = await apiRequest('GET', 'baseitems/purchase/history', params);
      setHistoryData(data.list || []);
    } catch (error) {
      console.error('Error loading history:', error);
      showToast('error', 'Error', 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    loadTabData(tab);
  };

  const handleFetch = () => {
    loadTabData(activeTab);
  };

  const handleDelete = async (itemId, departmentId, dt) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    const payload = { dt, departmentId, baseItemId: itemId };

    try {
      const response = await apiRequest('POST', 'baseitems/purchase/delete', payload);

      if (response.count >= 1) {
        showToast('success', 'Deleted', 'Item deleted successfully');
        loadHistory();
      } else {
        showToast('error', 'Error', 'Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      showToast('error', 'Error', 'Failed to delete item');
    }
  };

  const showIngredients = async (itemId, departmentId, dt, itemName) => {
    setPopupTitle(`${dt} - ${itemName}`);

    try {
      const params = { baseItemId: itemId, departmentId, dt };
      const data = await apiRequest('GET', 'baseitems/purchase/ingredients', params);
      setSelectedIngredients(data.list || []);
      setShowIngredientsPopup(true);
    } catch (error) {
      console.error('Error loading ingredients:', error);
      showToast('error', 'Error', 'Failed to load ingredients');
    }
  };

  return (
    <DashboardLayout title="Manage Base Items">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-t-2xl p-10 mb-8 shadow-lg">
            <h1 className="text-white text-3xl md:text-4xl font-bold mb-2">Manage Base Items</h1>
            <p className="text-orange-50 text-lg">Update Recipe, Purchase Base Item and History of purchases</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Items</label>
                <MultiSelect
                  options={baseItems.map(item => ({ value: item.id, label: item.name }))}
                  selected={selectedItems}
                  onChange={setSelectedItems}
                  placeholder="Select Items"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleFetch}
                  className="w-full bg-gradient-to-br from-orange-500 to-orange-600 text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:from-orange-600 hover:to-orange-700 transition-all shadow-sm"
                >
                  Fetch
                </button>
              </div>
            </div>
          </div>

          <div className="mb-4 md:mb-6">
            <div className="flex border-b border-gray-200 mb-6">
              <button
                onClick={() => handleTabChange('baseItems')}
                className={`px-6 py-3 font-semibold text-sm transition-all ${
                  activeTab === 'baseItems'
                    ? 'text-orange-600 border-b-2 border-orange-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Recipes & Purchase
              </button>
              <button
                onClick={() => handleTabChange('history')}
                className={`px-6 py-3 font-semibold text-sm transition-all ${
                  activeTab === 'history'
                    ? 'text-orange-600 border-b-2 border-orange-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                History
              </button>
            </div>

            {loading && (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              </div>
            )}

            {!loading && activeTab === 'baseItems' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Item</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Unit Price</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Purchase</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Update Recipe</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {baseItemsData.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 text-sm text-gray-900">{item.name}</td>
                          <td className="px-4 py-4 text-sm text-gray-900">₹{item.unitPrice}</td>
                          <td className="px-4 py-4 text-center">
                            {item.makingCost ? (
                              <button
                                onClick={() => router.push(`/base-item-purchase?items=${item.id}`)}
                                className="bg-gradient-to-br from-green-500 to-green-600 text-white px-3 py-1 rounded text-xs font-semibold hover:from-green-600 hover:to-green-700 transition-all"
                              >
                                Purchase
                              </button>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <button
                              onClick={() => router.push(`/update-base-item-recipe?items=${item.id}`)}
                              className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white px-3 py-1 rounded text-xs font-semibold hover:from-yellow-600 hover:to-yellow-700 transition-all"
                            >
                              {item.makingCost ? 'Update' : 'Add'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {baseItemsData.length === 0 && (
                  <div className="text-center py-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900">No data available</h3>
                  </div>
                )}
              </div>
            )}

            {!loading && activeTab === 'history' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Department</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Item</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Unit Quantity</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Item Price</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Total Quantity</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Total Price</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Ingredients</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {historyData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-4 text-sm text-gray-900">{row.dt}</td>
                          <td className="px-4 py-4 text-sm text-gray-900">{row.department?.name}</td>
                          <td className="px-4 py-4 text-sm text-gray-900">{row.baseItem?.name}</td>
                          <td className="px-4 py-4 text-sm text-gray-900">
                            {row.baseItem?.unitQuantity}{row.baseItem?.unit}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900">₹{row.itemPrice?.toLocaleString()}</td>
                          <td className="px-4 py-4 text-sm text-gray-900">
                            {row.quantity?.toLocaleString()}{row.baseItem?.unit}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900">₹{row.totalPrice?.toLocaleString()}</td>
                          <td className="px-4 py-4 text-center">
                            <button
                              onClick={() => showIngredients(row.itemId, row.department?.id, row.dt, row.baseItem?.name)}
                              className="bg-gradient-to-br from-green-500 to-green-600 text-white px-3 py-1 rounded text-xs font-semibold hover:from-green-600 hover:to-green-700 transition-all"
                            >
                              Ingredients
                            </button>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <button
                              onClick={() => handleDelete(row.itemId, row.department?.id, row.dt)}
                              className="bg-gradient-to-br from-red-500 to-red-600 text-white px-3 py-1 rounded text-xs font-semibold hover:from-red-600 hover:to-red-700 transition-all"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {historyData.length === 0 && (
                  <div className="text-center py-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900">No data available</h3>
                  </div>
                )}
              </div>
            )}
          </div>

        {showIngredientsPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-semibold">{popupTitle}</h3>
              <button
                onClick={() => setShowIngredientsPopup(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {selectedIngredients.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-3 border-b-2 border-gray-300 font-semibold text-sm">
                    <span className="flex-1">Ingredient</span>
                    <span className="w-32 text-center">Quantity</span>
                    <span className="w-24 text-right">Price</span>
                  </div>
                  {selectedIngredients.map((ingredient, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="flex-1 text-sm">{ingredient.name}</span>
                      <span className="w-32 text-center text-sm">
                        {ingredient.quantity} {ingredient.unit}
                      </span>
                      <span className="w-24 text-right text-sm font-semibold">₹{ingredient.totalPrice}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No ingredients found for this item.</p>
              )}
            </div>
          </div>
        </div>
        )}
    </DashboardLayout>
  );
}
