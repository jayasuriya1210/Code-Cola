const API_BASE = "/api";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  msg?: string;
  error?: string;
}

class ApiClient {
  private baseUrl = API_BASE;
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem("authToken", token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem("authToken");
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem("authToken");
  }

  private getHeaders(contentType = "application/json"): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": contentType,
    };

    const token = this.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }

  async get<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "GET",
      headers: this.getHeaders(),
      ...options,
    });

    return this.handleResponse<T>(response);
  }

  async post<T = any>(
    endpoint: string,
    body?: any,
    options?: RequestInit
  ): Promise<T> {
    const isFormData = body instanceof FormData;
    const authHeader = this.getToken() ? { Authorization: `Bearer ${this.getToken()}` } : {};

    // For FormData, let the browser set the Content-Type with the boundary
    const defaultHeaders = isFormData
      ? { ...authHeader }
      : { "Content-Type": "application/json", ...authHeader };

    const mergedHeaders = {
      ...defaultHeaders,
      ...(options?.headers as Record<string, string> || {})
    };

    // Remove Content-Type if it was manually set to multipart/form-data
    if (isFormData && mergedHeaders["Content-Type"] === "multipart/form-data") {
      delete mergedHeaders["Content-Type"];
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      ...options,
      headers: mergedHeaders,
      body: isFormData ? body : JSON.stringify(body),
    });

    return this.handleResponse<T>(response);
  }

  async put<T = any>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    const isFormData = body instanceof FormData;
    const authHeader = this.getToken() ? { Authorization: `Bearer ${this.getToken()}` } : {};

    const defaultHeaders = isFormData
      ? { ...authHeader }
      : { "Content-Type": "application/json", ...authHeader };

    const mergedHeaders = {
      ...defaultHeaders,
      ...(options?.headers as Record<string, string> || {})
    };

    if (isFormData && mergedHeaders["Content-Type"] === "multipart/form-data") {
      delete mergedHeaders["Content-Type"];
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "PUT",
      ...options,
      headers: mergedHeaders,
      body: isFormData ? body : JSON.stringify(body),
    });

    return this.handleResponse<T>(response);
  }

  async delete<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "DELETE",
      headers: this.getHeaders(),
      ...options,
    });

    return this.handleResponse<T>(response);
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get("content-type");
    let data: any;

    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      throw {
        status: response.status,
        message: data.msg || data.error || "An error occurred",
        data,
      };
    }

    return data as T;
  }
}

export const apiClient = new ApiClient();
