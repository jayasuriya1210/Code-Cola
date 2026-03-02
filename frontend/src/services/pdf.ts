import { apiClient } from "@/lib/api";

export interface PdfUploadResponse {
  caseId: string;
  text: string;
  filePath: string;
  pdfStored: boolean;
}

export const pdfService = {
  async upload(file: File, caseId?: string, pdfUrl?: string): Promise<PdfUploadResponse> {
    const formData = new FormData();
    formData.append("pdfFile", file);
    if (caseId) formData.append("case_id", caseId);
    if (pdfUrl) formData.append("pdf_url", pdfUrl);

    return apiClient.post<PdfUploadResponse>("/pdf/upload", formData);
  },

  async getFile(caseId: string, download = false): Promise<Blob> {
    const url = `/pdf/${caseId}/file${download ? "?download=1" : ""}`;
    const response = await fetch(`http://localhost:5000/api${url}`, {
      headers: {
        Authorization: `Bearer ${apiClient.getToken() || ""}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to download PDF");
    }

    return response.blob();
  },
};
