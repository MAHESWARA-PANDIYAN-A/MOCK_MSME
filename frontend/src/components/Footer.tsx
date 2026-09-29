import React from 'react';
import { Building2, ShieldAlert, Cpu, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs py-10 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <Building2 className="w-5 h-5 text-emerald-500" />
              <span>Udyam MSME Registration Portal</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              This simulated registration platform demonstrates end-to-end paperless MSME registration, 
              automated classification engine workflows, and REST API integration with the main SIH26130 platform.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-slate-800 border border-slate-700 text-amber-300 text-[11px] font-medium">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Simulation Environment — For Hackathon Demonstration Purposes Only</span>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">Quick Navigation</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="hover:text-emerald-400 transition-colors">Portal Home</Link></li>
              <li><Link to="/register" className="hover:text-emerald-400 transition-colors">New Registration</Link></li>
              <li><Link to="/track" className="hover:text-emerald-400 transition-colors">Track Status</Link></li>
              <li><Link to="/verify-search" className="hover:text-emerald-400 transition-colors">Public QR Verification</Link></li>
              <li><Link to="/login" className="hover:text-emerald-400 transition-colors">Applicant Login</Link></li>
              <li><Link to="/officer/login" className="hover:text-emerald-400 transition-colors">Officer Console</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">SIH26130 API & Specs</h4>
            <ul className="space-y-2">
              <li>
                <a href="http://localhost:8002/docs" target="_blank" rel="noreferrer" className="hover:text-emerald-400 flex items-center gap-1">
                  OpenAPI / Swagger <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li><span className="text-slate-500">Prefill REST API v1</span></li>
              <li><span className="text-slate-500">Webhook Status Broadcast</span></li>
              <li><span className="text-slate-500">Dynamic Classification Rules</span></li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© 2026 SIH26130 Hackathon Prototype Team. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-slate-400">
              <Cpu className="w-3.5 h-3.5 text-emerald-500" />
              Simulated MSME Microservice
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
