/**
 * Seed Script for Intelligent Invoice Memory Agent
 * 
 * This script wipes the database and optionally inserts demo data.
 * Run with: npm run seed
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  getDatabase, 
  resetDatabase, 
  closeDatabase,
  getStats,
} from './memory.js';

console.log(`
${'='.repeat(60)}
🌱 SEED SCRIPT - Intelligent Invoice Memory Agent
${'='.repeat(60)}
`);

// Reset database (wipe all tables)
console.log('🗑️  Wiping database...');
resetDatabase();

// Insert demo vendor rules
console.log('📝 Inserting demo data...\n');

const db = getDatabase();
const now = new Date().toISOString();

// Demo Rule 1: Supplier GmbH - Leistungsdatum mapping
const rule1Id = uuidv4();
db.prepare(`
  INSERT INTO vendor_rules 
  (id, vendor_id, vendor_name, target_field, source_raw_field, action, confidence, created_at, updated_at, usage_count)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  rule1Id,
  'supplier_gmbh',
  'Supplier GmbH',
  'serviceDate',
  'Leistungsdatum',
  'MAP',
  0.7,
  now,
  now,
  5
);
console.log('✅ Rule 1: Supplier GmbH - "Leistungsdatum" → "serviceDate"');

// Demo Rule 2: Supplier GmbH - Rechnungsnummer mapping
const rule2Id = uuidv4();
db.prepare(`
  INSERT INTO vendor_rules 
  (id, vendor_id, vendor_name, target_field, source_raw_field, action, confidence, created_at, updated_at, usage_count)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  rule2Id,
  'supplier_gmbh',
  'Supplier GmbH',
  'invoiceNumber',
  'Rechnungsnummer',
  'MAP',
  0.8,
  now,
  now,
  10
);
console.log('✅ Rule 2: Supplier GmbH - "Rechnungsnummer" → "invoiceNumber"');

// Demo Pattern 1: Parts AG - VAT removal
const pattern1Id = uuidv4();
db.prepare(`
  INSERT INTO correction_patterns 
  (id, vendor_id, vendor_name, field, pattern_type, correction_logic, trigger_condition, confidence, created_at, updated_at, usage_count)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  pattern1Id,
  'parts_ag',
  'Parts AG',
  'netTotal',
  'MATH',
  'REMOVE_VAT_19',
  "rawText.contains('MwSt. inkl')",
  0.75,
  now,
  now,
  3
);
console.log('✅ Pattern 1: Parts AG - VAT removal on "MwSt. inkl" trigger');

// Add some audit logs for demo
const auditIds = [uuidv4(), uuidv4(), uuidv4()];
const auditData = [
  { invoiceId: 'INV-DEMO-001', action: 'RECALL', details: { vendorId: 'supplier_gmbh', rulesFound: 2 } },
  { invoiceId: 'INV-DEMO-001', action: 'APPLY', details: { correctionsApplied: 1, confidenceScore: 0.85 } },
  { invoiceId: 'INV-DEMO-001', action: 'AUTO_APPROVE', details: { approved: true } },
];

for (let i = 0; i < auditIds.length; i++) {
  db.prepare(`
    INSERT INTO audit_logs (id, invoice_id, action, details, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `).run(auditIds[i], auditData[i].invoiceId, auditData[i].action, JSON.stringify(auditData[i].details), now);
}
console.log('✅ Added 3 demo audit log entries');

// Print summary
const stats = getStats();
console.log(`
${'─'.repeat(40)}
📊 Seed Summary:
   Vendor Rules:       ${stats.rules}
   Correction Patterns: ${stats.patterns}
   Audit Logs:         ${stats.logs}
${'─'.repeat(40)}
`);

// Close database
closeDatabase();

console.log(`
${'='.repeat(60)}
✅ SEED COMPLETE
${'='.repeat(60)}

Demo data includes:
• Supplier GmbH: Maps "Leistungsdatum" to serviceDate
• Supplier GmbH: Maps "Rechnungsnummer" to invoiceNumber  
• Parts AG: Removes 19% VAT when "MwSt. inkl" detected

Run the server with: npm run dev
`);
