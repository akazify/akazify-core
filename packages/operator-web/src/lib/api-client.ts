const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export class ApiClient {
  private baseURL: string;

  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Labor Tracking APIs
  async getLaborAssignments(operationId: string) {
    return this.request(`/operations/${operationId}/labor`);
  }

  async clockIn(assignmentId: string) {
    return this.request(`/labor/${assignmentId}/clock-in`, { method: 'POST' });
  }

  async clockOut(assignmentId: string) {
    return this.request(`/labor/${assignmentId}/clock-out`, { method: 'POST' });
  }

  async startBreak(assignmentId: string) {
    return this.request(`/labor/${assignmentId}/break/start`, { method: 'POST' });
  }

  async endBreak(assignmentId: string) {
    return this.request(`/labor/${assignmentId}/break/end`, { method: 'POST' });
  }

  async getLaborSummary(operationId: string) {
    return this.request(`/operations/${operationId}/labor/summary`);
  }

  // Material Consumption APIs
  async getMaterialConsumption(operationId: string) {
    return this.request(`/operations/${operationId}/materials`);
  }

  async recordMaterialConsumption(data: {
    operationId: string;
    materialId: string;
    consumedQuantity: number;
    wasteQuantity?: number;
    notes?: string;
  }) {
    return this.request('/materials/consume', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMaterialSummary(operationId: string) {
    return this.request(`/operations/${operationId}/materials/summary`);
  }

  // Non-conformance APIs
  async getNCRs(operationId: string) {
    return this.request(`/operations/${operationId}/ncrs`);
  }

  async createNCR(data: {
    operationId?: string;
    title: string;
    description: string;
    category: string;
    severity: string;
    quantityAffected: number;
    reportedBy: string;
  }) {
    return this.request('/ncrs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateNCRStatus(ncrId: string, data: { status: string; notes?: string }) {
    return this.request(`/ncrs/${ncrId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getNCRSummary(operationId: string) {
    return this.request(`/operations/${operationId}/ncrs/summary`);
  }

  // Quality Checks APIs
  async getQualityChecks(operationId: string) {
    return this.request(`/operations/${operationId}/quality-checks`);
  }

  async recordQualityCheck(data: {
    operationId: string;
    checkType: string;
    result: string;
    measurements?: Record<string, number>;
    notes?: string;
    inspectorId: string;
  }) {
    return this.request('/quality-checks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient();
