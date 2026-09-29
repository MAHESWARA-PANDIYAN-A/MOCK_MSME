import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { applicationService } from '../services/applicationService';
import { 
  ShieldCheck, Search, CheckCircle2, AlertCircle, Building2, 
  MapPin, Calendar, Award, RefreshCw 
} from 'lucide-react';
import { ClassificationBadge } from '../components/ClassificationBadge';

export const PublicVerifyPage: React.FC = () => {
  const { udyamNumber } = useParams<{ udyamNumber?: string }>();
  const navigate = useNavigate();

  const [searchCode, setSearchCode] = useState(udyamNumber || '');
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVerification = async (code: string) => {
    if (!code.trim()) return;
    setIsLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await applicationService.publicVerify(code.trim());
      setData(res.registration_details);
    } catch (err: any) {
      setError(err.response?.data?.detail || `No prototype registration found for '${code}'.`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (udyamNumber) {
      fetchVerification(udyamNumber);
    }
  }, [udyamNumber]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchCode.trim()) {
      navigate(`/verify/${searchCode.trim()}`);
      fetchVerification(searchCode.trim());
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Prototype Verification Service
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Verify Udyam MSME Registration
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Verify prototype registration authenticity and active classification status
        </p>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSearch} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            required
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            placeholder="Enter Mock Udyam Number (e.g. UDYAM-TN-00-1234567)"
            className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono uppercase"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors shrink-0"
        >
          {isLoading ? 'Verifying...' : 'Verify'}
        </button>
      </form>

      {/* Verification Result Card */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-2" />
          Querying simulated registration database...
        </div>
      ) : error ? (
        <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">Verification Failed</h4>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      ) : data ? (
        <div className="bg-white rounded-3xl border-2 border-emerald-400 shadow-lg p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-100">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Registration Verification Record
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                {data.enterprise_name}
              </h2>
              <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mt-1 inline-block">
                {data.udyam_registration_number}
              </span>
            </div>

            <div className="flex flex-col sm:items-end gap-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ACTIVE SIMULATION
              </span>
              <ClassificationBadge type={data.enterprise_type} size="sm" />
            </div>
          </div>

          {/* Details Table */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 font-medium text-[11px]">Organisation Type</span>
              <p className="font-bold text-slate-900">{data.organisation_type?.replace('_', ' ')}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 font-medium text-[11px]">Major Business Activity</span>
              <p className="font-bold text-slate-900">{data.major_activity}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 font-medium text-[11px]">State & District</span>
              <p className="font-bold text-slate-900">{data.district}, {data.state}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 font-medium text-[11px]">Registration Date</span>
              <p className="font-bold text-slate-900">{data.registration_date}</p>
            </div>
          </div>

          {/* Prototype Notice */}
          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              Prototype Simulation Verification
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              This verification confirms that the above enterprise registration data exists within the SIH26130 test suite. It does NOT claim to verify an official Government of India certificate.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
};
