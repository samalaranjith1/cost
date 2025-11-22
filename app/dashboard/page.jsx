'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import Sidebar from '@/components/dashboard/Sidebar';

export default function DashboardPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        router.push('/login');
      }
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#f0f0f0]">
      <DashboardHeader onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="pt-[70px] transition-all duration-300">
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <p className="text-gray-600 text-lg">
                Welcome to your dashboard! Content will be displayed here.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
