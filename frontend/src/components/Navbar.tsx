import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, Shield, User as UserIcon, LogOut, FileText, 
  Search, CheckCircle, Menu, X, Bell, LayoutDashboard, Settings
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-900/30 group-hover:bg-emerald-500 transition-colors">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
                Udyam MSME Portal
                <span className="hidden md:inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Simulated
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Micro, Small & Medium Enterprises Registration Workflow
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <Link
              to="/"
              className={`px-3 py-2 rounded-md text-xs font-semibold transition-colors ${
                isActive('/') ? 'bg-slate-800 text-emerald-400' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Home
            </Link>
            
            <Link
              to="/track"
              className={`px-3 py-2 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                isActive('/track') ? 'bg-slate-800 text-emerald-400' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              Track Application
            </Link>

            <Link
              to="/verify-search"
              className={`px-3 py-2 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                isActive('/verify-search') ? 'bg-slate-800 text-emerald-400' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Verify Registration
            </Link>

            {user ? (
              <div className="flex items-center gap-2 ml-3 pl-3 border-l border-slate-700">
                {user.role === 'APPLICANT' ? (
                  <Link
                    to="/dashboard"
                    className={`px-3 py-2 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      isActive('/dashboard') ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-emerald-300 hover:bg-slate-700'
                    }`}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    Applicant Dashboard
                  </Link>
                ) : (
                  <Link
                    to="/officer/dashboard"
                    className={`px-3 py-2 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      isActive('/officer/dashboard') ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-indigo-300 hover:bg-slate-700'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Officer Console
                  </Link>
                )}

                {user.role === 'ADMIN' && (
                  <Link
                    to="/admin/settings"
                    className="p-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-800"
                    title="Classification Rules & Audit"
                  >
                    <Settings className="w-4 h-4" />
                  </Link>
                )}

                <div className="flex items-center gap-2 px-2 py-1 rounded bg-slate-800/80 border border-slate-700 text-xs">
                  <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-semibold text-slate-200 truncate max-w-[120px]">{user.full_name}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-700 text-slate-300 font-mono">
                    {user.role}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-3 pl-3 border-l border-slate-700">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Applicant Login
                </Link>
                <Link
                  to="/officer/login"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-300 bg-indigo-950/60 border border-indigo-800/60 hover:bg-indigo-900/60 transition-colors flex items-center gap-1"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Officer Login
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm transition-colors"
                >
                  Register Enterprise
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-t border-slate-800 px-4 pt-2 pb-4 space-y-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-800"
          >
            Home
          </Link>
          <Link
            to="/track"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-800"
          >
            Track Application
          </Link>
          <Link
            to="/verify-search"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-800"
          >
            Verify Registration
          </Link>
          {user ? (
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="text-xs text-slate-400 px-3">Signed in as <b className="text-white">{user.full_name}</b> ({user.role})</div>
              {user.role === 'APPLICANT' ? (
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-sm font-semibold bg-emerald-600 text-white"
                >
                  Applicant Dashboard
                </Link>
              ) : (
                <Link
                  to="/officer/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-sm font-semibold bg-indigo-600 text-white"
                >
                  Officer Console
                </Link>
              )}
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-rose-400 hover:bg-slate-800"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-800"
              >
                Applicant Login
              </Link>
              <Link
                to="/officer/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium text-indigo-300 hover:bg-slate-800"
              >
                Officer Login
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-bold bg-emerald-600 text-white text-center"
              >
                Register Enterprise
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
