import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class ApiService {
  private api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  constructor() {
    // Add request interceptor to include token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle token expiration
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Dashboard APIs
  async getDashboardStats() {
    const response = await this.api.get('/dashboard/stats');
    return response.data;
  }

  async getRecentActivities() {
    const response = await this.api.get('/audit/recent');
    return response.data;
  }

  // Assets APIs
  async getAssets(params?: any) {
    const response = await this.api.get('/assets', { params });
    return response.data;
  }

  async getAsset(id: string) {
    const response = await this.api.get(`/assets/${id}`);
    return response.data;
  }

  async createAsset(asset: any) {
    const response = await this.api.post('/assets', asset);
    return response.data;
  }

  async updateAsset(id: string, asset: any) {
    const response = await this.api.put(`/assets/${id}`, asset);
    return response.data;
  }

  async deleteAsset(id: string) {
    const response = await this.api.delete(`/assets/${id}`);
    return response.data;
  }

  // Asset Manager specific APIs
  async assignCustodians(assetId: string, assignment: any) {
    const response = await this.api.post(`/assets/${assetId}/custodians`, assignment);
    return response.data;
  }

  async getVerificationStatus() {
    const response = await this.api.get('/assets/verification-status');
    return response.data;
  }

  async getAssetDepreciationSummary(assetId: string) {
    const response = await this.api.get(`/assets/${assetId}/depreciation`);
    return response.data;
  }

  // Verification APIs
  async getVerificationStats() {
    const response = await this.api.get('/verification/stats');
    return response.data;
  }

  async startVerification(data: any) {
    const response = await this.api.post('/verification/start', data);
    return response.data;
  }

  async submitVerification(data: any) {
    const response = await this.api.post('/verification/submit', data);
    return response.data;
  }

  async verifyAsset(assetId: string, verificationData: any) {
    const response = await this.api.post(`/verification/verify/${assetId}`, verificationData);
    return response.data;
  }

  // User Management APIs
  async getUsers(params?: any) {
    const response = await this.api.get('/users', { params });
    return response.data;
  }

  async getUser(userId: string) {
    const response = await this.api.get(`/users/${userId}`);
    return response.data;
  }

  async createUser(userData: any) {
    const response = await this.api.post('/users', userData);
    return response.data;
  }

  async updateUser(userId: string, userData: any) {
    const response = await this.api.put(`/users/${userId}`, userData);
    return response.data;
  }

  async deleteUser(userId: string) {
    const response = await this.api.delete(`/users/${userId}`);
    return response.data;
  }

  async resetUserPassword(userId: string) {
    const response = await this.api.post(`/users/${userId}/reset-password`);
    return response.data;
  }

  async changeUserStatus(userId: string, statusData: any) {
    const response = await this.api.post(`/users/${userId}/change-status`, statusData);
    return response.data;
  }

  async assignUserRole(userId: string, roleData: any) {
    const response = await this.api.post(`/users/${userId}/assign-role`, roleData);
    return response.data;
  }

  async getUserStats() {
    const response = await this.api.get('/users/stats/summary');
    return response.data;
  }

  // System Configuration APIs
  async getSystemConfiguration() {
    const response = await this.api.get('/system');
    return response.data;
  }

  async getSystemModules() {
    const response = await this.api.get('/system/modules');
    return response.data;
  }

  async getModuleConfiguration(moduleName: string) {
    const response = await this.api.get(`/system/modules/${moduleName}`);
    return response.data;
  }

  async updateModuleStatus(moduleName: string, status: string, reason?: string) {
    const response = await this.api.put(`/system/modules/${moduleName}/status`, null, {
      params: { status, reason }
    });
    return response.data;
  }

  async getSystemSettings(category?: string) {
    const response = await this.api.get('/system/settings', {
      params: category ? { category } : {}
    });
    return response.data;
  }

  async getSetting(settingKey: string) {
    const response = await this.api.get(`/system/settings/${settingKey}`);
    return response.data;
  }

  async updateSetting(settingKey: string, value: any, reason?: string) {
    const response = await this.api.put(`/system/settings/${settingKey}`, {
      value,
      reason
    });
    return response.data;
  }

  async getConfigurationHistory(params?: any) {
    const response = await this.api.get('/system/history', { params });
    return response.data;
  }

  async resetSystemToDefaults() {
    const response = await this.api.post('/system/reset-to-defaults', null, {
      params: { confirm: true }
    });
    return response.data;
  }

  // Reports APIs
  async getReports() {
    const response = await this.api.get('/reports');
    return response.data;
  }

  async generateReport(type: string, params?: any) {
    const response = await this.api.post(`/reports/generate/${type}`, params);
    return response.data;
  }

  async downloadReport(reportId: string) {
    const response = await this.api.get(`/reports/download/${reportId}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // PDF Report Downloads
  async downloadAssetRegisterPDF(filters?: any) {
    const params = new URLSearchParams({ format: 'pdf', ...filters });
    const response = await this.api.get(`/reports/asset-register?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async downloadExceptionReportPDF(filters?: any) {
    const params = new URLSearchParams({ format: 'pdf', ...filters });
    const response = await this.api.get(`/reports/exceptions?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async downloadDepreciationSummaryPDF() {
    const response = await this.api.get('/reports/depreciation-summary?format=pdf', {
      responseType: 'blob'
    });
    return response.data;
  }

  async downloadVerificationResultsPDF(filters?: any) {
    const params = new URLSearchParams({ format: 'pdf', ...filters });
    const response = await this.api.get(`/reports/verification-results?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // CSV Report Downloads
  async downloadAssetRegisterCSV(filters?: any) {
    const params = new URLSearchParams({ format: 'csv', ...filters });
    const response = await this.api.get(`/reports/asset-register?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async downloadExceptionReportCSV(filters?: any) {
    const params = new URLSearchParams({ format: 'csv', ...filters });
    const response = await this.api.get(`/reports/exceptions?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async downloadDepreciationSummaryCSV() {
    const response = await this.api.get('/reports/depreciation-summary?format=csv', {
      responseType: 'blob'
    });
    return response.data;
  }

  async downloadVerificationResultsCSV(filters?: any) {
    const params = new URLSearchParams({ format: 'csv', ...filters });
    const response = await this.api.get(`/reports/verification-results?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Custom Reports
  async createCustomReport(config: any) {
    const response = await this.api.post('/reports/custom', config, {
      responseType: config.format === 'pdf' ? 'blob' : 'json'
    });
    return response.data;
  }

  // View Reports (JSON format for preview)
  async viewAssetRegister(filters?: any) {
    const params = new URLSearchParams({ format: 'json', ...filters });
    const response = await this.api.get(`/reports/asset-register?${params}`);
    return response.data;
  }

  async viewExceptionReport(filters?: any) {
    const params = new URLSearchParams({ format: 'json', ...filters });
    const response = await this.api.get(`/reports/exceptions?${params}`);
    return response.data;
  }

  async viewDepreciationSummary() {
    const response = await this.api.get('/reports/depreciation-summary?format=json');
    return response.data;
  }

  async viewVerificationResults(filters?: any) {
    const params = new URLSearchParams({ format: 'json', ...filters });
    const response = await this.api.get(`/reports/verification-results?${params}`);
    return response.data;
  }

  // Depreciation APIs
  async getDepreciationData() {
    const response = await this.api.get('/depreciation');
    return response.data;
  }

  async calculateDepreciation(assetId: string) {
    const response = await this.api.post(`/depreciation/calculate/${assetId}`);
    return response.data;
  }

  // WIP APIs
  async getWipItems() {
    const response = await this.api.get('/wip');
    return response.data;
  }

  async createWipItem(item: any) {
    const response = await this.api.post('/wip', item);
    return response.data;
  }

  async updateWipItem(id: string, item: any) {
    const response = await this.api.put(`/wip/${id}`, item);
    return response.data;
  }

  // Audit APIs
  async getAuditLogs(params?: any) {
    const response = await this.api.get('/audit', { params });
    return response.data;
  }

  async getAuditLog(id: string) {
    const response = await this.api.get(`/audit/${id}`);
    return response.data;
  }

  async getAuditStatistics(params?: any) {
    const response = await this.api.get('/audit/statistics', { params });
    return response.data;
  }

  async getUserAuditTrail(userId: string, params?: any) {
    const response = await this.api.get(`/audit/user/${userId}`, { params });
    return response.data;
  }
}

export const apiService = new ApiService();
