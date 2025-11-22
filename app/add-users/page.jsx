'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { apiRequest } from '@/lib/api';
import { showToast } from '@/components/ToastContainer';
import { Plus, Trash2 } from 'lucide-react';

export default function AddUsersPage() {  const [rows, setRows] = useState([
    { id: Date.now(), userName: '', password: '', name: '', countryCode: '', phoneNumber: '', roleId: '' }
  ]);
  const [roles, setRoles] = useState([]);
  const [outletId, setOutletId] = useState(1);

  useEffect(() => {
    loadRoles();
    const userData = localStorage.getItem('userData');
    if (userData) {
      const userDataObject = JSON.parse(userData);
      setOutletId(userDataObject.outletId || 1);
    }
  }, []);

  const loadRoles = async () => {
    try {
      const response = await apiRequest('GET', 'user/roles');
      setRoles(response.list || []);
    } catch (error) {
      console.error('Error loading roles:', error);
      showToast('error', 'Error', 'Failed to load roles');
    }
  };

  const addRows = () => {
    const newRows = [];
    for (let i = 0; i < 3; i++) {
      newRows.push({
        id: Date.now() + i,
        userName: '',
        password: '',
        name: '',
        countryCode: '',
        phoneNumber: '',
        roleId: ''
      });
    }
    setRows([...rows, ...newRows]);
  };

  const deleteRow = (id) => {
    setRows(rows.filter((row) => row.id !== id));
  };

  const updateRow = (id, field, value) => {
    setRows(rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const isFormValid = () => {
    return rows.some(
      (row) => row.userName.trim() !== '' && row.password.trim() !== '' && row.name.trim() !== '' && row.roleId !== ''
    );
  };

  const handleSubmit = async () => {
    const validData = rows
      .filter(
        (row) => row.userName.trim() !== '' && row.password.trim() !== '' && row.name.trim() !== '' && row.roleId !== ''
      )
      .map((row) => ({
        userName: row.userName.trim(),
        password: row.password.trim(),
        name: row.name.trim(),
        countryCode: row.countryCode.trim(),
        phoneNumber: row.phoneNumber.trim(),
        roleId: row.roleId,
        outletId
      }));

    if (validData.length === 0) {
      showToast('warning', 'Warning', 'Please fill all required fields before submitting.');
      return;
    }

    try {
      const response = await apiRequest('POST', 'user/addusers', { list: validData });

      if (response.count >= 1) {
        showToast('success', 'Success', 'Users added successfully!');
        setRows([
          { id: Date.now(), userName: '', password: '', name: '', countryCode: '', phoneNumber: '', roleId: '' }
        ]);
      } else {
        showToast('error', 'Error', 'Failed to add users.');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('error', 'Error', 'Failed to add users.');
    }
  };

  return (
    <DashboardLayout title="Add Users">

        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
              <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-4 md:mb-0">Add Users</h2>
              <button
                onClick={handleSubmit}
                disabled={!isFormValid()}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-all hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed w-full md:w-auto"
              >
                Submit
              </button>
            </div>

            <div className="space-y-4">
              {rows.map((row) => (
                <div
                  key={row.id}
                  className="flex flex-col md:flex-row gap-4 p-4 bg-gray-50 rounded-lg border border-blue-400"
                >
                  <div className="flex-1">
                    <input
                      type="text"
                      value={row.userName}
                      onChange={(e) => updateRow(row.id, 'userName', e.target.value)}
                      placeholder="Enter User Name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex-1">
                    <input
                      type="password"
                      value={row.password}
                      onChange={(e) => updateRow(row.id, 'password', e.target.value)}
                      placeholder="Enter Password"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex-1">
                    <input
                      type="text"
                      value={row.name}
                      onChange={(e) => updateRow(row.id, 'name', e.target.value)}
                      placeholder="Enter Name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex-1">
                    <input
                      type="text"
                      value={row.countryCode}
                      onChange={(e) => updateRow(row.id, 'countryCode', e.target.value)}
                      placeholder="Country Code"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex-1">
                    <input
                      type="text"
                      value={row.phoneNumber}
                      onChange={(e) => updateRow(row.id, 'phoneNumber', e.target.value)}
                      placeholder="Phone Number"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex-1">
                    <select
                      value={row.roleId}
                      onChange={(e) => updateRow(row.id, 'roleId', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Role</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => deleteRow(row.id)}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-gray-700 border border-gray-400 rounded-md hover:bg-red-600 hover:text-white transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-6">
              <button
                onClick={addRows}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-all hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" />
                Add Rows
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
  );

}
