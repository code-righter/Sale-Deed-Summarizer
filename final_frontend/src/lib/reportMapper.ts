import type {
  KVPair,
  RawReportResponse,
  ReportViewModel,
  ValidationItemVM,
} from '@/types/document';

// ---------- helpers ----------
const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const str = (v: unknown): string | undefined => {
  if (v == null) return undefined;
  if (typeof v === 'string') return v.trim() || undefined;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return undefined;
};

const arr = <T = unknown>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

const pick = (obj: Record<string, unknown>, keys: string[]): unknown => {
  for (const k of keys) {
    if (obj[k] != null) return obj[k];
  }
  return undefined;
};

const humanize = (key: string): string =>
  key.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const flattenKV = (obj: unknown, prefix = ''): KVPair[] => {
  if (!isObject(obj)) return [];
  const out: KVPair[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const label = prefix ? `${prefix} — ${humanize(k)}` : humanize(k);
    const s = str(v);
    if (s !== undefined) {
      out.push({ label, value: s });
    } else if (isObject(v)) {
      out.push(...flattenKV(v, label));
    } else if (Array.isArray(v) && v.every((x) => typeof x !== 'object')) {
      out.push({ label, value: v.join(', ') });
    }
  }
  return out;
};

const normalizeStatus = (s: unknown): ValidationItemVM['status'] => {
  const v = (str(s) ?? '').toLowerCase();
  if (v.includes('verif') || v === 'ok' || v === 'valid') return 'verified';
  if (v.includes('mismatch') || v.includes('fail') || v.includes('invalid')) return 'mismatch';
  return 'unverified';
};

/** Normalize API payloads from `/report/{id}` (`report`) and `/history/...` (`document`). */
export function unwrapReportPayload(response: unknown): Record<string, unknown> {
  if (!isObject(response)) return {};
  const data = isObject(response.data) ? response.data : undefined;
  const nested =
    response.document ??
    response.report ??
    data?.document ??
    data?.report;
  if (isObject(nested)) return nested;
  return response;
}

// ---------- main mapper ----------
export const mapReportResponse = (response: unknown): ReportViewModel => {
  const document = unwrapReportPayload(response);
  const extracted = (document.llm_output as { extracted_data?: Record<string, unknown> } | undefined)
    ?.extracted_data ?? {};

  const propertyLoc = extracted?.property_location_information ?? {};

  // sale deed number (new prompt format: sale_deed_no)
  const saleDeedNumber = str(extracted?.sale_deed_no) ?? str(document?.sale_deed_no) ?? str(document?.sale_deed_number);

  // parties: merge vendor / purchaser / consenting parties into unified list
  const parties: { role: string; name?: string; details?: string; identifiers?: KVPair[] }[] = [];

  const addParties = (list: any[], role: string) => {
    for (const item of arr<any>(list)) {
      parties.push({
        role,
        name: str(item.name) ?? str(item.owner_name) ?? undefined,
        details: str(item.address) ?? undefined,
        identifiers: flattenKV(item).filter((kv) => kv.label.toLowerCase() !== 'name'),
      });
    }
  };

  addParties(extracted?.vendor_information ?? [], 'Vendor');
  addParties(extracted?.purchaser_information ?? [], 'Purchaser');
  addParties(extracted?.consenting_party_information ?? [], 'Consenting Party');

  // timeline from ownership_history_information
  const timeline = arr<any>(extracted?.ownership_history_information).map((it) => ({
    // keep previous 'date/from/to/reason' shape for backwards compatibility,
    // but also expose documentNumber and transferDetails explicitly.
    date: str(it.possession_time_period) ?? '',
    from: str(it.owner_name) ?? '',
    to: str(it.sale_deed_document_number) ?? '',
    reason: str(it.transfer_details) ?? '',
    documentNumber: str(it.sale_deed_document_number) ?? '',
    transferDetails: str(it.transfer_details) ?? '',
  }));

  const saleInfo = extracted?.sale_amount_information ?? {};

  const report: ReportViewModel = {
    // basic document info
    documentId: document?.document_id ?? document?._id ?? '',
    documentName: document?.document_name ?? '',
    uploadedAt: document?.uploaded_at ?? '',
    processingStatus: document?.processing_status ?? '',
    totalPages: document?.total_pages ?? 0,
    stampPagesDetected: document?.stamp_pages_detected ?? 0,
    documentCharacterCount: document?.document_character_count ?? 0,

    // property (shape expected by ReportContent)
    property: {
      address: str(propertyLoc.full_property_address) ?? '',
      district: str(propertyLoc.district) ?? '',
      state: str(propertyLoc.state) ?? '',
      pincode: str(propertyLoc.pincode) ?? '',
      type: undefined,
      // prefer explicit property_size from new prompt
      size: str(propertyLoc.property_size) ?? str(propertyLoc.property_size_sqft) ?? undefined,
      area: str(propertyLoc.property_size) ?? undefined,
      extra: [
        // include survey numbers and flattened boundaries / adjacent props
        ...(Array.isArray(propertyLoc.survey_numbers) ? [{ label: 'Survey Numbers', value: (propertyLoc.survey_numbers as any[]).join(', ') }] : []),
        ...flattenKV(propertyLoc.boundaries ?? {}, 'Boundaries'),
        ...flattenKV({ adjacent: propertyLoc.adjacent_properties ?? [] }, 'Adjacent Properties'),
      ].filter(Boolean),
    },

    // parties mapped above (shape expected by ReportContent)
    parties: parties.map((p) => ({
      role: p.role,
      name: p.name ?? 'Unknown',
      details: p.details,
      identifiers: p.identifiers ?? [],
    })),

    // ownership timeline for the UI timeline component
    timeline,

    // financial
    financial: {
      total: str(saleInfo.final_transaction_amount) ?? undefined,
      // provide both camelCase and snake_case fields for compatibility with UI
      stampDuty: str(saleInfo.stamp_duty) ?? str(saleInfo.stampDuty) ?? undefined,
      stamp_duty: str(saleInfo.stamp_duty) ?? str(saleInfo.stampDuty) ?? undefined,
      registrationFee: str(saleInfo.registration_fee) ?? str(saleInfo.registrationFee) ?? undefined,
      registration_fee: str(saleInfo.registration_fee) ?? str(saleInfo.registrationFee) ?? undefined,
      // keep other extra KV pairs if present (non-installment extras)
      extra: (Array.isArray(saleInfo.extra) ? (saleInfo.extra as any[]).map((e) => ({ label: e.label ?? humanize(String(e.key ?? 'extra')), value: str(e.value) ?? String(e) })) : []),
      // structured installments for table rendering
      installments: Array.isArray(saleInfo.installments)
        ? (saleInfo.installments as any[]).map((ins) => ({
            amount: str(ins.amount) ?? '—',
            paymentDate: str(ins.payment_date) ?? '—',
            paymentMode: str(ins.payment_mode) ?? '',
            bankDetails: str(ins.bank_details) ?? '',
            remarks: str(ins.remarks) ?? '',
          }))
        : [],
    },

    legalClauses: arr<string>(extracted?.legal_clauses ?? []),
    taxesAndCharges: arr<KVPair>(extracted?.taxes_and_charges ?? []),
    transactionDetails: arr<KVPair>(extracted?.transaction_details ?? []),

    validation: arr<Record<string, unknown>>(extracted.validation_status).map((v) => ({
      entity: str(v.entity) ?? 'Unknown',
      document: str(v.document) ?? '',
      status: normalizeStatus(v.status ?? v.result),
    })),

    registration: {
      registrationNumber: str(document?.registration_number) ?? undefined,
      registrationDate: str(document?.registration_date) ?? undefined,
      subRegistrarOffice: str(document?.sub_registrar_office) ?? undefined,
      extra: flattenKV(document?.registration ?? {}),
    },

    // sale deed number top-level (from extracted data / document)
    saleDeedNumber: saleDeedNumber ?? '',

    // keep raw extracted for debugging if needed
    _raw: response,
  };

  return report;
};