import { useCallback, useEffect, useRef, useState } from 'react';
import {
  uploadDocument,
  openProcessingStream,
  getProcessingStatus,
  getReport,
} from '@/services';
import { mapReportResponse } from '@/lib/reportMapper';
import type {
  ProcessingStageId,
  ProcessingStatusResponse,
  ReportViewModel,
  StageStatus,
} from '@/types/document';
import { PROCESSING_STAGES } from '@/types/document';

export type AnalyzerPhase = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

interface State {
  phase: AnalyzerPhase;
  uploadPct: number;
  documentId: string | null;
  documentName: string | null;
  stages: Record<ProcessingStageId, StageStatus>;
  currentStage: ProcessingStageId | null;
  report: ReportViewModel | null;
  error: string | null;
}

const initialStages = () =>
  PROCESSING_STAGES.reduce(
    (acc, s) => ({ ...acc, [s.id]: 'pending' as StageStatus }),
    {} as Record<ProcessingStageId, StageStatus>,
  );

const initialState: State = {
  phase: 'idle',
  uploadPct: 0,
  documentId: null,
  documentName: null,
  stages: initialStages(),
  currentStage: null,
  report: null,
  error: null,
};

const POLL_INTERVAL_MS = 3500; 
const STAGE_ORDER: ProcessingStageId[] = ['ocr_processing', 'llm_extraction'];

export function useDocumentAnalyzer() {
  const [state, setState] = useState<State>(initialState);
  const closeStreamRef = useRef<(() => void) | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finalizeInFlightRef = useRef(false);

  const cleanup = useCallback(() => {
    closeStreamRef.current?.();
    closeStreamRef.current = null;
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const applyStatus = useCallback((payload: ProcessingStatusResponse) => {
    setState((s) => {
      const nextStages = { ...s.stages };
      for (const stage of PROCESSING_STAGES) {
        const status = payload.stages?.[stage.id];
        if (status && !(nextStages[stage.id] === 'done' && status !== 'done')) {
          nextStages[stage.id] = status;
        }
      }
      const isDone = payload.current_stage === 'completed';
      const isFailed = payload.current_stage === 'failed';
      const currentStageFromPayload = !isDone && !isFailed ? (payload.current_stage as ProcessingStageId) : null;
      const prevIndex = s.currentStage ? STAGE_ORDER.indexOf(s.currentStage) : -1;
      const nextIndex = currentStageFromPayload ? STAGE_ORDER.indexOf(currentStageFromPayload) : -1;
      const effectiveCurrentStage =
        nextIndex >= prevIndex ? currentStageFromPayload : s.currentStage;

      if (effectiveCurrentStage) {
        nextStages[effectiveCurrentStage] = 'in_progress';
        const effectiveIndex = STAGE_ORDER.indexOf(effectiveCurrentStage);
        for (let idx = 0; idx < effectiveIndex; idx += 1) {
          nextStages[STAGE_ORDER[idx]] = 'done';
        }
      }
      return {
        ...s,
        stages: nextStages,
        currentStage: isDone || isFailed ? null : effectiveCurrentStage,
        error: isFailed ? payload.error ?? 'Processing failed' : s.error,
      };
    });
  }, []);

  const finalize = useCallback(async (documentId: string) => {
    if (finalizeInFlightRef.current) return;
    finalizeInFlightRef.current = true;
    try {
      const raw = await getReport(documentId);
      const vm = mapReportResponse(raw);
      setState((s) => ({
        ...s,
        phase: 'done',
        report: vm,
        stages: PROCESSING_STAGES.reduce(
          (acc, st) => ({ ...acc, [st.id]: 'done' as StageStatus }),
          {} as Record<ProcessingStageId, StageStatus>,
        ),
      }));
    } catch (err) {
      setState((s) => ({ ...s, phase: 'error', error: (err as Error).message }));
    } finally {
      finalizeInFlightRef.current = false;
      cleanup();
    }
  }, [cleanup]);

  const startTracking = useCallback((documentId: string) => {
    // Primary: SSE
    closeStreamRef.current = openProcessingStream(documentId, {
      onMessage: (payload) => {
        applyStatus(payload);
        if (payload.current_stage === 'completed') {
          finalize(documentId);
        } else if (payload.current_stage === 'failed') {
          setState((s) => ({ ...s, phase: 'error', error: payload.error ?? 'Processing failed' }));
          cleanup();
        }
      },
      onError: () => {
        // Stream died — polling fallback continues.
      },
    });

    // Fallback: polling
    pollTimerRef.current = setInterval(async () => {
      try {
        const status = await getProcessingStatus(documentId);
        applyStatus(status);
        if (status.current_stage === 'completed') {
          finalize(documentId);
        } else if (status.current_stage === 'failed') {
          setState((s) => ({ ...s, phase: 'error', error: status.error ?? 'Processing failed' }));
          cleanup();
        }
      } catch {
        // ignore transient errors
      }
    }, POLL_INTERVAL_MS);
  }, [applyStatus, cleanup, finalize]);

  const upload = useCallback(async (file: File) => {
    cleanup();
    setState({
      ...initialState,
      phase: 'uploading',
      documentName: file.name,
      stages: initialStages(),
    });

    try {
      const res = await uploadDocument(file, (pct) =>
        setState((s) => ({ ...s, uploadPct: pct })),
      );
      setState((s) => ({
        ...s,
        phase: 'processing',
        documentId: res.document_id,
        documentName: res.document_name ?? file.name,
      }));
      startTracking(res.document_id);
    } catch (err) {
      setState((s) => ({ ...s, phase: 'error', error: (err as Error).message }));
    }
  }, [cleanup, startTracking]);

  const reset = useCallback(() => {
    cleanup();
    setState({ ...initialState, stages: initialStages() });
  }, [cleanup]);

  return { ...state, upload, reset };
}
