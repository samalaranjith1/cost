'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { apiRequest } from '@/lib/api';
import { showToast } from '@/components/ToastContainer';
import { RefreshCw, UserPlus, CalendarPlus } from 'lucide-react';

export default function HRMSPage() {
  const [activeTab, setActiveTab] = useState('payroll');
  const [monthYear, setMonthYear] = useState('');
  const [status, setStatus] = useState('Active');
  const [payrollData, setPayrollData] = useState([]);
  const [employeesData, setEmployeesData] = useState([]);
  const [leavesData, setLeavesData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    populateMonthYearFilter();
  }, []);

  useEffect(() => {
    if (activeTab === 'payroll') {
      loadPayrollData();
    } else if (activeTab === 'employees') {
      loadEmployeesData();
    } else if (activeTab === 'leaves') {
      loadLeavesData();
    }
  }, [activeTab, monthYear, status]);

  const populateMonthYearFilter = () => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    setMonthYear(`${year}-${month}`);
  };

  const loadPayrollData = async () => {
    if (!monthYear) return;
    setLoading(true);
    try {
      const dt = `${monthYear}-01`;
      const response = await apiRequest('GET', 'employees/payroll/list', { enddt: dt });
      setPayrollData(response.list || []);
    } catch (error) {
      console.error('Error loading payroll data:', error);
      showToast('error', 'Error', 'Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  };

  const loadEmployeesData = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('GET', 'employees/list', { status });
      setEmployeesData(response.list || []);
    } catch (error) {
      console.error('Error loading employees data:', error);
      showToast('error', 'Error', 'Failed to load employees data');
    } finally {
      setLoading(false);
    }
  };

  const loadLeavesData = async () => {
    if (!monthYear) return;
    setLoading(true);
    try {
      const dt = `${monthYear}-01`;
      const response = await apiRequest('GET', 'employees/leaves/list', { enddt: dt });
      setLeavesData(response.list || []);
    } catch (error) {
      console.error('Error loading leaves data:', error);
      showToast('error', 'Error', 'Failed to load leaves data');
    } finally {
      setLoading(false);
    }
  };

  const handleFetch = () => {
    if (activeTab === 'payroll') {
      loadPayrollData();
    } else if (activeTab === 'employees') {
      loadEmployeesData();
    } else if (activeTab === 'leaves') {
      loadLeavesData();
    }
  };

  const formatYYYYMM = (monthStr) => {
    if (!monthStr) return '-';
    const year = monthStr.substring(0, 4);
    const month = monthStr.substring(4, 6);
    const date = new Date(year, parseInt(month) - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const totalNetPay = payrollData.reduce((sum, item) => sum + (item.netPay || 0), 0);

  return (
    <DashboardLayout title="HRMS">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-8 mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">HRMS</h1>
            <p className="text-orange-50 text-lg">Employee Metadata, Payroll and Leave Management</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Month and Year</label>
                <input
                  type="month"
                  value={monthYear}
                  onChange={(e) => setMonthYear(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {activeTab === 'employees' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleFetch}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-all"
              >
                Fetch
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md mb-6">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('payroll')}
                className={`px-6 py-4 font-medium transition-all ${
                  activeTab === 'payroll'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Payroll
              </button>
              <button
                onClick={() => setActiveTab('employees')}
                className={`px-6 py-4 font-medium transition-all ${
                  activeTab === 'employees'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Employees
              </button>
              <button
                onClick={() => setActiveTab('leaves')}
                className={`px-6 py-4 font-medium transition-all ${
                  activeTab === 'leaves'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Leaves
              </button>
            </div>

            <div className="p-6">
              {activeTab === 'payroll' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                      <div className="text-sm font-medium mb-2">Number of Employees</div>
                      <div className="text-2xl md:text-3xl font-bold">{payrollData.length}</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
                      <div className="text-sm font-medium mb-2">Total Net Pay</div>
                      <div className="text-2xl md:text-3xl font-bold">₹{totalNetPay.toLocaleString()}</div>
                    </div>
                  </div>

                  {loading ? (
                    <div className="flex justify-center py-12">
                      <RefreshCw className="w-10 h-10 animate-spin text-blue-600" />
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <table className="w-full">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Month</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Salary</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Deductions</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Net Pay</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Paid On</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {payrollData.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm">
                                {item.firstName} {item.lastName || ''}
                              </td>
                              <td className="px-4 py-3 text-sm">{formatYYYYMM(item.month)}</td>
                              <td className="px-4 py-3 text-sm">₹{item.basicSalary.toLocaleString()}</td>
                              <td className="px-4 py-3 text-sm">₹{item.deductions.toLocaleString()}</td>
                              <td className="px-4 py-3 text-sm font-medium">₹{item.netPay.toLocaleString()}</td>
                              <td className="px-4 py-3 text-sm">{item.paidOn || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'employees' && (
                <>
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <RefreshCw className="w-10 h-10 animate-spin text-blue-600" />
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <table className="w-full">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Phone</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Department</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Designation</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {employeesData.map((emp) => (
                            <tr key={emp.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm">
                                {emp.firstName} {emp.lastName || ''}
                              </td>
                              <td className="px-4 py-3 text-sm">{emp.email || '-'}</td>
                              <td className="px-4 py-3 text-sm">{emp.phone || '-'}</td>
                              <td className="px-4 py-3 text-sm">{emp.departmentName || '-'}</td>
                              <td className="px-4 py-3 text-sm">{emp.designationName || '-'}</td>
                              <td className="px-4 py-3 text-sm">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    emp.status === 'Active'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {emp.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'leaves' && (
                <>
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <RefreshCw className="w-10 h-10 animate-spin text-blue-600" />
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <table className="w-full">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Start Date</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">End Date</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Type</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {leavesData.map((leave) => (
                            <tr key={leave.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm">
                                {leave.firstName} {leave.lastName || ''}
                              </td>
                              <td className="px-4 py-3 text-sm">{leave.startDate}</td>
                              <td className="px-4 py-3 text-sm">{leave.endDate}</td>
                              <td className="px-4 py-3 text-sm">{leave.type}</td>
                              <td className="px-4 py-3 text-sm">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    leave.status === 'Approved'
                                      ? 'bg-green-100 text-green-800'
                                      : leave.status === 'Rejected'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}
                                >
                                  {leave.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
        </div>
    </DashboardLayout>
  );
}
