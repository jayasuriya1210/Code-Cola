import { apiClient } from "@/lib/api";

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface AuthResponse {
  msg: string;
  userId?: number;
  token?: string;
  user?: User;
}

export const authService = {
  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>("/auth/register", {
      name,
      email,
      password,
    });
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/auth/login", {
      email,
      password,
    });
    if (response.token) {
      apiClient.setToken(response.token);
    }
    return response;
  },

  logout() {
    apiClient.clearToken();
  },

  isAuthenticated(): boolean {
    return apiClient.getToken() !== null;
  },

  getToken(): string | null {
    return apiClient.getToken();
  },
};
