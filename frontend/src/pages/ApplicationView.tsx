import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { applicationService } from '../services/applicationService';
import { Application } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { ClassificationBadge } from '../components/ClassificationBadge';
import { 
  Building2, CheckCircle2, Clock, Award, ArrowLeft, 
  MapPin, ShieldCheck, DollarSign, Users, Briefcase, RefreshCw, AlertCircle
} from 'lucide-react';

export const ApplicationView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const justSubmitted = searchParams.get('submitted') === 'true';

  const [app, setApp] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApp = async () => {
      setIsLoading(true);
      try {
        if (id) {
          const data = await applicationService.getApplicationById(Number(id));
          setApp(data);
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load application record.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchApp();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-xs text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
        <span>Loading application record...</span>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
          {error || 'Application not found.'}
        </div>
        <Link to="/dashboard" className="text-emerald-600 font-bold text-xs hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const formatINR = (val: any) => {
    const num = Number(val) || 0;
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} Lakh`;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/dashboard"
          className="text-slate-600 hover:text-slate-900 text-xs font-semibold inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        {app.status === 'APPROVED' && app.udyam_registration_number && (
          <Link
            to={`/certificate/${app.udyam_registration_number}`}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
          >
            <Award className="w-4 h-4" />
            View Registration Certificate
          </Link>
        )}
      </div>

      {/* Submission Success Alert if redirected after submission */}
      {justSubmitted && (
        <div className="p-5 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex items-start gap-3 text-emerald-900">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-extrabold text-sm">Registration Submitted Successfully!</h3>
            <p className="text-xs text-emerald-800">
              Your application has been assigned number <b className="font-mono text-emerald-950">{app.application_number}</b> and is now queued for verification by the MSME review team.
            </p>
          </div>
        </div>
      )}

      {/* Overview Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-500">
                {app.application_number}
              </span>
              {app.prefilled_from_sih && (
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  ✓ Imported from SIH Portal
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black text-slate-900 mt-1">
              {app.enterprise?.name || 'Enterprise Registration'}
            </h1>
            <p className="text-xs text-slate-500">
              {app.enterprise?.organisation_type?.replace('_', ' ')} • Submitted on{' '}
              {app.submission_date ? new Date(app.submission_date).toLocaleDateString('en-IN') : 'Draft'}
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-1.5">
            <StatusBadge status={app.status} size="lg" />
            <ClassificationBadge type={app.enterprise_type} size="md" />
          </div>
        </div>

        {/* Key Quick Metadata */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-medium">Udyam Reg. Number</span>
            <p className="font-bold text-slate-900 mt-0.5 font-mono">
              {app.udyam_registration_number || 'Pending Approval'}
            </p>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-medium">Investment (Plant & Eq.)</span>
            <p className="font-bold text-slate-900 mt-0.5 font-mono">
              {formatINR(app.financials?.investment)}
            </p>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-medium">Annual Turnover</span>
            <p className="font-bold text-slate-900 mt-0.5 font-mono">
              {formatINR(app.financials?.turnover)}
            </p>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-medium">Primary Activity</span>
            <p className="font-bold text-slate-900 mt-0.5 truncate">
              {app.activities[0]?.major_activity || 'MANUFACTURING'}
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Verification Status */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b pb-2 border-slate-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Identity & Tax Verification
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Aadhaar (Masked):</span>
              <span className="font-bold text-slate-800 font-mono">
                {app.aadhaar_verification?.masked_aadhaar || 'XXXX-XXXX-1234'} (✓ Simulated Verified)
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Entrepreneur Name:</span>
              <span className="font-bold text-slate-800">{app.aadhaar_verification?.entrepreneur_name || '—'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">PAN Number:</span>
              <span className="font-bold text-slate-800 font-mono">{app.pan_verification?.pan_number || '—'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">GSTIN:</span>
              <span className="font-bold text-slate-800 font-mono">{app.gstin_verification?.gstin || 'Not Applicable'}</span>
            </div>
          </div>
        </div>

        {/* Address & Units */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b pb-2 border-slate-100">
            <MapPin className="w-4 h-4 text-emerald-600" />
            Location & Manufacturing Plants
          </h3>
          <div className="space-y-2 text-xs">
            <p className="text-slate-700">
              <b>Official Address:</b> {app.address?.premises_building ? `${app.address.premises_building}, ` : ''}
              {app.address?.city}, {app.address?.district}, {app.address?.state} - {app.address?.pincode}
            </p>
            <div className="pt-2 border-t border-slate-100">
              <span className="text-slate-500 font-medium">Registered Plants / Units ({app.plants.length}):</span>
              <div className="mt-1.5 space-y-1">
                {app.plants.map((p, idx) => (
                  <div key={idx} className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-[11px]">
                    <b>{p.unit_name}</b> — {p.district}, {p.state}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Activities */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b pb-2 border-slate-100">
            <Briefcase className="w-4 h-4 text-emerald-600" />
            Business Activities & NIC Codes
          </h3>
          <div className="space-y-2">
            {app.activities.map((act, idx) => (
              <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
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
        </div>

        {/* Classification Summary */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b pb-2 border-slate-100">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            Classification Evaluation
          </h3>
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5 text-xs text-emerald-950">
            <div className="font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Engine Result: {app.enterprise_type} ENTERPRISE
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              {app.classification_reason || 'Investment and turnover meet prototype Micro enterprise criteria.'}
            </p>
          </div>
        </div>
      </div>

      {/* Application Timeline & Audit History */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 border-b pb-2 border-slate-100">
          Application Status History & Officer Notes
        </h3>
        <div className="space-y-4">
          {app.status_history.map((hist, idx) => (
            <div key={idx} className="flex items-start gap-3 text-xs">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                {idx + 1}
              </div>
              <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">
                    Status changed to <span className="text-emerald-700">{hist.new_status}</span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(hist.created_at).toLocaleString('en-IN')}
                  </span>
                </div>
                {hist.comments && (
                  <p className="text-slate-600 mt-1 italic bg-white p-2 rounded border border-slate-100">
                    "{hist.comments}"
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
