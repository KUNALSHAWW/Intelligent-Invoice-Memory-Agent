/**
 * Intelligent Invoice Memory Agent - Demo Script
 * 
 * This script demonstrates the complete flow of the invoice memory system:
 * 1. Initialize with fresh database
 * 2. Process an invoice that needs human review
 * 3. Human provides corrections
 * 4. System learns from corrections
 * 5. Process similar invoice - system auto-applies learned corrections
 * 
 * Run with: npm run demo
 */

import { Invoice } from './types.js';
import { 
  MemoryManager, 
  resetDatabase, 
  closeDatabase,
  getStats,
  getAllRules,
  getAllPatterns,
} from './memory.js';

// ============================================================================
// DEMO HELPER FUNCTIONS
// ============================================================================

function printHeader(title: string): void {
  console.log('\n' + '═'.repeat(70));
  console.log(`  ${title}`);
  console.log('═'.repeat(70));
}

function printSubHeader(title: string): void {
  console.log('\n' + '─'.repeat(50));
  console.log(`  ${title}`);
  console.log('─'.repeat(50));
}

function printInvoice(invoice: Invoice): void {
  console.log('\n📄 Invoice Details:');
  console.log(`   ID:           ${invoice.invoiceId}`);
  console.log(`   Vendor:       ${invoice.vendor}`);
  console.log(`   Number:       ${invoice.invoiceNumber ?? '(not set)'}`);
  console.log(`   Date:         ${invoice.invoiceDate ?? '(not set)'}`);
  console.log(`   Service Date: ${invoice.serviceDate ?? '(not set)'}`);
  console.log(`   Total:        ${invoice.totalAmount} ${invoice.currency}`);
  
  if (Object.keys(invoice.extractedFields).length > 0) {
    console.log('\n   📝 Extracted Fields (Raw OCR):');
    for (const [key, value] of Object.entries(invoice.extractedFields)) {
      console.log(`      ${key}: ${value}`);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// MAIN DEMO FUNCTION
// ============================================================================

async function runDemo(): Promise<void> {
  const memoryManager = new MemoryManager();

  printHeader('🧠 INTELLIGENT INVOICE MEMORY AGENT - DEMO');
  console.log('\nThis demo shows how the system learns from human corrections');
  console.log('and applies that knowledge to future invoices.\n');

  // ========================================================================
  // STEP 1: Initialize Database
  // ========================================================================
  printSubHeader('STEP 1: Initialize Fresh Database');
  
  console.log('\n🔄 Resetting database to clean state...');
  resetDatabase();
  
  const initialStats = getStats();
  console.log('✅ Database initialized');
  console.log(`   Vendor Rules: ${initialStats.rules}`);
  console.log(`   Correction Patterns: ${initialStats.patterns}`);
  
  await sleep(500);

  // ========================================================================
  // STEP 2: Process First Invoice (Supplier GmbH) - INV-A-001
  // ========================================================================
  printSubHeader('STEP 2: Process Invoice INV-A-001 (Supplier GmbH)');
  
  console.log('\n📤 Simulating OCR extraction from German invoice...');
  console.log('   Note: The OCR extracted "Leistungsdatum" (German for service date)');
  console.log('   but the system doesn\'t know how to map it yet.\n');

  const invoice1: Invoice = {
    invoiceId: 'INV-A-001',
    vendor: 'Supplier GmbH',
    vendorId: 'supplier_gmbh',
    invoiceNumber: 'SG-2024-001',
    invoiceDate: '2024-01-15',
    totalAmount: 1190.00,
    currency: 'EUR',
    lineItems: [
      { description: 'Consulting Services Q1 2024', quantity: 10, unitPrice: 100.00, totalPrice: 1000.00, taxRate: 19 }
    ],
    extractedFields: {
      'Leistungsdatum': '2024-01-01',
      'Rechnungsnummer': 'SG-2024-001',
    },
    rawText: 'Rechnung\nSupplier GmbH\nLeistungsdatum: 01.01.2024\nRechnungsnummer: SG-2024-001',
  };

  printInvoice(invoice1);
  
  console.log('\n🔍 Processing invoice through memory system...');
  const memories1 = memoryManager.recall(invoice1.vendor);
  const result1 = memoryManager.apply(invoice1, memories1);
  const decision1 = memoryManager.makeDecision(result1.processedInvoice, result1.confidenceScore, result1.proposedCorrections);

  console.log('\n📊 Processing Result:');
  console.log(`   Confidence Score:      ${(result1.confidenceScore * 100).toFixed(1)}%`);
  console.log(`   Requires Human Review: ${decision1.requiresHumanReview ? '✗ YES' : '✓ NO'}`);
  console.log(`   Applied Corrections:   ${result1.proposedCorrections.length}`);
  console.log(`   Service Date:          ${result1.processedInvoice.serviceDate ?? '(still not set)'}`);
  
  if (decision1.reviewReasons.length > 0) {
    console.log('\n   ⚠️  Review Reasons:');
    for (const reason of decision1.reviewReasons) {
      console.log(`      • ${reason}`);
    }
  }

  console.log('\n💡 OBSERVATION: serviceDate is missing because the system');
  console.log('   doesn\'t know that "Leistungsdatum" should map to serviceDate.');

  await sleep(500);

  // ========================================================================
  // STEP 3: Human Provides Correction
  // ========================================================================
  printSubHeader('STEP 3: Human Reviews and Corrects Invoice');

  console.log('\n👤 Human reviewer sees:');
  console.log('   - serviceDate is missing');
  console.log('   - extractedFields has "Leistungsdatum": "2024-01-01"');
  console.log('   - Human knows Leistungsdatum means "service date" in German');
  console.log('\n📝 Human submits correction: { serviceDate: "2024-01-01" }');

  const finalInvoice1: Invoice = {
    ...invoice1,
    serviceDate: '2024-01-01',
  };

  const learnResult1 = memoryManager.learn(invoice1, finalInvoice1);

  console.log('\n✅ System learned the mapping!');
  console.log(`   New Rules Created: ${learnResult1.newRules.length}`);

  const rulesAfterStep3 = getAllRules();
  console.log(`\n📚 Memories in database: ${rulesAfterStep3.length} vendor rule(s)`);
  for (const rule of rulesAfterStep3) {
    console.log(`   • ${rule.sourceRawField} → ${rule.targetField} (confidence: ${(rule.confidence * 100).toFixed(0)}%)`);
  }

  await sleep(500);

  // ========================================================================
  // STEP 4: Process Second Invoice from Same Vendor
  // ========================================================================
  printSubHeader('STEP 4: Process Invoice INV-A-002 (Same Vendor)');

  console.log('\n📤 New invoice from Supplier GmbH arrives...');
  console.log('   This invoice also has "Leistungsdatum" in extractedFields.');
  console.log('   Let\'s see if the system auto-fills serviceDate!\n');

  const invoice2: Invoice = {
    invoiceId: 'INV-A-002',
    vendor: 'Supplier GmbH',
    vendorId: 'supplier_gmbh',
    invoiceNumber: 'SG-2024-002',
    invoiceDate: '2024-02-15',
    totalAmount: 2380.00,
    currency: 'EUR',
    lineItems: [
      { description: 'Development Services', quantity: 20, unitPrice: 100.00, totalPrice: 2000.00, taxRate: 19 }
    ],
    extractedFields: {
      'Leistungsdatum': '2024-02-01',
      'Rechnungsnummer': 'SG-2024-002',
    },
    rawText: 'Rechnung\nSupplier GmbH\nLeistungsdatum: 01.02.2024',
  };

  printInvoice(invoice2);
  
  console.log('\n🔍 Processing invoice through memory system...');
  const memories2 = memoryManager.recall(invoice2.vendor);
  const result2 = memoryManager.apply(invoice2, memories2);
  const decision2 = memoryManager.makeDecision(result2.processedInvoice, result2.confidenceScore, result2.proposedCorrections);

  console.log('\n📊 Processing Result:');
  console.log(`   Confidence Score:      ${(result2.confidenceScore * 100).toFixed(1)}%`);
  console.log(`   Requires Human Review: ${decision2.requiresHumanReview ? '✗ YES' : '✓ NO'}`);
  console.log(`   Applied Corrections:   ${result2.proposedCorrections.length}`);

  console.log('\n🎉 SERVICE DATE AUTO-FILLED!');
  console.log(`   Original:  ${invoice2.serviceDate ?? '(not set)'}`);
  console.log(`   After:     ${result2.processedInvoice.serviceDate}`);

  if (result2.proposedCorrections.length > 0) {
    console.log('\n   📝 Applied Corrections:');
    for (const correction of result2.proposedCorrections) {
      console.log(`      • ${correction.field}: ${correction.currentValue ?? 'null'} → ${correction.proposedValue}`);
      console.log(`        Source: ${correction.source}`);
    }
  }

  await sleep(500);

  // ========================================================================
  // STEP 5: Process Parts AG Invoice (VAT Calculation)
  // ========================================================================
  printSubHeader('STEP 5: Process Invoice from Parts AG (VAT Scenario)');

  console.log('\n📤 Invoice from Parts AG with "MwSt. inkl" (VAT included)...');
  console.log('   The grossTotal needs to be converted to netTotal.\n');

  const invoice3: Invoice = {
    invoiceId: 'INV-B-001',
    vendor: 'Parts AG',
    vendorId: 'parts_ag',
    invoiceNumber: 'PA-2024-001',
    invoiceDate: '2024-01-20',
    grossTotal: 1190.00,
    totalAmount: 1190.00,
    currency: 'EUR',
    lineItems: [
      { description: 'Spare Parts', quantity: 5, unitPrice: 200.00, totalPrice: 1000.00, taxRate: 19 }
    ],
    extractedFields: {
      'Gesamtbetrag': '1.190,00 EUR',
    },
    rawText: 'Rechnung Parts AG\nGesamtbetrag: 1.190,00 EUR (MwSt. inkl.)',
  };

  printInvoice(invoice3);

  console.log('\n🔍 Processing invoice through memory system...');
  const memories3 = memoryManager.recall(invoice3.vendor);
  const result3 = memoryManager.apply(invoice3, memories3);
  const decision3 = memoryManager.makeDecision(result3.processedInvoice, result3.confidenceScore, result3.proposedCorrections);

  console.log('\n📊 Processing Result:');
  console.log(`   Confidence Score:      ${(result3.confidenceScore * 100).toFixed(1)}%`);
  console.log(`   Requires Human Review: ${decision3.requiresHumanReview ? '✗ YES' : '✓ NO'}`);

  // Human corrects the netTotal
  printSubHeader('STEP 6: Human Corrects Net Total (VAT Removal)');

  const netTotal = Math.round((1190.00 / 1.19) * 100) / 100;
  console.log(`\n👤 Human calculates: netTotal = 1190 / 1.19 = ${netTotal} EUR`);
  console.log(`📝 Human submits correction: { netTotal: ${netTotal} }`);

  const finalInvoice3: Invoice = {
    ...invoice3,
    netTotal: netTotal,
  };

  const learnResult3 = memoryManager.learn(invoice3, finalInvoice3);
  console.log(`\n✅ System learned VAT pattern!`);
  console.log(`   New Patterns: ${learnResult3.newPatterns.length}`);

  // ========================================================================
  // FINAL SUMMARY
  // ========================================================================
  printHeader('📊 DEMO COMPLETE - FINAL STATISTICS');

  const finalStats = getStats();
  const allRules = getAllRules();
  const allPatterns = getAllPatterns();

  console.log('\n📚 Memory Database Contents:');
  console.log(`   Vendor Rules:        ${finalStats.rules}`);
  console.log(`   Correction Patterns: ${finalStats.patterns}`);
  console.log(`   Audit Logs:          ${finalStats.logs}`);

  if (allRules.length > 0) {
    console.log('\n📋 Vendor Rules:');
    for (const rule of allRules) {
      console.log(`   • [${rule.vendorId}] ${rule.sourceRawField} → ${rule.targetField} (${(rule.confidence * 100).toFixed(0)}%)`);
    }
  }

  if (allPatterns.length > 0) {
    console.log('\n📋 Correction Patterns:');
    for (const pattern of allPatterns) {
      console.log(`   • [${pattern.vendorId}] ${pattern.field}: ${pattern.correctionLogic} (${(pattern.confidence * 100).toFixed(0)}%)`);
    }
  }

  console.log('\n' + '═'.repeat(70));
  console.log('  ✅ DEMO COMPLETED SUCCESSFULLY!');
  console.log('');
  console.log('  Key Takeaways:');
  console.log('  1. System starts with no knowledge');
  console.log('  2. Human corrections teach the system vendor-specific mappings');
  console.log('  3. Future invoices from same vendor get auto-corrections');
  console.log('  4. Confidence increases with each successful correction');
  console.log('═'.repeat(70));
  console.log('');

  closeDatabase();
}

// ============================================================================
// RUN DEMO
// ============================================================================

runDemo().catch((error) => {
  console.error('\n❌ Demo failed with error:', error);
  closeDatabase();
  process.exit(1);
});
