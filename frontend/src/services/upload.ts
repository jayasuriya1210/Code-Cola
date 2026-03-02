import { apiClient } from "@/lib/api";

export interface UploadResponse {
    caseId: number;
    text: string;
    filePath: string;
    pdfStored: boolean;
}

export const uploadService = {
    async uploadFile(file: File): Promise<UploadResponse> {
        const formData = new FormData();
        formData.append("pdfFile", file);

        // Using apiClient.post doesn't automatically set multipart headers properly if it uses JSON.stringify
        // The apiClient uses axios underneath, so we can just pass the FormData.
        // However, if apiClient explicitly stringifies, we might need to bypass it.
        // By looking at apiClient, it checks if data instanceof FormData, and handles it.
        return apiClient.post<UploadResponse>("/pdf/upload", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            }
        });
    },
};
