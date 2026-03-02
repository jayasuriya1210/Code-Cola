import { apiClient } from "@/lib/api";

export interface Case {
  id: number;
  caseId: string;
  title: string;
  court: string;
  year: number;
  summary?: string;
  [key: string]: any;
}

export const caseService = {
  async list(): Promise<Case[]> {
    return apiClient.get<Case[]>("/cases/list");
  },

  async getById(caseId: string): Promise<Case> {
    return apiClient.get<Case>(`/cases/${caseId}`);
  },

  async search(query: string): Promise<Case[]> {
    return apiClient.get<Case[]>(`/cases/search?q=${encodeURIComponent(query)}`);
  },
};
