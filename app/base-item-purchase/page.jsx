'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { apiRequest } from '@/lib/api';
import { showToast } from '@/components/ToastContainer';

export default function BaseItemPurchasePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [baseItem, setBaseItem] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [measureValue, setMeasureValue] = useState(0);
  const [originalMeasureValue, setOriginalMeasureValue] = useState(0);
  const [dateFilter, setDateFilter] = useState('today');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [loading, setLoading] = useState(false);

  const baseItemId = searchParams.get('items');

  useEffect(() => {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    setPurchaseDate(today);

    if (baseItemId) {
      loadBaseItemDetails();
      loadDepartments();
      loadIngredients();
    } else {
      showToast('error', 'Error', "Can't find Base Item");
    }
  }, [baseItemId]);

  const loadBaseItemDetails = async () => {
    try {
      const data = await apiRequest('GET', `baseitems/${baseItemId}`);
      setBaseItem(data);
      setMeasureValue(data.unitQuantity);
      setOriginalMeasureValue(data.unitQuantity);
    } catch (error) {
      console.error('Error loading base item:', error);
      showToast('error', 'Error', 'Failed to load base item details');
    }
  };

  const loadDepartments = async () => {
    try {
      const data = await apiRequest('GET', 'departments/list');
      setDepartments(data.list || []);
    } catch (error) {
      console.error('Error loading departments:', error);
      showToast('error', 'Error', 'Failed to load departments');
    }
  };

  const loadIngredients = async () => {
    try {
      const data = await apiRequest('GET', `baseitems/${baseItemId}/ingredients`);
      setIngredients(data.list || []);
    } catch (error) {
      console.error('Error loading ingredients:', error);
      showToast('error', 'Error', 'Failed to load ingredients');
    }
  };

  const handleDateFilterChange = (value) => {
    setDateFilter(value);
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

    if (value === 'today') {
      setPurchaseDate(today);
    } else if (value === 'yesterday') {
      setPurchaseDate(yesterdayStr);
    }
  };

  const updateAllQuantities = () => {
    const newMeasureValue = parseFloat(measureValue);
    if (isNaN(newMeasureValue) || newMeasureValue <= 0) {
      showToast('error', 'Error', 'Please enter a valid measurement value');
      return;
    }

    const ratio = newMeasureValue / originalMeasureValue;

    const updatedIngredients = ingredients.map(ingredient => {
      const originalQuantity = parseFloat(ingredient.ingredientQuantity);
      const totalPrice = parseFloat(ingredient.ingredientPrice);
      const unit = ingredient.item.unit;

      const actualNewQuantity = originalQuantity * ratio;
      let newQuantity = actualNewQuantity;

      if (unit === 'GM' || unit === 'ML') {
        newQuantity = Math.round(actualNewQuantity);
      }

      const quantityRatio = newQuantity / originalQuantity;
      const newPrice = totalPrice * quantityRatio;

      return {
        ...ingredient,
        displayQuantity: newQuantity,
        displayPrice: newPrice
      };
    });

    setIngredients(updatedIngredients);
    showToast('success', 'Success', 'Quantities updated successfully!');
  };

  const handleRefresh = () => {
    setMeasureValue(originalMeasureValue);
    loadIngredients();
  };

  const handleSubmit = async () => {
    if (!selectedDepartment) {
      showToast('error', 'Error', 'Please select a department');
      return;
    }

    if (!purchaseDate) {
      showToast('error', 'Error', 'Please select a date');
      return;
    }

    const purchaseQuantity = parseFloat(measureValue);
    if (isNaN(purchaseQuantity) || purchaseQuantity <= 0) {
      showToast('error', 'Error', 'Please enter a valid quantity to prepare');
      return;
    }

    const items = ingredients.map(ingredient => ({
      itemId: ingredient.itemId,
      ingredientQuantity: ingredient.displayQuantity || ingredient.ingredientQuantity,
      ingredientPrice: ingredient.displayPrice || ingredient.ingredientPrice
    }));

    const totalCost = items.reduce((sum, item) => sum + item.ingredientPrice, 0);
    const costPerUnit = totalCost * (baseItem.unitQuantity / purchaseQuantity);

    const payload = {
      dt: purchaseDate,
      departmentId: selectedDepartment,
      baseItemId,
      purchaseQuantity,
      unitQuantity: baseItem.unitQuantity,
      unit: baseItem.unit,
      items
    };

    const departmentName = departments.find(d => d.id === selectedDepartment)?.name || 'Selected Department';

    const confirmed = confirm(
      `Confirm Preparation\n\n` +
      `Preparing on: ${purchaseDate}\n` +
      `Preparing by: ${departmentName}\n` +
      `Quantity to prepare: ${purchaseQuantity} ${baseItem.unit}\n` +
      `Total ingredients: ${items.length}\n` +
      `Total cost of ingredients: ₹${totalCost.toFixed(2)}\n` +
      `Cost per Unit (${baseItem.unitQuantity} ${baseItem.unit}): ₹${costPerUnit.toFixed(2)}\n\n` +
      `Do you want to purchase these ingredients to prepare ${baseItem.name}?`
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      const response = await apiRequest('POST', 'baseitems/purchase/upsert', payload);

      if (response.count >= 1) {
        showToast('success', 'Success', 'Purchase completed successfully!');
        setOriginalMeasureValue(purchaseQuantity);
        loadIngredients();
      } else {
        showToast('error', 'Error', 'Failed to submit purchase');
      }
    } catch (error) {
      console.error('Error submitting purchase:', error);
      showToast('error', 'Error', 'Failed to submit purchase');
    } finally {
      setLoading(false);
    }
  };

  const totalItems = ingredients.length;
  const totalPrice = ingredients.reduce(
    (sum, item) => sum + (item.displayPrice || item.ingredientPrice),
    0
  );

  return (
    <DashboardLayout title={baseItem ? `Purchase Ingredients for ${baseItem.name}` : 'Purchase Ingredients'}>
      <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {baseItem ? baseItem.name : 'Loading...'}
              </h1>
              <p className="text-gray-600">
                Update the preparation quantity of the base item to purchase respective ingredients
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preparation Quantity</label>
                  <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
                    <input
                      type="number"
                      value={measureValue}
                      onChange={(e) => setMeasureValue(e.target.value)}
                      step="0.01"
                      className="flex-1 text-center font-medium border-none focus:outline-none"
                    />
                    <span className="text-blue-700 font-medium bg-blue-50 px-3 py-1 rounded">
                      {baseItem?.unit}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                  <select
                    value={dateFilter}
                    onChange={(e) => handleDateFilterChange(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none"
                  >
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="custom">Custom Date</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    disabled={dateFilter !== 'custom'}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Departments</label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none"
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={updateAllQuantities}
                  className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm"
                >
                  Update Quantities
                </button>
                <button
                  onClick={handleRefresh}
                  className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm"
                >
                  🔄 Reset
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-gradient-to-br from-green-500 to-green-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : '✓ Purchase Ingredients'}
                </button>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Ingredients</h2>
                <div className="flex gap-6 text-sm">
                  <span className="font-semibold">Total Items: {totalItems}</span>
                  <span className="font-semibold text-blue-600">Total Cost: ₹{totalPrice.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-blue-600 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Item</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Unit Quantity</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Unit Price</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Ingredient Quantity</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Ingredient Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {ingredients.map((ingredient) => (
                      <tr key={ingredient.itemId} className="hover:bg-blue-50 transition-colors">
                        <td className="px-4 py-3 text-sm">
                          <span
                            onClick={() => router.push(`/item-summary?items=${ingredient.itemId}`)}
                            className="text-blue-600 font-medium cursor-pointer hover:underline"
                          >
                            {ingredient.item.name}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">₹{ingredient.unitQuantity.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm font-medium">₹{ingredient.unitPrice.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm">
                          {(ingredient.displayQuantity || ingredient.ingredientQuantity).toLocaleString()} {ingredient.item.unit}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-blue-600">
                          ₹{(ingredient.displayPrice || ingredient.ingredientPrice).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {ingredients.length === 0 && (
                  <div className="text-center py-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-600">No ingredients found for this base item.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
    </DashboardLayout>
  );
}
