'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { apiRequest } from '@/lib/api';
import { showToast } from '@/components/ToastContainer';

export default function UpdateProductRecipePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [product, setProduct] = useState(null);
  const [items, setItems] = useState([]);
  const [existingIngredients, setExistingIngredients] = useState([]);
  const [newRows, setNewRows] = useState([{ id: 1, itemId: '', quantity: '' }]);
  const [loading, setLoading] = useState(false);

  const productId = searchParams.get('items');

  useEffect(() => {
    if (productId) {
      loadProductDetails();
      loadItems();
      loadExistingIngredients();
    } else {
      showToast('error', 'Error', "Can't find Menu Item");
    }
  }, [productId]);

  const loadProductDetails = async () => {
    try {
      const data = await apiRequest('GET', `products/${productId}`);
      setProduct(data);
    } catch (error) {
      console.error('Error loading product:', error);
      showToast('error', 'Error', 'Failed to load product details');
    }
  };

  const loadItems = async () => {
    try {
      const data = await apiRequest('GET', 'items/list');
      setItems(data.list || []);
    } catch (error) {
      console.error('Error loading items:', error);
      showToast('error', 'Error', 'Failed to load items');
    }
  };

  const loadExistingIngredients = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('GET', `products/${productId}/directingredients`);
      setExistingIngredients(data.list || []);
    } catch (error) {
      console.error('Error loading ingredients:', error);
      showToast('error', 'Error', 'Failed to load ingredients');
    } finally {
      setLoading(false);
    }
  };

  const addRows = () => {
    const lastId = newRows.length > 0 ? newRows[newRows.length - 1].id : 0;
    const rows = [];
    for (let i = 1; i <= 3; i++) {
      rows.push({ id: lastId + i, itemId: '', quantity: '' });
    }
    setNewRows([...newRows, ...rows]);
  };

  const updateRow = (id, field, value) => {
    setNewRows(newRows.map(row => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const isFormValid = () => {
    return newRows.some(row => row.itemId && parseFloat(row.quantity) > 0);
  };

  const handleSubmitNew = async () => {
    const data = newRows
      .filter(row => row.itemId && row.quantity)
      .map(row => ({
        itemId: row.itemId,
        ingredientQuantity: parseFloat(row.quantity)
      }));

    if (data.length === 0) {
      showToast('error', 'Error', 'Please fill all fields before submitting');
      return;
    }

    setLoading(true);

    try {
      const response = await apiRequest('POST', 'products/ingredients/upsert', {
        productId,
        list: data
      });

      if (response.count >= 1) {
        showToast('success', 'Success', 'Recipe submitted successfully!');
        setNewRows([{ id: 1, itemId: '', quantity: '' }]);
        loadExistingIngredients();
      } else {
        showToast('error', 'Error', 'Failed to submit recipe');
      }
    } catch (error) {
      console.error('Error submitting recipe:', error);
      showToast('error', 'Error', 'Failed to submit recipe');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    try {
      await apiRequest('POST', 'products/ingredients/upsert', {
        productId,
        list: [{ itemId, ingredientQuantity: parseFloat(newQuantity) }]
      });
      showToast('success', 'Success', 'Quantity updated successfully!');
      loadExistingIngredients();
    } catch (error) {
      console.error('Error updating quantity:', error);
      showToast('error', 'Error', 'Failed to update quantity');
    }
  };

  const handleDelete = async (itemId) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await apiRequest('POST', `products/${productId}/ingredients/delete`, { itemId });

      if (response.count >= 1) {
        showToast('success', 'Deleted', 'Item deleted successfully!');
        loadExistingIngredients();
      } else {
        showToast('error', 'Error', 'Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      showToast('error', 'Error', 'Failed to delete item');
    }
  };

  const totalItems = existingIngredients.length;
  const totalCost = existingIngredients.reduce((sum, item) => sum + parseFloat(item.ingredientPrice), 0);

  return (
    <DashboardLayout title={product ? `Recipe for ${product.name}` : 'Menu Item Recipe'}>
      <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">{product?.name || 'Loading...'}</h1>
            {product && (
              <h3 className="text-xl text-gray-600 mt-2">
                {product.masterProductName} ({product.departmentName})
              </h3>
            )}
          </div>

          <div className="bg-white rounded-2xl p-8 mb-8 shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Add New Ingredients</h2>
              <button
                onClick={handleSubmitNew}
                disabled={!isFormValid() || loading}
                className={`px-6 py-2.5 rounded-lg font-semibold text-white transition-all ${
                  isFormValid() && !loading
                    ? 'bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 cursor-pointer'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                {loading ? 'Submitting...' : 'Submit Ingredients'}
              </button>
            </div>

            <div className="space-y-4 mb-4">
              {newRows.map((row) => (
                <div
                  key={row.id}
                  className="bg-gray-50 border border-blue-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div>
                    <select
                      value={row.itemId}
                      onChange={(e) => updateRow(row.id, 'itemId', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none"
                    >
                      <option value="">Select Item</option>
                      {items.map(item => (
                        <option key={item.id} value={item.id}>{item.alias || item.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <input
                      type="number"
                      value={row.quantity}
                      onChange={(e) => updateRow(row.id, 'quantity', e.target.value)}
                      min="0"
                      placeholder="Enter Quantity"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={addRows}
                className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all"
              >
                + Add
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Existing Ingredients</h2>
              <button
                onClick={loadExistingIngredients}
                className="bg-gradient-to-br from-green-500 to-green-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all"
              >
                🔄 Refresh
              </button>
            </div>

            <div className="flex gap-8 mb-6">
              <div className="text-sm">
                <span className="font-semibold">Total Items: </span>
                <span className="text-gray-700">{totalItems}</span>
              </div>
              <div className="text-sm">
                <span className="font-semibold">Total Cost: </span>
                <span className="text-blue-600 font-bold">₹{totalCost.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-blue-600 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Recipe</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Unit Quantity</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Unit Price</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Ingredient Quantity</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Ingredient Price</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {existingIngredients.map((ingredient) => (
                    <IngredientRow
                      key={ingredient.itemId}
                      ingredient={ingredient}
                      onUpdate={handleUpdateQuantity}
                      onDelete={handleDelete}
                      router={router}
                    />
                  ))}
                </tbody>
              </table>

              {existingIngredients.length === 0 && !loading && (
                <div className="text-center py-12">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-600">No ingredients added yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
    </DashboardLayout>
  );
}

function IngredientRow({ ingredient, onUpdate, onDelete, router }) {
  const [quantity, setQuantity] = useState(ingredient.ingredientQuantity);
  const [showApply, setShowApply] = useState(false);
  const [oldValue, setOldValue] = useState(null);

  const handleQuantityChange = (newValue) => {
    setQuantity(newValue);
    if (parseFloat(newValue) !== parseFloat(ingredient.ingredientQuantity)) {
      setShowApply(true);
      setOldValue(ingredient.ingredientQuantity);
    } else {
      setShowApply(false);
      setOldValue(null);
    }
  };

  const handleApply = () => {
    onUpdate(ingredient.itemId, quantity);
    setShowApply(false);
    setOldValue(null);
  };

  const unitQuantity = ingredient.item?.unitQuantity || ingredient.unitQuantity;
  const itemPrice = ingredient.unitPrice;
  const newTotalPrice = (parseFloat(quantity) / unitQuantity) * itemPrice;

  return (
    <tr className="hover:bg-blue-50 transition-colors">
      <td className="px-4 py-3 text-sm">
        <span
          onClick={() => router.push(`/item-summary?items=${ingredient.itemId}`)}
          className="text-blue-600 font-medium cursor-pointer hover:underline"
        >
          {ingredient.item?.name}
        </span>
        {ingredient.baseItemId && (
          <span className="ml-2 bg-teal-500 text-white text-xs px-2 py-0.5 rounded">Base Item</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm">₹{unitQuantity}</td>
      <td className="px-4 py-3 text-sm">₹{itemPrice}</td>
      <td className="px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            className="w-24 border border-gray-300 rounded px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          {oldValue && (
            <span className="text-xs text-gray-500">(old: {oldValue})</span>
          )}
          {showApply && (
            <button
              onClick={handleApply}
              className="bg-gradient-to-br from-green-500 to-green-600 text-white px-3 py-1 rounded text-xs font-semibold hover:from-green-600 hover:to-green-700 transition-all"
            >
              ✓ Apply
            </button>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-sm font-bold text-blue-600">
        ₹{newTotalPrice.toFixed(2)}
      </td>
      <td className="px-4 py-3">
        <button
          onClick={() => onDelete(ingredient.itemId)}
          className="bg-gradient-to-br from-red-500 to-red-600 text-white px-3 py-1 rounded text-xs font-semibold hover:from-red-600 hover:to-red-700 transition-all"
        >
          🗑 Delete
        </button>
      </td>
    </tr>
  );
}
