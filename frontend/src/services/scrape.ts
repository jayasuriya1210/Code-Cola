import { apiClient } from "@/lib/api";

export interface SearchResult {
  title: string;
  link: string;
  pdf?: string;
  caseId?: string;
  [key: string]: any;
}

export interface SearchResponse {
  query: string;
  optimizedQuery: string;
  provider: string;
  courtlistenerApiKeyConfigured: boolean;
  pdfLinksGuaranteed: boolean;
  results: SearchResult[];
}

export const scrapeService = {
  async search(query: string): Promise<SearchResponse> {
    return apiClient.post<SearchResponse>("/scrape/search", {
      query,
    });
  },
};
