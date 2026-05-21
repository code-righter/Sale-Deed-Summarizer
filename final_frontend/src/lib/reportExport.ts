import type { ReportViewModel, KVPair } from '@/types/document';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function sanitizeFilename(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '_').trim() || 'report';
}

function display(value?: string): string {
  return value ? escapeHtml(value) : '—';
}

function keyValueGrid(items: Array<{ label: string; value?: string }>): string {
  return `
    <table class="kv-table">
      <tbody>
        ${items
          .map(
            (item) => `
              <tr>
                <td class="label">${escapeHtml(item.label)}</td>
                <td>${display(item.value)}</td>
              </tr>`,
          )
          .join('')}
      </tbody>
    </table>`;
}

function kvTable(items: KVPair[], emptyText = 'None available'): string {
  if (!items.length) return `<p class="muted">${escapeHtml(emptyText)}</p>`;
  return `
    <table>
      <thead>
        <tr>
          <th>Label</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        ${items
          .map(
            (k) => `
              <tr>
                <td>${escapeHtml(k.label)}</td>
                <td>${escapeHtml(k.value)}</td>
              </tr>`,
          )
          .join('')}
      </tbody>
    </table>`;
}

function buildHTML(vm: ReportViewModel): string {
  const propertyRows: Array<{ label: string; value?: string }> = [
    { label: 'Address', value: vm.property.address },
    { label: 'District', value: vm.property.district },
    { label: 'State', value: vm.property.state },
    { label: 'Pincode', value: vm.property.pincode },
    { label: 'Property Type', value: vm.property.type },
    { label: 'Property Size', value: vm.property.size ?? vm.property.area },
  ];

  const partiesTable = vm.parties.length
    ? `
      <table>
        <thead>
          <tr>
            <th>Role</th>
            <th>Name</th>
            <th>Address / Details</th>
          </tr>
        </thead>
        <tbody>
          ${vm.parties
            .map(
              (p) => `
              <tr>
                <td>${escapeHtml(p.role)}</td>
                <td>${escapeHtml(p.name)}</td>
                <td>${display(p.details)}</td>
              </tr>`,
            )
            .join('')}
        </tbody>
      </table>`
    : '<p class="muted">No parties extracted.</p>';

  const timelineTable = vm.timeline.length
    ? `
      <table>
        <thead>
          <tr>
            <th>Date / Period</th>
            <th>From</th>
            <th>To / Document</th>
            <th>Transfer Details</th>
          </tr>
        </thead>
        <tbody>
          ${vm.timeline
            .map(
              (t) => `
              <tr>
                <td>${display(t.date)}</td>
                <td>${display(t.from)}</td>
                <td>${display(t.documentNumber ?? t.to)}</td>
                <td>${display(t.transferDetails ?? t.reason)}</td>
              </tr>`,
            )
            .join('')}
        </tbody>
      </table>`
    : '<p class="muted">No ownership history available.</p>';

  const installmentsTable = vm.financial.installments?.length
    ? `
      <h3>Installments</h3>
      <table>
        <thead>
          <tr>
            <th>Amount</th>
            <th>Date</th>
            <th>Bank / Mode</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          ${vm.financial.installments
            .map(
              (ins) => `
              <tr>
                <td>${display(ins.amount)}</td>
                <td>${display(ins.paymentDate)}</td>
                <td>${display(ins.bankDetails || ins.paymentMode)}</td>
                <td>${display(ins.remarks || 'Done')}</td>
              </tr>`,
            )
            .join('')}
        </tbody>
      </table>`
    : '';

  return `
    <h1>Legality - Document Analysis Report</h1>
    <p class="muted">Generated for: <strong>${escapeHtml(vm.documentName || 'Unnamed document')}</strong></p>
    ${keyValueGrid([
      { label: 'Sale Deed Number', value: vm.saleDeedNumber },
      { label: 'Document ID', value: vm.documentId },
      { label: 'Uploaded At', value: vm.uploadedAt },
      { label: 'Processing Status', value: vm.processingStatus },
    ])}

    <h2>Property Information</h2>
    ${keyValueGrid(propertyRows)}
    ${kvTable(vm.property.extra ?? [], 'No additional property metadata.')}

    <h2>Parties Involved</h2>
    ${partiesTable}

    <h2>Ownership Timeline</h2>
    ${timelineTable}

    <h2>Financial Details</h2>
    ${keyValueGrid([
      { label: 'Total Amount', value: vm.financial.total },
      { label: 'Stamp Duty', value: vm.financial.stampDuty ?? vm.financial.stamp_duty },
      { label: 'Registration Fee', value: vm.financial.registrationFee ?? vm.financial.registration_fee },
    ])}
    ${installmentsTable}
    ${kvTable(vm.financial.extra ?? [], 'No additional financial entries.')}
  `;
}

export function exportReportAsWord(vm: ReportViewModel) {
  const html = `<html><head><meta charset="utf-8"><style>
    body{font-family:Arial,sans-serif;padding:28px;color:#111;line-height:1.4}
    h1{color:#7c3aed;margin:0 0 8px 0}
    h2{color:#1f2937;border-bottom:2px solid #7c3aed;padding-bottom:4px;margin:24px 0 10px}
    h3{margin:16px 0 8px}
    p{margin:6px 0}
    .muted{color:#6b7280}
    table{width:100%;border-collapse:collapse;margin:8px 0 12px}
    th,td{border:1px solid #d1d5db;padding:8px;vertical-align:top;text-align:left}
    th{background:#f3f4f6;font-weight:700}
    .kv-table td.label{width:32%;font-weight:700;background:#f9fafb}
    ul,ol{margin:8px 0 12px 24px}
  </style></head><body>${buildHTML(vm)}</body></html>`;
  downloadBlob(
    new Blob([html], { type: 'application/msword' }),
    `${sanitizeFilename(vm.documentName || 'report')}.doc`,
  );
}

export function exportReportAsPDF(vm: ReportViewModel) {
  const html = `<html><head><meta charset="utf-8"><title>${vm.documentName} — Legality</title><style>
    body{font-family:Arial,sans-serif;padding:24px;max-width:920px;margin:0 auto;color:#111;line-height:1.4}
    h1{color:#7c3aed;margin:0 0 8px 0}
    h2{color:#1f2937;border-bottom:2px solid #7c3aed;padding-bottom:4px;margin:22px 0 10px;page-break-after:avoid}
    h3{margin:14px 0 8px;page-break-after:avoid}
    p{margin:6px 0}
    .muted{color:#6b7280}
    table{width:100%;border-collapse:collapse;margin:8px 0 12px;page-break-inside:auto}
    tr{page-break-inside:avoid;page-break-after:auto}
    th,td{border:1px solid #d1d5db;padding:7px;vertical-align:top;text-align:left}
    th{background:#f3f4f6;font-weight:700}
    .kv-table td.label{width:32%;font-weight:700;background:#f9fafb}
    ul,ol{margin:8px 0 12px 24px}
    @media print{body{padding:12px}}
  </style></head><body>${buildHTML(vm)}<script>window.print()</script></body></html>`;
  const w = window.open('', '_blank');
  if (w) {
    w.document.write(html);
    w.document.close();
  }
}
