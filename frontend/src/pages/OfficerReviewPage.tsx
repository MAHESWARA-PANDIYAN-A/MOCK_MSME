import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { officerService } from '../services/officerService';
import { Application } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { ClassificationBadge } from '../components/ClassificationBadge';
import { ClassificationCard } from '../components/ClassificationCard';
import { 
  Shield, CheckCircle2, AlertCircle, ArrowLeft, RefreshCw, 
  XCircle, FileText, Check, Award, Eye, MessageSquare, Send
} from 'lucide-react';

export const OfficerReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [app, setApp] = useState<Application | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [reviewAction, setReviewAction] = useState<string>('APPROVE');
  const [comments, setComments] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchApp = async () => {
    setIsLoading(true);
    try {
      if (id) {
        const data = await officerService.getApplicationById(Number(id));
        setApp(data);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load application for inspection.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApp();
  }, [id]);

  const handleStartVerification = async () => {
    if (!app) return;
    try {
      await officerService.startVerification(app.id);
      fetchApp();
      setSuccessMsg('Application status updated to Under Verification.');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to start verification.');
    }
  };

  const handleExecuteReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!app) return;

    if (reviewAction === 'RETURN_FOR_CORRECTION' && !comments.trim()) {
      setError('A mandatory comment explaining the required correction is required.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await officerService.reviewApplication(app.id, reviewAction, comments);
      setSuccessMsg(res.message);
      fetchApp();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to process officer review action.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-xs text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
        <span>Loading inspection console...</span>
      </div>
    );
  }

  if (error && !app) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
          {error}
        </div>
        <Link to="/officer/dashboard" className="text-indigo-600 font-bold text-xs hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Return to Queue
        </Link>
      </div>
    );
  }

  if (!app) return null;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'aadhaar', label: 'Aadhaar Verification' },
    { id: 'pan', label: 'PAN & GSTIN' },
    { id: 'enterprise', label: 'Enterprise Details' },
    { id: 'address', label: 'Address & Plants' },
    { id: 'activities', label: 'NIC Activities' },
    { id: 'financials', label: 'Financials & MSME' },
    { id: 'timeline', label: 'Status Timeline' },
  ];

  const formatINR = (val: any) => {
    const num = Number(val) || 0;
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} Lakh`;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Breadcrumb & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <Link
            to="/officer/dashboard"
            className="text-slate-500 hover:text-slate-900 text-xs font-semibold inline-flex items-center gap-1 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Queue
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              {app.enterprise?.name}
            </h1>
            <span className="font-mono text-xs font-bold text-slate-500">
              ({app.application_number})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status={app.status} size="md" />
          <ClassificationBadge type={app.enterprise_type} size="sm" />
          {app.status === 'SUBMITTED' && (
            <button
              onClick={handleStartVerification}
              className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition-colors"
            >
              Start Inspection
            </button>
          )}
          {app.status === 'APPROVED' && app.udyam_registration_number && (
            <Link
              to={`/certificate/${app.udyam_registration_number}`}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs flex items-center gap-1"
            >
              <Award className="w-3.5 h-3.5" /> Certificate
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Inspection Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Multi-Tab Inspection Panels */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex border-b border-slate-200 overflow-x-auto bg-slate-50/70 text-xs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 font-semibold whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-700 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500">Applicant:</span>
                    <p className="font-bold text-slate-900">{app.applicant?.full_name || 'Rahul Kumar'}</p>
                    <span className="text-[11px] text-slate-500">{app.applicant?.email} • {app.applicant?.mobile}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500">Enterprise Type:</span>
                    <p className="font-bold text-slate-900">{app.enterprise_type} ENTERPRISE</p>
                    <span className="text-[11px] text-slate-500">{app.enterprise?.organisation_type?.replace('_', ' ')}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-1">
                  <span className="font-bold text-indigo-900">Pre-filing Source & Status:</span>
                  <p className="text-slate-600">
                    Source System: <b>{app.source_system}</b> {app.prefilled_from_sih ? '(Imported via SIH Prefill API)' : ''}
                  </p>
                  {app.external_reference_id && (
                    <p className="font-mono text-slate-500 text-[11px]">External Ref: {app.external_reference_id}</p>
                  )}
                </div>
              </div>
            )}

            {/* AADHAAR TAB */}
            {activeTab === 'aadhaar' && (
              <div className="space-y-3 text-xs">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5 text-emerald-950">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Simulated Aadhaar Verification Record
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Verified through simulated OTP pipeline. Full 12-digit Aadhaar numbers are never stored in compliance with privacy mandates.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500">Masked Aadhaar:</span>
                    <p className="font-mono font-bold text-slate-900">{app.aadhaar_verification?.masked_aadhaar || 'XXXX-XXXX-1234'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500">Verified Name:</span>
                    <p className="font-bold text-slate-900">{app.aadhaar_verification?.entrepreneur_name}</p>
                  </div>
                </div>
              </div>
            )}

            {/* PAN TAB */}
            {activeTab === 'pan' && (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-500">PAN Number:</span>
                  <p className="font-mono font-bold text-slate-900 text-sm">{app.pan_verification?.pan_number || 'Not provided'}</p>
                  <span className="text-emerald-700 font-semibold block">✓ Simulated Verified with Income Tax Entity Records</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-500">GSTIN Details:</span>
                  <p className="font-mono font-bold text-slate-900">{app.gstin_verification?.gstin || 'Not Applicable / Exempt'}</p>
                  <span className="text-slate-600 block">Trade Name: {app.gstin_verification?.trade_name || app.enterprise?.name}</span>
                </div>
              </div>
            )}

            {/* ENTERPRISE TAB */}
            {activeTab === 'enterprise' && (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500">Enterprise Name:</span>
                  <p className="font-bold text-slate-900">{app.enterprise?.name}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500">Organisation:</span>
                  <p className="font-bold text-slate-900">{app.enterprise?.organisation_type?.replace('_', ' ')}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500">Commencement Date:</span>
                  <p className="font-bold text-slate-900">{app.enterprise?.date_of_commencement || '—'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500">Social Category & Gender:</span>
                  <p className="font-bold text-slate-900">{app.enterprise?.social_category} • {app.enterprise?.gender}</p>
                </div>
              </div>
            )}

            {/* ADDRESS & PLANTS TAB */}
            {activeTab === 'address' && (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-bold block mb-1">Official Address:</span>
                  <p className="text-slate-800">
                    {app.address?.premises_building ? `${app.address.premises_building}, ` : ''}
                    {app.address?.city}, {app.address?.district}, {app.address?.state} - {app.address?.pincode}
                  </p>
                </div>
                <div className="space-y-2">
                  <span className="text-slate-700 font-bold block">Units / Plants ({app.plants.length}):</span>
                  {app.plants.map((p, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>{p.unit_name}</span>
                        <span>{p.district}, {p.state}</span>
                      </div>
                      <p className="text-slate-600">{p.address} (PIN: {p.pincode})</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ACTIVITIES TAB */}
            {activeTab === 'activities' && (
              <div className="space-y-2 text-xs">
                {app.activities.map((act, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded text-[11px] mr-2">
                        {act.nic_code}
                      </span>
                      <span className="font-medium text-slate-800">{act.description}</span>
                    </div>
                    {act.is_primary && (
                      <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">
                        PRIMARY
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* FINANCIALS & MSME TAB */}
            {activeTab === 'financials' && (
              <div className="space-y-4">
                <ClassificationCard
                  enterpriseType={app.enterprise_type || 'MICRO'}
                  investment={Number(app.financials?.investment) || 0}
                  turnover={Number(app.financials?.turnover) || 0}
                  exportTurnover={Number(app.financials?.export_turnover) || 0}
                  reason={app.classification_reason}
                />
              </div>
            )}

            {/* TIMELINE TAB */}
            {activeTab === 'timeline' && (
              <div className="space-y-3 text-xs">
                {app.status_history.map((hist, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>Status changed to {hist.new_status}</span>
                      <span className="text-slate-400 font-normal">{new Date(hist.created_at).toLocaleString('en-IN')}</span>
                    </div>
                    {hist.comments && (
                      <p className="text-slate-600 italic bg-white p-2 rounded border border-slate-100">
                        "{hist.comments}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Officer Decision Action Box */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6 h-fit">
          <div className="border-b pb-3 border-slate-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">Official Action</span>
            <h3 className="text-lg font-black text-slate-900">Review Decision</h3>
          </div>

          <form onSubmit={handleExecuteReview} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Action</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 cursor-pointer text-emerald-950 font-bold">
                  <input
                    type="radio"
                    name="decision"
                    value="APPROVE"
                    checked={reviewAction === 'APPROVE'}
                    onChange={() => setReviewAction('APPROVE')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Approve & Generate Mock Udyam No.</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-amber-200 bg-amber-50/70 cursor-pointer text-amber-950 font-bold">
                  <input
                    type="radio"
                    name="decision"
                    value="RETURN_FOR_CORRECTION"
                    checked={reviewAction === 'RETURN_FOR_CORRECTION'}
                    onChange={() => setReviewAction('RETURN_FOR_CORRECTION')}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <span>Return for Correction</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-rose-200 bg-rose-50/70 cursor-pointer text-rose-950 font-bold">
                  <input
                    type="radio"
                    name="decision"
                    value="REJECT"
                    checked={reviewAction === 'REJECT'}
                    onChange={() => setReviewAction('REJECT')}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <span>Reject Application</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Officer Comments {reviewAction === 'RETURN_FOR_CORRECTION' ? '*' : '(Optional)'}
              </label>
              <textarea
                rows={3}
                required={reviewAction === 'RETURN_FOR_CORRECTION'}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder={
                  reviewAction === 'RETURN_FOR_CORRECTION'
                    ? "e.g. Please correct the enterprise commencement date and unit PIN code."
                    : "Official review remarks..."
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className={`w-full py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition-all flex items-center justify-center gap-1.5 ${
                reviewAction === 'APPROVE'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20'
                  : reviewAction === 'RETURN_FOR_CORRECTION'
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/20'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/20'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              {isProcessing ? 'Processing Action...' : `Submit ${reviewAction.replace(/_/g, ' ')}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
