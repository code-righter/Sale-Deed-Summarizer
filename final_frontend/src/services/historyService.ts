import { api } from './api';
import type { HistoryListResponse, RawReportResponse } from '@/types/document';

export async function listHistoryDocuments(): Promise<HistoryListResponse> {
  console.log(`Requests reached for doc history`)
  const { data } = await api.get<HistoryListResponse>('/history/documents');
  return data;
}

export async function getHistoryDocument(documentId: string): Promise<RawReportResponse> {
  console.log(`Requests reached for specific doc history`)
  const { data } = await api.get<RawReportResponse>(`/history/documents/${documentId}`);
  return data;
}
