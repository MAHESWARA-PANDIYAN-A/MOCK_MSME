import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { applicationService } from '../services/applicationService';
import { ApplicationListItem, NotificationItem } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { ClassificationBadge } from '../components/ClassificationBadge';
import { 
  Building2, PlusCircle, FileText, AlertCircle, CheckCircle2, 
  Clock, RefreshCw, Award, ArrowRight, Eye, Edit3, Bell, X
} from 'lucide-react';

export const ApplicantDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [applications, setApplications] = useState<ApplicationListItem[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({
    DRAFT: 0,
    SUBMITTED: 0,
    UNDER_VERIFICATION: 0,
    CORRECTION_REQUIRED: 0,
    APPROVED: 0,
    REJECTED: 0,
    TOTAL: 0,
  });
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [appData, notifs] = await Promise.all([
        applicationService.getMyApplications(),
        applicationService.getNotifications(),
      ]);
      setApplications(appData.applications);
      setCounts(appData.counts);
      setNotifications(notifs);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load dashboard applications.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleStartNewRegistration = async () => {
    try {
      const draft = await applicationService.getOrCreateDraft();
      navigate(`/wizard/${draft.id}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDismissNotification = async (id: number) => {
    try {
      await applicationService.markNotificationRead(id);
      setNotifications(notifications.filter((n) => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            Entrepreneur Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            Welcome, {user?.full_name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your simulated Udyam registrations, update drafts, and view generated MSME certificates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            className="p-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleStartNewRegistration}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md shadow-emerald-900/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            New Registration
          </button>
        </div>
      </div>

      {/* Notifications Alert Banner (if correction required or updates) */}
      {notifications.filter((n) => !n.is_read).length > 0 && (
        <div className="space-y-2">
          {notifications
            .filter((n) => !n.is_read)
            .slice(0, 3)
            .map((notif) => (
              <div
                key={notif.id}
                className={`p-4 rounded-xl border flex items-start justify-between gap-3 text-xs ${
                  notif.notification_type === 'WARNING'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : notif.notification_type === 'SUCCESS'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-blue-50 border-blue-200 text-blue-900'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <Bell className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-bold">{notif.title}</h4>
                    <p className="mt-0.5">{notif.message}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDismissNotification(notif.id)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
        </div>
      )}

      {/* Dynamic Status Count Cards from Database */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Drafts</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900">{counts.DRAFT || 0}</p>
          <span className="text-[10px] text-slate-400">Incomplete registrations</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-blue-600 mb-1">
            <span className="text-xs font-semibold">Submitted</span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-blue-900">{counts.SUBMITTED || 0}</p>
          <span className="text-[10px] text-slate-400">Pending review</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-indigo-600 mb-1">
            <span className="text-xs font-semibold">Under Verif.</span>
            <RefreshCw className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-indigo-900">{counts.UNDER_VERIFICATION || 0}</p>
          <span className="text-[10px] text-slate-400">Officer inspecting</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <span className="text-xs font-semibold">Correction</span>
            <AlertCircle className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-amber-900">{counts.CORRECTION_REQUIRED || 0}</p>
          <span className="text-[10px] text-slate-400">Action requested</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <span className="text-xs font-semibold">Approved</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-emerald-900">{counts.APPROVED || 0}</p>
          <span className="text-[10px] text-slate-400">Certificate issued</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-rose-600 mb-1">
            <span className="text-xs font-semibold">Rejected</span>
            <AlertCircle className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-rose-900">{counts.REJECTED || 0}</p>
          <span className="text-[10px] text-slate-400">Non-compliant</span>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">Your Enterprise Registrations</h3>
            <p className="text-xs text-slate-500">Live database applications registered under your account</p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Total Records: {applications.length}
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
            Loading application records...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 text-xs">
            {error}
          </div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">No applications found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You haven't initiated any Udyam registrations yet. Click below to begin your paperless simulated registration.
            </p>
            <button
              onClick={handleStartNewRegistration}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500"
            >
              Start Registration
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Application Number</th>
                  <th className="py-3 px-4">Enterprise Name</th>
                  <th className="py-3 px-4">Enterprise Type</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Submission Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {app.application_number}
                      {app.prefilled_from_sih && (
                        <span className="block text-[10px] text-emerald-600 font-sans font-medium">
                          ✓ Prefilled from SIH
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{app.enterprise_name}</div>
                      <span className="text-[11px] text-slate-500">{app.organisation_type?.replace('_', ' ') || 'Enterprise'}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <ClassificationBadge type={app.enterprise_type} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {app.district}, {app.state}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {app.submission_date
                        ? new Date(app.submission_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={app.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {app.status === 'DRAFT' || app.status === 'CORRECTION_REQUIRED' ? (
                          <button
                            onClick={() => navigate(`/wizard/${app.id}`)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 transition-colors flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3" />
                            {app.status === 'CORRECTION_REQUIRED' ? 'Correct Form' : 'Continue'}
                          </button>
                        ) : null}

                        <Link
                          to={`/application/${app.id}`}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors flex items-center gap-1"
                          title="View Details"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </Link>

                        {app.status === 'APPROVED' && app.udyam_registration_number && (
                          <Link
                            to={`/certificate/${app.udyam_registration_number}`}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors flex items-center gap-1"
                          >
                            <Award className="w-3 h-3" />
                            Certificate
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
