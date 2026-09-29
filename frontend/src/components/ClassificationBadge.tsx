import React from 'react';
import { EnterpriseClassification } from '../types';
import { Sparkles, Building2, Factory, HelpCircle } from 'lucide-react';

interface ClassificationBadgeProps {
  type?: EnterpriseClassification | string;
  size?: 'sm' | 'md' | 'lg';
}

export const ClassificationBadge: React.FC<ClassificationBadgeProps> = ({ type = 'MICRO', size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
    lg: 'text-sm px-3 py-1.5 font-bold',
  }[size];

  switch (type) {
    case 'MICRO':
      return (
        <span className={`inline-flex items-center gap-1 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 ${sizeClasses}`}>
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          MICRO Enterprise
        </span>
      );
    case 'SMALL':
      return (
        <span className={`inline-flex items-center gap-1 rounded-md bg-blue-100 text-blue-800 border border-blue-300 ${sizeClasses}`}>
          <Building2 className="w-3.5 h-3.5 text-blue-600" />
          SMALL Enterprise
        </span>
      );
    case 'MEDIUM':
      return (
        <span className={`inline-flex items-center gap-1 rounded-md bg-purple-100 text-purple-800 border border-purple-300 ${sizeClasses}`}>
          <Factory className="w-3.5 h-3.5 text-purple-600" />
          MEDIUM Enterprise
        </span>
      );
    case 'OUTSIDE_RANGE':
      return (
        <span className={`inline-flex items-center gap-1 rounded-md bg-slate-100 text-slate-800 border border-slate-300 ${sizeClasses}`}>
          <HelpCircle className="w-3.5 h-3.5 text-slate-600" />
          Outside MSME Range
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1 rounded-md bg-slate-100 text-slate-700 ${sizeClasses}`}>
          {type || 'Pending'}
        </span>
      );
  }
};
