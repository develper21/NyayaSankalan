import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { UserRole } from '../../types/api.types';
import { GovernmentLogo } from '../../components/common/GovernmentLogo';



export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      navigateToRoleDashboard(user.role);
    }
  }, [isAuthenticated, user]);

  const navigateToRoleDashboard = (role: UserRole) => {
    switch (role) {
      case UserRole.POLICE:
        navigate('/police/dashboard');
        break;
      case UserRole.SHO:
        navigate('/sho/dashboard');
        break;
      case UserRole.COURT_CLERK:
        navigate('/court/dashboard');
        break;
      case UserRole.JUDGE:
        navigate('/judge/dashboard');
        break;
      default:
        navigate('/login');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await login(email, password);
      // Navigation handled in useEffect when user state updates
    } catch (error: any) {
      setErrorMsg(error?.response?.data?.message || error?.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick login for test accounts
  const quickLogin = (role: UserRole) => {
    switch (role) {
      case UserRole.POLICE:
        setEmail('officer1@police.gov');
        setPassword('password123');
        break;
      case UserRole.SHO:
        setEmail('sho.central@police.gov');
        setPassword('password123');
        break;
      case UserRole.COURT_CLERK:
        setEmail('clerk@court.gov');
        setPassword('password123');
        break;
      case UserRole.JUDGE:
        setEmail('judge@court.gov');
        setPassword('password123');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center items-center font-sans">
      {/* Header with emblem and title */}
      <header className="w-full max-w-md mx-auto flex flex-col items-center pt-8 pb-4">
        <GovernmentLogo className="w-14 h-14 mb-2" />
        <h1 className="text-3xl font-serif font-bold text-navy-900 tracking-wide">NyayaSankalan</h1>
        <p className="text-base text-gray-700 mt-1">Police-Court Case Management System</p>
      </header>
      {/* Info Box */}
      <div className="w-full max-w-md mx-auto mb-4">
        <div className="bg-gray-50 border border-navy-200 text-navy-800 rounded px-4 py-2 text-center text-sm">
          Official Portal: For authorized government personnel only.
        </div>
      </div>

      {/* Login Form */}
      <main className="w-full max-w-md mx-auto">
        <div className="bg-white border border-navy-200 rounded-lg px-6 py-7">
          <form onSubmit={handleSubmit} className="space-y-5" aria-label="Login form">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
              autoComplete="username"
              className="focus:ring-1 focus:ring-navy-500 text-base"
            />
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                autoComplete="current-password"
                className="focus:ring-1 focus:ring-navy-500 text-base"
              />
              <button
                type="button"
                className="absolute right-3 top-8 text-xs text-navy-700 hover:underline focus:outline-none focus:ring-1 focus:ring-navy-500 rounded"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={0}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe((v) => !v)}
                  className="mr-2 focus:ring-1 focus:ring-navy-500"
                  aria-checked={rememberMe}
                />
                Remember Me
              </label>
              <a href="#" className="text-xs text-navy-700 hover:underline focus:outline-none focus:ring-1 focus:ring-navy-500 rounded">Forgot Password?</a>
            </div>
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded px-3 py-2 text-sm font-semibold">
                {errorMsg}
              </div>
            )}
            <Button
              type="submit"
              variant="primary"
              className="w-full focus:ring-1 focus:ring-navy-500 text-base py-2"
              isLoading={isLoading}
              aria-busy={isLoading}
            >
              Sign In
            </Button>
          </form>
          {/* Quick login buttons for test accounts */}
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Button type="button" variant="secondary" className="w-full text-base py-2" onClick={() => quickLogin(UserRole.POLICE)}>
              Police Test Login
            </Button>
            <Button type="button" variant="secondary" className="w-full text-base py-2" onClick={() => quickLogin(UserRole.SHO)}>
              SHO Test Login
            </Button>
            <Button type="button" variant="secondary" className="w-full text-base py-2" onClick={() => quickLogin(UserRole.COURT_CLERK)}>
              Clerk Test Login
            </Button>
            <Button type="button" variant="secondary" className="w-full text-base py-2" onClick={() => quickLogin(UserRole.JUDGE)}>
              Judge Test Login
            </Button>
          </div>
          {/* Test Credentials */}
          <div className="mt-7">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-gray-500 font-medium">Test Accounts</span>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="font-semibold text-navy-700">👮 Police Officer</p>
                <p className="text-gray-600 mt-1">officer1@police.gov</p>
                <p className="text-gray-500">password123</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="font-semibold text-navy-700">🏢 SHO</p>
                <p className="text-gray-600 mt-1">sho.central@police.gov</p>
                <p className="text-gray-500">password123</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="font-semibold text-navy-700">🧑‍⚖️ Clerk</p>
                <p className="text-gray-600 mt-1">clerk@court.gov</p>
                <p className="text-gray-500">password123</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <p className="font-semibold text-navy-700">👨‍⚖️ Judge</p>
                <p className="text-gray-600 mt-1">judge@court.gov</p>
                <p className="text-gray-500">password123</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      {/* Footer */}
      <footer className="mt-8 text-center text-xs text-gray-500 w-full pb-4">
        <div className="mb-1">© 2025 Government of India. All rights reserved.</div>
        <div>Contact: support@nyayasankalan.gov.in</div>
      </footer>
      {/* Minimal custom colors for navy */}
      <style>{`
        .text-navy-900 { color: #1B263B; }
        .text-navy-800 { color: #273A5A; }
        .text-navy-700 { color: #324A6D; }
        .border-navy-200 { border-color: #A3B1C6; }
        .focus\:ring-navy-500:focus { box-shadow: 0 0 0 2px #3A5A97; }
        .bg-navy-50 { background-color: #F4F7FB; }
      `}</style>
    </div>
  );
};
