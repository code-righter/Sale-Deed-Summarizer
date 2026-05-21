import { motion } from 'framer-motion';
import {
  MapPin, Users, Banknote, Clock, ShieldCheck,
  ScrollText, Receipt, Hash, FileText, FileDown, Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ReportViewModel, KVPair } from '@/types/document';
import { exportReportAsPDF, exportReportAsWord } from '@/lib/reportExport';

interface ReportContentProps {
  report: ReportViewModel;
}

function Section({
  icon: Icon, title, children,
}: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      {children}
    </motion.section>
  );
}

function KVList({ items }: { items: KVPair[] }) {
  if (!items.length) return null;
  return (
    <div className="grid sm:grid-cols-2 gap-2 mt-3">
      {items.map((kv, i) => (
        <div key={i} className="p-2.5 rounded-lg bg-secondary/50">
          <p className="text-xs text-muted-foreground">{kv.label}</p>
          <p className="text-sm font-medium break-words">{kv.value}</p>
        </div>
      ))}
    </div>
  );
}

/**
 * Pure presentational report component.
 * Used by both live (ReportDisplay) and history (ProcessedDocumentReportDisplay) flows.
 */
export function ReportContent({ report }: ReportContentProps) {
  return (
    <div className="w-full max-w-3xl space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gradient">Document Analysis Report</h2>
          {/* Sale deed number (from new prompt format) */}
          {report.saleDeedNumber && (
            <p className="text-sm text-muted-foreground mt-1">Sale Deed No.: <span className="font-medium text-foreground">{report.saleDeedNumber}</span></p>
          )}
          <p className="text-sm text-muted-foreground mt-1">{report.documentName}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportReportAsPDF(report)}>
            <FileText className="h-4 w-4 mr-1" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportReportAsWord(report)}>
            <FileDown className="h-4 w-4 mr-1" /> Word
          </Button>
        </div>
      </div>

      <Section icon={MapPin} title="Property Information">
        {report.property.address && <p className="text-foreground">{report.property.address}</p>}
        <p className="text-muted-foreground text-sm mt-1">
          {[report.property.district, report.property.state, report.property.pincode].filter(Boolean).join(' • ')}
        </p>
        {/* Property size card */}
        {report.property.size && (
          <div className="mt-3 p-3 rounded-lg bg-secondary/50">
            <p className="text-xs text-muted-foreground">Property Size</p>
            <p className="font-semibold">{report.property.size}</p>
          </div>
        )}
        <div className="flex flex-wrap gap-2 mt-3">
          {report.property.type && (
            <span className="text-xs px-2 py-1 rounded-full bg-secondary/60">{report.property.type}</span>
          )}
          {report.property.area && (
            <span className="text-xs px-2 py-1 rounded-full bg-secondary/60">{report.property.area}</span>
          )}
        </div>
        <KVList items={report.property.extra ?? []} />
      </Section>

      <Section icon={Users} title="Parties Involved">
        {report.parties.length === 0 ? (
          <p className="text-sm text-muted-foreground">No parties extracted.</p>
        ) : (
          <div className="space-y-3">
            {report.parties.map((p, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0 bg-primary/20 text-primary">
                  {p.role}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{p.name}</p>
                  {p.details && <p className="text-sm text-muted-foreground">{p.details}</p>}
                  {p.identifiers && <KVList items={p.identifiers} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section icon={Clock} title="Ownership Timeline">
        {report.timeline.length === 0 ? (
          <p className="text-sm text-muted-foreground">No ownership history available.</p>
        ) : (
          <div className="relative pl-6">
            <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-primary/30" />
            {report.timeline.map((item, i) => (
              <div key={i} className="relative mb-6 last:mb-0">
                <div className="absolute -left-[17px] top-1.5 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                <div className="p-3 rounded-lg bg-secondary/50">
                  <span className="text-xs font-mono text-primary">{item.date}</span>
                  <p className="font-medium mt-1">
                    <span className="text-muted-foreground">{item.from}</span>
                    <span className="mx-2 text-primary">→</span>
                    <span>{item.to}</span>
                  </p>
                  {/* show document number and transfer details if present */}
                  {item.documentNumber && (
                    <p className="text-xs text-muted-foreground mt-1">Document No.: <span className="font-medium text-foreground">{item.documentNumber}</span></p>
                  )}
                  {item.transferDetails && (
                    <p className="text-sm text-muted-foreground mt-1">Transfer details: {item.transferDetails}</p>
                  )}
                  {item.reason && !item.transferDetails && <p className="text-sm text-muted-foreground mt-1">{item.reason}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section icon={Banknote} title="Financial Details">
        {report.financial.total && (
          <div className="text-3xl font-bold text-gradient mb-3">{report.financial.total}</div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-secondary/50">
            <p className="text-xs text-muted-foreground">Stamp Duty</p>
            <p className="font-semibold">{report.financial.stampDuty ?? report.financial.stamp_duty ?? '—'}</p>
          </div>
          <div className="p-3 rounded-lg bg-secondary/50">
            <p className="text-xs text-muted-foreground">Registration Fee</p>
            <p className="font-semibold">{report.financial.registrationFee ?? report.financial.registration_fee ?? '—'}</p>
          </div>
        </div>

        {/* Installments table */}
        {report.financial.installments && report.financial.installments.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Installments</h4>
            <div className="w-full overflow-auto rounded-md border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/5">
                  <tr>
                    <th className="text-left px-3 py-2">Amount</th>
                    <th className="text-left px-3 py-2">Date</th>
                    <th className="text-left px-3 py-2">Bank / Mode</th>
                    <th className="text-left px-3 py-2">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {report.financial.installments.map((ins, idx) => (
                    <tr key={idx} className="even:bg-secondary/25">
                      <td className="px-3 py-3 align-top break-words">{ins.amount}</td>
                      <td className="px-3 py-3 align-top">{ins.paymentDate}</td>
                      <td className="px-3 py-3 align-top">{ins.bankDetails || ins.paymentMode || '—'}</td>
                      <td className="px-3 py-3 align-top">{ins.remarks || 'Done'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <KVList items={report.financial.extra ?? []} />
      </Section>

      {report.legalClauses.length > 0 && (
        <Section icon={ScrollText} title="Legal Clauses">
          <ol className="list-decimal pl-5 space-y-2 text-sm text-foreground/90">
            {report.legalClauses.map((c, i) => <li key={i}>{c}</li>)}
          </ol>
        </Section>
      )}

      {report.taxesAndCharges.length > 0 && (
        <Section icon={Receipt} title="Taxes & Charges">
          <KVList items={report.taxesAndCharges} />
        </Section>
      )}

      {report.transactionDetails.length > 0 && (
        <Section icon={Hash} title="Transaction Details">
          <KVList items={report.transactionDetails} />
        </Section>
      )}

      {report.validation.length > 0 && (
        <Section icon={ShieldCheck} title="Validation Status">
          <div className="space-y-2">
            {report.validation.map((v, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-sm">{v.entity}</p>
                  <p className="text-xs text-muted-foreground font-mono truncate">{v.document}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${
                  v.status === 'verified' ? 'bg-green-500/20 text-green-400'
                  : v.status === 'mismatch' ? 'bg-red-500/20 text-red-400'
                  : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {v.status === 'verified' ? '✓ Verified' : v.status === 'mismatch' ? '✗ Mismatch' : '? Unverified'}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section icon={Building2} title="Registration Details">
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-secondary/50">
            <p className="text-xs text-muted-foreground">Registration No.</p>
            <p className="font-semibold">{report.registration.registrationNumber ?? '—'}</p>
          </div>
          <div className="p-3 rounded-lg bg-secondary/50">
            <p className="text-xs text-muted-foreground">Date</p>
            <p className="font-semibold">{report.registration.registrationDate ?? '—'}</p>
          </div>
          <div className="p-3 rounded-lg bg-secondary/50">
            <p className="text-xs text-muted-foreground">Sub-Registrar Office</p>
            <p className="font-semibold">{report.registration.subRegistrarOffice ?? '—'}</p>
          </div>
        </div>
        <KVList items={report.registration.extra ?? []} />
      </Section>
    </div>
  );
}
