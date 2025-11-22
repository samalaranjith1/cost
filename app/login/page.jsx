'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LoginForm from '@/components/login/LoginForm';
import LoginHeader from '@/components/login/LoginHeader';

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eef5ff] to-white">
      <LoginHeader />

      <main className="pt-32 pb-8 flex flex-col items-center px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
            Welcome Back!
          </h1>
          <p className="text-lg md:text-xl text-gray-700 font-light">
            Sign in to manage your outlet operations
          </p>
        </div>

        <LoginForm />
      </main>
    </div>
  );
}
