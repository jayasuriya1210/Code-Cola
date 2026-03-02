import { apiClient } from "@/lib/api";

export interface SummaryData {
  background: string;
  legalIssues: string;
  arguments: string;
  courtReasoning: string;
  judgmentOutcome: string;
  fullText: string;
}

export interface Summary {
  id: number;
  caseId: string;
  summary: SummaryData;
  createdAt: string;
}

export interface GenerateSummaryResponse {
  caseId: string;
  summaryId: number;
  summary: SummaryData;
}

export const summaryService = {
  async generate(text: string, caseId?: string): Promise<GenerateSummaryResponse> {
    return apiClient.post<GenerateSummaryResponse>("/summary/generate", {
      text,
      case_id: caseId,
    });
  },

  async getLatest(caseId: string): Promise<Summary> {
    return apiClient.get<Summary>(`/summary/${caseId}/latest`);
  },
};
