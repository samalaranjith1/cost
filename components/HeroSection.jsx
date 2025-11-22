import { ArrowRight, BarChart3 } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="pt-24 pb-16 bg-gradient-to-br from-[#306dff] via-[#4a7fff] to-[#5a8fff]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="text-white">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Simplify Your Restaurant Operations
            </h1>
            <p className="text-xl mb-8 text-blue-50 leading-relaxed">
              Manage inventory, track costs, and boost profits with our all-in-one restaurant management platform. Built for efficiency.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="px-8 py-4 bg-white text-[#306dff] rounded-lg hover:bg-gray-50 transition-all font-semibold flex items-center justify-center gap-2 shadow-lg">
                Get Started Free
                <ArrowRight size={20} />
              </button>
              <button className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg hover:bg-white hover:text-[#306dff] transition-all font-semibold">
                Watch Demo
              </button>
            </div>
            <div className="mt-8 flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#22c55e] rounded-full"></div>
                <span className="text-sm text-blue-50">500+ Restaurants</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#22c55e] rounded-full"></div>
                <span className="text-sm text-blue-50">99.9% Uptime</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="bg-white rounded-2xl shadow-2xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-[#306dff] rounded-lg flex items-center justify-center">
                  <BarChart3 className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Dashboard Overview</h3>
                  <p className="text-sm text-gray-500">Real-time analytics</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Total Revenue</span>
                  <span className="font-bold text-[#22c55e]">₹4,52,000</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Orders Today</span>
                  <span className="font-bold text-[#306dff]">127</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Inventory Value</span>
                  <span className="font-bold text-gray-900">₹1,25,000</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Performance</span>
                  <span className="text-sm font-semibold text-[#22c55e]">+12%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-[#306dff] to-[#22c55e] h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
