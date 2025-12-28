import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { ZodError } from 'zod';
import {
  ProcessRequestSchema,
  LearnRequestSchema,
  ProcessingResult,
} from './types.js';
import {
  memoryManager,
  closeDatabase,
  getAllRules,
  getAllPatterns,
  getStats,
  resetDatabase,
} from './memory.js';

// ============================================================================
// EXPRESS APP SETUP
// ============================================================================

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors()); // Enable CORS for all origins

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`📥 ${new Date().toISOString()} | ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// API ROUTES
// ============================================================================

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Intelligent Invoice Memory Agent',
  });
});

/**
 * GET /
 * API documentation
 */
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Intelligent Invoice Memory Agent',
    version: '1.0.0',
    endpoints: {
      'GET /health': 'Health check',
      'POST /process': 'Process an invoice',
      'POST /learn': 'Learn from corrections',
      'GET /rules': 'Get all vendor rules',
      'GET /patterns': 'Get all correction patterns',
      'GET /stats': 'Get database statistics',
      'POST /reset': 'Reset database (development only)',
    },
  });
});

/**
 * POST /process
 * Process an invoice through the memory system
 * Returns: proposedCorrections, confidenceScore, auditTrail
 */
app.post('/process', (req: Request, res: Response) => {
  try {
    // Validate request
    const { invoice } = ProcessRequestSchema.parse(req.body);

    console.log(`\n${'='.repeat(50)}`);
    console.log(`🧠 Processing Invoice: ${invoice.invoiceId}`);
    console.log(`${'='.repeat(50)}`);

    // Step 1: Recall memories for this vendor
    const memories = memoryManager.recall(invoice.vendor);

    // Step 2: Apply memories to process the invoice
    const { processedInvoice, proposedCorrections, confidenceScore } = 
      memoryManager.apply(invoice, memories);

    // Step 3: Make decision (auto-approve or human review)
    const { requiresHumanReview, reviewReasons } = 
      memoryManager.makeDecision(processedInvoice, confidenceScore, proposedCorrections);

    // Get audit trail
    const auditTrail = memoryManager.getAndClearAuditTrail();

    // Build response
    const result: ProcessingResult = {
      originalInvoice: invoice,
      processedInvoice,
      proposedCorrections,
      confidenceScore: Math.round(confidenceScore * 100) / 100,
      requiresHumanReview,
      reviewReasons,
      auditTrail,
      processingTimestamp: new Date().toISOString(),
    };

    // Log summary
    console.log(`\n📊 Result Summary:`);
    console.log(`   Confidence: ${(confidenceScore * 100).toFixed(1)}%`);
    console.log(`   Human Review: ${requiresHumanReview ? 'REQUIRED' : 'NOT REQUIRED'}`);
    console.log(`   Corrections: ${proposedCorrections.length}`);
    console.log(`${'='.repeat(50)}\n`);

    res.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        error: 'Validation Error',
        details: error.errors,
      });
      return;
    }
    console.error('Error processing invoice:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /learn
 * Learn from human corrections
 * Input: { invoiceId, originalInvoice, finalInvoice }
 */
app.post('/learn', (req: Request, res: Response) => {
  try {
    // Validate request
    const { invoiceId, originalInvoice, finalInvoice } = LearnRequestSchema.parse(req.body);

    console.log(`\n${'='.repeat(50)}`);
    console.log(`📚 Learning from Invoice: ${invoiceId}`);
    console.log(`${'='.repeat(50)}`);

    // Learn from the corrections
    const learnResult = memoryManager.learn(originalInvoice, finalInvoice);

    // Get audit trail
    const auditTrail = memoryManager.getAndClearAuditTrail();

    console.log(`\n📊 Learning Summary:`);
    console.log(`   New Rules: ${learnResult.newRules.length}`);
    console.log(`   Updated Rules: ${learnResult.updatedRules.length}`);
    console.log(`   New Patterns: ${learnResult.newPatterns.length}`);
    console.log(`   Updated Patterns: ${learnResult.updatedPatterns.length}`);
    console.log(`${'='.repeat(50)}\n`);

    res.json({
      success: true,
      invoiceId,
      learnResult,
      auditTrail,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        error: 'Validation Error',
        details: error.errors,
      });
      return;
    }
    console.error('Error learning:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /rules
 * Get all vendor rules
 */
app.get('/rules', (req: Request, res: Response) => {
  try {
    const rules = getAllRules();
    res.json({ rules, count: rules.length });
  } catch (error) {
    console.error('Error fetching rules:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * GET /patterns
 * Get all correction patterns
 */
app.get('/patterns', (req: Request, res: Response) => {
  try {
    const patterns = getAllPatterns();
    res.json({ patterns, count: patterns.length });
  } catch (error) {
    console.error('Error fetching patterns:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * GET /stats
 * Get database statistics
 */
app.get('/stats', (req: Request, res: Response) => {
  try {
    const stats = getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * POST /reset
 * Reset database (development only)
 */
app.post('/reset', (req: Request, res: Response) => {
  try {
    resetDatabase();
    res.json({ success: true, message: 'Database reset complete' });
  } catch (error) {
    console.error('Error resetting database:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Endpoint ${req.method} ${req.path} not found`,
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

const server = app.listen(PORT, () => {
  console.log(`
${'='.repeat(60)}
🧠 INTELLIGENT INVOICE MEMORY AGENT
${'='.repeat(60)}
✅ Server running on port ${PORT}
📍 Local:   http://localhost:${PORT}
📍 Health:  http://localhost:${PORT}/health
📍 Process: POST http://localhost:${PORT}/process
📍 Learn:   POST http://localhost:${PORT}/learn
${'='.repeat(60)}
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  server.close(() => {
    closeDatabase();
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM...');
  server.close(() => {
    closeDatabase();
    process.exit(0);
  });
});

export default app;
