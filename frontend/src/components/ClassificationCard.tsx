import React from 'react';
import { EnterpriseClassification } from '../types';
import { CheckCircle2, AlertCircle, Info, Sparkles, Building, Factory } from 'lucide-react';

interface ClassificationCardProps {
  enterpriseType: EnterpriseClassification | string;
  investment: number;
  turnover: number;
  exportTurnover?: number;
  reason?: string;
  className?: string;
}

export const ClassificationCard: React.FC<ClassificationCardProps> = ({
  enterpriseType = 'MICRO',
  investment = 0,
  turnover = 0,
  exportTurnover = 0,
  reason,
  className = '',
}) => {
  const formatINR = (val: number) => {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    } else if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)} Lakh`;
    }
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const getTheme = () => {
    switch (enterpriseType) {
      case 'MICRO':
        return {
          bg: 'bg-emerald-50/80',
          border: 'border-emerald-300',
          titleColor: 'text-emerald-900',
          tagBg: 'bg-emerald-600',
          icon: Sparkles,
          threshold: 'Investment ≤ ₹2.5 Cr & Turnover ≤ ₹10 Cr'
        };
      case 'SMALL':
        return {
          bg: 'bg-blue-50/80',
          border: 'border-blue-300',
          titleColor: 'text-blue-900',
          tagBg: 'bg-blue-600',
          icon: Building,
          threshold: 'Investment ≤ ₹25 Cr & Turnover ≤ ₹100 Cr'
        };
      case 'MEDIUM':
        return {
          bg: 'bg-purple-50/80',
          border: 'border-purple-300',
          titleColor: 'text-purple-900',
          tagBg: 'bg-purple-600',
          icon: Factory,
          threshold: 'Investment ≤ ₹125 Cr & Turnover ≤ ₹500 Cr'
        };
      default:
        return {
          bg: 'bg-slate-50',
          border: 'border-slate-300',
          titleColor: 'text-slate-900',
          tagBg: 'bg-slate-600',
          icon: AlertCircle,
          threshold: 'Outside configured MSME ranges'
        };
    }
  };

  const theme = getTheme();
  const IconComponent = theme.icon;

  return (
    <div className={`rounded-xl border-2 p-5 ${theme.bg} ${theme.border} shadow-sm ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-slate-200">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Automated MSME Engine
          </span>
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            Enterprise Classification
          </h3>
        </div>
        <div className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-white font-black text-sm shadow-sm ${theme.tagBg}`}>
          <IconComponent className="w-4 h-4" />
          <span>{enterpriseType}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
        <div className="bg-white/90 p-3 rounded-lg border border-slate-200 shadow-2xs">
          <p className="text-xs text-slate-500 font-medium">Plant & Machinery Investment</p>
          <p className="text-base font-bold text-slate-800">{formatINR(investment)}</p>
        </div>
        <div className="bg-white/90 p-3 rounded-lg border border-slate-200 shadow-2xs">
          <p className="text-xs text-slate-500 font-medium">Turnover (Net)</p>
          <p className="text-base font-bold text-slate-800">
            {formatINR(Math.max(0, turnover - exportTurnover))}
            {exportTurnover > 0 && (
              <span className="text-xs font-normal text-slate-500 ml-1">
                (Export ₹{(exportTurnover/10000000).toFixed(2)}Cr excluded)
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="bg-white/80 rounded-lg p-3 border border-slate-200 text-xs space-y-1.5">
        <div className="flex items-start gap-1.5 text-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            {reason || `Investment and turnover fall within the configured ${enterpriseType} enterprise thresholds.`}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500 pt-1 border-t border-slate-100">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>Configured Threshold: {theme.threshold}</span>
        </div>
      </div>

      <p className="text-[11px] text-slate-500 mt-2.5 italic text-center">
        Prototype classification based on current configured Udyam thresholds. Calculated by backend business logic.
      </p>
    </div>
  );
};
