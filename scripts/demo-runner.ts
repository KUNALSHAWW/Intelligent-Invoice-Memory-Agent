/**
 * 🎬 Intelligent Invoice Memory Agent - Demo Runner
 * 
 * This script runs an automated demonstration of the Invoice Memory Agent,
 * showcasing all key features: processing, learning, and auto-correction.
 * 
 * Usage: npx ts-node scripts/demo-runner.ts [--url <backend-url>]
 */

const API_BASE = process.argv.includes('--url') 
  ? process.argv[process.argv.indexOf('--url') + 1]
  : 'http://localhost:3000';

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgBlack: '\x1b[40m',
};

const c = colors;

// Helper functions
function print(msg: string) {
  console.log(msg);
}

function header(title: string) {
  const line = '═'.repeat(60);
  print(`\n${c.cyan}${line}${c.reset}`);
  print(`${c.bright}${c.cyan}  ${title}${c.reset}`);
  print(`${c.cyan}${line}${c.reset}\n`);
}

function subHeader(title: string) {
  print(`\n${c.yellow}▸ ${title}${c.reset}\n`);
}

function success(msg: string) {
  print(`${c.green}✓${c.reset} ${msg}`);
}

function info(msg: string) {
  print(`${c.blue}ℹ${c.reset} ${msg}`);
}

function warning(msg: string) {
  print(`${c.yellow}⚠${c.reset} ${msg}`);
}

function error(msg: string) {
  print(`${c.red}✗${c.reset} ${msg}`);
}

function json(obj: any, indent = 2) {
  print(`${c.dim}${JSON.stringify(obj, null, indent)}${c.reset}`);
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function typewriter(text: string, speed = 30) {
  for (const char of text) {
    process.stdout.write(char);
    await delay(speed);
  }
  print('');
}

// API functions
async function apiCall(endpoint: string, method = 'GET', body?: any) {
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);
  
  const response = await fetch(`${API_BASE}${endpoint}`, options);
  return response.json();
}

// Demo invoices
const demoInvoices = {
  supplierGmbh: {
    invoiceId: 'DEMO-001',
    vendor: 'Supplier GmbH',
    rawText: 'Rechnung Nr. DEMO-001\nLeistungsdatum: 2025-01-15\nBetrag: €1,250.00 inkl. MwSt.',
    extractedFields: {
      Leistungsdatum: '2025-01-15',
      Bruttobetrag: '1250.00',
      Rechnungsnummer: 'DEMO-001',
    },
    confidence: 0.75,
  },
  partsAg: {
    invoiceId: 'DEMO-002',
    vendor: 'Parts AG',
    rawText: 'Invoice DEMO-002\nDelivery: 2025-01-20\nTotal: €500.00',
    extractedFields: {
      DeliveryDate: '2025-01-20',
      TotalAmount: '500.00',
    },
    confidence: 0.65,
  },
  newVendor: {
    invoiceId: 'DEMO-003',
    vendor: 'New Tech Solutions',
    rawText: 'Invoice #DEMO-003\nService Date: 2025-01-25\nGrand Total: €2,000.00',
    extractedFields: {
      ServiceRenderedOn: '2025-01-25',
      GrandTotal: '2000.00',
      InvoiceNumber: 'DEMO-003',
    },
    confidence: 0.45,
  },
};

// Demo scenarios
async function demoHealthCheck() {
  header('🏥 STEP 1: Health Check');
  
  await typewriter('Checking backend connectivity...');
  await delay(500);
  
  try {
    const health = await apiCall('/health');
    success(`Backend is ${health.status.toUpperCase()}`);
    info(`Service: ${health.service}`);
    info(`Timestamp: ${health.timestamp}`);
    return true;
  } catch (e) {
    error(`Failed to connect to backend at ${API_BASE}`);
    error('Make sure the backend server is running!');
    return false;
  }
}

async function demoCurrentState() {
  header('📊 STEP 2: Current System State');
  
  await typewriter('Fetching current statistics...');
  await delay(300);
  
  const stats = await apiCall('/stats');
  print('');
  print(`  ${c.cyan}┌────────────────────────────┐${c.reset}`);
  print(`  ${c.cyan}│${c.reset}  📚 Rules:    ${c.bright}${String(stats.rules).padStart(10)}${c.reset}  ${c.cyan}│${c.reset}`);
  print(`  ${c.cyan}│${c.reset}  🔄 Patterns: ${c.bright}${String(stats.patterns).padStart(10)}${c.reset}  ${c.cyan}│${c.reset}`);
  print(`  ${c.cyan}│${c.reset}  📝 Logs:     ${c.bright}${String(stats.logs).padStart(10)}${c.reset}  ${c.cyan}│${c.reset}`);
  print(`  ${c.cyan}└────────────────────────────┘${c.reset}`);
  
  await delay(500);
  
  subHeader('Existing Vendor Rules');
  const rules = await apiCall('/rules');
  if (rules.length === 0) {
    info('No rules yet - the system will learn!');
  } else {
    for (const rule of rules.slice(0, 5)) {
      print(`  ${c.dim}•${c.reset} ${c.magenta}${rule.vendor}${c.reset}: ${rule.sourceField} → ${c.green}${rule.targetField}${c.reset} (${Math.round(rule.confidence * 100)}%)`);
    }
    if (rules.length > 5) {
      print(`  ${c.dim}... and ${rules.length - 5} more rules${c.reset}`);
    }
  }
}

async function demoProcessInvoice(name: string, invoice: typeof demoInvoices.supplierGmbh) {
  subHeader(`Processing Invoice: ${invoice.invoiceId} from ${invoice.vendor}`);
  
  print(`${c.dim}Input Invoice:${c.reset}`);
  json({
    invoiceId: invoice.invoiceId,
    vendor: invoice.vendor,
    confidence: invoice.confidence,
    extractedFields: invoice.extractedFields,
  });
  
  await delay(300);
  await typewriter('Processing...', 50);
  await delay(500);
  
  const result = await apiCall('/process', 'POST', { invoice });
  
  print('');
  
  // Show corrections
  if (result.proposedCorrections && result.proposedCorrections.length > 0) {
    success(`Applied ${result.proposedCorrections.length} correction(s):`);
    for (const correction of result.proposedCorrections) {
      print(`  ${c.yellow}↳${c.reset} ${correction.field}: ${c.dim}${correction.currentValue || 'null'}${c.reset} → ${c.green}${correction.proposedValue}${c.reset}`);
      print(`    ${c.dim}Source: ${correction.source}${c.reset}`);
    }
  } else {
    info('No corrections applied (no matching rules found)');
  }
  
  print('');
  
  // Show decision
  const confidence = Math.round(result.confidenceScore * 100);
  const bar = '█'.repeat(Math.floor(confidence / 5)) + '░'.repeat(20 - Math.floor(confidence / 5));
  
  print(`  Confidence: [${confidence >= 80 ? c.green : c.yellow}${bar}${c.reset}] ${confidence}%`);
  
  if (result.requiresHumanReview) {
    warning(`Decision: REQUIRES HUMAN REVIEW`);
    print(`  ${c.dim}Reasons: ${result.reviewReasons.join(', ')}${c.reset}`);
  } else {
    success(`Decision: AUTO-APPROVED ✓`);
  }
  
  return result;
}

async function demoLearning() {
  header('🧠 STEP 4: Teaching the Agent');
  
  await typewriter('Simulating human correction for a new vendor...');
  await delay(500);
  
  const invoice = demoInvoices.newVendor;
  
  // Process first to get original
  print(`\n${c.dim}Original Invoice from "${invoice.vendor}":${c.reset}`);
  json({
    vendor: invoice.vendor,
    extractedFields: invoice.extractedFields,
  });
  
  await delay(500);
  
  // Simulate human correction
  print(`\n${c.yellow}Human makes corrections:${c.reset}`);
  const correctedInvoice = {
    ...invoice,
    serviceDate: '2025-01-25',       // Learned from ServiceRenderedOn
    totalAmount: '2000.00',          // Learned from GrandTotal  
    invoiceNumber: 'DEMO-003',       // Learned from InvoiceNumber
  };
  
  print(`  ${c.cyan}ServiceRenderedOn${c.reset} → ${c.green}serviceDate${c.reset}: "2025-01-25"`);
  print(`  ${c.cyan}GrandTotal${c.reset} → ${c.green}totalAmount${c.reset}: "2000.00"`);
  print(`  ${c.cyan}InvoiceNumber${c.reset} → ${c.green}invoiceNumber${c.reset}: "DEMO-003"`);
  
  await delay(500);
  await typewriter('\nSubmitting corrections to learning engine...');
  
  const learnResult = await apiCall('/learn', 'POST', {
    invoiceId: invoice.invoiceId,
    originalInvoice: invoice,
    finalInvoice: correctedInvoice,
  });
  
  await delay(300);
  
  if (learnResult.success) {
    success('Learning complete!');
    
    const lr = learnResult.learnResult;
    if (lr.newRules.length > 0) {
      print(`\n  ${c.green}New rules created:${c.reset}`);
      for (const rule of lr.newRules) {
        print(`    • ${rule.sourceField} → ${rule.targetField}`);
      }
    }
    if (lr.updatedRules.length > 0) {
      print(`\n  ${c.blue}Rules updated:${c.reset}`);
      for (const rule of lr.updatedRules) {
        print(`    • ${rule.sourceField} → ${rule.targetField} (confidence: ${Math.round(rule.confidence * 100)}%)`);
      }
    }
  } else {
    warning('No new patterns to learn');
  }
}

async function demoAutoCorrection() {
  header('⚡ STEP 5: Auto-Correction in Action');
  
  await typewriter('Processing a new invoice from the same vendor...');
  await delay(500);
  
  // Create a new invoice from the vendor we just taught
  const newInvoice = {
    invoiceId: 'DEMO-004',
    vendor: 'New Tech Solutions',
    rawText: 'Invoice #DEMO-004\nService Date: 2025-02-01\nGrand Total: €3,500.00',
    extractedFields: {
      ServiceRenderedOn: '2025-02-01',
      GrandTotal: '3500.00',
      InvoiceNumber: 'DEMO-004',
    },
    confidence: 0.70,
  };
  
  print(`\n${c.dim}New Invoice (same vendor):${c.reset}`);
  json({
    vendor: newInvoice.vendor,
    extractedFields: newInvoice.extractedFields,
  });
  
  await delay(500);
  await typewriter('\nProcessing with learned rules...');
  await delay(500);
  
  const result = await apiCall('/process', 'POST', { invoice: newInvoice });
  
  print('');
  
  if (result.proposedCorrections && result.proposedCorrections.length > 0) {
    success(`🎉 Auto-applied ${result.proposedCorrections.length} learned correction(s)!`);
    for (const correction of result.proposedCorrections) {
      print(`  ${c.green}✓${c.reset} ${correction.field}: ${c.green}${correction.proposedValue}${c.reset}`);
      print(`    ${c.dim}(from learned rule: ${correction.source})${c.reset}`);
    }
  }
  
  const confidence = Math.round(result.confidenceScore * 100);
  print(`\n  Final Confidence: ${c.bright}${confidence}%${c.reset}`);
  
  if (!result.requiresHumanReview) {
    success('Invoice AUTO-APPROVED without human intervention! 🚀');
  }
}

async function demoFinalStats() {
  header('📈 FINAL: System Statistics');
  
  await delay(300);
  
  const stats = await apiCall('/stats');
  const rules = await apiCall('/rules');
  const patterns = await apiCall('/patterns');
  
  print(`\n  ${c.bright}${c.cyan}System Summary${c.reset}\n`);
  print(`  ┌─────────────────────────────────────────┐`);
  print(`  │  Total Rules:     ${c.green}${String(stats.rules).padStart(18)}${c.reset}  │`);
  print(`  │  Total Patterns:  ${c.green}${String(stats.patterns).padStart(18)}${c.reset}  │`);
  print(`  │  Audit Logs:      ${c.green}${String(stats.logs).padStart(18)}${c.reset}  │`);
  print(`  └─────────────────────────────────────────┘`);
  
  print(`\n  ${c.bright}Rules by Vendor:${c.reset}`);
  const vendorGroups: Record<string, number> = {};
  for (const rule of rules) {
    vendorGroups[rule.vendor] = (vendorGroups[rule.vendor] || 0) + 1;
  }
  for (const [vendor, count] of Object.entries(vendorGroups)) {
    print(`    ${c.magenta}${vendor}${c.reset}: ${count} rules`);
  }
}

async function runDemo() {
  console.clear();
  
  print(`${c.bgBlack}${c.bright}${c.cyan}`);
  print(`
  ╔═══════════════════════════════════════════════════════════════╗
  ║                                                               ║
  ║   🧠 INTELLIGENT INVOICE MEMORY AGENT                         ║
  ║                                                               ║
  ║      Interactive Demo Runner                                  ║
  ║                                                               ║
  ╚═══════════════════════════════════════════════════════════════╝
  `);
  print(`${c.reset}`);
  
  info(`Backend URL: ${API_BASE}`);
  print('');
  
  await delay(1000);
  
  // Step 1: Health check
  const healthy = await demoHealthCheck();
  if (!healthy) {
    print(`\n${c.red}Demo cannot continue without backend connection.${c.reset}`);
    print(`Start the backend with: ${c.cyan}npm start${c.reset}`);
    process.exit(1);
  }
  
  await delay(1000);
  
  // Step 2: Show current state
  await demoCurrentState();
  
  await delay(1000);
  
  // Step 3: Process invoices with existing rules
  header('📄 STEP 3: Processing Invoices');
  
  await typewriter('Processing invoices with existing learned rules...');
  
  await demoProcessInvoice('Supplier GmbH', demoInvoices.supplierGmbh);
  await delay(800);
  
  await demoProcessInvoice('Parts AG', demoInvoices.partsAg);
  await delay(800);
  
  // Step 4: Learning
  await demoLearning();
  
  await delay(1000);
  
  // Step 5: Auto-correction with learned rules
  await demoAutoCorrection();
  
  await delay(1000);
  
  // Final stats
  await demoFinalStats();
  
  // Finale
  header('🎬 Demo Complete!');
  
  print(`  ${c.bright}What you just saw:${c.reset}\n`);
  print(`  ${c.green}1.${c.reset} Health check - verified backend connectivity`);
  print(`  ${c.green}2.${c.reset} Current state - existing rules and patterns`);
  print(`  ${c.green}3.${c.reset} Invoice processing - auto-correction with rules`);
  print(`  ${c.green}4.${c.reset} Learning - human correction creates new rules`);
  print(`  ${c.green}5.${c.reset} Auto-correction - learned rules applied automatically`);
  
  print(`\n  ${c.cyan}Try the web interface:${c.reset}`);
  print(`  ${c.dim}https://intelligent-invoice-memory-agent.vercel.app/${c.reset}`);
  
  print(`\n  ${c.bright}Thank you for watching! ⭐${c.reset}\n`);
}

// Run the demo
runDemo().catch(console.error);
