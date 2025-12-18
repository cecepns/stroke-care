import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Material, ChatMessage } from '../types';

const API_BASE_URL = 'https://api-inventory.isavralabel.com/stroke-care/api'; // For Android emulator
// const API_BASE_URL = 'http://localhost:3001/api'; // For iOS simulator

class ApiService {
  private async getAuthToken(): Promise<string | null> {
    return await AsyncStorage.getItem('authToken');
  }

  private async getAuthHeaders(): Promise<{ [key: string]: string }> {
    const token = await this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Authentication
  async register(name: string, email: string, password: string): Promise<{ message: string; userId: number }> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password, role: 'user' }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    return data;
  }

  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    console.log('ApiService: Sending login request...');
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    console.log('ApiService: Received response, status:', response.status);
    const data = await response.json();
    
    if (!response.ok) {
      console.error('ApiService: Login failed with status', response.status);
      throw new Error(data.message || 'Login failed');
    }

    console.log('ApiService: Login successful, storing token...');
    // Store token
    await AsyncStorage.setItem('authToken', data.token);
    await AsyncStorage.setItem('user', JSON.stringify(data.user));
    console.log('ApiService: Token stored successfully');

    return data;
  }

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
  }

  async getCurrentUser(): Promise<User | null> {
    const userString = await AsyncStorage.getItem('user');
    return userString ? JSON.parse(userString) : null;
  }

  // Materials
  async getMaterials(): Promise<Material[]> {
    const response = await fetch(`${API_BASE_URL}/materials`, {
      headers: await this.getAuthHeaders(),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch materials');
    }

    return data;
  }

  // Chat History
  async getUserChatHistory(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/chat-history/user`, {
      headers: await this.getAuthHeaders(),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch chat history');
    }

    return data;
  }

  async getRecentMessages(limit: number = 10): Promise<ChatMessage[]> {
    const response = await fetch(`${API_BASE_URL}/chat-history/user/recent?limit=${limit}`, {
      headers: await this.getAuthHeaders(),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch recent messages');
    }

    return data;
  }

  // Stroke Risk Screening
  async submitScreening(screeningData: {
    answers: { [key: number]: 'A' | 'B' | 'C' };
    score: number;
    category: string;
    riskLevel: 'low' | 'medium' | 'high';
  }): Promise<{ message: string; screeningId?: number }> {
    const response = await fetch(`${API_BASE_URL}/screening`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(screeningData),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to submit screening');
    }

    return data;
  }

  async getScreeningHistory(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/screening/history`, {
      headers: await this.getAuthHeaders(),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch screening history');
    }

    return data;
  }

  // Health Notes
  async getHealthNotes(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/health-notes`, {
      headers: await this.getAuthHeaders(),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch health notes');
    }

    return data;
  }

  async getHealthNoteByDate(date: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/health-notes/${date}`, {
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      const data = await response.json();
      throw new Error(data.message || 'Failed to fetch health note');
    }

    return await response.json();
  }

  async saveHealthNote(noteData: {
    note_date: string;
    blood_sugar?: number;
    blood_sugar_status?: 'low' | 'normal' | 'high';
    cholesterol?: number;
    cholesterol_status?: 'low' | 'normal' | 'high';
    blood_pressure_systolic?: number;
    blood_pressure_diastolic?: number;
    blood_pressure_status?: 'low' | 'normal' | 'high';
    notes?: string;
  }): Promise<{ message: string; noteId: number }> {
    const response = await fetch(`${API_BASE_URL}/health-notes`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(noteData),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to save health note');
    }

    return data;
  }

  async deleteHealthNote(id: number): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/health-notes/${id}`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders(),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete health note');
    }

    return data;
  }
}

export default new ApiService();
