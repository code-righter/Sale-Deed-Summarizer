import { useEffect, useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { ReportDisplay } from '@/components/document/ReportDisplay';
import { ProcessedDocumentReportDisplay } from '@/components/document/ProcessedDocumentReportDisplay';

type ViewMode = 'new' | 'history';

const Index = () => {
  const [mode, setMode] = useState<ViewMode>('new');
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [sidebarRefresh, setSidebarRefresh] = useState(0);

  useEffect(() => {
    document.title = 'Legality — AI Legal Document Analyzer';
  }, []);

  const handleNewAnalysis = () => {
    setActiveDocumentId(null);
    setMode('new');
  };

  const handleSelectDocument = (id: string) => {
    setActiveDocumentId(id);
    setMode('history');
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar
          activeDocumentId={activeDocumentId}
          onNewAnalysis={handleNewAnalysis}
          onSelectDocument={handleSelectDocument}
          refreshKey={sidebarRefresh}
        />
        <div className="flex-1 flex flex-col min-h-screen">
          <header className="h-12 flex items-center border-b border-border px-2 shrink-0">
            <SidebarTrigger />
          </header>
          <main className="flex-1 overflow-y-auto">
            {mode === 'new' && (
              <ReportDisplay
                onAnalysisComplete={(documentId) => {
                  setSidebarRefresh((n) => n + 1);
                  setActiveDocumentId(documentId);
                }}
              />
            )}
            {mode === 'history' && activeDocumentId && (
              <ProcessedDocumentReportDisplay documentId={activeDocumentId} />
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
