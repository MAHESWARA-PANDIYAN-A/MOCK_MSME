import React from 'react';
import { ApplicationStatusType } from '../types';
import { Clock, CheckCircle2, AlertCircle, RefreshCw, XCircle, FileEdit } from 'lucide-react';

interface StatusBadgeProps {
  status: ApplicationStatusType | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-semibold',
  }[size];

  switch (status) {
    case 'DRAFT':
      return (
        <span className={`inline-flex items-center rounded-full bg-slate-100 text-slate-700 border border-slate-300 ${sizeClasses}`}>
          <FileEdit className="w-3.5 h-3.5 text-slate-500" />
          Draft
        </span>
      );
    case 'SUBMITTED':
      return (
        <span className={`inline-flex items-center rounded-full bg-blue-50 text-blue-700 border border-blue-200 ${sizeClasses}`}>
          <Clock className="w-3.5 h-3.5 text-blue-500" />
          Submitted
        </span>
      );
    case 'UNDER_VERIFICATION':
      return (
        <span className={`inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 ${sizeClasses}`}>
          <RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin-slow" />
          Under Verification
        </span>
      );
    case 'CORRECTION_REQUIRED':
      return (
        <span className={`inline-flex items-center rounded-full bg-amber-50 text-amber-800 border border-amber-300 ${sizeClasses}`}>
          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
          Correction Required
        </span>
      );
    case 'APPROVED':
      return (
        <span className={`inline-flex items-center rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 ${sizeClasses}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Approved
        </span>
      );
    case 'REJECTED':
      return (
        <span className={`inline-flex items-center rounded-full bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses}`}>
          <XCircle className="w-3.5 h-3.5 text-rose-500" />
          Rejected
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center rounded-full bg-slate-100 text-slate-700 ${sizeClasses}`}>
          {status}
        </span>
      );
  }
};
