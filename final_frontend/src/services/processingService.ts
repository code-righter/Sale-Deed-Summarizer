import { api, API_BASE_URL } from './api';
import type { ProcessingStageId, ProcessingStatusResponse, StageStatus } from '@/types/document';

type RawStage =
  | 'pdf_to_image'
  | 'ocr_processing'
  | 'stamp_detection'
  | 'doc_build'
  | 'prompt_build'
  | 'llm_extraction'
  | 'completed'
  | 'failed';

const STAGE_TRANSITION_MAP: Record<RawStage, ProcessingStageId | 'completed' | 'failed'> = {
  pdf_to_image: 'ocr_processing',
  ocr_processing: 'ocr_processing',
  stamp_detection: 'llm_extraction',
  doc_build: 'llm_extraction',
  prompt_build: 'llm_extraction',
  llm_extraction: 'llm_extraction',
  completed: 'completed',
  failed: 'failed',
};

function inferCurrentStageFromStages(stages: Partial<Record<ProcessingStageId, StageStatus>>): ProcessingStageId | null {
  if (stages.llm_extraction === 'in_progress') return 'llm_extraction';
  if (stages.ocr_processing === 'in_progress') return 'ocr_processing';
  if (stages.llm_extraction === 'done' && stages.ocr_processing !== 'done') return 'ocr_processing';
  if (stages.ocr_processing === 'done' && stages.llm_extraction !== 'done') return 'llm_extraction';
  return null;
}

function normalizeStageStatus(status?: string): StageStatus {
  if (status === 'in_progress' || status === 'processing') return 'in_progress';
  if (status === 'done' || status === 'completed') return 'done';
  if (status === 'error' || status === 'failed') return 'error';
  return 'pending';
}

function normalizeProcessingPayload(rawPayload: unknown): ProcessingStatusResponse {
  const raw = (rawPayload ?? {}) as Record<string, unknown>;
  const stageFromStep = raw.step as RawStage | undefined;
  const stageFromCurrent = raw.current_stage as RawStage | undefined;
  const rawStage = stageFromStep ?? stageFromCurrent;
  const inputStages =
    (raw.stages as Partial<Record<ProcessingStageId, StageStatus>> | undefined) ?? {};

  const mappedStage = rawStage ? STAGE_TRANSITION_MAP[rawStage] : undefined;
  const stageFromMap = inferCurrentStageFromStages(inputStages);
  const normalizedCurrentStage =
    mappedStage ??
    (raw.status === 'completed'
      ? 'completed'
      : raw.status === 'failed'
      ? 'failed'
      : stageFromMap ?? 'ocr_processing');

  const normalizedStageStatus = normalizeStageStatus((raw.stage_status ?? raw.status) as string | undefined);
  const normalizedStages: Partial<Record<ProcessingStageId, StageStatus>> = {
    ...inputStages,
  };

  if (normalizedCurrentStage === 'ocr_processing' || normalizedCurrentStage === 'llm_extraction') {
    normalizedStages[normalizedCurrentStage] = normalizedStageStatus;
  }

  if (normalizedCurrentStage === 'completed') {
    normalizedStages.ocr_processing = 'done';
    normalizedStages.llm_extraction = 'done';
  }

  return {
    success: (raw.success as boolean | undefined) ?? true,
    document_id:
      (raw.document_id as string | undefined) ??
      ((raw.data as { document_id?: string } | undefined)?.document_id ?? ''),
    current_stage: normalizedCurrentStage,
    stages: normalizedStages,
    error: (raw.error as string | undefined) ?? (normalizedCurrentStage === 'failed' ? 'Processing failed' : undefined),
  };
}

export async function getProcessingStatus(documentId: string): Promise<ProcessingStatusResponse> {
  const { data } = await api.get(`/processing-status/${documentId}`);
  return normalizeProcessingPayload(data);
}

export interface StreamHandlers {
  onMessage: (payload: ProcessingStatusResponse) => void;
  onError?: (err: Event) => void;
  onComplete?: () => void;
}

/**
 * Opens an SSE stream for processing updates.
 * Returns a `close` function to stop the stream.
 */
export function openProcessingStream(documentId: string, handlers: StreamHandlers): () => void {
  const url = `${API_BASE_URL}/stream/${documentId}`;
  const source = new EventSource(url, { withCredentials: false });

  source.onmessage = (evt) => {
    try {
      const parsed = JSON.parse(evt.data);
      const normalized = normalizeProcessingPayload(parsed);
      handlers.onMessage(normalized);

      if (normalized.current_stage === 'completed' || normalized.current_stage === 'failed') {
        handlers.onComplete?.();
        source.close();
      }
    } catch (err) {
      console.error('Failed to parse SSE event:', err);
    }
  };

  source.onerror = (e) => {
    handlers.onError?.(e);
    try {
      source.close();
    } catch (err) {
      // ignore
    }
  };

  return () => source.close();
}
