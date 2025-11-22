'use client';

import { useState, useEffect } from 'react';
import { Menu, Bell } from 'lucide-react';
import { getUserData } from '@/lib/api';

export default function DashboardHeader({ onMenuToggle }) {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const data = getUserData();
    setUserData(data);
  }, []);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-[70px] bg-white/90 backdrop-blur-md shadow-md flex items-center px-6 z-[1000] transition-all">
      <button
        onClick={onMenuToggle}
        className="flex items-center justify-center w-10 h-10 rounded-full text-gray-700 hover:bg-[#1441e3] hover:text-white transition-all mr-9"
      >
        <Menu size={20} />
      </button>

      <div className="flex items-center gap-2 text-2xl font-bold text-gray-800">
        <i className="fas fa-utensils text-3xl"></i>
        <span>Costonomy</span>
      </div>

      <div className="ml-auto flex items-center gap-4">
        <div className="relative cursor-pointer">
          <Bell size={20} className="text-gray-700" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-[18px] h-[18px] flex items-center justify-center text-[10px] font-semibold">
            3
          </span>
        </div>

        <div className="w-10 h-10 rounded-full bg-[#306dff] text-white flex items-center justify-center font-semibold cursor-pointer hover:bg-[#1441e3] transition-all">
          {getInitials(userData?.name)}
        </div>
      </div>
    </header>
  );
}
