'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { apiRequest } from '@/lib/api';
import { showToast } from '@/components/ToastContainer';

export default function ProductRecipeDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [product, setProduct] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [groupedData, setGroupedData] = useState({});
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [loading, setLoading] = useState(false);

  const productId = searchParams.get('items');
  const storeItems = searchParams.get('storeitems') || '';

  useEffect(() => {
    if (productId) {
      loadProductDetails();
      loadIngredients();
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

  const loadIngredients = async () => {
    setLoading(true);
    try {
      const params = storeItems ? { storeitems: storeItems } : {};
      const data = await apiRequest('GET', `products/${productId}/ingredients`, params);
      const list = data.list || [];
      setIngredients(list);

      const grouped = groupDataByBaseItem(list);
      setGroupedData(grouped);
    } catch (error) {
      console.error('Error loading ingredients:', error);
      showToast('error', 'Error', 'Failed to load ingredients');
    } finally {
      setLoading(false);
    }
  };

  const groupDataByBaseItem = (data) => {
    const grouped = {};

    data.forEach(item => {
      const baseItemName = item.baseItem?.name || 'Unknown';
      if (!grouped[baseItemName]) {
        grouped[baseItemName] = [];
      }
      grouped[baseItemName].push(item);
    });

    return grouped;
  };

  const toggleGroup = (baseItemName) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [baseItemName]: !prev[baseItemName]
    }));
  };

  const totalItems = ingredients.length;
  const totalPrice = ingredients.reduce((sum, item) => sum + parseFloat(item.ingredientPrice), 0);

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

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Ingredients</h2>
            </div>

            <div className="flex gap-8 mb-6">
              <div className="text-sm">
                <span className="font-semibold">Total Items: </span>
                <span className="text-gray-700">{totalItems}</span>
              </div>
              <div className="text-sm">
                <span className="font-semibold">Total Price: </span>
                <span className="text-blue-600 font-bold">₹{totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-blue-600 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Base Item</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Ingredient</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Unit Quantity</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Unit Price</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Ingredient Quantity</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Ingredient Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.keys(groupedData).map((baseItemName) => {
                      const group = groupedData[baseItemName];
                      const hasMasterRow = group.some(item => item.baseItemId === item.itemId);
                      const masterRow = group.find(item => item.baseItemId === item.itemId);
                      const childRows = group.filter(item => item.baseItemId !== item.itemId);
                      const isCollapsed = collapsedGroups[baseItemName];

                      if (hasMasterRow && masterRow) {
                        return (
                          <>
                            <tr key={`master-${masterRow.baseItemId}`} className="bg-blue-50">
                              <td className="px-4 py-3 text-sm">
                                {group.length > 1 && (
                                  <button
                                    onClick={() => toggleGroup(baseItemName)}
                                    className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-200 text-blue-700 font-bold text-xs mr-2 transition-transform"
                                    style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
                                  >
                                    ▼
                                  </button>
                                )}
                                <span className="font-semibold text-blue-700">
                                  {masterRow.baseItem?.name}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm font-semibold text-blue-700">
                                {masterRow.item.name}
                              </td>
                              <td className="px-4 py-3 text-sm font-semibold text-blue-700">
                                ₹{masterRow.unitQuantity}
                              </td>
                              <td className="px-4 py-3 text-sm font-semibold text-blue-700">
                                ₹{masterRow.unitPrice}
                              </td>
                              <td className="px-4 py-3 text-sm font-semibold text-blue-700">
                                {masterRow.ingredientQuantity}
                              </td>
                              <td className="px-4 py-3 text-sm font-bold text-blue-600">
                                ₹{masterRow.ingredientPrice.toFixed(2)}
                              </td>
                            </tr>
                            {!isCollapsed && childRows.map((item, idx) => (
                              <tr key={`child-${item.itemId}-${idx}`} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm pl-12 relative">
                                  <span className="absolute left-8 top-1/2 w-2 h-px bg-gray-400"></span>
                                  {item.baseItem?.name}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <span
                                    onClick={() => router.push(`/item-summary?items=${item.itemId}`)}
                                    className="text-blue-600 cursor-pointer hover:underline"
                                  >
                                    {item.item.name}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm">{item.unitQuantity}</td>
                                <td className="px-4 py-3 text-sm">₹{item.unitPrice.toFixed(2)}</td>
                                <td className="px-4 py-3 text-sm">{item.ingredientQuantity}</td>
                                <td className="px-4 py-3 text-sm">₹{item.ingredientPrice.toFixed(2)}</td>
                              </tr>
                            ))}
                          </>
                        );
                      } else {
                        return group.map((item, idx) => (
                          <tr key={`${item.itemId}-${idx}`} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">
                              <span
                                onClick={() => router.push(`/update-base-item-recipe?items=${item.baseItemId}`)}
                                className="text-gray-600 font-medium cursor-pointer hover:underline"
                              >
                                {item.baseItem?.name || '-'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span
                                onClick={() => router.push(`/item-summary?items=${item.itemId}`)}
                                className="text-blue-600 font-medium cursor-pointer hover:underline"
                              >
                                {item.item.name}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-blue-600">
                              {item.unitQuantity}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-blue-600">
                              ₹{item.unitPrice.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-blue-600">
                              {item.ingredientQuantity}
                            </td>
                            <td className="px-4 py-3 text-sm font-bold text-blue-600">
                              ₹{item.ingredientPrice.toFixed(2)}
                            </td>
                          </tr>
                        ));
                      }
                    })}
                  </tbody>
                </table>
              )}

              {ingredients.length === 0 && !loading && (
                <div className="text-center py-12">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-600">No ingredients found for this item.</p>
                </div>
              )}
            </div>
          </div>
        </div>
    </DashboardLayout>
  );
}
