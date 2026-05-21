import { api } from './api';
import type { RawReportResponse } from '@/types/document';

export async function getReport(documentId: string): Promise<RawReportResponse> {
  const { data } = await api.get<RawReportResponse>(`/report/${documentId}`);
  return data;
}
