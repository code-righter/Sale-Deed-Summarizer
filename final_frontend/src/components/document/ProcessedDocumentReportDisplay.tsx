import { useEffect, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { ReportContent } from './ReportContent';
import { getHistoryDocument } from '@/services/historyService';
import { mapReportResponse, unwrapReportPayload } from '@/lib/reportMapper';
import type { ReportViewModel } from '@/types/document';

/**
 * HISTORY VIEW FLOW.
 * Pure read-only renderer for a previously processed document.
 * No upload, processing, or SSE logic — only fetch + display.
 */
interface ProcessedDocumentReportDisplayProps {
  documentId: string;
}

export function ProcessedDocumentReportDisplay({ documentId }: ProcessedDocumentReportDisplayProps) {
  const [report, setReport] = useState<ReportViewModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    setReport(null);

    getHistoryDocument(documentId)
      .then((raw) => {
        // Backend returns { document: { ... } } — normalize to the document object
        console.log('getHistoryDocument response', raw);
        if (!alive) return;
        setReport(mapReportResponse(unwrapReportPayload(raw)));
      })
      .catch((err: Error) => {
        if (!alive) return;
        setError(err.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [documentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 flex flex-col items-center text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Could not load document</h2>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <ReportContent report={report} />
    </div>
  );
}
