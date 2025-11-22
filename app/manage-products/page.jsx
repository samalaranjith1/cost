'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { apiRequest } from '@/lib/api';
import { showToast } from '@/components/ToastContainer';
import { RefreshCw, Plus, Download, Edit, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ManageProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [masterItems, setMasterItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [changedRows, setChangedRows] = useState(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsResponse, departmentsResponse, itemsResponse] = await Promise.all([
        apiRequest('GET', 'delicia-meta/menuitems'),
        apiRequest('GET', 'delicia/departments'),
        apiRequest('GET', 'delicia-meta/menumasteritems')
      ]);

      setProducts(
        productsResponse.list.map((product) => ({
          ...product,
          initialName: product.name,
          initialDepartmentId: product.departmentId,
          initialMasterItemId: product.masterItemId,
          initialPrice: product.price
        }))
      );
      setDepartments(departmentsResponse.list || []);
      setMasterItems(itemsResponse.list || []);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('error', 'Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    showToast('info', 'Info', 'Refreshing menu items...');
    loadData();
  };

  const handleAddProduct = () => {
    router.push('/add-products');
  };

  const handleChange = (id, field, value) => {
    setProducts(
      products.map((product) => {
        if (product.id === id) {
          const updated = { ...product, [field]: value };
          const hasChanges =
            updated.name !== updated.initialName ||
            updated.departmentId !== updated.initialDepartmentId ||
            updated.masterItemId !== updated.initialMasterItemId ||
            updated.price !== updated.initialPrice;

          if (hasChanges) {
            setChangedRows((prev) => new Set(prev).add(id));
          } else {
            setChangedRows((prev) => {
              const newSet = new Set(prev);
              newSet.delete(id);
              return newSet;
            });
          }
          return updated;
        }
        return product;
      })
    );
  };

  const handleApply = async (id) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;

    try {
      const response = await apiRequest('POST', 'delicia-meta/menuitem/apply', {
        list: [
          {
            id: product.id,
            name: product.name,
            departmentId: product.departmentId,
            masterItemId: product.masterItemId,
            price: product.price
          }
        ]
      });

      if (response.count >= 1) {
        showToast('success', 'Success', 'Changes applied successfully!');
        setProducts(
          products.map((p) =>
            p.id === id
              ? {
                  ...p,
                  initialName: p.name,
                  initialDepartmentId: p.departmentId,
                  initialMasterItemId: p.masterItemId,
                  initialPrice: p.price
                }
              : p
          )
        );
        setChangedRows((prev) => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      } else {
        showToast('error', 'Error', 'Failed to apply changes');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('error', 'Error', 'Failed to apply changes');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await apiRequest('POST', 'delicia-meta/menuitem/delete', { id });

      if (response.count >= 1) {
        showToast('success', 'Success', 'Item deleted successfully!');
        setProducts(products.filter((p) => p.id !== id));
      } else {
        showToast('error', 'Error', 'Failed to delete item');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('error', 'Error', 'Failed to delete item');
    }
  };

  const handleExport = () => {
    const exportData = products.map((product) => {
      const dept = departments.find((d) => d.id === product.departmentId);
      const masterItem = masterItems.find((m) => m.id === product.masterItemId);
      return {
        ID: product.id,
        'Item Name': product.name,
        Department: dept?.name || '',
        'Master Item': masterItem?.name || '',
        Price: product.price,
        'Last Week': product.weeklyItemsSold || 0,
        'Last Month': product.monthlyItemsSold || 0
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Menu Items');

    const timestamp = new Date().toISOString().slice(0, 19).replace(/[-T:]/g, '');
    XLSX.writeFile(wb, `menu_items_${timestamp}.xlsx`);

    showToast('success', 'Success', 'Export completed successfully!');
  };

  const itemsWithSalesLastWeek = products.filter((p) => (p.weeklyItemsSold || 0) > 0).length;
  const itemsWithSalesLastMonth = products.filter((p) => (p.monthlyItemsSold || 0) > 0).length;

  return (
    <DashboardLayout title="Manage Products">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
            <h1 className="text-2xl md:text-3xl font-semibold text-blue-600 text-center mb-6">
              Menu Items Management
            </h1>

            <div className="flex flex-wrap gap-3 mb-6 justify-end">
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-all text-sm font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={() => setEditMode(!editMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  editMode
                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                <Edit className="w-4 h-4" />
                {editMode ? 'Done Editing' : 'Edit Values'}
              </button>
              <button
                onClick={handleAddProduct}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-all text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Menu Item
              </button>
            </div>

            <div className="flex justify-between items-center mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm font-semibold text-gray-800">
                Total Items: {products.length}; Sales in last week: {itemsWithSalesLastWeek}; Sales in
                last month: {itemsWithSalesLastMonth}
              </div>
              <button
                onClick={handleExport}
                disabled={products.length === 0}
                className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Export to Excel
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <RefreshCw className="w-10 h-10 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full">
                  <thead className="bg-blue-600 text-white">
                    <tr>
                      <th className="px-3 py-3 text-left text-sm font-medium">ID</th>
                      <th className="px-3 py-3 text-left text-sm font-medium">Item Name</th>
                      <th className="px-3 py-3 text-left text-sm font-medium">Department</th>
                      <th className="px-3 py-3 text-left text-sm font-medium">Master Item</th>
                      <th className="px-3 py-3 text-left text-sm font-medium">Price</th>
                      <th className="px-3 py-3 text-left text-sm font-medium">Last Week</th>
                      <th className="px-3 py-3 text-left text-sm font-medium">Last Month</th>
                      <th className="px-3 py-3 text-left text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {products.map((product, index) => (
                      <tr
                        key={product.id}
                        className={`hover:bg-blue-50 transition-colors ${
                          changedRows.has(product.id)
                            ? 'bg-blue-100'
                            : index % 2 === 0
                            ? 'bg-white'
                            : 'bg-gray-50'
                        }`}
                      >
                        <td className="px-3 py-3 text-sm text-gray-700">{product.id}</td>
                        <td className="px-3 py-3 text-sm">
                          <input
                            type="text"
                            value={product.name}
                            onChange={(e) => handleChange(product.id, 'name', e.target.value)}
                            disabled={!editMode}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                          />
                        </td>
                        <td className="px-3 py-3 text-sm">
                          <select
                            value={product.departmentId}
                            onChange={(e) => handleChange(product.id, 'departmentId', e.target.value)}
                            disabled={!editMode}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                          >
                            <option value="">Select Department</option>
                            {departments.map((dept) => (
                              <option key={dept.id} value={dept.id}>
                                {dept.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-3 text-sm">
                          <select
                            value={product.masterItemId}
                            onChange={(e) => handleChange(product.id, 'masterItemId', e.target.value)}
                            disabled={!editMode}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                          >
                            <option value="">Select Item</option>
                            {masterItems.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-3 text-sm">
                          <input
                            type="number"
                            value={product.price}
                            onChange={(e) => handleChange(product.id, 'price', e.target.value)}
                            disabled={!editMode}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                          />
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-700">
                          {product.weeklyItemsSold || 0}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-700">
                          {product.monthlyItemsSold || 0}
                        </td>
                        <td className="px-3 py-3 text-sm">
                          <div className="flex gap-2">
                            {changedRows.has(product.id) && (
                              <button
                                onClick={() => handleApply(product.id)}
                                className="bg-green-600 text-white px-2 py-1.5 rounded hover:bg-green-700 transition-all text-xs"
                              >
                                Apply
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="flex items-center gap-1 bg-red-50 text-red-600 border border-red-600 px-2 py-1.5 rounded hover:bg-red-600 hover:text-white transition-all text-xs"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          )}
          </div>
    </DashboardLayout>
  );
}
