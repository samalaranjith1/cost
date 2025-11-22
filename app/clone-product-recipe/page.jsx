'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { apiRequest } from '@/lib/api';
import { showToast } from '@/components/ToastContainer';

export default function CloneProductRecipePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [sourceProduct, setSourceProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeMultiplier, setActiveMultiplier] = useState(null);

  const productId = searchParams.get('items');

  useEffect(() => {
    if (productId) {
      loadSourceProduct();
      loadProducts();
      loadIngredients();
    } else {
      showToast('error', 'Error', "Can't find Menu Item");
    }
  }, [productId]);

  const loadSourceProduct = async () => {
    try {
      const data = await apiRequest('GET', `products/${productId}`);
      setSourceProduct(data);
    } catch (error) {
      console.error('Error loading product:', error);
      showToast('error', 'Error', 'Failed to load product details');
    }
  };

  const loadProducts = async () => {
    try {
      const data = await apiRequest('GET', 'products/list');
      const filteredProducts = (data.list || []).filter(p => p.id !== productId);
      setProducts(filteredProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      showToast('error', 'Error', 'Failed to load products');
    }
  };

  const loadIngredients = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('GET', `products/${productId}/directingredients`);
      setIngredients(data.list || []);
    } catch (error) {
      console.error('Error loading ingredients:', error);
      showToast('error', 'Error', 'Failed to load ingredients');
    } finally {
      setLoading(false);
    }
  };

  const adjustQuantities = (factor, multiplierName) => {
    setActiveMultiplier(multiplierName);

    const updatedIngredients = ingredients.map(ingredient => {
      const newQuantity = ingredient.ingredientQuantity * factor;
      const unitPrice = ingredient.unitPrice;
      const unitQuantity = ingredient.item?.unitQuantity || ingredient.unitQuantity;
      const newPrice = (newQuantity / unitQuantity) * unitPrice;

      return {
        ...ingredient,
        ingredientQuantity: newQuantity,
        ingredientPrice: newPrice
      };
    });

    setIngredients(updatedIngredients);
    showToast('success', 'Success', `All quantities adjusted by ${factor}x`);
  };

  const handleReset = () => {
    setActiveMultiplier(null);
    loadIngredients();
  };

  const handleQuantityChange = (itemId, newQuantity) => {
    const updatedIngredients = ingredients.map(ingredient => {
      if (ingredient.itemId === itemId) {
        const unitPrice = ingredient.unitPrice;
        const unitQuantity = ingredient.item?.unitQuantity || ingredient.unitQuantity;
        const newPrice = (parseFloat(newQuantity) / unitQuantity) * unitPrice;

        return {
          ...ingredient,
          ingredientQuantity: parseFloat(newQuantity),
          ingredientPrice: newPrice
        };
      }
      return ingredient;
    });

    setIngredients(updatedIngredients);
  };

  const handleClone = async () => {
    if (!selectedProduct) {
      showToast('error', 'Error', 'Please select a product to clone to');
      return;
    }

    const data = ingredients.map(ingredient => ({
      itemId: ingredient.itemId,
      ingredientQuantity: ingredient.ingredientQuantity
    }));

    if (data.length === 0) {
      showToast('error', 'Error', 'No recipe items found to clone');
      return;
    }

    setLoading(true);

    try {
      const response = await apiRequest('POST', 'products/ingredients/upsert', {
        productId: selectedProduct,
        list: data
      });

      if (response.count >= 1) {
        showToast('success', 'Success', 'Recipe cloned successfully!');
        setSelectedProduct('');
      } else {
        showToast('error', 'Error', 'Failed to clone recipe');
      }
    } catch (error) {
      console.error('Error cloning recipe:', error);
      showToast('error', 'Error', 'Failed to clone recipe');
    } finally {
      setLoading(false);
    }
  };

  const totalItems = ingredients.length;
  const totalCost = ingredients.reduce((sum, item) => sum + parseFloat(item.ingredientPrice), 0);

  return (
    <DashboardLayout title="Clone Recipe">

        <div className="max-w-7xl mx-auto p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {sourceProduct ? `Cloning Recipe of ${sourceProduct.name}` : 'Clone Recipe'}
            </h1>
          </div>

          <div className="bg-white rounded-2xl p-8 mb-8 shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Clone To</h2>
              <button
                onClick={handleClone}
                disabled={!selectedProduct || loading}
                className={`px-6 py-2.5 rounded-lg font-semibold text-white transition-all ${
                  selectedProduct && !loading
                    ? 'bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 cursor-pointer'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                {loading ? 'Cloning...' : 'Submit'}
              </button>
            </div>

            <div className="bg-gray-50 border border-blue-200 rounded-xl p-4">
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none"
              >
                <option value="">Select Item to Clone</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>{product.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {sourceProduct ? `Recipe of ${sourceProduct.name}` : 'Recipes'}
              </h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => adjustQuantities(0.25, 'quarter')}
                  disabled={activeMultiplier === 'quarter'}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeMultiplier === 'quarter'
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700'
                  }`}
                >
                  1/4x (Full to Quarter)
                </button>
                <button
                  onClick={() => adjustQuantities(0.5, 'half')}
                  disabled={activeMultiplier === 'half'}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeMultiplier === 'half'
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700'
                  }`}
                >
                  1/2x (Full to Half)
                </button>
                <button
                  onClick={() => adjustQuantities(2, 'double')}
                  disabled={activeMultiplier === 'double'}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeMultiplier === 'double'
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700'
                  }`}
                >
                  2x (Half to Full)
                </button>
                <button
                  onClick={handleReset}
                  className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:from-blue-600 hover:to-blue-700 transition-all"
                >
                  🔄 Reset
                </button>
              </div>
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
                          {ingredient.item?.name}
                        </span>
                        {ingredient.baseItemId && (
                          <span className="ml-2 bg-teal-500 text-white text-xs px-2 py-0.5 rounded">
                            Base Item
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {ingredient.item?.unitQuantity || ingredient.unitQuantity}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        ₹{ingredient.unitPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <input
                          type="number"
                          value={ingredient.ingredientQuantity}
                          onChange={(e) => handleQuantityChange(ingredient.itemId, e.target.value)}
                          className="w-24 border border-gray-300 rounded px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-blue-600">
                        ₹{ingredient.ingredientPrice.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {ingredients.length === 0 && !loading && (
                <div className="text-center py-12">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-600">No ingredients found to clone.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
  );

}
