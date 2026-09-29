import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { applicationService } from '../services/applicationService';
import { verificationService } from '../services/verificationService';
import { Application } from '../types';
import { STATES_AND_DISTRICTS } from '../data/statesAndDistricts';
import { NIC_ACTIVITIES } from '../data/nicActivities';
import { ClassificationCard } from '../components/ClassificationCard';
import { 
  Building2, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, 
  ArrowLeft, Save, Check, RefreshCw, Send, Sparkles, MapPin, DollarSign, FileCheck
} from 'lucide-react';

export const RegistrationWizard: React.FC = () => {
  const { applicationId } = useParams<{ applicationId?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [app, setApp] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // STEP 1: Verification & Identity
  const [entrepreneurName, setEntrepreneurName] = useState(user?.full_name || 'Rahul Kumar');
  const [aadhaarRaw, setAadhaarRaw] = useState('123456781234');
  const [aadhaarVerified, setAadhaarVerified] = useState(true);
  const [maskedAadhaar, setMaskedAadhaar] = useState('XXXX-XXXX-1234');
  const [aadhaarOtp, setAadhaarOtp] = useState('123456');
  const [showAadhaarOtpBox, setShowAadhaarOtpBox] = useState(false);

  const [panNumber, setPanNumber] = useState('ABCDE1234F');
  const [panName, setPanName] = useState('ABC FOODS PVT LTD');
  const [panVerified, setPanVerified] = useState(true);
  const [gstin, setGstin] = useState('33ABCDE1234F1Z1');

  // STEP 2: Enterprise & Business Activity
  const [enterpriseName, setEnterpriseName] = useState('ABC Foods Pvt Ltd');
  const [orgType, setOrgType] = useState('PRIVATE_LIMITED');
  const [majorActivity, setMajorActivity] = useState('MANUFACTURING');
  const [selectedNicCode, setSelectedNicCode] = useState('DEMO-1071');

  // STEP 3: Business Location
  const [addressLine, setAddressLine] = useState('Plot 45-B, SIDCO Industrial Estate');
  const [city, setCity] = useState('Salem');
  const [selectedState, setSelectedState] = useState('Tamil Nadu');
  const [selectedDistrict, setSelectedDistrict] = useState('Salem');
  const [pincode, setPincode] = useState('636001');

  // STEP 4: Financials & MSME Classification
  const [investment, setInvestment] = useState<number>(15000000); // 1.5 Cr
  const [turnover, setTurnover] = useState<number>(60000000); // 6 Cr
  const [classificationResult, setClassificationResult] = useState<{
    enterprise_type: string;
    reason: string;
  }>({
    enterprise_type: 'MICRO',
    reason: 'Investment and turnover fall within the configured Micro enterprise thresholds.'
  });

  // STEP 5: Declaration
  const [declared, setDeclared] = useState(true);

  // Load existing application
  useEffect(() => {
    const initApp = async () => {
      setIsLoading(true);
      try {
        let loadedApp: Application;
        if (applicationId) {
          loadedApp = await applicationService.getApplicationById(Number(applicationId));
        } else {
          loadedApp = await applicationService.getOrCreateDraft();
        }
        setApp(loadedApp);

        if (loadedApp.enterprise) {
          if (loadedApp.enterprise.name) setEnterpriseName(loadedApp.enterprise.name);
          if (loadedApp.enterprise.organisation_type) setOrgType(loadedApp.enterprise.organisation_type);
          if (loadedApp.enterprise.gstin) setGstin(loadedApp.enterprise.gstin);
        }

        if (loadedApp.aadhaar_verification) {
          setAadhaarVerified(loadedApp.aadhaar_verification.is_verified);
          if (loadedApp.aadhaar_verification.masked_aadhaar) setMaskedAadhaar(loadedApp.aadhaar_verification.masked_aadhaar);
          if (loadedApp.aadhaar_verification.entrepreneur_name) setEntrepreneurName(loadedApp.aadhaar_verification.entrepreneur_name);
        }

        if (loadedApp.pan_verification) {
          setPanVerified(loadedApp.pan_verification.is_verified);
          if (loadedApp.pan_verification.pan_number) setPanNumber(loadedApp.pan_verification.pan_number);
          if (loadedApp.pan_verification.name_on_pan) setPanName(loadedApp.pan_verification.name_on_pan);
        }

        if (loadedApp.address) {
          if (loadedApp.address.road_street || loadedApp.address.premises_building || loadedApp.address.flat_door_block) {
            setAddressLine(loadedApp.address.premises_building || loadedApp.address.road_street || loadedApp.address.flat_door_block || '');
          }
          if (loadedApp.address.city) setCity(loadedApp.address.city);
          if (loadedApp.address.state) setSelectedState(loadedApp.address.state);
          if (loadedApp.address.district) setSelectedDistrict(loadedApp.address.district);
          if (loadedApp.address.pincode) setPincode(loadedApp.address.pincode);
        }

        if (loadedApp.activities && loadedApp.activities.length > 0) {
          setMajorActivity(loadedApp.activities[0].major_activity);
          setSelectedNicCode(loadedApp.activities[0].nic_code);
        }

        if (loadedApp.financials) {
          setInvestment(Number(loadedApp.financials.investment) || 15000000);
          setTurnover(Number(loadedApp.financials.turnover) || 60000000);
        }

        const inv = loadedApp.financials ? Number(loadedApp.financials.investment) : 15000000;
        const turn = loadedApp.financials ? Number(loadedApp.financials.turnover) : 60000000;
        const classRes = await applicationService.calculateClassificationPreview(inv, turn, 0);
        setClassificationResult({
          enterprise_type: classRes.enterprise_type,
          reason: classRes.reason,
        });
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to initialize registration.');
      } finally {
        setIsLoading(false);
      }
    };
    initApp();
  }, [applicationId, user]);

  // Recalculate preview on investment/turnover change
  useEffect(() => {
    const updatePreview = async () => {
      try {
        const res = await applicationService.calculateClassificationPreview(investment, turnover, 0);
        setClassificationResult({
          enterprise_type: res.enterprise_type,
          reason: res.reason,
        });
      } catch (err) {
        console.error(err);
      }
    };
    if (investment >= 0 && turnover >= 0) {
      updatePreview();
    }
  }, [investment, turnover]);

  // Save draft
  const handleSaveDraft = async (targetStep?: number) => {
    if (!app) return;
    setIsSaving(true);
    setError(null);

    const activeNic = NIC_ACTIVITIES.find((n) => n.code === selectedNicCode) || NIC_ACTIVITIES[0];

    const payload = {
      current_step: targetStep || currentStep,
      is_declared: declared,
      enterprise: {
        name: enterpriseName,
        organisation_type: orgType,
        date_of_incorporation: '2024-01-10',
        date_of_commencement: '2024-03-01',
        pan_number: panNumber,
        gstin: gstin || null,
        social_category: 'General',
        gender: 'Male',
        specially_abled: 'No',
      },
      aadhaar: {
        masked_aadhaar: maskedAadhaar,
        entrepreneur_name: entrepreneurName,
        is_verified: aadhaarVerified,
      },
      pan: {
        has_pan: 'YES',
        pan_number: panNumber,
        name_on_pan: panName,
        is_verified: panVerified,
      },
      gstin: {
        has_gstin: gstin ? 'YES' : 'NO',
        gstin: gstin || undefined,
        trade_name: enterpriseName,
        is_verified: !!gstin,
      },
      address: {
        flat_door_block: addressLine,
        city: city || 'Salem',
        state: selectedState,
        district: selectedDistrict,
        pincode: pincode,
        mobile: user?.mobile || '9876543210',
        email: user?.email || 'rahul@example.com',
      },
      plants: [
        {
          unit_name: `${enterpriseName} Unit 1`,
          address: addressLine,
          state: selectedState,
          district: selectedDistrict,
          pincode: pincode,
          business_activity: majorActivity,
          commencement_date: '2024-03-01',
        }
      ],
      promoters: [
        {
          name: entrepreneurName,
          role: orgType === 'PRIVATE_LIMITED' ? 'Director' : 'Owner',
          masked_pan: panNumber ? `${panNumber.slice(0, 2)}***${panNumber.slice(-2)}` : 'ABCDE****F',
          ownership_share: 100,
        }
      ],
      activities: [
        {
          major_activity: majorActivity,
          nic_code: activeNic.code,
          description: activeNic.description,
          is_primary: true,
        }
      ],
      financials: {
        investment: investment,
        turnover: turnover,
        export_turnover: 0,
        financial_year: '2024-2025',
      },
    };

    try {
      const updated = await applicationService.saveDraft(app.id, payload);
      setApp(updated);
      setSuccessMsg('Progress saved.');
      setTimeout(() => setSuccessMsg(null), 2500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save draft.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === 1 && (!aadhaarVerified || !panVerified)) {
      setError('Please complete simulated Aadhaar & PAN verification before proceeding.');
      return;
    }
    if (currentStep === 2 && !enterpriseName.trim()) {
      setError('Enterprise Name is required.');
      return;
    }
    if (currentStep === 3 && (!city.trim() || pincode.length !== 6)) {
      setError('Valid City and 6-digit PIN code are required.');
      return;
    }

    setError(null);
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    await handleSaveDraft(nextStep);
  };

  const handlePrev = () => {
    setError(null);
    const prev = Math.max(1, currentStep - 1);
    setCurrentStep(prev);
    handleSaveDraft(prev);
  };

  const handleSimulateAadhaarVerify = async () => {
    if (aadhaarRaw.replace(/\D/g, '').length !== 12) {
      setError('Aadhaar number must contain 12 digits.');
      return;
    }
    try {
      const res = await verificationService.verifyAadhaarOtp(app?.id, aadhaarRaw, '123456', entrepreneurName);
      setAadhaarVerified(true);
      setMaskedAadhaar(res.masked_aadhaar);
      setShowAadhaarOtpBox(false);
      setSuccessMsg('Aadhaar Verified (Simulated)');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Verification failed.');
    }
  };

  const handleSimulatePanVerify = async () => {
    if (panNumber.trim().length !== 10) {
      setError('PAN must be 10 characters (e.g. ABCDE1234F).');
      return;
    }
    try {
      const res = await verificationService.verifyPan(app?.id, panNumber, enterpriseName || entrepreneurName);
      setPanVerified(true);
      setPanName(res.name_on_pan);
      setSuccessMsg('PAN Verified (Simulated)');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'PAN verification failed.');
    }
  };

  const handleFinalSubmit = async () => {
    if (!app) return;
    if (!declared) {
      setError('Please accept the prototype confirmation checkbox.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await handleSaveDraft(5);
      await applicationService.submitApplication(app.id, true);
      navigate(`/application/${app.id}?submitted=true`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Submission failed. Please check all fields.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-xs text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
        <span>Loading simplified registration...</span>
      </div>
    );
  }

  const stepsList = [
    { title: "Verification", icon: ShieldCheck },
    { title: "Enterprise", icon: Building2 },
    { title: "Location", icon: MapPin },
    { title: "Financials & Tier", icon: DollarSign },
    { title: "Review & Submit", icon: FileCheck },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-700 uppercase bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
              Step {currentStep} of 5
            </span>
            {app?.prefilled_from_sih && (
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Prefilled from SIH Portal
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            {stepsList[currentStep - 1].title}
          </h1>
          <p className="text-xs text-slate-500">
            Application Reference: <b className="font-mono text-slate-800">{app?.application_number}</b>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSaveDraft()}
            disabled={isSaving}
            className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5 text-slate-500" />
            {isSaving ? 'Saving...' : 'Save Draft'}
          </button>
          <Link
            to="/dashboard"
            className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-600 text-xs font-semibold"
          >
            Exit
          </Link>
        </div>
      </div>

      {/* Streamlined 5-Step Stepper */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="grid grid-cols-5 gap-2 text-xs">
          {stepsList.map((st, idx) => {
            const stepNum = idx + 1;
            const isCompleted = stepNum < currentStep;
            const isCurrent = stepNum === currentStep;
            const Icon = st.icon;

            return (
              <button
                key={stepNum}
                onClick={() => {
                  if (stepNum <= currentStep || isCompleted) {
                    setCurrentStep(stepNum);
                    handleSaveDraft(stepNum);
                  }
                }}
                className={`p-2 rounded-xl flex flex-col items-center gap-1 text-center transition-all ${
                  isCurrent
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : isCompleted
                    ? 'bg-emerald-50 text-emerald-900 font-semibold'
                    : 'text-slate-400 bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1">
                  {isCompleted ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Icon className="w-3.5 h-3.5" />}
                  <span className="text-[11px] hidden sm:inline">{st.title}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Alerts */}
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

      {/* Form Content */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
        {/* STEP 1: Verification & Identity */}
        {currentStep === 1 && (
          <div className="space-y-5 max-w-xl mx-auto">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Name of Entrepreneur *
              </label>
              <input
                type="text"
                required
                value={entrepreneurName}
                onChange={(e) => setEntrepreneurName(e.target.value)}
                placeholder="Rahul Kumar"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Aadhaar */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800">
                  Aadhaar Number (12 Digits)
                </label>
                {aadhaarVerified && (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    ✓ Verified (Masked)
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aadhaarVerified ? maskedAadhaar : aadhaarRaw}
                  onChange={(e) => setAadhaarRaw(e.target.value)}
                  disabled={aadhaarVerified}
                  placeholder="1234 5678 1234"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono bg-white"
                />
                {!aadhaarVerified ? (
                  <button
                    type="button"
                    onClick={handleSimulateAadhaarVerify}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shrink-0"
                  >
                    Quick Verify
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAadhaarVerified(false)}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold shrink-0"
                  >
                    Change
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Paperless verification. Full Aadhaar is never saved in the database.
              </p>
            </div>

            {/* PAN & GSTIN */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800">
                  PAN Number *
                </label>
                {panVerified && (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    ✓ Verified
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={10}
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                  placeholder="ABCDE1234F"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono uppercase bg-white"
                />
                <button
                  type="button"
                  onClick={handleSimulatePanVerify}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shrink-0"
                >
                  {panVerified ? 'Re-Verify' : 'Verify PAN'}
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1 mt-2">
                  GSTIN (Optional / if registered)
                </label>
                <input
                  type="text"
                  maxLength={15}
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  placeholder="33ABCDE1234F1Z1"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono uppercase bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Enterprise & Business Activity */}
        {currentStep === 2 && (
          <div className="space-y-4 max-w-xl mx-auto">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Name of Enterprise *
              </label>
              <input
                type="text"
                required
                value={enterpriseName}
                onChange={(e) => setEnterpriseName(e.target.value)}
                placeholder="ABC Foods Pvt Ltd"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Organisation Type
                </label>
                <select
                  value={orgType}
                  onChange={(e) => setOrgType(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  <option value="PROPRIETORSHIP">Proprietorship</option>
                  <option value="PARTNERSHIP">Partnership</option>
                  <option value="LLP">LLP</option>
                  <option value="PRIVATE_LIMITED">Private Limited Company</option>
                  <option value="PUBLIC_LIMITED">Public Limited Company</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Major Business Activity
                </label>
                <select
                  value={majorActivity}
                  onChange={(e) => setMajorActivity(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white font-semibold"
                >
                  <option value="MANUFACTURING">Manufacturing</option>
                  <option value="SERVICES">Services</option>
                  <option value="TRADING">Trading</option>
                  <option value="MANUFACTURING_AND_SERVICES">Manufacturing & Services</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Primary Activity Category (NIC Code)
              </label>
              <select
                value={selectedNicCode}
                onChange={(e) => setSelectedNicCode(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                {NIC_ACTIVITIES.map((nic) => (
                  <option key={nic.code} value={nic.code}>
                    [{nic.code}] {nic.section} — {nic.description}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* STEP 3: Business Location */}
        {currentStep === 3 && (
          <div className="space-y-4 max-w-xl mx-auto">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Plant / Registered Premises Address *
              </label>
              <input
                type="text"
                required
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                placeholder="Plot 45-B, SIDCO Industrial Estate"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  City / Town *
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Salem"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  PIN Code (6 Digits) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="636001"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  State *
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => {
                    setSelectedState(e.target.value);
                    const dists = STATES_AND_DISTRICTS[e.target.value] || [];
                    if (dists.length > 0) setSelectedDistrict(dists[0]);
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  {Object.keys(STATES_AND_DISTRICTS).map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  District *
                </label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  {(STATES_AND_DISTRICTS[selectedState] || []).map((dist) => (
                    <option key={dist} value={dist}>{dist}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Financials & MSME Classification */}
        {currentStep === 4 && (
          <div className="space-y-6 max-w-xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Investment in Plant & Machinery (in ₹) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={investment}
                  onChange={(e) => setInvestment(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Value: ₹{(investment / 10000000).toFixed(2)} Crore
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Total Annual Turnover (in ₹) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={turnover}
                  onChange={(e) => setTurnover(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Value: ₹{(turnover / 10000000).toFixed(2)} Crore
                </span>
              </div>
            </div>

            {/* Live Automated Classification Card */}
            <ClassificationCard
              enterpriseType={classificationResult.enterprise_type}
              investment={investment}
              turnover={turnover}
              exportTurnover={0}
              reason={classificationResult.reason}
            />
          </div>
        )}

        {/* STEP 5: Review & Declaration */}
        {currentStep === 5 && (
          <div className="space-y-6 max-w-xl mx-auto">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <h3 className="font-bold text-slate-900 border-b pb-2 border-slate-200">
                Application Summary
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500">Enterprise:</span>
                  <p className="font-bold text-slate-900">{enterpriseName}</p>
                </div>
                <div>
                  <span className="text-slate-500">Tier:</span>
                  <p className="font-bold text-emerald-800">{classificationResult.enterprise_type}</p>
                </div>
                <div>
                  <span className="text-slate-500">Entrepreneur:</span>
                  <p className="font-bold text-slate-900">{entrepreneurName}</p>
                </div>
                <div>
                  <span className="text-slate-500">PAN & Aadhaar:</span>
                  <p className="font-mono text-slate-900">{panNumber} • {maskedAadhaar}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500">Location:</span>
                  <p className="font-medium text-slate-800">{addressLine}, {city}, {selectedDistrict}, {selectedState} - {pincode}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={declared}
                  onChange={(e) => setDeclared(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 shrink-0"
                />
                <span className="text-emerald-950 font-medium leading-relaxed">
                  I confirm the accuracy of this simulated application and understand this portal is a demonstration environment for SIH26130.
                </span>
              </label>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={!declared || isSaving}
                className="w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {isSaving ? 'Submitting Application...' : 'Submit Udyam Registration'}
              </button>
            </div>
          </div>
        )}

        {/* Wizard Bottom Buttons */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-200">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>

          {currentStep < 5 && (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm flex items-center gap-1"
            >
              Continue <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
