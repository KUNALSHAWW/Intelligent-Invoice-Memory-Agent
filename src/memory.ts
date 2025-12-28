import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import {
  Invoice,
  VendorRule,
  CorrectionPattern,
  MemoryRecallResult,
  ProposedCorrection,
  LearnResult,
  AuditTrailEntry,
} from './types.js';

// ============================================================================
// DATABASE CONFIGURATION
// ============================================================================

/**
 * Get database path from environment or default
 * - Uses DB_PATH env var if set (for Render persistent disk at /data)
 * - Falls back to ./data/memory.db for local development
 */
function getDatabasePath(): string {
  const dbPath = process.env.DB_PATH || './data/memory.db';
  const dbDir = dirname(dbPath);
  
  // Ensure directory exists
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
    console.log(`📁 Created data directory: ${dbDir}`);
  }
  
  console.log(`📁 Using database path: ${dbPath}`);
  return dbPath;
}

// Database singleton
let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    const dbPath = getDatabasePath();
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeTables(db);
    console.log('✅ Database connected');
  }
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    console.log('🔒 Database closed');
  }
}

export function resetDatabase(): void {
  const database = getDatabase();
  database.exec(`
    DROP TABLE IF EXISTS audit_logs;
    DROP TABLE IF EXISTS correction_patterns;
    DROP TABLE IF EXISTS vendor_rules;
  `);
  initializeTables(database);
  console.log('✅ Database reset');
}

function initializeTables(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS vendor_rules (
      id TEXT PRIMARY KEY,
      vendor_id TEXT NOT NULL,
      vendor_name TEXT,
      target_field TEXT NOT NULL,
      source_raw_field TEXT NOT NULL,
      action TEXT NOT NULL CHECK (action IN ('MAP', 'DEFAULT')),
      confidence REAL NOT NULL DEFAULT 0.5,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      usage_count INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_vendor_rules_vendor ON vendor_rules(vendor_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_vendor_rules_unique 
      ON vendor_rules(vendor_id, target_field, source_raw_field);

    CREATE TABLE IF NOT EXISTS correction_patterns (
      id TEXT PRIMARY KEY,
      vendor_id TEXT NOT NULL,
      vendor_name TEXT,
      field TEXT NOT NULL,
      pattern_type TEXT NOT NULL CHECK (pattern_type IN ('MATH', 'TEXT')),
      correction_logic TEXT NOT NULL,
      trigger_condition TEXT,
      confidence REAL NOT NULL DEFAULT 0.5,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      usage_count INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_correction_patterns_vendor ON correction_patterns(vendor_id);

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_audit_logs_invoice ON audit_logs(invoice_id);
  `);
}

// ============================================================================
// DATABASE ROW TYPES
// ============================================================================

interface VendorRuleRow {
  id: string;
  vendor_id: string;
  vendor_name: string | null;
  target_field: string;
  source_raw_field: string;
  action: string;
  confidence: number;
  created_at: string;
  updated_at: string;
  usage_count: number;
}

interface CorrectionPatternRow {
  id: string;
  vendor_id: string;
  vendor_name: string | null;
  field: string;
  pattern_type: string;
  correction_logic: string;
  trigger_condition: string | null;
  confidence: number;
  created_at: string;
  updated_at: string;
  usage_count: number;
}

// ============================================================================
// MEMORY MANAGER CLASS
// ============================================================================

export class MemoryManager {
  private auditTrail: AuditTrailEntry[] = [];

  /**
   * Normalizes vendor name to a consistent ID format
   */
  private normalizeVendorId(vendor: string): string {
    return vendor.toLowerCase().trim().replace(/\s+/g, '_');
  }

  /**
   * Adds an entry to the current audit trail
   */
  private addAudit(action: string, details: Record<string, any>): void {
    this.auditTrail.push({
      action,
      timestamp: new Date().toISOString(),
      details,
    });
  }

  /**
   * Clears and returns the audit trail
   */
  getAndClearAuditTrail(): AuditTrailEntry[] {
    const trail = [...this.auditTrail];
    this.auditTrail = [];
    return trail;
  }

  /**
   * Logs action to persistent audit_logs table
   */
  private logToDatabase(invoiceId: string, action: string, details: Record<string, any>): void {
    const database = getDatabase();
    database.prepare(`
      INSERT INTO audit_logs (id, invoice_id, action, details, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `).run(uuidv4(), invoiceId, action, JSON.stringify(details), new Date().toISOString());
  }

  // ==========================================================================
  // RECALL: Fetch rules for a vendor
  // ==========================================================================

  recall(vendorId: string): MemoryRecallResult {
    const normalizedId = this.normalizeVendorId(vendorId);
    const database = getDatabase();

    console.log(`🔍 Recalling memories for vendor: ${normalizedId}`);

    const vendorRuleRows = database.prepare(
      `SELECT * FROM vendor_rules WHERE vendor_id = ? ORDER BY confidence DESC`
    ).all(normalizedId) as VendorRuleRow[];

    const correctionPatternRows = database.prepare(
      `SELECT * FROM correction_patterns WHERE vendor_id = ? ORDER BY confidence DESC`
    ).all(normalizedId) as CorrectionPatternRow[];

    const vendorRules: VendorRule[] = vendorRuleRows.map(this.rowToVendorRule);
    const correctionPatterns: CorrectionPattern[] = correctionPatternRows.map(this.rowToCorrectionPattern);

    console.log(`📚 Found ${vendorRules.length} rules, ${correctionPatterns.length} patterns`);

    this.addAudit('RECALL', {
      vendorId: normalizedId,
      rulesFound: vendorRules.length,
      patternsFound: correctionPatterns.length,
    });

    return { vendorRules, correctionPatterns };
  }

  // ==========================================================================
  // APPLY: Apply memories to process an invoice
  // ==========================================================================

  apply(
    invoice: Invoice,
    memories: MemoryRecallResult
  ): {
    processedInvoice: Invoice;
    proposedCorrections: ProposedCorrection[];
    confidenceScore: number;
  } {
    console.log(`🔧 Applying memories to invoice: ${invoice.invoiceId}`);

    // Deep clone invoice
    const processedInvoice: Invoice = JSON.parse(JSON.stringify(invoice));
    const proposedCorrections: ProposedCorrection[] = [];
    let totalConfidence = 0.5; // Base confidence

    // Apply vendor rules (field mappings)
    for (const rule of memories.vendorRules) {
      const sourceValue = invoice.extractedFields[rule.sourceRawField];
      const currentValue = (processedInvoice as any)[rule.targetField];

      if (sourceValue !== undefined && sourceValue !== null) {
        if (currentValue === undefined || currentValue === null) {
          // Apply the mapping
          (processedInvoice as any)[rule.targetField] = sourceValue;
          
          proposedCorrections.push({
            field: rule.targetField,
            currentValue: null,
            proposedValue: sourceValue,
            source: `VendorRule: ${rule.sourceRawField} → ${rule.targetField}`,
            confidence: rule.confidence,
          });

          totalConfidence += rule.confidence * 0.1;
          console.log(`  ✓ Applied: ${rule.sourceRawField} → ${rule.targetField} = ${sourceValue}`);

          // Increment usage count
          this.incrementRuleUsage(rule.id);
        }
      }
    }

    // Apply correction patterns
    for (const pattern of memories.correctionPatterns) {
      const result = this.applyCorrectionPattern(processedInvoice, pattern);
      if (result) {
        proposedCorrections.push(result);
        totalConfidence += pattern.confidence * 0.1;
        this.incrementPatternUsage(pattern.id);
      }
    }

    // Calculate final confidence based on completeness
    const completeness = this.calculateCompleteness(processedInvoice);
    const confidenceScore = Math.min(1, Math.max(0, (totalConfidence + completeness) / 2));

    this.addAudit('APPLY', {
      invoiceId: invoice.invoiceId,
      correctionsApplied: proposedCorrections.length,
      confidenceScore,
    });

    return { processedInvoice, proposedCorrections, confidenceScore };
  }

  // ==========================================================================
  // LEARN: Learn from human corrections
  // ==========================================================================

  learn(originalInvoice: Invoice, finalInvoice: Invoice): LearnResult {
    console.log(`📝 Learning from corrections for invoice: ${originalInvoice.invoiceId}`);

    const vendorId = this.normalizeVendorId(originalInvoice.vendor);
    const now = new Date().toISOString();
    const result: LearnResult = {
      newRules: [],
      updatedRules: [],
      newPatterns: [],
      updatedPatterns: [],
    };

    // Compare fields to find corrections
    const fieldsToCheck = [
      'serviceDate', 'invoiceDate', 'dueDate', 'totalAmount', 
      'netTotal', 'grossTotal', 'taxAmount', 'invoiceNumber'
    ];

    for (const field of fieldsToCheck) {
      const originalValue = (originalInvoice as any)[field];
      const finalValue = (finalInvoice as any)[field];

      // Skip if no change
      if (originalValue === finalValue) continue;
      if (finalValue === undefined || finalValue === null) continue;

      console.log(`  📌 Detected correction: ${field} = ${finalValue} (was: ${originalValue})`);

      // Try to find source field in extractedFields
      const sourceField = this.findSourceField(originalInvoice.extractedFields, finalValue);

      if (sourceField) {
        // Create or update vendor rule
        const ruleResult = this.upsertVendorRule(
          vendorId,
          originalInvoice.vendor,
          field,
          sourceField,
          now
        );

        if (ruleResult.isNew) {
          result.newRules.push(ruleResult.rule);
        } else {
          result.updatedRules.push(ruleResult.rule);
        }
      }

      // Check for mathematical patterns (VAT removal)
      if (typeof originalValue === 'number' && typeof finalValue === 'number') {
        const patternResult = this.detectMathPattern(
          vendorId,
          originalInvoice.vendor,
          field,
          originalValue,
          finalValue,
          originalInvoice,
          now
        );

        if (patternResult) {
          if (patternResult.isNew) {
            result.newPatterns.push(patternResult.pattern);
          } else {
            result.updatedPatterns.push(patternResult.pattern);
          }
        }
      }
    }

    // Log to database
    this.logToDatabase(originalInvoice.invoiceId, 'LEARN', {
      vendorId,
      newRules: result.newRules.length,
      updatedRules: result.updatedRules.length,
      newPatterns: result.newPatterns.length,
      updatedPatterns: result.updatedPatterns.length,
    });

    this.addAudit('LEARN', {
      invoiceId: originalInvoice.invoiceId,
      newRules: result.newRules.length,
      updatedRules: result.updatedRules.length,
    });

    console.log(`✅ Learning complete: ${result.newRules.length} new, ${result.updatedRules.length} updated`);

    return result;
  }

  // ==========================================================================
  // DECISION ENGINE
  // ==========================================================================

  makeDecision(
    invoice: Invoice,
    confidenceScore: number,
    proposedCorrections: ProposedCorrection[]
  ): { requiresHumanReview: boolean; reviewReasons: string[] } {
    const reasons: string[] = [];

    // Rule 1: Confidence threshold
    if (confidenceScore < 0.8) {
      reasons.push(`Confidence score (${(confidenceScore * 100).toFixed(1)}%) below 80% threshold`);
    }

    // Rule 2: Critical fields missing
    const criticalFields = ['invoiceDate', 'totalAmount', 'vendor'];
    for (const field of criticalFields) {
      const value = (invoice as any)[field];
      if (value === undefined || value === null || value === '') {
        reasons.push(`Critical field missing: ${field}`);
      }
    }

    // Rule 3: Large corrections on sensitive fields
    for (const correction of proposedCorrections) {
      if (['totalAmount', 'netTotal', 'grossTotal'].includes(correction.field)) {
        if (correction.confidence < 0.7) {
          reasons.push(`Low-confidence correction on sensitive field: ${correction.field}`);
        }
      }
    }

    const requiresHumanReview = reasons.length > 0;

    this.addAudit(requiresHumanReview ? 'HUMAN_CORRECTION' : 'AUTO_APPROVE', {
      confidenceScore,
      requiresHumanReview,
      reasons,
    });

    return { requiresHumanReview, reviewReasons: reasons };
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  private rowToVendorRule(row: VendorRuleRow): VendorRule {
    return {
      id: row.id,
      vendorId: row.vendor_id,
      vendorName: row.vendor_name ?? undefined,
      targetField: row.target_field,
      sourceRawField: row.source_raw_field,
      action: row.action as 'MAP' | 'DEFAULT',
      confidence: row.confidence,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      usageCount: row.usage_count,
    };
  }

  private rowToCorrectionPattern(row: CorrectionPatternRow): CorrectionPattern {
    return {
      id: row.id,
      vendorId: row.vendor_id,
      vendorName: row.vendor_name ?? undefined,
      field: row.field,
      patternType: row.pattern_type as 'MATH' | 'TEXT',
      correctionLogic: row.correction_logic,
      triggerCondition: row.trigger_condition ?? undefined,
      confidence: row.confidence,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      usageCount: row.usage_count,
    };
  }

  private applyCorrectionPattern(
    invoice: Invoice,
    pattern: CorrectionPattern
  ): ProposedCorrection | null {
    // Check trigger condition
    if (pattern.triggerCondition) {
      if (pattern.triggerCondition.includes("rawText.contains('MwSt. inkl')")) {
        if (!invoice.rawText?.includes('MwSt. inkl')) {
          return null;
        }
      }
    }

    if (pattern.patternType === 'MATH') {
      const grossTotal = invoice.grossTotal ?? invoice.totalAmount;
      if (!grossTotal) return null;

      let newValue: number | undefined;
      const originalValue = (invoice as any)[pattern.field];

      if (pattern.correctionLogic === 'REMOVE_VAT_19') {
        newValue = Math.round((grossTotal / 1.19) * 100) / 100;
      } else if (pattern.correctionLogic === 'REMOVE_VAT_7') {
        newValue = Math.round((grossTotal / 1.07) * 100) / 100;
      }

      if (newValue !== undefined && newValue !== originalValue) {
        (invoice as any)[pattern.field] = newValue;
        console.log(`  ✓ Applied pattern: ${pattern.field} = ${newValue} (${pattern.correctionLogic})`);

        return {
          field: pattern.field,
          currentValue: originalValue,
          proposedValue: newValue,
          source: `CorrectionPattern: ${pattern.correctionLogic}`,
          confidence: pattern.confidence,
        };
      }
    }

    return null;
  }

  private calculateCompleteness(invoice: Invoice): number {
    const fields = ['invoiceId', 'vendor', 'invoiceNumber', 'invoiceDate', 'serviceDate', 'totalAmount'];
    let filled = 0;
    for (const field of fields) {
      if ((invoice as any)[field] !== undefined && (invoice as any)[field] !== null) {
        filled++;
      }
    }
    return filled / fields.length;
  }

  private findSourceField(extractedFields: Record<string, any>, targetValue: any): string | null {
    for (const [key, value] of Object.entries(extractedFields)) {
      if (value === targetValue) return key;
      
      // Handle date format variations
      if (typeof value === 'string' && typeof targetValue === 'string') {
        if (this.datesMatch(value, targetValue)) return key;
      }
    }
    return null;
  }

  private datesMatch(a: string, b: string): boolean {
    const parseDate = (s: string): Date | null => {
      // ISO format
      let d = new Date(s);
      if (!isNaN(d.getTime())) return d;
      
      // German format DD.MM.YYYY
      const match = s.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
      if (match) {
        d = new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
        if (!isNaN(d.getTime())) return d;
      }
      return null;
    };

    const dateA = parseDate(a);
    const dateB = parseDate(b);
    return dateA !== null && dateB !== null && dateA.getTime() === dateB.getTime();
  }

  private upsertVendorRule(
    vendorId: string,
    vendorName: string,
    targetField: string,
    sourceField: string,
    now: string
  ): { rule: VendorRule; isNew: boolean } {
    const database = getDatabase();

    // Check for existing rule
    const existing = database.prepare(`
      SELECT * FROM vendor_rules 
      WHERE vendor_id = ? AND target_field = ? AND source_raw_field = ?
    `).get(vendorId, targetField, sourceField) as VendorRuleRow | undefined;

    if (existing) {
      // Update confidence (increase by 0.1, max 1.0)
      const newConfidence = Math.min(1, existing.confidence + 0.1);
      database.prepare(`
        UPDATE vendor_rules 
        SET confidence = ?, updated_at = ?, usage_count = usage_count + 1
        WHERE id = ?
      `).run(newConfidence, now, existing.id);

      console.log(`  📈 Updated rule confidence: ${existing.id} → ${(newConfidence * 100).toFixed(0)}%`);

      return {
        rule: this.rowToVendorRule({ ...existing, confidence: newConfidence, updated_at: now }),
        isNew: false,
      };
    }

    // Create new rule
    const id = uuidv4();
    database.prepare(`
      INSERT INTO vendor_rules 
      (id, vendor_id, vendor_name, target_field, source_raw_field, action, confidence, created_at, updated_at, usage_count)
      VALUES (?, ?, ?, ?, ?, 'MAP', 0.5, ?, ?, 0)
    `).run(id, vendorId, vendorName, targetField, sourceField, now, now);

    console.log(`  ✨ Created new rule: ${sourceField} → ${targetField}`);

    return {
      rule: {
        id,
        vendorId,
        vendorName,
        targetField,
        sourceRawField: sourceField,
        action: 'MAP',
        confidence: 0.5,
        createdAt: now,
        updatedAt: now,
        usageCount: 0,
      },
      isNew: true,
    };
  }

  private detectMathPattern(
    vendorId: string,
    vendorName: string,
    field: string,
    originalValue: number,
    finalValue: number,
    invoice: Invoice,
    now: string
  ): { pattern: CorrectionPattern; isNew: boolean } | null {
    // Check for VAT removal patterns
    let correctionLogic: string | null = null;
    let triggerCondition: string | undefined;

    // VAT 19%
    if (Math.abs(originalValue / 1.19 - finalValue) < 0.01) {
      correctionLogic = 'REMOVE_VAT_19';
      if (invoice.rawText?.includes('MwSt.')) {
        triggerCondition = "rawText.contains('MwSt. inkl')";
      }
    }

    // VAT 7%
    if (Math.abs(originalValue / 1.07 - finalValue) < 0.01) {
      correctionLogic = 'REMOVE_VAT_7';
    }

    if (!correctionLogic) return null;

    const database = getDatabase();

    // Check for existing pattern
    const existing = database.prepare(`
      SELECT * FROM correction_patterns 
      WHERE vendor_id = ? AND field = ? AND correction_logic = ?
    `).get(vendorId, field, correctionLogic) as CorrectionPatternRow | undefined;

    if (existing) {
      const newConfidence = Math.min(1, existing.confidence + 0.1);
      database.prepare(`
        UPDATE correction_patterns 
        SET confidence = ?, updated_at = ?
        WHERE id = ?
      `).run(newConfidence, now, existing.id);

      return {
        pattern: this.rowToCorrectionPattern({ ...existing, confidence: newConfidence }),
        isNew: false,
      };
    }

    // Create new pattern
    const id = uuidv4();
    database.prepare(`
      INSERT INTO correction_patterns 
      (id, vendor_id, vendor_name, field, pattern_type, correction_logic, trigger_condition, confidence, created_at, updated_at, usage_count)
      VALUES (?, ?, ?, ?, 'MATH', ?, ?, 0.5, ?, ?, 0)
    `).run(id, vendorId, vendorName, field, correctionLogic, triggerCondition ?? null, now, now);

    console.log(`  ✨ Created new pattern: ${field} = ${correctionLogic}`);

    return {
      pattern: {
        id,
        vendorId,
        vendorName,
        field,
        patternType: 'MATH',
        correctionLogic,
        triggerCondition,
        confidence: 0.5,
        createdAt: now,
        updatedAt: now,
        usageCount: 0,
      },
      isNew: true,
    };
  }

  private incrementRuleUsage(ruleId: string): void {
    const database = getDatabase();
    database.prepare(`UPDATE vendor_rules SET usage_count = usage_count + 1 WHERE id = ?`).run(ruleId);
  }

  private incrementPatternUsage(patternId: string): void {
    const database = getDatabase();
    database.prepare(`UPDATE correction_patterns SET usage_count = usage_count + 1 WHERE id = ?`).run(patternId);
  }
}

// Export singleton
export const memoryManager = new MemoryManager();

// ============================================================================
// DATABASE QUERY HELPERS (for API)
// ============================================================================

export function getAllRules(): VendorRule[] {
  const database = getDatabase();
  const rows = database.prepare(`SELECT * FROM vendor_rules ORDER BY confidence DESC`).all() as VendorRuleRow[];
  return rows.map(row => ({
    id: row.id,
    vendorId: row.vendor_id,
    vendorName: row.vendor_name ?? undefined,
    targetField: row.target_field,
    sourceRawField: row.source_raw_field,
    action: row.action as 'MAP' | 'DEFAULT',
    confidence: row.confidence,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    usageCount: row.usage_count,
  }));
}

export function getAllPatterns(): CorrectionPattern[] {
  const database = getDatabase();
  const rows = database.prepare(`SELECT * FROM correction_patterns ORDER BY confidence DESC`).all() as CorrectionPatternRow[];
  return rows.map(row => ({
    id: row.id,
    vendorId: row.vendor_id,
    vendorName: row.vendor_name ?? undefined,
    field: row.field,
    patternType: row.pattern_type as 'MATH' | 'TEXT',
    correctionLogic: row.correction_logic,
    triggerCondition: row.trigger_condition ?? undefined,
    confidence: row.confidence,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    usageCount: row.usage_count,
  }));
}

export function getStats(): { rules: number; patterns: number; logs: number } {
  const database = getDatabase();
  const rules = (database.prepare(`SELECT COUNT(*) as c FROM vendor_rules`).get() as { c: number }).c;
  const patterns = (database.prepare(`SELECT COUNT(*) as c FROM correction_patterns`).get() as { c: number }).c;
  const logs = (database.prepare(`SELECT COUNT(*) as c FROM audit_logs`).get() as { c: number }).c;
  return { rules, patterns, logs };
}
