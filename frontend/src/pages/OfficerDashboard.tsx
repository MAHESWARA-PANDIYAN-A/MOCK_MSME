import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { officerService } from '../services/officerService';
import { StatusBadge } from '../components/StatusBadge';
import { ClassificationBadge } from '../components/ClassificationBadge';
import { STATES_AND_DISTRICTS } from '../data/statesAndDistricts';
import { 
  Shield, Search, Filter, RefreshCw, FileText, CheckCircle2, 
  AlertCircle, Clock, Eye, Settings, ChevronLeft, ChevronRight, Building2
} from 'lucide-react';

export const OfficerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<any>({
    total_registrations: 0,
    new_submitted: 0,
    under_verification: 0,
    correction_required: 0,
    approved: 0,
    rejected: 0,
  });
  const [breakdown, setBreakdown] = useState<any>({});
  const [applications, setApplications] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [enterpriseTypeFilter, setEnterpriseTypeFilter] = useState('ALL');
  const [orgTypeFilter, setOrgTypeFilter] = useState('ALL');
  const [stateFilter, setStateFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [dashData, listData] = await Promise.all([
        officerService.getDashboard(),
        officerService.getApplications({
          page,
          limit,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          enterprise_type: enterpriseTypeFilter !== 'ALL' ? enterpriseTypeFilter : undefined,
          organisation_type: orgTypeFilter !== 'ALL' ? orgTypeFilter : undefined,
          state: stateFilter !== 'ALL' ? stateFilter : undefined,
          search: search.trim() ? search.trim() : undefined,
        }),
      ]);

      setStats(dashData.stats);
      setBreakdown(dashData.breakdown || {});
      setApplications(listData.items);
      setTotalCount(listData.total);
      setTotalPages(listData.total_pages);
    } catch (err) {
      console.error('Failed to fetch officer data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, statusFilter, enterpriseTypeFilter, orgTypeFilter, stateFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Officer Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-lg border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 bg-indigo-950 px-2.5 py-0.5 rounded border border-indigo-800">
              Government Review Portal
            </span>
            <span className="text-xs text-slate-400 font-mono">MSME Office Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            MSME Officer Inspection Dashboard
          </h1>
          <p className="text-xs text-slate-400">
            Welcome, Officer <b className="text-white">{user?.full_name}</b> • Review incoming registrations, verify tax data, and issue certificates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {user?.role === 'ADMIN' && (
            <Link
              to="/admin/settings"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Settings className="w-4 h-4" />
              Admin Settings
            </Link>
          )}
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Real-time DB Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500">Total Filings</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats.total_registrations || 0}</p>
          <span className="text-[10px] text-slate-400">All registered records</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/40 shadow-2xs">
          <span className="text-xs font-semibold text-blue-700">New Submitted</span>
          <p className="text-2xl font-black text-blue-900 mt-1">{stats.new_submitted || 0}</p>
          <span className="text-[10px] text-blue-600 font-medium">Needs initial review</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 shadow-2xs">
          <span className="text-xs font-semibold text-indigo-700">Under Verif.</span>
          <p className="text-2xl font-black text-indigo-900 mt-1">{stats.under_verification || 0}</p>
          <span className="text-[10px] text-indigo-600 font-medium">In progress</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/40 shadow-2xs">
          <span className="text-xs font-semibold text-amber-700">Correction</span>
          <p className="text-2xl font-black text-amber-900 mt-1">{stats.correction_required || 0}</p>
          <span className="text-[10px] text-amber-600 font-medium">Returned to applicant</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 shadow-2xs">
          <span className="text-xs font-semibold text-emerald-700">Approved</span>
          <p className="text-2xl font-black text-emerald-900 mt-1">{stats.approved || 0}</p>
          <span className="text-[10px] text-emerald-600 font-medium">Udyam issued</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/40 shadow-2xs">
          <span className="text-xs font-semibold text-rose-700">Rejected</span>
          <p className="text-2xl font-black text-rose-900 mt-1">{stats.rejected || 0}</p>
          <span className="text-[10px] text-rose-600 font-medium">Non-compliant</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by App No, Udyam No, Enterprise Name, Applicant, or PAN..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
          <button
            type="submit"
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-colors shrink-0"
          >
            Search
          </button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Status Filter</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_VERIFICATION">Under Verification</option>
              <option value="CORRECTION_REQUIRED">Correction Required</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Enterprise Type</label>
            <select
              value={enterpriseTypeFilter}
              onChange={(e) => {
                setEnterpriseTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
            >
              <option value="ALL">All Tiers</option>
              <option value="MICRO">Micro</option>
              <option value="SMALL">Small</option>
              <option value="MEDIUM">Medium</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Organisation</label>
            <select
              value={orgTypeFilter}
              onChange={(e) => {
                setOrgTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
            >
              <option value="ALL">All Types</option>
              <option value="PROPRIETORSHIP">Proprietorship</option>
              <option value="PARTNERSHIP">Partnership</option>
              <option value="LLP">LLP</option>
              <option value="PRIVATE_LIMITED">Private Limited</option>
              <option value="PUBLIC_LIMITED">Public Limited</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">State Jurisdiction</label>
            <select
              value={stateFilter}
              onChange={(e) => {
                setStateFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
            >
              <option value="ALL">All States</option>
              {Object.keys(STATES_AND_DISTRICTS).map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Registration Applications Queue ({totalCount})
          </span>
          <span className="text-xs text-slate-500">
            Page {page} of {totalPages || 1}
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
            Loading officer records...
          </div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No applications found matching the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Application No.</th>
                  <th className="py-3 px-4">Enterprise Name</th>
                  <th className="py-3 px-4">Applicant</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4">Submission Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {app.application_number}
                      {app.udyam_registration_number && (
                        <span className="block text-[10px] text-emerald-600 font-mono font-normal">
                          {app.udyam_registration_number}
                        </span>
                      )}
                      {app.prefilled_from_sih && (
                        <span className="block text-[10px] text-blue-600 font-sans">
                          ✓ SIH Prefilled
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{app.enterprise_name}</div>
                      <span className="text-[11px] text-slate-500">{app.organisation_type?.replace('_', ' ')}</span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {app.applicant_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {app.district}, {app.state}
                    </td>
                    <td className="py-3.5 px-4">
                      <ClassificationBadge type={app.enterprise_type} size="sm" />
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
                      <Link
                        to={`/officer/review/${app.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect & Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg border border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 flex items-center gap-1 font-semibold"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <span className="text-slate-600">
            Page {page} of {totalPages || 1}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 rounded-lg border border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 flex items-center gap-1 font-semibold"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
