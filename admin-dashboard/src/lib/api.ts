// lib/api.ts - API client for SimWeGo Admin Dashboard

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://simwego-w8jpu.ondigitalocean.app';

interface Client {
  id: number;
  name: string;
  api_key: string;
  active: boolean;
  monty_username: string;
  token_status: 'valid' | 'expired' | 'none';
  created_at: string;
  updated_at: string;
  agent_id: string | null;
  reseller_id: string | null;
}

interface CreateClientData {
  name: string;
  monty_username: string;
  monty_password: string;
  active?: boolean;
}

interface UpdateClientData {
  name?: string;
  monty_username?: string;
  monty_password?: string;
  active?: boolean;
}

interface ApiResponse<T> {
  clients?: T[];
  total?: number;
  timestamp?: string;
  message?: string;
  error?: string;
}

interface MontyTestResponse {
  success: boolean;
  message: string;
  client_id: string;
  agent_id: string | null;
  reseller_id: string | null;
  expires_at: string | null;
  error?: string;
}

class SimWeGoAPI {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private getToken(): string {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('adminToken') || '';
    }
    return '';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        mode: 'cors',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          message: `HTTP ${response.status}: ${response.statusText}` 
        }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Impossible de se connecter à l\'API SimWeGo. Vérifiez que l\'API est démarrée sur le port 3001.');
      }
      throw error;
    }
  }

  // Admin Stats
  async getStats() {
    return this.request('/admin/stats');
  }

  // Client Management
  async getClients(): Promise<ApiResponse<Client>> {
    return this.request<ApiResponse<Client>>('/admin/clients');
  }

  async getClient(id: number): Promise<Client> {
    return this.request<Client>(`/admin/clients/${id}`);
  }

  async createClient(data: CreateClientData): Promise<Client> {
    return this.request<Client>('/admin/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateClient(id: number, data: UpdateClientData): Promise<Client> {
    return this.request<Client>(`/admin/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteClient(id: number): Promise<{ message: string }> {
    return this.request(`/admin/clients/${id}`, {
      method: 'DELETE',
    });
  }

  async testMontyConnection(id: number): Promise<MontyTestResponse> {
    return this.request<MontyTestResponse>(`/admin/clients/${id}/test`, {
      method: 'POST',
    });
  }

  // Create client with Monty validation
  async createClientWithMontyValidation(data: CreateClientData): Promise<Client> {
    // First validate Monty credentials by attempting to create and test
    const client = await this.createClient(data);
    
    try {
      const testResult = await this.testMontyConnection(client.id);
      if (!testResult.success) {
        // If Monty connection fails, clean up the created client
        await this.deleteClient(client.id);
        throw new Error(`Monty connection failed: ${testResult.message}`);
      }
      return client;
    } catch (error) {
      // Clean up on any error
      await this.deleteClient(client.id).catch(() => {}); // Ignore cleanup errors
      throw error;
    }
  }
}

export const api = new SimWeGoAPI();
export type { Client, CreateClientData, UpdateClientData, MontyTestResponse };