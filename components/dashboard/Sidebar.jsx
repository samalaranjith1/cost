'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getUserData, clearAuthData } from '@/lib/api';

export default function Sidebar({ isOpen, onClose }) {
  const router = useRouter();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const data = getUserData();
    setUserData(data);
  }, []);

  const menuItems = [
    {
      section: 'Dashboard',
      icon: 'fas fa-tachometer-alt',
      items: []
    },
    {
      section: 'Manage Store',
      icon: 'fas fa-store',
      items: [
        { label: 'Purchase', icon: 'fas fa-cart-plus', url: '/manage-item-purchase' },
        { label: 'Closing', icon: 'fas fa-lock', url: '/manage-item-purchase-closing-stock' }
      ]
    },
    {
      section: 'Manage Kitchen',
      icon: 'fas fa-utensils',
      items: [
        { label: 'Purchase', icon: 'fas fa-shopping-basket', url: '/manage-item-consumption' },
        { label: 'Closing', icon: 'fas fa-door-closed', url: '/manage-item-consumption-closing-stock' }
      ]
    },
    {
      section: 'Manage Vendors',
      icon: 'fas fa-truck',
      items: [
        { label: 'Purchases & Expenses', icon: 'fas fa-file-invoice-dollar', url: '/manage-supplier-purchase' },
        { label: 'Payments', icon: 'fas fa-file-invoice-dollar', url: '/manage-supplier-payments' }
      ]
    },
    {
      section: 'Manage Sales',
      icon: 'fas fa-chart-line',
      items: [
        { label: 'Upload Petpooja Sales', icon: 'fas fa-file-upload', url: '/upload-sales-data-petpooja' },
        { label: 'Upload Golkal Sales', icon: 'fas fa-file-upload', url: '/upload-sales-data-glokal' },
        { label: 'Upload Bank Statement', icon: 'fas fa-file-upload', url: '/upload-bank-statement' },
        { label: 'Daily Sales Dashboard', icon: 'fas fa-calendar-day', url: '/sales-dashboard' },
        { label: 'Analyze Bank Statement', icon: 'fas fa-calendar-day', url: '/statement-dashboard' },
        { label: 'Top Selling Items', icon: 'fas fa-star', url: '/selling-items' },
        { label: 'Manage Invoices', icon: 'fas fa-star', url: '/manage-outgoing-invoices' }
      ]
    },
    {
      section: 'Manage Menu',
      icon: 'fas fa-book',
      items: [
        { label: 'Menu Items Recipe', icon: 'fas fa-utensil-spoon', url: '/menu-items-recipe-dashboard' },
        { label: 'Base Items Recipe', icon: 'fas fa-utensil-spoon', url: '/manage-base-item-purchase' }
      ]
    },
    {
      section: 'Metadata',
      icon: 'fas fa-database',
      items: [
        { label: 'Manage Store Items', icon: 'fas fa-boxes', url: '/manage-items' },
        { label: 'Manage Vendors', icon: 'fas fa-handshake', url: '/manage-suppliers' },
        { label: 'Manage Departments', icon: 'fas fa-sitemap', url: '/manage-departments' },
        { label: 'Manage Menu', icon: 'fas fa-utensils', url: '/manage-products' }
      ]
    },
    {
      section: 'HRMS',
      icon: 'fas fa-user-shield',
      items: [
        { label: 'Manage Employees', icon: 'fas fa-users-cog', url: '/hrms' }
      ]
    },
    {
      section: 'Authorization',
      icon: 'fas fa-user-shield',
      items: [
        { label: 'Manage Users', icon: 'fas fa-users-cog', url: '/manage-users' }
      ]
    }
  ];

  const handleNavigation = (url) => {
    if (url) {
      router.push(url);
      onClose();
    }
  };

  const handleDashboardClick = () => {
    router.push('/dashboard');
    onClose();
  };

  const handleLogout = () => {
    clearAuthData();
    router.push('/login');
    onClose();
  };

  return (
    <>
      <div
        className={`fixed top-[70px] left-0 right-0 bottom-0 bg-black/50 z-[998] transition-opacity duration-300 ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={onClose}
      />

      <nav
        className={`fixed top-[70px] left-0 w-[280px] h-[calc(100vh-70px)] bg-white shadow-md z-[999] overflow-y-auto transition-transform duration-300 border-r border-gray-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <ul className="list-none">
          <div
            className="px-6 py-3 text-[#306dff] font-semibold text-sm uppercase tracking-wide mt-4 cursor-pointer hover:bg-gray-100 transition-colors flex items-center gap-3"
            onClick={handleDashboardClick}
          >
            <i className="fas fa-tachometer-alt w-5 text-center text-lg"></i>
            <span>Dashboard</span>
          </div>

          {menuItems.map((section, idx) => (
            <div key={idx}>
              {section.items.length > 0 && (
                <>
                  <div className="px-6 py-3 text-[#306dff] font-semibold text-sm uppercase tracking-wide mt-4 flex items-center gap-3">
                    <i className={`${section.icon} w-5 text-center text-lg`}></i>
                    <span>{section.section}</span>
                  </div>
                  {section.items.map((item, itemIdx) => (
                    <li
                      key={itemIdx}
                      className="px-6 py-3 cursor-pointer transition-all flex items-center gap-3 text-gray-800 border-l-3 border-transparent hover:bg-gray-100 hover:text-[#306dff] hover:border-l-[#306dff]"
                      onClick={() => handleNavigation(item.url)}
                    >
                      <i className={`${item.icon} w-5 text-center text-lg`}></i>
                      <span>{item.label}</span>
                    </li>
                  ))}
                </>
              )}
            </div>
          ))}

          <div className="px-6 py-3 text-[#306dff] font-semibold text-sm uppercase tracking-wide mt-4 flex items-center gap-3">
            <i className="fas fa-user-circle w-5 text-center text-lg"></i>
            <span>My Account</span>
          </div>
          <li
            className="px-6 py-3 cursor-pointer transition-all flex items-center gap-3 text-gray-800 border-l-3 border-transparent hover:bg-gray-100 hover:text-[#306dff]"
            onClick={() => handleNavigation('/meta/manage-users')}
          >
            <i className="fas fa-user-edit w-5 text-center text-lg"></i>
            <span>{userData?.name || 'Account Settings'}</span>
          </li>
          <li
            className="px-6 py-3 cursor-pointer transition-all flex items-center gap-3 text-gray-800 border-l-3 border-transparent hover:bg-gray-100 hover:text-red-500"
            onClick={handleLogout}
          >
            <i className="fas fa-sign-out-alt w-5 text-center text-lg"></i>
            <span>Logout</span>
          </li>
        </ul>
      </nav>
    </>
  );
}
