'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { apiRequest } from '@/lib/api';
import { showToast } from '@/components/ToastContainer';
import { RefreshCw, Plus, Edit, Trash2 } from 'lucide-react';

export default function ManageUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [changedRows, setChangedRows] = useState(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersResponse, rolesResponse, departmentsResponse] = await Promise.all([
        apiRequest('GET', 'user/list'),
        apiRequest('GET', 'user/roles'),
        apiRequest('GET', 'departments/list')
      ]);

      setUsers(
        (usersResponse.list || []).map((user) => ({
          ...user,
          initialName: user.name,
          initialCountryCode: user.countryCode,
          initialPhoneNumber: user.phoneNumber,
          initialRoleId: user.roleId,
          initialDisabled: user.disabled,
          initialDepartments: user.departments || []
        }))
      );
      setRoles(rolesResponse.list || []);
      setDepartments(departmentsResponse.list || []);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('error', 'Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    showToast('info', 'Info', 'Refreshing users...');
    loadData();
  };

  const handleAddUser = () => {
    router.push('/add-users');
  };

  const handleChange = (id, field, value) => {
    setUsers(
      users.map((user) => {
        if (user.id === id) {
          const updated = { ...user, [field]: value };
          const hasChanges =
            updated.name !== updated.initialName ||
            updated.countryCode !== updated.initialCountryCode ||
            updated.phoneNumber !== updated.initialPhoneNumber ||
            updated.roleId !== updated.initialRoleId ||
            updated.disabled !== updated.initialDisabled ||
            JSON.stringify(updated.departments) !== JSON.stringify(updated.initialDepartments);

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
        return user;
      })
    );
  };

  const handleDepartmentChange = (id, selectedDepts) => {
    handleChange(id, 'departments', selectedDepts);
  };

  const handleApply = async (id) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;

    try {
      const response = await apiRequest('POST', 'user/register', {
        userName: user.userName,
        name: user.name,
        countryCode: user.countryCode,
        phoneNumber: user.phoneNumber,
        roleId: user.roleId,
        disabled: user.disabled,
        departments: user.departments || []
      });

      if (response.id) {
        showToast('success', 'Success', 'Changes applied successfully!');
        setUsers(
          users.map((u) =>
            u.id === id
              ? {
                  ...u,
                  initialName: u.name,
                  initialCountryCode: u.countryCode,
                  initialPhoneNumber: u.phoneNumber,
                  initialRoleId: u.roleId,
                  initialDisabled: u.disabled,
                  initialDepartments: u.departments || []
                }
              : u
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
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await apiRequest('POST', 'user/delete', { id });

      if (response.count >= 1) {
        showToast('success', 'Success', 'User deleted successfully!');
        setUsers(users.filter((u) => u.id !== id));
      } else {
        showToast('error', 'Error', 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('error', 'Error', 'Failed to delete user');
    }
  };

  return (
    <DashboardLayout title="Manage Users">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
            <h1 className="text-2xl md:text-3xl font-semibold text-blue-600 text-center mb-6">Manage Users</h1>

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
                onClick={handleAddUser}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-all text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Add User
              </button>
            </div>

            <div className="flex justify-between items-center mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold text-gray-800">Total Users: {users.length}</div>
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
                      <th className="px-3 py-3 text-left text-sm font-medium">Business</th>
                      <th className="px-3 py-3 text-left text-sm font-medium">User Name</th>
                      <th className="px-3 py-3 text-left text-sm font-medium">Name</th>
                      <th className="px-3 py-3 text-left text-sm font-medium">Country Code</th>
                      <th className="px-3 py-3 text-left text-sm font-medium">Phone Number</th>
                      <th className="px-3 py-3 text-left text-sm font-medium">Role</th>
                      <th className="px-3 py-3 text-left text-sm font-medium">Active</th>
                      <th className="px-3 py-3 text-left text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map((user, index) => (
                      <tr
                        key={user.id}
                        className={`hover:bg-blue-50 transition-colors ${
                          changedRows.has(user.id) ? 'bg-blue-100' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }`}
                      >
                        <td className="px-3 py-3 text-sm text-gray-700">{user.outletName || '-'}</td>
                        <td className="px-3 py-3 text-sm text-gray-700">{user.userName}</td>
                        <td className="px-3 py-3 text-sm">
                          <input
                            type="text"
                            value={user.name}
                            onChange={(e) => handleChange(user.id, 'name', e.target.value)}
                            disabled={!editMode}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                          />
                        </td>
                        <td className="px-3 py-3 text-sm">
                          <input
                            type="text"
                            value={user.countryCode}
                            onChange={(e) => handleChange(user.id, 'countryCode', e.target.value)}
                            disabled={!editMode}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                          />
                        </td>
                        <td className="px-3 py-3 text-sm">
                          <input
                            type="text"
                            value={user.phoneNumber}
                            onChange={(e) => handleChange(user.id, 'phoneNumber', e.target.value)}
                            disabled={!editMode}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                          />
                        </td>
                        <td className="px-3 py-3 text-sm">
                          <select
                            value={user.roleId}
                            onChange={(e) => handleChange(user.id, 'roleId', e.target.value)}
                            disabled={!editMode}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                          >
                            <option value="">Select Role</option>
                            {roles.map((role) => (
                              <option key={role.id} value={role.id}>
                                {role.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-3 text-sm">
                          <select
                            value={user.disabled ? 'true' : 'false'}
                            onChange={(e) => handleChange(user.id, 'disabled', e.target.value === 'true')}
                            disabled={!editMode}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                          >
                            <option value="false">Yes</option>
                            <option value="true">No</option>
                          </select>
                        </td>
                        <td className="px-3 py-3 text-sm">
                          <div className="flex gap-2">
                            {changedRows.has(user.id) && (
                              <button
                                onClick={() => handleApply(user.id)}
                                className="bg-green-600 text-white px-2 py-1.5 rounded hover:bg-green-700 transition-all text-xs"
                              >
                                Apply
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(user.id)}
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
