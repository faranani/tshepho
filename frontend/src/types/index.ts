export interface CustodianAssignment {
  user_id: string;
  username: string;
  full_name: string;
  email: string;
  assigned_date: string;
  assigned_by: string;
  is_primary: boolean;
  notification_sent: boolean;
}

export interface CustodianAssignmentRequest {
  user_id: string;
  is_primary: boolean;
}

export interface BulkCustodianAssignmentRequest {
  custodians: CustodianAssignmentRequest[];
  replace_existing: boolean;
}

export interface VerificationStatusResponse {
  summary: {
    total_assets: number;
    active_verifications: number;
    overdue_verifications: number;
    upcoming_verifications: number;
    exceptions: number;
  };
  active_verifications: AssetVerificationStatus[];
  overdue_verifications: AssetVerificationStatus[];
  upcoming_verifications: AssetVerificationStatus[];
  exceptions: AssetVerificationStatus[];
}

export interface AssetVerificationStatus {
  asset_id: string;
  description: string;
  location: string;
  custodian?: string;
  custodians: CustodianAssignment[];
  status: string;
  last_verification_date?: string;
  next_verification_due?: string;
  last_verification?: any;
}

export interface AssetDepreciationSummary {
  asset_id: string;
  description: string;
  purchase_date: string;
  purchase_cost: number;
  useful_life_years: number;
  depreciation_class: string;
  current_calculations: {
    age_in_years: number;
    depreciation_rate_percent: number;
    annual_depreciation: number;
    accumulated_depreciation: number;
    current_value: number;
    depreciation_method: string;
  };
  depreciation_history: any[];
  export_data: {
    asset_value: number;
    depreciation_rate: number;
    accumulated_depreciation: number;
    remaining_useful_life_years: number;
  };
}

export interface Asset {
  _id: string;
  asset_id?: string;
  asset_tag?: string;
  name?: string;
  description?: string;
  category?: string;
  location: string;
  department?: string;
  assigned_to?: string;
  custodian?: string;
  purchase_date: string;
  purchase_cost: number;
  current_value?: number;
  depreciation_method?: string;
  depreciation_class?: string;
  useful_life_years: number;
  salvage_value?: number;
  status: 'active' | 'disposed' | 'maintenance' | 'missing' | 'inactive' | 'under_maintenance' | 'lost' | 'wip' | 'under_verification';
  condition?: 'excellent' | 'good' | 'fair' | 'poor';
  warranty_expiry?: string;
  last_maintenance?: string;
  next_maintenance?: string;
  barcode?: string;
  qr_code?: string;
  serial_number?: string;
  manufacturer?: string;
  model?: string;
  subcategory?: string;
  notes?: string;
  photos?: string[];
  documents?: string[];
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  custodians?: CustodianAssignment[];
  last_verification_date?: string;
  next_verification_due?: string;
  verification_frequency_days?: number;
  maintenance_date?: string;
  disposed_date?: string;
}

export interface DashboardStats {
  total_assets: number;
  active_assets: number;
  inactive_assets: number;
  disposed_assets: number;
  maintenance_assets: number;
  wip_assets: number;
  under_verification_assets: number;
  lost_assets: number;
  pending_verification: number;
  maintenance_due: number;
  total_value: number;
  current_value: number;
  depreciated_value: number;
  assets_by_category: { [key: string]: number };
  assets_by_location: { [key: string]: number };
  recent_activities: AuditLog[];
  // Asset Manager specific metrics
  overdue_verifications?: number;
  verification_exceptions?: number;
  assets_with_custodians?: number;
  assets_without_custodians?: number;
}

export interface VerificationStats {
  total_verified: number;
  pending_verification: number;
  verification_exceptions: number;
  last_verification_date?: string;
  verification_progress: number;
}

export interface AuditLog {
  _id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  user_id: string;
  user_name: string;
  timestamp: string;
  details: any;
  ip_address?: string;
  user_agent?: string;
}

export interface Report {
  _id: string;
  name: string;
  type: string;
  description: string;
  parameters?: any;
  generated_at?: string;
  generated_by?: string;
  file_path?: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface WipItem {
  _id: string;
  name: string;
  description?: string;
  category: string;
  estimated_cost: number;
  actual_cost?: number;
  start_date: string;
  expected_completion?: string;
  actual_completion?: string;
  status: 'planning' | 'in_progress' | 'completed' | 'cancelled';
  progress_percentage: number;
  assigned_to?: string;
  department: string;
  created_at: string;
  updated_at: string;
}

export interface DepreciationData {
  asset_id: string;
  asset_name: string;
  purchase_cost: number;
  current_value: number;
  accumulated_depreciation: number;
  annual_depreciation: number;
  remaining_life: number;
  depreciation_schedule: DepreciationEntry[];
}

export interface DepreciationEntry {
  year: number;
  beginning_value: number;
  depreciation_amount: number;
  ending_value: number;
  accumulated_depreciation: number;
}

export interface User {
  _id: string;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'asset_manager' | 'auditor';
  department?: string;
  phone?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  total?: number;
  page?: number;
  limit?: number;
}
