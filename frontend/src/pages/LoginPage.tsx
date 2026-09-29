import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, Shield, User, Lock, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC<{ isOfficerPortal?: boolean }> = ({ isOfficerPortal = false }) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [emailOrMobile, setEmailOrMobile] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // If navigated from officer route or toggle
  const isOfficer = isOfficerPortal || location.pathname.includes('officer');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await login(emailOrMobile, password);
      if (res.role === 'OFFICER' || res.role === 'ADMIN') {
        navigate('/officer/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = (email: string, pass: string) => {
    setEmailOrMobile(email);
    setPassword(pass);
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${
            isOfficer ? 'bg-indigo-600 shadow-indigo-900/20' : 'bg-emerald-600 shadow-emerald-900/20'
          }`}>
            {isOfficer ? <Shield className="w-8 h-8" /> : <Building2 className="w-8 h-8" />}
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-extrabold text-slate-900">
          {isOfficer ? 'MSME Officer / Admin Console' : 'Applicant Portal Login'}
        </h2>
        <p className="mt-1.5 text-center text-xs text-slate-600">
          {isOfficer ? 'Restricted government review workflow simulator' : 'Access your enterprise applications & certificates'}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-md rounded-2xl border border-slate-200 sm:px-10 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isOfficer ? 'Official Email / Username' : 'Registered Email or Mobile'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={emailOrMobile}
                  onChange={(e) => setEmailOrMobile(e.target.value)}
                  placeholder={isOfficer ? "priya.officer@example.com" : "rahul@example.com or 9876543210"}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2.5 px-4 rounded-xl text-white font-bold text-sm shadow-md transition-all ${
                isOfficer
                  ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/20'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20'
              }`}
            >
              {isLoading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Demo Credentials Helper Pill */}
          <div className="pt-4 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Quick Demo Logins (Click to autofill):
            </p>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('rahul@example.com', 'Applicant@123')}
                className="w-full text-left p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 text-emerald-900 text-xs transition-colors flex items-center justify-between"
              >
                <div>
                  <span className="font-bold">Applicant:</span> Rahul Kumar (ABC Foods)
                </div>
                <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded font-mono">Use</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('priya.officer@example.com', 'Officer@123')}
                className="w-full text-left p-2 rounded-lg bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-200 text-indigo-900 text-xs transition-colors flex items-center justify-between"
              >
                <div>
                  <span className="font-bold">Officer:</span> Priya Sharma (Salem MSME)
                </div>
                <span className="text-[10px] bg-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded font-mono">Use</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin@msme.example.com', 'Admin@123')}
                className="w-full text-left p-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs transition-colors flex items-center justify-between"
              >
                <div>
                  <span className="font-bold">Admin:</span> MSME Admin (Full Control)
                </div>
                <span className="text-[10px] bg-slate-300 text-slate-800 px-1.5 py-0.5 rounded font-mono">Use</span>
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-slate-600">
            {isOfficer ? (
              <Link to="/login" className="text-indigo-600 hover:underline font-semibold">
                Switch to Applicant Login
              </Link>
            ) : (
              <div className="space-y-1">
                <div>
                  Don't have an applicant account?{' '}
                  <Link to="/register" className="text-emerald-600 hover:underline font-bold">
                    Register Now
                  </Link>
                </div>
                <div>
                  <Link to="/officer/login" className="text-slate-500 hover:text-indigo-600 text-[11px]">
                    Go to Officer / Admin Portal →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
