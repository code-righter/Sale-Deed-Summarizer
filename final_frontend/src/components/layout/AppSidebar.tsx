import { useEffect, useState } from 'react';
import { Plus, FileText, Scale, LogOut, Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import { listHistoryDocuments } from '@/services';
import type { HistoryDocument } from '@/types/document';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface AppSidebarProps {
  activeDocumentId: string | null;
  onNewAnalysis: () => void;
  onSelectDocument: (id: string) => void;
  refreshKey?: number;
}

function StatusIcon({ status }: { status: HistoryDocument['processing_status'] }) {
  if (status === 'completed') return <CheckCircle2 className="h-3 w-3 text-green-500" />;
  if (status === 'failed') return <AlertCircle className="h-3 w-3 text-destructive" />;
  if (status === 'processing') return <Loader2 className="h-3 w-3 text-primary animate-spin" />;
  return <Clock className="h-3 w-3 text-muted-foreground" />;
}

export function AppSidebar({ activeDocumentId, onNewAnalysis, onSelectDocument, refreshKey = 0 }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const [docs, setDocs] = useState<HistoryDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    // Normalize backend response keys (document_id, uploaded_at, processing_status)
    listHistoryDocuments()
      .then((res) => {
        console.log('listHistoryDocuments response', res);
        if (!alive) return;
        const normalized = (res.documents ?? []).map((d: any) => ({
          id: d.id ?? d.document_id ?? d.documentId ?? '',
          document_name:
            d.document_name ?? d.documentName ?? d.name ?? 'Untitled Document',
          uploaded_at: d.uploaded_at ?? d.uploadedAt ?? '',
          processing_status:
            d.processing_status ?? d.processingStatus ?? 'unknown',
        }));
        setDocs(normalized);
      })
      .catch((err: Error) => {
        if (alive) setError(err.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [refreshKey]);

  const handleLogout = async () => {
    await signOut();
    navigate('/auth', { replace: true });
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Scale className="h-6 w-6 text-primary shrink-0" />
          {!collapsed && <span className="text-lg font-bold text-gradient">Legality</span>}
        </div>
        <Button
          onClick={onNewAnalysis}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          size={collapsed ? 'icon' : 'default'}
        >
          <Plus className="h-4 w-4" />
          {!collapsed && <span className="ml-2">New Analysis</span>}
        </Button>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {!collapsed && (
          <p className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Documents
          </p>
        )}

        {loading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && !collapsed && (
          <p className="px-3 py-2 text-xs text-destructive">{error}</p>
        )}

        {!loading && !error && docs.length === 0 && !collapsed && (
          <p className="px-3 py-2 text-xs text-muted-foreground">No documents yet.</p>
        )}

        <SidebarMenu>
        {docs.map((doc) => (
          <SidebarMenuItem
            key={`${doc.id}-${doc.uploaded_at}`}
          >
            <SidebarMenuButton
              onClick={() => onSelectDocument(doc.id)}
              className={`w-full justify-start ${
                activeDocumentId === doc.id
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : ''
              }`}
            >
              <FileText className="h-4 w-4 shrink-0" />

              {!collapsed && (
                <div className="flex flex-col items-start overflow-hidden ml-2 flex-1 min-w-0">
                  <span className="text-sm truncate w-full">
                    {doc.document_name}
                  </span>

                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <StatusIcon status={doc.processing_status} />
                    {doc.processing_status}
                  </span>
                </div>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size={collapsed ? 'icon' : 'sm'}
          onClick={handleLogout}
          className="w-full justify-start"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Logout</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
