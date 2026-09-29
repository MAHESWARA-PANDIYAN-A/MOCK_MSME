import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { officerService } from '../services/officerService';
import { ClassificationRule } from '../types';
import { 
  Settings, Sliders, ShieldCheck, Database, RefreshCw, 
  Save, CheckCircle2, AlertCircle, FileText, Activity 
} from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [rules, setRules] = useState<ClassificationRule[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [integrationLogs, setIntegrationLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'rules' | 'audit' | 'integrations'>('rules');

  const [isLoading, setIsLoading] = useState(true);
  const [editingRuleId, setEditingRuleId] = useState<number | null>(null);
  const [editInvestment, setEditInvestment] = useState<number>(0);
  const [editTurnover, setEditTurnover] = useState<number>(0);
  const [editDesc, setEditDesc] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [rData, aData, iData] = await Promise.all([
        officerService.getClassificationRules(),
        officerService.getAuditLogs(1, 30),
        officerService.getIntegrationLogs(),
      ]);
      setRules(rData);
      setAuditLogs(aData.items || []);
      setIntegrationLogs(iData || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load administrator settings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStartEdit = (rule: ClassificationRule) => {
    setEditingRuleId(rule.id);
    setEditInvestment(rule.max_investment);
    setEditTurnover(rule.max_turnover);
    setEditDesc(rule.description || '');
  };

  const handleSaveRule = async (ruleId: number) => {
    setIsSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const updated = await officerService.updateClassificationRule(ruleId, {
        max_investment: editInvestment,
        max_turnover: editTurnover,
        description: editDesc,
      });
      setRules(rules.map((r) => (r.id === ruleId ? updated : r)));
      setEditingRuleId(null);
      setSuccessMsg('Classification threshold updated in database and audited.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update rule.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-xs text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-slate-700 mb-2" />
        <span>Loading Admin Console...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            System Administration
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-1">
            MSME Configuration & Audit Console
          </h1>
          <p className="text-xs text-slate-400">
            Manage classification engine thresholds, inspect SIH integration requests, and review system audit trails.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
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

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-xs gap-2">
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2.5 font-bold rounded-t-xl transition-colors flex items-center gap-1.5 ${
            activeTab === 'rules'
              ? 'bg-white border-t-2 border-slate-900 text-slate-900 shadow-2xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Classification Rules ({rules.length})
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2.5 font-bold rounded-t-xl transition-colors flex items-center gap-1.5 ${
            activeTab === 'audit'
              ? 'bg-white border-t-2 border-slate-900 text-slate-900 shadow-2xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          System Audit Logs ({auditLogs.length})
        </button>

        <button
          onClick={() => setActiveTab('integrations')}
          className={`px-4 py-2.5 font-bold rounded-t-xl transition-colors flex items-center gap-1.5 ${
            activeTab === 'integrations'
              ? 'bg-white border-t-2 border-slate-900 text-slate-900 shadow-2xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          SIH Integration API Logs ({integrationLogs.length})
        </button>
      </div>

      {/* RULES TAB */}
      {activeTab === 'rules' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Configurable Classification Thresholds</h3>
            <p className="text-xs text-slate-500">
              Thresholds dynamically queried by backend business logic. Changes are immediately applied across the platform.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-semibold">
                <tr>
                  <th className="py-3 px-4">Enterprise Tier</th>
                  <th className="py-3 px-4">Max Investment (₹)</th>
                  <th className="py-3 px-4">Max Turnover (₹)</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Last Updated</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {rules.map((r) => (
                  <tr key={r.id}>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {r.enterprise_type}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {editingRuleId === r.id ? (
                        <input
                          type="number"
                          value={editInvestment}
                          onChange={(e) => setEditInvestment(Number(e.target.value))}
                          className="w-32 px-2 py-1 border border-slate-300 rounded text-xs"
                        />
                      ) : (
                        `₹${(r.max_investment / 10000000).toFixed(2)} Cr`
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {editingRuleId === r.id ? (
                        <input
                          type="number"
                          value={editTurnover}
                          onChange={(e) => setEditTurnover(Number(e.target.value))}
                          className="w-32 px-2 py-1 border border-slate-300 rounded text-xs"
                        />
                      ) : (
                        `₹${(r.max_turnover / 10000000).toFixed(2)} Cr`
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {editingRuleId === r.id ? (
                        <input
                          type="text"
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                        />
                      ) : (
                        r.description
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-slate-400">
                      {r.updated_at ? new Date(r.updated_at).toLocaleDateString('en-IN') : 'Default'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {editingRuleId === r.id ? (
                        <div className="inline-flex gap-1">
                          <button
                            onClick={() => handleSaveRule(r.id)}
                            disabled={isSaving}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded text-xs font-bold"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingRuleId(null)}
                            className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartEdit(r)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-semibold"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AUDIT LOGS TAB */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">System Security & Audit Trail</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-semibold">
                <tr>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Sanitized Details</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {auditLogs.map((l) => (
                  <tr key={l.id}>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">{l.action}</td>
                    <td className="py-3 px-4 font-medium">{l.user_name}</td>
                    <td className="py-3 px-4 text-slate-500">{l.entity_type} #{l.entity_id || '—'}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600 max-w-xs truncate">
                      {JSON.stringify(l.details)}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-400">
                      {new Date(l.created_at).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INTEGRATIONS TAB */}
      {activeTab === 'integrations' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">SIH REST Integration Requests</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-semibold">
                <tr>
                  <th className="py-3 px-4">Endpoint</th>
                  <th className="py-3 px-4">External Reference</th>
                  <th className="py-3 px-4">Idempotency Key</th>
                  <th className="py-3 px-4">Response</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {integrationLogs.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 px-4 font-mono font-bold">{item.endpoint}</td>
                    <td className="py-3 px-4 font-mono text-emerald-700">{item.external_reference_id || '—'}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{item.idempotency_key || 'None'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        {item.response_status} OK
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-400">
                      {new Date(item.created_at).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
