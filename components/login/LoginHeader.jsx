'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function LoginHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-md shadow-md py-3'
          : 'bg-white/90 backdrop-blur-md py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <div className="w-8 h-8 bg-[#306dff] rounded-full flex items-center justify-center text-white text-lg font-bold">
              C
            </div>
            Costonomy
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/#features" className="text-gray-700 font-semibold hover:text-[#306dff] transition-colors">
              How it Works
            </Link>
            <Link href="/#testimonials" className="text-gray-700 font-semibold hover:text-[#306dff] transition-colors">
              Testimonials
            </Link>
            <Link href="/#pricing" className="text-gray-700 font-semibold hover:text-[#306dff] transition-colors">
              Pricing
            </Link>
          </nav>

          <Link
            href="/register"
            className="bg-[#306dff] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#1a4df7] transition-all hidden md:block"
          >
            Register
          </Link>
        </div>
      </div>
    </header>
  );
}
