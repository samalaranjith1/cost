'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { showToast } from '@/components/ToastContainer';

export default function LoginForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const validateForm = () => {
    let isValid = true;
    const newErrors = { email: '', password: '' };

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const loginUser = async (loginData) => {
    try {
      const response = await fetch('https://flavourheaven.in/costonomy-services/user/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(loginData)
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Login API Error:', error);
      throw error;
    }
  };

  const handleSuccessfulLogin = (data) => {
    localStorage.setItem('authToken', data.token);

    const userData = {
      id: data.user.id,
      userName: data.user.userName,
      name: data.user.name,
      countryCode: data.user.countryCode,
      phoneNumber: data.user.phoneNumber,
      email: data.user.email,
      roleId: data.user.roleId,
      outletId: data.user.outlet?.id,
      outletName: data.user.outlet?.name,
      outletType: data.user.outlet?.outletType,
      outletLogo: data.user.outlet?.logo,
      outletCompany: data.user.outlet?.companyName,
      currency: data.user.outlet?.currency,
      dailyConsumptionGoalPercentage: data.user.outlet?.dailyConsumptionGoalPercentage,
      overallExpectedMarginPercentage: data.user.outlet?.overallExpectedMarginPercentage,
      disabled: data.user.disabled,
      departments: data.user.departments
    };
    localStorage.setItem('userData', JSON.stringify(userData));
  };

  const getRedirectionType = () => {
    return 'dashboard';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    const loginData = {
      username: formData.email.trim(),
      password: formData.password,
      timestamp: new Date().toISOString()
    };

    try {
      console.log('Logging in user:', loginData);
      const response = await loginUser(loginData);

      handleSuccessfulLogin(response);
      let redirection = getRedirectionType();

      showToast('success', 'Login Successful', 'Welcome back! Redirecting to dashboard...');

      setTimeout(() => {
        if (redirection === 'dashboard') {
          router.push('/dashboard');
        } else {
          router.push('/department');
        }
      }, 1500);

    } catch (error) {
      console.error('Login failed:', error);

      let errorMessage = 'Login failed. Please check your credentials.';
      let errorType = 'Login Error';

      if (error.message) {
        if (error.message.includes('credentials') || error.message.includes('password') || error.message.includes('invalid')) {
          errorType = 'Invalid Credentials';
          errorMessage = 'Invalid email or password. Please try again.';
        } else if (error.message.includes('not found') || error.message.includes('user')) {
          errorType = 'Account Not Found';
          errorMessage = 'No account found with this email. Please sign up first.';
        } else if (error.message.includes('network') || error.message.includes('Network')) {
          errorType = 'Connection Issue';
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }

      showToast('error', errorType, errorMessage, 7000);
    } finally {
      setIsLoading(false);
    }
  };

  const loadGoogleAPIs = () => {
    return new Promise((resolve, reject) => {
      if (typeof window !== 'undefined' && typeof window.google !== 'undefined') {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = resolve;
      script.onerror = () => reject(new Error('Failed to load Google APIs'));
      document.head.appendChild(script);
    });
  };

  const parseJwt = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error parsing JWT:', error);
      throw new Error('Failed to parse Google authentication token');
    }
  };

  const handleGoogleResponse = async (response) => {
    try {
      console.log('Google authentication successful');

      const userInfo = parseJwt(response.credential);
      console.log('Google user info:', userInfo);

      const loginPayload = {
        username: userInfo.email,
        provider: 'google',
        providerId: userInfo.sub,
        name: userInfo.name,
        profilePicture: userInfo.picture,
        emailVerified: userInfo.email_verified || false,
        timestamp: new Date().toISOString()
      };

      console.log('Google login payload:', loginPayload);

      const result = await loginUser(loginPayload);
      handleSuccessfulLogin(result);

      showToast('success', 'Google Login Successful', 'Welcome back! Redirecting to dashboard...');

      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);

    } catch (error) {
      console.error('Error handling Google response:', error);
      showToast('error', 'Google Login Error', error.message || 'Google login failed. Please try again.', 7000);
    } finally {
      setGoogleLoading(false);
    }
  };

  const initGoogleAuth = () => {
    try {
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.top = '-9999px';
      tempContainer.style.left = '-9999px';
      document.body.appendChild(tempContainer);

      window.google.accounts.id.initialize({
        client_id: '478314125932-6kl4foadmlnrg64hadcm3rairm2i9k5u.apps.googleusercontent.com',
        callback: handleGoogleResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: true
      });

      window.google.accounts.id.renderButton(tempContainer, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        shape: 'rectangular',
        text: 'signin_with',
        logo_alignment: 'left'
      });

      const googleButton = tempContainer.querySelector('[role="button"]');
      if (googleButton) {
        googleButton.click();
      } else {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            console.warn('Google Sign-in prompt was not displayed or skipped');
            showToast('error', 'Google Login Error', 'Google Sign-in was cancelled or not available', 7000);
            setGoogleLoading(false);
          }
        });
      }

      setTimeout(() => {
        if (document.body.contains(tempContainer)) {
          document.body.removeChild(tempContainer);
        }
      }, 5000);

    } catch (error) {
      console.error('Google Auth initialization failed:', error);
      showToast('error', 'Google Login Error', 'Failed to initialize Google login', 7000);
      setGoogleLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);

    try {
      await loadGoogleAPIs();
      initGoogleAuth();
    } catch (error) {
      console.error('Google login failed:', error);

      let errorMessage = 'Google login failed. Please try again.';
      let errorType = 'Google Login Error';

      if (error.message) {
        if (error.message.includes('popup') || error.message.includes('cancelled')) {
          errorType = 'Login Cancelled';
          errorMessage = 'Google login was cancelled. Please try again.';
        } else if (error.message.includes('not found')) {
          errorType = 'Account Not Found';
          errorMessage = 'No account found with this Google account. Please sign up first.';
        } else if (error.message.includes('network')) {
          errorType = 'Connection Issue';
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }

      showToast('error', errorType, errorMessage, 7000);
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    showToast('info', 'Forgot Password', 'Forgot password functionality would be implemented here');
  };

  return (
    <div className="bg-white p-8 md:p-10 rounded-xl shadow-lg w-full max-w-md border-t-4 border-[#306dff]">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Sign In</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="john.doe@gmail.com"
            className={`w-full px-4 py-3 border rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#306dff] focus:border-[#306dff] ${
              errors.email ? 'border-red-500' : 'border-gray-200'
            }`}
          />
          {errors.email && (
            <div className="text-red-500 text-xs mt-1">{errors.email}</div>
          )}
        </div>

        <div className="mb-6">
          <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900">
            Password <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••"
            className={`w-full px-4 py-3 border rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#306dff] focus:border-[#306dff] ${
              errors.password ? 'border-red-500' : 'border-gray-200'
            }`}
          />
          {errors.password && (
            <div className="text-red-500 text-xs mt-1">{errors.password}</div>
          )}
        </div>

        <div className="flex justify-end mb-6">
          <a
            href="#"
            onClick={handleForgotPassword}
            className="text-sm text-[#306dff] hover:text-[#1441e3] transition-colors"
          >
            Forgot Password?
          </a>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#306dff] text-white py-3.5 rounded-lg text-sm font-semibold uppercase tracking-wide hover:bg-[#1441e3] transition-all disabled:bg-gray-300 disabled:cursor-not-allowed relative"
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">OR</span>
        </div>
      </div>

      <button
        onClick={handleGoogleLogin}
        disabled={googleLoading}
        className="w-full bg-white border border-gray-200 text-gray-900 py-3 rounded-lg text-sm hover:bg-gray-50 hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <div className="w-5 h-5 bg-contain bg-no-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z' fill='%234285F4'/%3E%3Cpath d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z' fill='%2334A853'/%3E%3Cpath d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z' fill='%23FBBC05'/%3E%3Cpath d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z' fill='%23EA4335'/%3E%3C/svg%3E")`
        }}></div>
        {googleLoading ? 'Connecting...' : 'Login with Google'}
      </button>

      <div className="text-center mt-6 text-sm text-gray-700">
        Need to create a new outlet?{' '}
        <Link href="/register" className="text-[#306dff] font-medium hover:underline">
          Sign up here
        </Link>
      </div>
    </div>
  );
}
