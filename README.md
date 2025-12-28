# 🧠 Intelligent Invoice Memory Agent

A production-ready **Learned Memory System** for invoice processing. The system processes invoices, "remembers" user corrections, and auto-applies them to future invoices from the same vendor.

## 🎯 Features

- **Memory Recall**: Fetches vendor-specific rules (e.g., "Supplier A always forgets Service Date")
- **Auto-Correction**: Applies learned mappings to normalize invoice fields
- **Learning Engine**: Learns from human corrections to improve future processing
- **Decision Engine**: Auto-approves if confidence > 80%, otherwise flags for review
- **Persistent Storage**: SQLite database with Render disk persistence
- **REST API**: Full-featured Express.js API with CORS enabled

## 📁 Project Structure

```
/src
  types.ts      # Zod schemas for Invoice, VendorRule, CorrectionPattern
  memory.ts     # MemoryManager: recall(), learn(), makeDecision()
  server.ts     # Express server with API endpoints
  seed.ts       # Database seeding script
  demo.ts       # Demo script (optional)
Dockerfile      # Docker config for Render
render.yaml     # Render Blueprint configuration
package.json
```

## 🚀 Quick Start (Local Development)

```bash
# Install dependencies
npm install

# Seed the database with demo data
npm run seed

# Start development server (with hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The server runs on `http://localhost:3000` by default.

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check (returns 200 OK) |
| `POST` | `/process` | Process an invoice |
| `POST` | `/learn` | Learn from corrections |
| `GET` | `/rules` | Get all vendor rules |
| `GET` | `/patterns` | Get all correction patterns |
| `GET` | `/stats` | Get database statistics |
| `POST` | `/reset` | Reset database |

### POST /process

Process an invoice through the memory system.

**Request:**
```json
{
  "invoice": {
    "invoiceId": "INV-001",
    "vendor": "Supplier GmbH",
    "invoiceNumber": "SG-2024-001",
    "invoiceDate": "2024-01-15",
    "totalAmount": 1190.00,
    "currency": "EUR",
    "extractedFields": {
      "Leistungsdatum": "2024-01-01",
      "Rechnungsnummer": "SG-2024-001"
    },
    "rawText": "Invoice text..."
  }
}
```

**Response:**
```json
{
  "originalInvoice": { ... },
  "processedInvoice": { ... },
  "proposedCorrections": [
    {
      "field": "serviceDate",
      "currentValue": null,
      "proposedValue": "2024-01-01",
      "source": "VendorRule: Leistungsdatum → serviceDate",
      "confidence": 0.7
    }
  ],
  "confidenceScore": 0.85,
  "requiresHumanReview": false,
  "reviewReasons": [],
  "auditTrail": [ ... ],
  "processingTimestamp": "2024-01-15T10:30:00.000Z"
}
```

### POST /learn

Learn from human corrections.

**Request:**
```json
{
  "invoiceId": "INV-001",
  "originalInvoice": {
    "invoiceId": "INV-001",
    "vendor": "Supplier GmbH",
    "extractedFields": {
      "Leistungsdatum": "2024-01-01"
    }
  },
  "finalInvoice": {
    "invoiceId": "INV-001",
    "vendor": "Supplier GmbH",
    "serviceDate": "2024-01-01",
    "extractedFields": {
      "Leistungsdatum": "2024-01-01"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "invoiceId": "INV-001",
  "learnResult": {
    "newRules": [ ... ],
    "updatedRules": [ ... ],
    "newPatterns": [ ... ],
    "updatedPatterns": [ ... ]
  },
  "auditTrail": [ ... ]
}
```

## 🔧 Business Logic

### Vendor Rules (Field Mappings)

| Vendor | Raw Field | Maps To |
|--------|-----------|---------|
| Supplier GmbH | `Leistungsdatum` | `serviceDate` |
| Supplier GmbH | `Rechnungsnummer` | `invoiceNumber` |

### Correction Patterns

| Vendor | Pattern | Trigger |
|--------|---------|---------|
| Parts AG | Remove 19% VAT from `netTotal` | `rawText` contains "MwSt. inkl" |

### Decision Rules

| Condition | Action |
|-----------|--------|
| `confidence > 0.8` AND no critical fields missing | ✅ Auto-Approve |
| Critical field missing (`invoiceDate`, `totalAmount`, `vendor`) | ⚠️ Human Review |
| Low-confidence correction on sensitive field | ⚠️ Human Review |

## 🐳 Deploy to Render

### Option 1: Using render.yaml Blueprint

1. Push this repository to GitHub/GitLab
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click **New** → **Blueprint**
4. Connect your repository
5. Render will detect `render.yaml` and configure automatically

### Option 2: Manual Setup

1. **Create Web Service**
   - Go to Render Dashboard → **New** → **Web Service**
   - Connect your GitHub/GitLab repo
   - Select **Docker** as Environment
   - Render auto-detects the Dockerfile

2. **Set Environment Variables**
   ```
   NODE_ENV = production
   DB_PATH = /data/memory.db
   ```

3. **⚠️ IMPORTANT: Add Persistent Disk**
   - Go to your service → **Disks** tab
   - Click **Add Disk**
   - Name: `invoice-memory-data`
   - Mount Path: `/data`
   - Size: `1 GB`
   - Click **Save**

4. **Redeploy** the service

The SQLite database will now persist across deployments!

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port (Render sets this automatically) |
| `DB_PATH` | `./data/memory.db` | SQLite database file path |
| `NODE_ENV` | `development` | Environment mode |

## 🧪 Testing with cURL

```bash
# Health check
curl http://localhost:3000/health

# Process an invoice
curl -X POST http://localhost:3000/process \
  -H "Content-Type: application/json" \
  -d '{
    "invoice": {
      "invoiceId": "INV-TEST-001",
      "vendor": "Supplier GmbH",
      "totalAmount": 1190,
      "currency": "EUR",
      "extractedFields": {
        "Leistungsdatum": "2024-01-01"
      }
    }
  }'

# Learn from corrections
curl -X POST http://localhost:3000/learn \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceId": "INV-TEST-001",
    "originalInvoice": {
      "invoiceId": "INV-TEST-001",
      "vendor": "Supplier GmbH",
      "extractedFields": { "Leistungsdatum": "2024-01-01" }
    },
    "finalInvoice": {
      "invoiceId": "INV-TEST-001",
      "vendor": "Supplier GmbH",
      "serviceDate": "2024-01-01",
      "extractedFields": { "Leistungsdatum": "2024-01-01" }
    }
  }'

# Get statistics
curl http://localhost:3000/stats
```

## 📊 CORS Configuration

CORS is enabled for all origins to allow the Vercel frontend to communicate with this backend. The server accepts requests from any domain.

## 📜 License

MIT License

---

Built with ❤️ for intelligent invoice processing
