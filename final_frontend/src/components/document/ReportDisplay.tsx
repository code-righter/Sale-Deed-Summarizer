import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Scale, AlertCircle, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DocumentUpload } from './DocumentUpload';
import { ProcessingTimeline } from './ProcessingTimeline';
import { ReportContent } from './ReportContent';
import { useDocumentAnalyzer } from '@/hooks/useDocumentAnalyzer';

/**
 * NEW DOCUMENT FLOW.
 * Owns upload → live processing → final report rendering.
 * Do NOT reuse for history view (see ProcessedDocumentReportDisplay).
 */
interface ReportDisplayProps {
  /** Called once when a document finishes processing and the report is ready. */
  onAnalysisComplete?: (documentId: string) => void;
}

export function ReportDisplay({ onAnalysisComplete }: ReportDisplayProps) {
  const a = useDocumentAnalyzer();
  const notifiedDocumentIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (a.phase === 'idle') {
      notifiedDocumentIdRef.current = null;
      return;
    }
    if (a.phase !== 'done' || !a.report?.documentId) return;
    if (notifiedDocumentIdRef.current === a.report.documentId) return;
    notifiedDocumentIdRef.current = a.report.documentId;
    onAnalysisComplete?.(a.report.documentId);
  }, [a.phase, a.report?.documentId, onAnalysisComplete]);

  if (a.phase === 'idle') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[60vh] px-4"
      >
        <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
          <Scale className="h-16 w-16 text-primary mb-6" />
        </motion.div>
        <h1 className="text-4xl font-bold text-gradient mb-3">Legality</h1>
        <p className="text-muted-foreground text-center max-w-md mb-8">
          AI-powered legal document analysis. Upload a scanned sale deed and we'll extract a structured report.
        </p>
        <DocumentUpload onFileSelected={a.upload} />
      </motion.div>
    );
  }

  if (a.phase === 'uploading' || a.phase === 'processing') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">Analyzing</p>
          <h2 className="text-xl font-semibold truncate">{a.documentName}</h2>
          {a.phase === 'uploading' && (
            <div className="mt-3">
              <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${a.uploadPct}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Uploading… {a.uploadPct}%</p>
            </div>
          )}
        </div>
        <ProcessingTimeline stages={a.stages} currentStage={a.currentStage} error={a.error} />
      </div>
    );
  }

  if (a.phase === 'error') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 flex flex-col items-center text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Analysis failed</h2>
        <p className="text-sm text-muted-foreground mb-6">{a.error}</p>
        <Button onClick={a.reset}>
          <RotateCcw className="h-4 w-4 mr-1" /> Try again
        </Button>
      </div>
    );
  }

  // done — report should be set by finalize; show loading/error fallbacks if not
  if (!a.report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading report…</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <ReportContent report={a.report} />
      <div className="mt-6 flex justify-end">
        <Button variant="outline" onClick={a.reset}>
          <RotateCcw className="h-4 w-4 mr-1" /> Analyze another document
        </Button>
      </div>
    </div>
  );
}
