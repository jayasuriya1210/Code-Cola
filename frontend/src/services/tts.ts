import { apiClient } from "@/lib/api";

export interface TtsGenerateResponse {
  audioId: string;
  caseId?: number;
  audioURL: string;
  audioURLs?: string[];
  ttsProvider: string;
  language: string;
}

export interface TtsHealthResponse {
  piper?: { enabled: boolean; ready: boolean };
  edge?: { enabled: boolean; ready: boolean };
}

export const ttsService = {
  async generate(
    text: string,
    lang: string = "en",
    caseId?: string,
    summaryId?: string,
    caseTitle?: string,
    sourceUrl?: string,
    pdfUrl?: string
  ): Promise<TtsGenerateResponse> {
    return apiClient.post<TtsGenerateResponse>("/tts/generate", {
      text,
      lang,
      case_id: caseId,
      summary_id: summaryId,
      case_title: caseTitle,
      source_url: sourceUrl,
      pdf_url: pdfUrl,
    });
  },

  async proxyAudio(url: string): Promise<Blob> {
    const encodedUrl = encodeURIComponent(url);
    const response = await fetch(`http://localhost:5000/api/tts/proxy?u=${encodedUrl}`, {
      headers: {
        Authorization: `Bearer ${apiClient.getToken() || ""}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to proxy audio");
    }

    return response.blob();
  },

  async health(): Promise<TtsHealthResponse> {
    return apiClient.get<TtsHealthResponse>("/tts/health");
  },
};
