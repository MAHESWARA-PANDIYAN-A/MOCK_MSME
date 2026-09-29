export type UserRole = 'APPLICANT' | 'OFFICER' | 'ADMIN';

export interface User {
  id: number;
  email: string;
  mobile: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export type ApplicationStatusType = 
  | 'DRAFT' 
  | 'SUBMITTED' 
  | 'UNDER_VERIFICATION' 
  | 'CORRECTION_REQUIRED' 
  | 'APPROVED' 
  | 'REJECTED';

export type EnterpriseClassification = 'MICRO' | 'SMALL' | 'MEDIUM' | 'OUTSIDE_RANGE';

export interface AadhaarDetail {
  masked_aadhaar?: string;
  entrepreneur_name?: string;
  is_verified: boolean;
  verification_ref?: string;
}

export interface PanDetail {
  has_pan: string;
  pan_number?: string;
  name_on_pan?: string;
  is_verified: boolean;
}

export interface GstinDetail {
  has_gstin: string;
  gstin?: string;
  trade_name?: string;
  is_verified: boolean;
}

export interface EnterpriseAddress {
  flat_door_block?: string;
  premises_building?: string;
  village_town?: string;
  block?: string;
  road_street?: string;
  city: string;
  state: string;
  district: string;
  pincode: string;
  mobile?: string;
  email?: string;
}

export interface PlantUnit {
  id?: number;
  unit_name: string;
  building_premises?: string;
  address: string;
  state: string;
  district: string;
  pincode: string;
  business_activity?: string;
  commencement_date?: string;
}

export interface Promoter {
  id?: number;
  name: string;
  role: string;
  masked_pan?: string;
  ownership_share?: number;
}

export interface BusinessActivity {
  id?: number;
  major_activity: string;
  nic_code: string;
  description: string;
  is_primary: boolean;
}

export interface FinancialDetail {
  investment: number;
  turnover: number;
  export_turnover?: number;
  financial_year?: string;
  male_employees?: number;
  female_employees?: number;
  other_employees?: number;
  total_employees?: number;
  bank_name?: string;
  ifsc_code?: string;
  account_number?: string;
}

export interface EnterpriseDetail {
  name: string;
  organisation_type: string;
  date_of_incorporation?: string;
  date_of_commencement?: string;
  pan_number?: string;
  gstin?: string;
  social_category?: string;
  gender?: string;
  specially_abled?: string;
}

export interface StatusHistoryItem {
  id: number;
  old_status?: string;
  new_status: string;
  changed_by_user_id?: number;
  comments?: string;
  created_at: string;
}

export interface CertificateInfo {
  id: number;
  udyam_registration_number: string;
  enterprise_name: string;
  organisation_type: string;
  major_activity: string;
  enterprise_type: string;
  state: string;
  district: string;
  qr_code_path?: string;
  pdf_path?: string;
  issue_date: string;
}

export interface Application {
  id: number;
  application_number: string;
  user_id?: number;
  external_reference_id?: string;
  source_system: string;
  status: ApplicationStatusType;
  udyam_registration_number?: string;
  enterprise_type?: EnterpriseClassification;
  submission_date?: string;
  approval_date?: string;
  prefilled_from_sih: boolean;
  prefilled_meta?: Record<string, any>;
  current_step: number;
  is_declared: boolean;
  created_at: string;
  updated_at: string;
  applicant?: {
    full_name?: string;
    email?: string;
    mobile?: string;
  };
  enterprise?: EnterpriseDetail;
  aadhaar_verification?: AadhaarDetail;
  pan_verification?: PanDetail;
  gstin_verification?: GstinDetail;
  address?: EnterpriseAddress;
  plants: PlantUnit[];
  promoters: Promoter[];
  activities: BusinessActivity[];
  financials?: FinancialDetail;
  classification_reason?: string;
  status_history: StatusHistoryItem[];
  certificate?: CertificateInfo;
}

export interface ApplicationListItem {
  id: number;
  application_number: string;
  enterprise_name: string;
  applicant_name: string;
  state?: string;
  district?: string;
  major_activity?: string;
  enterprise_type?: EnterpriseClassification;
  organisation_type?: string;
  submission_date?: string;
  status: ApplicationStatusType;
  udyam_registration_number?: string;
  prefilled_from_sih: boolean;
  created_at: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
  application_id?: number;
}

export interface ClassificationRule {
  id: number;
  enterprise_type: string;
  max_investment: number;
  max_turnover: number;
  description?: string;
  is_active: boolean;
  updated_at?: string;
  updated_by?: string;
}
