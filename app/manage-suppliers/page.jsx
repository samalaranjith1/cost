'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { apiRequest } from '@/lib/api';
import { showToast } from '@/components/ToastContainer';
import { RefreshCw, Plus, Download, Edit, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ManageSuppliersPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [changedRows, setChangedRows] = useState(new Set());

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('GET', 'delicia-meta/vendors');
      setSuppliers(
        response.list.map((supplier) => ({
          ...supplier,
          initialName: supplier.name
        }))
      );
    } catch (error) {
      console.error('Error loading suppliers:', error);
      showToast('error', 'Error', 'Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    showToast('info', 'Info', 'Refreshing vendors...');
    loadSuppliers();
  };

  const handleAddSupplier = () => {
    router.push('/add-suppliers');
  };

  const handleChange = (id, field, value) => {
    setSuppliers(
      suppliers.map((supplier) => {
        if (supplier.id === id) {
          const updated = { ...supplier, [field]: value };
          if (updated.name !== updated.initialName) {
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
        return supplier;
      })
    );
  };

  const handleApply = async (id) => {
    const supplier = suppliers.find((s) => s.id === id);
    if (!supplier) return;

    try {
      const response = await apiRequest('POST', 'delicia-meta/vendor/apply', {
        list: [{ id: supplier.id, name: supplier.name }]
      });

      if (response.count >= 1) {
        showToast('success', 'Success', 'Changes applied successfully!');
        setSuppliers(
          suppliers.map((s) => (s.id === id ? { ...s, initialName: s.name } : s))
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
    if (!confirm('Are you sure you want to delete this vendor?')) return;

    try {
      const response = await apiRequest('POST', 'delicia-meta/vendor/delete', { id });

      if (response.count >= 1) {
        showToast('success', 'Success', 'Vendor deleted successfully!');
        setSuppliers(suppliers.filter((s) => s.id !== id));
      } else {
        showToast('error', 'Error', 'Failed to delete vendor');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('error', 'Error', 'Failed to delete vendor');
    }
  };

  const handleExport = () => {
    const exportData = suppliers.map((supplier) => ({
      ID: supplier.id,
      'Vendor Name': supplier.name
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Vendors');

    const timestamp = new Date().toISOString().slice(0, 19).replace(/[-T:]/g, '');
    XLSX.writeFile(wb, `vendors_${timestamp}.xlsx`);

    showToast('success', 'Success', 'Export completed successfully!');
  };

  return (
    <DashboardLayout title="Manage Suppliers">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
            <h1 className="text-2xl md:text-3xl font-semibold text-blue-600 text-center mb-6">
              Vendor Management
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
                onClick={handleAddSupplier}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-all text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Vendor
              </button>
            </div>

            <div className="flex justify-between items-center mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold text-gray-800">
                Total Vendors: {suppliers.length}
              </div>
              <button
                onClick={handleExport}
                disabled={suppliers.length === 0}
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
                      <th className="px-3 py-2.5 md:px-4 md:py-3 text-left text-sm font-medium">ID</th>
                      <th className="px-3 py-2.5 md:px-4 md:py-3 text-left text-sm font-medium">Vendor Name</th>
                      <th className="px-3 py-2.5 md:px-4 md:py-3 text-left text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {suppliers.map((supplier, index) => (
                      <tr
                        key={supplier.id}
                        className={`hover:bg-blue-50 transition-colors ${
                          changedRows.has(supplier.id)
                            ? 'bg-blue-100'
                            : index % 2 === 0
                            ? 'bg-white'
                            : 'bg-gray-50'
                        }`}
                      >
                        <td className="px-3 py-2.5 md:px-4 md:py-3 text-sm text-gray-700">{supplier.id}</td>
                        <td className="px-3 py-2.5 md:px-4 md:py-3 text-sm">
                          <input
                            type="text"
                            value={supplier.name}
                            onChange={(e) => handleChange(supplier.id, 'name', e.target.value)}
                            disabled={!editMode}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          />
                        </td>
                        <td className="px-3 py-2.5 md:px-4 md:py-3 text-sm">
                          <div className="flex gap-2">
                            {changedRows.has(supplier.id) && (
                              <button
                                onClick={() => handleApply(supplier.id)}
                                className="bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 transition-all text-sm text-xs md:text-sm font-medium"
                              >
                                Apply
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(supplier.id)}
                              className="flex items-center gap-1 bg-red-50 text-red-600 border border-red-600 px-3 py-1.5 rounded hover:bg-red-600 hover:text-white transition-all text-sm"
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
