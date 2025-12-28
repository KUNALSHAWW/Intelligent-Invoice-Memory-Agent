import { z } from 'zod';

// ============================================================================
// LINE ITEM SCHEMA
// ============================================================================
export const LineItemSchema = z.object({
  description: z.string(),
  quantity: z.number().optional(),
  unitPrice: z.number().optional(),
  totalPrice: z.number().optional(),
  taxRate: z.number().optional(),
});

export type LineItem = z.infer<typeof LineItemSchema>;

// ============================================================================
// INVOICE SCHEMA
// ============================================================================
export const InvoiceSchema = z.object({
  invoiceId: z.string(),
  vendor: z.string(),
  vendorId: z.string().optional(),
  invoiceNumber: z.string().optional(),
  invoiceDate: z.string().optional(),
  serviceDate: z.string().optional(),
  dueDate: z.string().optional(),
  totalAmount: z.number().optional(),
  netTotal: z.number().optional(),
  grossTotal: z.number().optional(),
  taxAmount: z.number().optional(),
  currency: z.string().default('EUR'),
  lineItems: z.array(LineItemSchema).default([]),
  extractedFields: z.record(z.string(), z.any()).default({}),
  rawText: z.string().optional(),
});

export type Invoice = z.infer<typeof InvoiceSchema>;

// ============================================================================
// VENDOR RULE SCHEMA
// ============================================================================
export const VendorRuleSchema = z.object({
  id: z.string(),
  vendorId: z.string(),
  vendorName: z.string().optional(),
  targetField: z.string(),
  sourceRawField: z.string(),
  action: z.enum(['MAP', 'DEFAULT']),
  confidence: z.number().min(0).max(1).default(0.5),
  createdAt: z.string(),
  updatedAt: z.string(),
  usageCount: z.number().default(0),
});

export type VendorRule = z.infer<typeof VendorRuleSchema>;

// ============================================================================
// CORRECTION PATTERN SCHEMA
// ============================================================================
export const CorrectionPatternSchema = z.object({
  id: z.string(),
  vendorId: z.string(),
  vendorName: z.string().optional(),
  field: z.string(),
  patternType: z.enum(['MATH', 'TEXT']),
  correctionLogic: z.string(),
  triggerCondition: z.string().optional(),
  confidence: z.number().min(0).max(1).default(0.5),
  createdAt: z.string(),
  updatedAt: z.string(),
  usageCount: z.number().default(0),
});

export type CorrectionPattern = z.infer<typeof CorrectionPatternSchema>;

// ============================================================================
// AUDIT LOG SCHEMA
// ============================================================================
export const AuditLogSchema = z.object({
  id: z.string(),
  invoiceId: z.string(),
  action: z.enum(['RECALL', 'APPLY', 'LEARN', 'HUMAN_CORRECTION', 'AUTO_APPROVE']),
  details: z.record(z.string(), z.any()),
  timestamp: z.string(),
});

export type AuditLog = z.infer<typeof AuditLogSchema>;

// ============================================================================
// PROCESSING RESULT SCHEMA
// ============================================================================
export const ProposedCorrectionSchema = z.object({
  field: z.string(),
  currentValue: z.any().optional(),
  proposedValue: z.any(),
  source: z.string(),
  confidence: z.number(),
});

export type ProposedCorrection = z.infer<typeof ProposedCorrectionSchema>;

export const AuditTrailEntrySchema = z.object({
  action: z.string(),
  timestamp: z.string(),
  details: z.record(z.string(), z.any()),
});

export type AuditTrailEntry = z.infer<typeof AuditTrailEntrySchema>;

export const ProcessingResultSchema = z.object({
  originalInvoice: InvoiceSchema,
  processedInvoice: InvoiceSchema,
  proposedCorrections: z.array(ProposedCorrectionSchema),
  confidenceScore: z.number().min(0).max(1),
  requiresHumanReview: z.boolean(),
  reviewReasons: z.array(z.string()),
  auditTrail: z.array(AuditTrailEntrySchema),
  processingTimestamp: z.string(),
});

export type ProcessingResult = z.infer<typeof ProcessingResultSchema>;

// ============================================================================
// API REQUEST/RESPONSE SCHEMAS
// ============================================================================
export const ProcessRequestSchema = z.object({
  invoice: InvoiceSchema,
});

export type ProcessRequest = z.infer<typeof ProcessRequestSchema>;

export const LearnRequestSchema = z.object({
  invoiceId: z.string(),
  originalInvoice: InvoiceSchema,
  finalInvoice: InvoiceSchema,
});

export type LearnRequest = z.infer<typeof LearnRequestSchema>;

// ============================================================================
// HELPER TYPES
// ============================================================================
export interface MemoryRecallResult {
  vendorRules: VendorRule[];
  correctionPatterns: CorrectionPattern[];
}

export interface LearnResult {
  newRules: VendorRule[];
  updatedRules: VendorRule[];
  newPatterns: CorrectionPattern[];
  updatedPatterns: CorrectionPattern[];
}
