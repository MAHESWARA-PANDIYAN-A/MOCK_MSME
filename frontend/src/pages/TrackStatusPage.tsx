import React, { useState } from 'react';
import { applicationService } from '../services/applicationService';
import { Search, Clock, CheckCircle2, AlertCircle, Building2, MapPin, RefreshCw, ArrowRight } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { ClassificationBadge } from '../components/ClassificationBadge';

export const TrackStatusPage: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await applicationService.publicTrack(identifier.trim());
      setResult(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || `No application found matching '${identifier}'.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold">
          <Clock className="w-4 h-4 text-blue-600" />
          Real-Time Tracking Service
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Track Udyam Application Status
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Enter your Application Reference Number or Udyam Registration Number
        </p>
      </div>

      <form onSubmit={handleSearch} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="e.g. UDYAM-MOCK-2026-000123 or SIH-APP-1001"
            className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors shrink-0"
        >
          {isLoading ? 'Searching...' : 'Track Status'}
        </button>
      </form>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-2" />
          Searching application status...
        </div>
      ) : error ? (
        <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">Not Found</h4>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      ) : result ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-100">
            <div>
              <span className="text-xs font-mono font-bold text-slate-500">{result.application_number}</span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{result.enterprise_name}</h2>
              <p className="text-xs text-slate-500">Location: {result.state}</p>
            </div>
            <div className="flex flex-col sm:items-end gap-1">
              <StatusBadge status={result.status} size="lg" />
              <ClassificationBadge type={result.enterprise_type} size="sm" />
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Application Progression History</h3>
            <div className="space-y-3">
              {result.timeline?.map((item: any, idx: number) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      Status: <span className="text-emerald-700">{item.status}</span>
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(item.date).toLocaleString('en-IN')}
                    </span>
                  </div>
                  {item.comments && (
                    <p className="text-slate-600 italic bg-white p-2 rounded border border-slate-100">
                      "{item.comments}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
