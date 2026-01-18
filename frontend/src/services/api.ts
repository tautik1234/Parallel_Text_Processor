import axios from 'axios';

// --- Interfaces ---
export interface BatchStatusResponse {
  success: boolean;
  data: {
    batchId: string;
    totalJobs: number;
    completed: number;
    failed: number;
    processing: number;
    pending: number;
  };
}

export interface BatchResultsResponse {
  success: boolean;
  data: {
    batchId: string;
    files: Array<{
      filename: string;
      totalLines: number;
      averageSentiment: number;
      processingTimeMs: number;
    }>;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

export interface UploadResponse {
  success: boolean;
  message: string;
  data: {
    jobId: string;
    filename: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
  };
}

export interface BatchResponse {
  success: boolean;
  message: string;
  data: {
    batchId: string;
    totalFiles: number;
    jobs: Array<{
      jobId: string;
      filename: string;
      status: string;
    }>;
  };
}

export interface JobResultData {
  jobId: string;
  filename: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  results: any[];
  statistics: {
    totalLines: number;
    processingTimeMs: number;
    averageSentiment: number;
  };
  createdAt: string;
  completedAt: string;
}

// --- Axios Setup ---
// Get URL from .env (Vercel/Render) or fallback to localhost (Dev)
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${BASE_URL}/api`, // Dynamically builds the full URL
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// --- API Methods ---
export const authAPI = {
  login: (credentials: any) => api.post<AuthResponse>('/auth/login', credentials),
  register: (data: any) => api.post<AuthResponse>('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentJobs: (limit = 5) => api.get(`/dashboard/recent?limit=${limit}`),
};

export const textAPI = {
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<UploadResponse>('/text/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  processBatch: (files: FileList | File[]) => {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file); 
    });
    return api.post<BatchResponse>('/text/batch', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getJobResults: (jobId: string) => api.get<{ success: boolean, data: JobResultData }>(`/text/results/${jobId}`),
  getBatchStatus: (batchId: string) => api.get<BatchStatusResponse>(`/text/batch/${batchId}`),
  getBatchResults: (batchId: string) => api.get<BatchResultsResponse>(`/text/batch/${batchId}/results`),
};

export const historyAPI = {
  // --- CRITICAL FIX: Ensures 2 arguments are accepted ---
  searchHistory: (query: string, page: number = 1) => 
    api.get(`/history/search?q=${encodeURIComponent(query)}&page=${page}`),

  getHistory: (page: number = 1) => 
    api.get(`/history?page=${page}`),

  downloadReport: (id: string, filename: string) =>
    api.get(`/history/export/${id}`, { responseType: 'blob' }).then((response) => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename.replace(/\.[^/.]+$/, "") + ".csv");
      document.body.appendChild(link);
      link.click();
    }),

  deleteRecord: (id: string) => api.delete(`/history/${id}`),
};

export default api;