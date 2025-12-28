// ============================================================================
// API CLIENT - Connection to Invoice Memory Agent Backend
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

// Types
export interface Invoice {
  invoiceId: string;
  vendor: string;
  invoiceDate?: string;
  dueDate?: string;
  totalAmount?: number;
  netTotal?: number;
  vatAmount?: number;
  vatRate?: number;
  currency?: string;
  lineItems?: LineItem[];
  extractedFields?: Record<string, string>;
  rawText?: string;
  serviceDate?: string;
  confidence?: number;
}

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ProposedCorrection {
  field: string;
  currentValue: unknown;
  proposedValue: unknown;
  source: string;
  confidence: number;
}

export interface AuditTrailEntry {
  action: string;
  timestamp: string;
  details: Record<string, unknown>;
}

export interface ProcessingResult {
  originalInvoice: Invoice;
  processedInvoice: Invoice;
  proposedCorrections: ProposedCorrection[];
  confidenceScore: number;
  requiresHumanReview: boolean;
  reviewReasons: string[];
  auditTrail: AuditTrailEntry[];
  processingTimestamp: string;
}

export interface LearnResult {
  success: boolean;
  invoiceId: string;
  learnResult: {
    newRules: unknown[];
    updatedRules: unknown[];
    newPatterns: unknown[];
    updatedPatterns: unknown[];
  };
  auditTrail: AuditTrailEntry[];
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  service: string;
}

export interface StatsResponse {
  rules: number;
  patterns: number;
  logs: number;
}

export interface VendorRule {
  id: string;
  vendorId: string;
  vendorName: string;
  targetField: string;
  sourceRawField: string;
  action: string;
  confidence: number;
  usageCount: number;
}

export interface CorrectionPattern {
  id: string;
  patternType: string;
  targetField: string;
  triggerCondition: string;
  usageCount: number;
}

// API Error
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Fetch wrapper with error handling
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        errorData.message || errorData.error || `HTTP ${response.status}`
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, `Network error: ${(error as Error).message}`);
  }
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * Check backend health status
 */
export async function checkHealth(): Promise<HealthResponse> {
  return fetchApi<HealthResponse>('/health');
}

/**
 * Process an invoice through the memory agent
 */
export async function processInvoice(invoice: Invoice): Promise<ProcessingResult> {
  return fetchApi<ProcessingResult>('/process', {
    method: 'POST',
    body: JSON.stringify({ invoice }),
  });
}

/**
 * Submit human corrections to teach the system
 */
export async function learnFromCorrections(
  invoiceId: string,
  originalInvoice: Invoice,
  finalInvoice: Invoice
): Promise<LearnResult> {
  return fetchApi<LearnResult>('/learn', {
    method: 'POST',
    body: JSON.stringify({
      invoiceId,
      originalInvoice,
      finalInvoice,
    }),
  });
}

/**
 * Get all vendor rules
 */
export async function getRules(): Promise<{ rules: VendorRule[]; count: number }> {
  return fetchApi('/rules');
}

/**
 * Get all correction patterns
 */
export async function getPatterns(): Promise<{ patterns: CorrectionPattern[]; count: number }> {
  return fetchApi('/patterns');
}

/**
 * Get database statistics
 */
export async function getStats(): Promise<StatsResponse> {
  return fetchApi<StatsResponse>('/stats');
}

/**
 * Reset the database (development only)
 */
export async function resetDatabase(): Promise<{ success: boolean; message: string }> {
  return fetchApi('/reset', { method: 'POST' });
}

// ============================================================================
// DEMO DATA
// ============================================================================

export const DEMO_INVOICES: Invoice[] = [
  {
    invoiceId: 'INV-DEMO-001',
    vendor: 'Supplier GmbH',
    rawText: `
      RECHNUNG
      Rechnungsnummer: 2024-0042
      Leistungsdatum: 15.01.2024
      
      Beratungsleistungen IT-Infrastruktur
      Menge: 40 Stunden
      Einzelpreis: 150,00 EUR
      
      Zwischensumme: 6.000,00 EUR
      MwSt. 19%: 1.140,00 EUR
      Gesamtbetrag: 7.140,00 EUR
    `,
    extractedFields: {
      Leistungsdatum: '2024-01-15',
      Rechnungsnummer: '2024-0042',
    },
    totalAmount: 7140,
    vatRate: 19,
    currency: 'EUR',
    confidence: 0.77,
  },
  {
    invoiceId: 'INV-DEMO-002',
    vendor: 'Parts AG',
    rawText: `
      INVOICE / RECHNUNG
      Invoice No: PA-2024-1337
      Date: 2024-01-20
      
      Industrial Components - Batch #447
      50 x Precision Bearings @ 45.00 EUR
      
      Subtotal: 2.250,00 EUR
      MwSt. inkl (19%): Included
      Total: 2.250,00 EUR (Brutto)
    `,
    extractedFields: {
      InvoiceNo: 'PA-2024-1337',
    },
    totalAmount: 2250,
    vatRate: 19,
    currency: 'EUR',
    confidence: 0.72,
  },
  {
    invoiceId: 'INV-DEMO-003',
    vendor: 'Tech Solutions Ltd',
    rawText: `
      COMMERCIAL INVOICE
      Reference: TSL/2024/0089
      Service Period: January 2024
      
      Cloud Infrastructure Services
      - Compute: 1,200.00 EUR
      - Storage: 450.00 EUR
      - Bandwidth: 150.00 EUR
      
      Net Total: 1,800.00 EUR
      VAT (19%): 342.00 EUR
      Grand Total: 2,142.00 EUR
    `,
    extractedFields: {
      Reference: 'TSL/2024/0089',
      ServicePeriod: 'January 2024',
    },
    totalAmount: 2142,
    netTotal: 1800,
    vatAmount: 342,
    vatRate: 19,
    currency: 'EUR',
    confidence: 0.85,
  },
];
