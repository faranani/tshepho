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
  status: 'active' | 'disposed' | 'maintenance' | 'missing' | 'inactive' | 'under_maintenance' | 'lost';
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
}

export interface DashboardStats {
  total_assets: number;
  active_assets: number;
  pending_verification: number;
  maintenance_due: number;
  total_value: number;
  depreciated_value: number;
  assets_by_category: { [key: string]: number };
  assets_by_location: { [key: string]: number };
  recent_activities: AuditLog[];
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
