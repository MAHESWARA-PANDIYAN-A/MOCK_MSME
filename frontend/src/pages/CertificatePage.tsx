import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { applicationService } from '../services/applicationService';
import { API_BASE_URL, BACKEND_URL } from '../services/api';
import { 
  Award, Download, Printer, ArrowLeft, ShieldAlert, 
  CheckCircle2, QrCode, Building2, RefreshCw 
} from 'lucide-react';

export const CertificatePage: React.FC = () => {
  const { udyamNumber } = useParams<{ udyamNumber: string }>();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCert = async () => {
      setIsLoading(true);
      try {
        if (udyamNumber) {
          const res = await applicationService.publicVerify(udyamNumber);
          setData(res.registration_details);
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Certificate not found.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCert();
  }, [udyamNumber]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    if (udyamNumber) {
      window.open(`${API_BASE_URL}/public/certificate/${udyamNumber}/pdf`, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-xs text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
        <span>Generating digital certificate view...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
          {error || 'Certificate not found.'}
        </div>
        <Link to="/dashboard" className="text-emerald-600 font-bold text-xs hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Action Bar (hidden in print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <Link
          to="/dashboard"
          className="text-slate-600 hover:text-slate-900 text-xs font-semibold inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            Print Certificate
          </button>
          <button
            onClick={handleDownloadPdf}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Simulated Certificate Display Frame */}
      <div className="bg-white border-4 border-slate-900 rounded-3xl p-8 sm:p-12 shadow-2xl space-y-8 relative overflow-hidden print:p-6 print:border-2 print:shadow-none">
        {/* Watermark notice */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none">
          <span className="text-7xl sm:text-9xl font-black text-slate-900 transform -rotate-12">
            SIMULATED
          </span>
        </div>

        {/* Certificate Header */}
        <div className="text-center space-y-2 border-b-2 border-slate-800 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4 text-amber-700" />
            SIH26130 Prototype — Simulated Certificate
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
            UDYAM MSME REGISTRATION
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-800">
            Micro, Small and Medium Enterprises Registration Certificate
          </p>
        </div>

        {/* Registration Number Highlight */}
        <div className="bg-slate-50 border-2 border-slate-300 rounded-2xl p-4 text-center space-y-1">
          <span className="text-xs uppercase font-bold text-slate-500">
            Mock Udyam Registration Number
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-wider">
            {data.udyam_registration_number}
          </div>
        </div>

        {/* Certificate Data Table */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-500 font-medium uppercase text-[10px]">Name of Enterprise</span>
            <p className="font-extrabold text-sm text-slate-900">{data.enterprise_name}</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-500 font-medium uppercase text-[10px]">Organisation Type</span>
            <p className="font-bold text-slate-900">{data.organisation_type?.replace('_', ' ')}</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-500 font-medium uppercase text-[10px]">Type of Enterprise</span>
            <p className="font-black text-emerald-800 text-sm">{data.enterprise_type} ENTERPRISE</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-500 font-medium uppercase text-[10px]">Major Activity</span>
            <p className="font-bold text-slate-900">{data.major_activity}</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-500 font-medium uppercase text-[10px]">State & District</span>
            <p className="font-bold text-slate-900">{data.district}, {data.state}</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-500 font-medium uppercase text-[10px]">Date of Registration</span>
            <p className="font-bold text-slate-900">{data.registration_date}</p>
          </div>
        </div>

        {/* Verification & QR Code Footer */}
        <div className="pt-6 border-t-2 border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 p-1.5 bg-white border-2 border-slate-900 rounded-xl flex items-center justify-center shrink-0">
              <img
                src={`${BACKEND_URL}/generated/qr/${data.udyam_registration_number}_qr.png`}
                alt="Verification QR"
                className="w-full h-full object-contain"
                onError={(e) => {
                  // fallback icon if image loading delay
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <QrCode className="w-16 h-16 text-slate-800 hidden only:block" />
            </div>
            <div className="text-xs space-y-1 text-slate-700">
              <span className="font-bold text-slate-900 block">Digital Prototype Verification:</span>
              <p className="text-[11px] text-slate-600">
                Scan QR or visit <span className="font-mono text-emerald-800">/verify/{data.udyam_registration_number}</span> to view simulated verification records.
              </p>
              <span className="text-[10px] text-emerald-700 font-semibold inline-block bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ✓ Paperless Validation Complete
              </span>
            </div>
          </div>

          <div className="text-right text-xs space-y-1 text-slate-500">
            <div className="font-bold text-slate-900">SIH26130 Verification Seal</div>
            <p className="text-[10px]">Simulated Signature: VALIDATED</p>
          </div>
        </div>

        {/* Mandatory Legal Disclaimer */}
        <div className="text-center pt-4 border-t border-slate-200 text-[10px] text-rose-700 font-medium italic">
          NOTICE: This certificate is generated by the SIH26130 prototype and is for simulation and demonstration purposes only. It carries no legal or official Government endorsement.
        </div>
      </div>
    </div>
  );
};
