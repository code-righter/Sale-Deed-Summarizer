// Domain types for the Legality document analyzer.
// Backend response shape is intentionally loose (Record<string, unknown>);
// the mapping layer in `src/lib/reportMapper.ts` converts it to a stable
// `ReportViewModel` used everywhere in the UI.

export type ProcessingStageId =
  | 'ocr_processing'
  | 'llm_extraction';

export type StageStatus = 'pending' | 'in_progress' | 'done' | 'error';

export const PROCESSING_STAGES: { id: ProcessingStageId; label: string; sublabel: string }[] = [
  { id: 'ocr_processing', label: 'OCR Processing', sublabel: 'Extracting text from images' },
  { id: 'llm_extraction', label: 'LLM Extraction', sublabel: 'AI structured extraction' },
];

export interface UploadResponse {
  success: boolean;
  document_id: string;
  document_name?: string;
}

export interface ProcessingStatusResponse {
  success: boolean;
  document_id: string;
  current_stage: ProcessingStageId | 'completed' | 'failed';
  stages: Partial<Record<ProcessingStageId, StageStatus>>;
  error?: string;
}

export interface HistoryDocument {
  id: string;
  document_name: string;
  uploaded_at: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface HistoryListResponse {
  success: boolean;
  documents: HistoryDocument[];
}

// Raw backend report — kept opaque on purpose.
export interface RawReportResponse {
  success: boolean;
  document_id: string;
  document_name?: string;
  report: Record<string, unknown>;
}

// ---------- View Model (UI contract) ----------

export interface KVPair {
  label: string;
  value: string;
}

export interface PropertyInfoVM {
  address?: string;
  district?: string;
  state?: string;
  pincode?: string;
  size?: string;
  area?: string;
  type?: string;
  extra?: KVPair[];
}

export interface PartyVM {
  name: string;
  role: string;
  details?: string;
  identifiers?: KVPair[];
}

export interface TimelineEventVM {
  date: string;
  from: string;
  to: string;
  reason?: string;
  documentNumber?: string;
  transferDetails?: string;
}

export interface FinancialVM {
  total?: string;
  stampDuty?: string;
  stamp_duty?: string;
  registrationFee?: string;
  registration_fee?: string;
  installments?: Array<{
    amount: string;
    paymentDate: string;
    paymentMode?: string;
    bankDetails?: string;
    remarks?: string;
  }>;
  extra?: KVPair[];
}

export interface ValidationItemVM {
  entity: string;
  document: string;
  status: 'verified' | 'unverified' | 'mismatch';
}

export interface RegistrationVM {
  registrationNumber?: string;
  registrationDate?: string;
  subRegistrarOffice?: string;
  extra?: KVPair[];
}

export interface ReportViewModel {
  documentId: string;
  documentName: string;
  uploadedAt?: string;
  processingStatus?: string;
  totalPages?: number;
  stampPagesDetected?: number;
  documentCharacterCount?: number;
  saleDeedNumber?: string;
  property: PropertyInfoVM;
  parties: PartyVM[];
  timeline: TimelineEventVM[];
  financial: FinancialVM;
  legalClauses: string[];
  taxesAndCharges: KVPair[];
  transactionDetails: KVPair[];
  validation: ValidationItemVM[];
  registration: RegistrationVM;
  _raw?: unknown;
}
