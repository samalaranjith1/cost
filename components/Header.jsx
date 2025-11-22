'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, X } from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-[#306dff]">Costonomy</span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-700 hover:text-[#306dff] transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-gray-700 hover:text-[#306dff] transition-colors">
              Pricing
            </a>
            <a href="#about" className="text-gray-700 hover:text-[#306dff] transition-colors">
              About
            </a>
            <a href="#contact" className="text-gray-700 hover:text-[#306dff] transition-colors">
              Contact
            </a>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 text-[#306dff] border border-[#306dff] rounded-lg hover:bg-[#306dff] hover:text-white transition-all"
            >
              Login
            </button>
            <button className="px-4 py-2 bg-[#306dff] text-white rounded-lg hover:bg-[#2557d6] transition-all">
              Book Demo
            </button>
          </div>

          <button
            className="md:hidden text-gray-700"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-4">
              <a href="#features" className="text-gray-700 hover:text-[#306dff] transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-gray-700 hover:text-[#306dff] transition-colors">
                Pricing
              </a>
              <a href="#about" className="text-gray-700 hover:text-[#306dff] transition-colors">
                About
              </a>
              <a href="#contact" className="text-gray-700 hover:text-[#306dff] transition-colors">
                Contact
              </a>
              <button
                onClick={() => router.push('/login')}
                className="px-4 py-2 text-[#306dff] border border-[#306dff] rounded-lg hover:bg-[#306dff] hover:text-white transition-all text-left"
              >
                Login
              </button>
              <button className="px-4 py-2 bg-[#306dff] text-white rounded-lg hover:bg-[#2557d6] transition-all text-left">
                Book Demo
              </button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
