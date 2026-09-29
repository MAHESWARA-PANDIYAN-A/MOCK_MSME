import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export const PrototypeBanner: React.FC = () => {
  return (
    <aside aria-label="Prototype notice" className="bg-amber-500/10 border-b border-amber-500/20 text-amber-900 py-2 px-4 no-print">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 font-medium">
          <span className="inline-flex items-center gap-1 bg-amber-600 text-white font-bold px-2 py-0.5 rounded text-[11px] uppercase tracking-wide">
            <AlertTriangle className="w-3.5 h-3.5" />
            SIH26130 Prototype
          </span>
          <span>Simulated Udyam Workflow — This is a simulated registration portal and is NOT the official Government of India portal.</span>
        </div>
        <div className="flex items-center gap-1.5 text-amber-800 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Paperless Mock Verification Mode</span>
        </div>
      </div>
    </aside>
  );
};
