import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, ShieldCheck, ArrowRight, CheckCircle2, Search, 
  FileCheck, Calculator, Sparkles, Layers, Zap, ExternalLink 
} from 'lucide-react';
import { ClassificationCard } from '../components/ClassificationCard';
import { applicationService } from '../services/applicationService';

export const LandingPage: React.FC = () => {
  // Interactive Live Calculator state
  const [calcInvestment, setCalcInvestment] = useState<number>(15000000); // 1.5 Cr
  const [calcTurnover, setCalcTurnover] = useState<number>(60000000); // 6 Cr
  const [calcExport, setCalcExport] = useState<number>(0);
  const [calcResult, setCalcResult] = useState<{
    enterprise_type: string;
    reason: string;
  }>({
    enterprise_type: 'MICRO',
    reason: 'Investment (₹1.50 Cr) and Turnover (₹6.00 Cr) fall within the configured Micro enterprise thresholds.'
  });
  const [isCalculating, setIsCalculating] = useState(false);

  const handleCalculate = async () => {
    setIsCalculating(true);
    try {
      const res = await applicationService.calculateClassificationPreview(calcInvestment, calcTurnover, calcExport);
      setCalcResult({
        enterprise_type: res.enterprise_type,
        reason: res.reason
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white pt-14 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(#15803d_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none"></div>
        <div className="max-w-6xl mx-auto relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>SIH26130 MSME Paperless Interoperability Microservice</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight">
            Simulated Udyam <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500">
              MSME Registration Portal
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
            Register your enterprise through a simulated Udyam workflow, calculate real-time MSME classification, 
            and generate a verifiable digital registration certificate for the SIH26130 platform.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/40 transition-all hover:scale-105"
            >
              Start New Registration
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/track"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm transition-all"
            >
              <Search className="w-4 h-4 text-emerald-400" />
              Track Application
            </Link>

            <Link
              to="/verify-search"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm transition-all"
            >
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              Verify Certificate
            </Link>
          </div>

          {/* Prototype disclaimer pill */}
          <div className="pt-6">
            <div className="inline-block p-3 rounded-xl bg-slate-950/70 border border-amber-500/30 text-slate-400 text-xs max-w-2xl text-center">
              <span className="font-bold text-amber-400">SIH26130 Prototype Notice:</span> This is a simulated registration portal designed for technical demonstration. It does not perform actual government filings or UIDAI/GSTN integrations.
            </div>
          </div>
        </div>
      </section>

      {/* Key Highlights / Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Engineered for Paperless Interoperability
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2">
            Fully automated microservice designed to integrate with the central SIH26130 application pipeline.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <FileCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Paperless Multi-Step Wizard</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              12-step guided workflow following real Udyam guidelines: mock OTP Aadhaar verification, PAN validation, 
              plant units, activities, and financial declarations with zero mandatory document scans.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Dynamic Classification Engine</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Configurable backend classification rules dynamically categorize enterprises into Micro, Small, or Medium 
              tiers based on plant & machinery investments and turnover thresholds.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">SIH Pre-fill Integration API</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Accepts authenticated REST payloads from the main SIH portal, pre-populating drafts so entrepreneurs 
              never retype data already collected across the unified single-window platform.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Classification Calculator Widget */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 sm:p-10 text-white shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <Calculator className="w-4 h-4" />
                <span>Interactive Tool</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold">
                Test MSME Classification Rules
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                Adjust the investment and turnover figures to preview the automated categorization logic 
                computed by the backend rule engine in real time.
              </p>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Investment in Plant & Machinery (INR):
                  </label>
                  <input
                    type="number"
                    value={calcInvestment}
                    onChange={(e) => setCalcInvestment(Number(e.target.value))}
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-emerald-500 focus:outline-hidden"
                  />
                  <span className="text-[11px] text-slate-400">
                    Value: ₹{(calcInvestment / 10000000).toFixed(2)} Crore
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Annual Turnover (INR):
                  </label>
                  <input
                    type="number"
                    value={calcTurnover}
                    onChange={(e) => setCalcTurnover(Number(e.target.value))}
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-emerald-500 focus:outline-hidden"
                  />
                  <span className="text-[11px] text-slate-400">
                    Value: ₹{(calcTurnover / 10000000).toFixed(2)} Crore
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Export Turnover Excluded (INR):
                  </label>
                  <input
                    type="number"
                    value={calcExport}
                    onChange={(e) => setCalcExport(Number(e.target.value))}
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <button
                  onClick={handleCalculate}
                  disabled={isCalculating}
                  className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-bold text-white shadow-sm transition-colors"
                >
                  {isCalculating ? 'Computing...' : 'Recalculate via Backend Engine'}
                </button>
              </div>
            </div>

            <div className="lg:col-span-6">
              <ClassificationCard
                enterpriseType={calcResult.enterprise_type}
                investment={calcInvestment}
                turnover={calcTurnover}
                exportTurnover={calcExport}
                reason={calcResult.reason}
                className="bg-white text-slate-900"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-100 rounded-3xl p-8 sm:p-12 border border-slate-200">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Benefits of MSME Registration
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              General informational overview of enterprise recognition under the MSME framework.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-base mb-3">
                01
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1.5">Business Recognition</h4>
              <p className="text-xs text-slate-600">
                Formal legal status and digital certificate establishing enterprise categorization.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base mb-3">
                02
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1.5">Scheme Discoverability</h4>
              <p className="text-xs text-slate-600">
                Easier identification and eligibility screening for public development programs.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-base mb-3">
                03
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1.5">Support Access</h4>
              <p className="text-xs text-slate-600">
                Streamlined verification for industrial estates, power subsidies, and patent assistance.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-base mb-3">
                04
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1.5">Credit Opportunities</h4>
              <p className="text-xs text-slate-600">
                Potential qualification for priority sector lending subject to financial institution criteria.
              </p>
            </div>
          </div>

          <div className="mt-8 text-center text-slate-500 text-[11px]">
            * Note: Registration facilitates discoverability and formal identity; it does not constitute a legal guarantee of loans or automatic grant approvals.
          </div>
        </div>
      </section>
    </div>
  );
};
