'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { apiRequest } from '@/lib/api';
import { showToast } from '@/components/ToastContainer';
import { RefreshCw, Plus, Download, Edit, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';

const UNITS = ['PCS', 'GM', 'BOTTLE', 'ML', 'KG', 'CYLINDER', 'PKTS', 'CASE', 'PKT', 'TIN', 'CYLINDERS', 'LTR'];

export default function ManageStoreItemsPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [itemGroups, setItemGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [changedRows, setChangedRows] = useState(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [itemsResponse, groupsResponse] = await Promise.all([
        apiRequest('GET', 'delicia-meta/items'),
        apiRequest('GET', 'delicia-meta/itemgroups')
      ]);

      setItems(
        itemsResponse.list.map((item) => ({
          ...item,
          initialName: item.name,
          initialUnit: item.unit,
          initialMeasure: item.measure,
          initialPrice: item.price,
          initialGroupId: item.groupId
        }))
      );
      setItemGroups(groupsResponse.list || []);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('error', 'Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    showToast('info', 'Info', 'Refreshing store items...');
    loadData();
  };

  const handleAddItem = () => {
    router.push('/add-store-items');
  };

  const handleChange = (id, field, value) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          const hasChanges =
            updated.name !== updated.initialName ||
            updated.unit !== updated.initialUnit ||
            updated.measure !== updated.initialMeasure ||
            updated.price !== updated.initialPrice ||
            updated.groupId !== updated.initialGroupId;

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
        return item;
      })
    );
  };

  const handleApply = async (id) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    try {
      const response = await apiRequest('POST', 'delicia-meta/storeitem/apply', {
        list: [
          {
            id: item.id,
            name: item.name,
            unit: item.unit,
            measure: item.measure,
            price: item.price,
            groupId: item.groupId
          }
        ]
      });

      if (response.count >= 1) {
        showToast('success', 'Success', 'Changes applied successfully!');
        setItems(
          items.map((i) =>
            i.id === id
              ? {
                  ...i,
                  initialName: i.name,
                  initialUnit: i.unit,
                  initialMeasure: i.measure,
                  initialPrice: i.price,
                  initialGroupId: i.groupId
                }
              : i
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
      const response = await apiRequest('POST', 'delicia-meta/storeitem/delete', { id });

      if (response.count >= 1) {
        showToast('success', 'Success', 'Item deleted successfully!');
        setItems(items.filter((i) => i.id !== id));
      } else {
        showToast('error', 'Error', 'Failed to delete item');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('error', 'Error', 'Failed to delete item');
    }
  };

  const handleExport = () => {
    const exportData = items.map((item) => {
      const group = itemGroups.find((g) => g.id === item.groupId);
      return {
        ID: item.id,
        'Item Name': item.name,
        Unit: item.unit,
        Measurement: item.measure,
        Price: item.price,
        'Group Name': group?.name || ''
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Store Items');

    const timestamp = new Date().toISOString().slice(0, 19).replace(/[-T:]/g, '');
    XLSX.writeFile(wb, `store_items_${timestamp}.xlsx`);

    showToast('success', 'Success', 'Export completed successfully!');
  };

  return (
    <DashboardLayout title="Manage Store Items">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
            <h1 className="text-2xl md:text-3xl font-semibold text-blue-600 text-center mb-6">
              Manage Store Items
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
                onClick={handleAddItem}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-all text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Store Items
              </button>
            </div>

            <div className="flex justify-between items-center mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold text-gray-800">Total Items: {items.length}</div>
              <button
                onClick={handleExport}
                disabled={items.length === 0}
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
                      <th className="px-4 py-3 text-left text-sm font-medium">ID</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Item Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Unit</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Measurement</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Price</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Group Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {items.map((item, index) => (
                      <tr
                        key={item.id}
                        className={`hover:bg-blue-50 transition-colors ${
                          changedRows.has(item.id) ? 'bg-blue-100' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }`}
                      >
                        <td className="px-4 py-3 text-sm text-gray-700">{item.id}</td>
                        <td className="px-4 py-3 text-sm">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleChange(item.id, 'name', e.target.value)}
                            disabled={!editMode}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <select
                            value={item.unit}
                            onChange={(e) => handleChange(item.id, 'unit', e.target.value)}
                            disabled={!editMode}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                          >
                            {UNITS.map((unit) => (
                              <option key={unit} value={unit}>
                                {unit}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <input
                            type="number"
                            value={item.measure}
                            onChange={(e) => handleChange(item.id, 'measure', e.target.value)}
                            disabled={!editMode}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) => handleChange(item.id, 'price', e.target.value)}
                            disabled={!editMode}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <select
                            value={item.groupId}
                            onChange={(e) => handleChange(item.id, 'groupId', e.target.value)}
                            disabled={!editMode}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                          >
                            <option value="">Select Group</option>
                            {itemGroups.map((group) => (
                              <option key={group.id} value={group.id}>
                                {group.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-2">
                            {changedRows.has(item.id) && (
                              <button
                                onClick={() => handleApply(item.id)}
                                className="bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 transition-all text-xs text-xs md:text-sm font-medium"
                              >
                                Apply
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(item.id)}
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
