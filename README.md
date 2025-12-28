<div align="center">

#  Intelligent Invoice Memory Agent

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen?style=for-the-badge)](https://intelligent-invoice-memory-agent.vercel.app/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js%2014-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**An AI-powered invoice processing system that learns from human corrections and automatically applies them to future invoices.**

[Live Demo](https://intelligent-invoice-memory-agent.vercel.app/)  [Report Bug](https://github.com/KUNALSHAWW/Intelligent-Invoice-Memory-Agent/issues)  [Request Feature](https://github.com/KUNALSHAWW/Intelligent-Invoice-Memory-Agent/issues)

</div>

---

##  Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [API Reference](#-api-reference)
- [Frontend Pages](#-frontend-pages)
- [How It Works](#-how-it-works)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [License](#-license)

---

##  Overview

The **Intelligent Invoice Memory Agent** is a production-ready system designed to streamline invoice processing through machine learning from human feedback. Instead of requiring complex ML model training, the system uses a **memory-based approach** that learns incrementally from user corrections.

### The Problem
- Invoice processing is repetitive and error-prone
- Different vendors have different invoice formats
- Manual corrections are made repeatedly for the same vendor patterns
- No learning from past corrections

### The Solution
- **Memory-based learning**: System remembers corrections per vendor
- **Auto-correction**: Applies learned patterns automatically
- **Confidence scoring**: Routes low-confidence invoices for human review
- **Continuous improvement**: Gets smarter with each correction

---

##  Key Features

| Feature | Description |
|---------|-------------|
|  **Memory Recall** | Fetches vendor-specific rules (e.g., "Supplier A always has Leistungsdatum  serviceDate") |
|  **Auto-Correction** | Automatically applies learned field mappings to normalize invoice data |
|  **Learning Engine** | Learns from human corrections and stores patterns for future use |
|  **Decision Engine** | Auto-approves invoices with >80% confidence, flags others for review |
|  **Modern UI** | Sleek "Monochrome Luxury" interface with real-time processing animations |
|  **Audit Trail** | Complete logging of all processing decisions and corrections |
|  **Persistent Storage** | SQLite database with disk persistence for production reliability |
|  **REST API** | Full-featured Express.js API with CORS enabled for cross-origin requests |

---

##  System Architecture

```

                              FRONTEND (Vercel)                              
                          Next.js 14 + Tailwind CSS                          
       
    Dashboard      Invoice Processor           Rules Viewer            
    - Status       - JSON Input         - Vendor Rules                
    - Metrics      - Agent Mind         - Correction Patterns         
    - Rules        - Human Review       - Usage Statistics            
       
─
                                     
                                      HTTPS (REST API)
                                     

                              BACKEND (Render)                               
                           Express.js + TypeScript                           
    
                             Memory Manager                                
              
       recall()       apply()        learn()     makeDecision()    
     Fetch rules   Apply rules    Store new       Confidence      
     & patterns    to invoice     corrections     evaluation      
              
    
                                                                            
                                                                            
    
                          SQLite Database                                  
     vendor_rules    correction_patterns    audit_logs                  
    

```

---

##  Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js 18** | Runtime environment |
| **TypeScript** | Type-safe development |
| **Express.js** | REST API framework |
| **SQLite** | Embedded database |
| **better-sqlite3** | SQLite driver with sync API |
| **Zod** | Runtime schema validation |
| **CORS** | Cross-origin resource sharing |

### Frontend
| Technology | Purpose |
|------------|---------|
| **Next.js 14** | React framework with App Router |
| **TypeScript** | Type-safe development |
| **Tailwind CSS** | Utility-first styling |
| **Framer Motion** | Animations & transitions |
| **JetBrains Mono** | Monospace typography |

### Deployment
| Platform | Service |
|----------|---------|
| **Vercel** | Frontend hosting (SSR + Edge) |
| **Render** | Backend hosting + SQLite persistence |
| **Docker** | Containerization |

---

##  Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/KUNALSHAWW/Intelligent-Invoice-Memory-Agent.git
   cd Intelligent-Invoice-Memory-Agent
   ```

2. **Install Backend Dependencies**
   ```bash
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Build the Backend**
   ```bash
   npm run build
   ```

5. **Seed the Database (Optional)**
   ```bash
   npm run seed
   ```

6. **Start the Backend Server**
   ```bash
   npm start
   # Server runs on http://localhost:3000
   ```

7. **Start the Frontend (New Terminal)**
   ```bash
   cd frontend
   npm run dev
   # Frontend runs on http://localhost:3001
   ```

8. **Open in Browser**
   ```
   http://localhost:3001
   ```

---

##  API Reference

### Base URL
- **Local**: `http://localhost:3000`
- **Production**: Your Render URL

### Endpoints

#### Health Check
```http
GET /health
```
**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-28T12:00:00.000Z",
  "service": "Intelligent Invoice Memory Agent"
}
```

#### Process Invoice
```http
POST /process
Content-Type: application/json

{
  "invoice": {
    "invoiceId": "INV-001",
    "vendor": "Supplier GmbH",
    "rawText": "Invoice content...",
    "extractedFields": {
      "Leistungsdatum": "2024-01-15"
    },
    "confidence": 0.77
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
      "proposedValue": "2024-01-15",
      "source": "VendorRule: Leistungsdatum  serviceDate",
      "confidence": 0.7
    }
  ],
  "confidenceScore": 0.85,
  "requiresHumanReview": false,
  "reviewReasons": [],
  "auditTrail": [ ... ]
}
```

#### Learn from Corrections
```http
POST /learn
Content-Type: application/json

{
  "invoiceId": "INV-001",
  "originalInvoice": { ... },
  "finalInvoice": { ... }
}
```
**Response:**
```json
{
  "success": true,
  "invoiceId": "INV-001",
  "learnResult": {
    "newRules": [...],
    "updatedRules": [...],
    "newPatterns": [...],
    "updatedPatterns": [...]
  }
}
```

#### Get Rules
```http
GET /rules
```

#### Get Patterns
```http
GET /patterns
```

#### Get Statistics
```http
GET /stats
```
**Response:**
```json
{
  "rules": 5,
  "patterns": 2,
  "logs": 47
}
```

---

##  Frontend Pages

### 1. Dashboard (`/`)
- **System Status**: Real-time backend connectivity
- **Metrics Display**: Memories stored, patterns learned, automation accuracy
- **Rules Preview**: Recently learned vendor rules
- **Quick Actions**: Navigate to processor or rules viewer

### 2. Invoice Processor (`/invoice`)
- **JSON Input**: Paste or load demo invoice data
- **Agent Mind Visualization**: Animated neural network showing processing phases
- **Processing Phases**: Receiving  Recalling  Analyzing  Applying  Deciding
- **Confidence Meter**: Visual confidence score with threshold indicator
- **Human Review Form**: Edit fields when confidence is below threshold
- **Learning Submission**: Train the system with corrections

### 3. Rules Viewer (`/rules`)
- **Vendor Rules Tab**: All learned field mappings grouped by vendor
- **Patterns Tab**: Cross-vendor correction patterns
- **Raw JSON View**: Technical data inspection

---

##  How It Works

### Processing Flow

```
1. RECEIVE INVOICE
    Validate JSON structure
    Extract vendor identifier

2. RECALL MEMORIES
    Query vendor_rules table for vendor-specific rules
    Query correction_patterns for applicable patterns

3. APPLY CORRECTIONS
    Execute field mappings (e.g., Leistungsdatum  serviceDate)
    Apply pattern-based transformations (e.g., VAT removal)
    Track all changes in audit trail

4. MAKE DECISION
    Calculate confidence score
    If confidence  80%: AUTO-APPROVE
    If confidence < 80%: FLAG FOR HUMAN REVIEW

5. LEARN (if human corrections provided)
    Compare original vs final invoice
    Extract new rules from corrections
    Update existing rule confidence
    Store new patterns
```

### Example: Learning a New Rule

**Scenario**: User corrects `serviceDate` based on `Leistungsdatum` field

```
Before Learning:
- Invoice has: { extractedFields: { Leistungsdatum: "2024-01-15" } }
- System outputs: { serviceDate: null }
- Human corrects: { serviceDate: "2024-01-15" }

After Learning:
- New rule created: "Leistungsdatum"  "serviceDate" for "Supplier GmbH"
- Confidence: 50% (initial)

Next Invoice from Same Vendor:
- Invoice has: { extractedFields: { Leistungsdatum: "2024-02-20" } }
- System auto-fills: { serviceDate: "2024-02-20" }
- Rule confidence increases with each successful application
```

---

##  Deployment

### Backend Deployment (Render)

1. **Connect GitHub Repository** to Render
2. **Create Web Service** with these settings:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     ```
     NODE_ENV=production
     PORT=3000
     DB_PATH=/data/memory.db
     ```
3. **Add Persistent Disk**: Mount at `/data` (1GB)

### Frontend Deployment (Vercel)

1. **Import Repository** to Vercel
2. **Set Root Directory**: `frontend`
3. **Add Environment Variable**:
   ```
   NEXT_PUBLIC_BACKEND_URL=https://your-backend.onrender.com
   ```
4. **Deploy**

### Using Docker

```bash
# Build
docker build -t invoice-memory-agent .

# Run
docker run -p 3000:3000 -v invoice-data:/data invoice-memory-agent
```

---

##  Project Structure

```
Intelligent-Invoice-Memory-Agent/
 src/                          # Backend source code
    types.ts                  # Zod schemas & TypeScript types
    memory.ts                 # MemoryManager class & DB operations
    server.ts                 # Express API server
    seed.ts                   # Database seeding script
    demo.ts                   # Demo/testing script
 frontend/                     # Next.js frontend
    src/
       app/
          page.tsx          # Dashboard
          invoice/page.tsx  # Invoice Processor
          rules/page.tsx    # Rules Viewer
          layout.tsx        # Root layout
          globals.css       # Global styles
       components/
          AgentState.tsx    # Agent brain animation
          ui.tsx            # Reusable UI components
       lib/
           api.ts            # Backend API client
    tailwind.config.ts        # Tailwind configuration
    package.json
 dist/                         # Compiled backend
 data/                         # SQLite database
 Dockerfile                    # Docker configuration
 render.yaml                   # Render Blueprint
 package.json                  # Backend dependencies
 tsconfig.json                 # TypeScript configuration
 README.md                     # This file
```

---

##  Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Use Zod for all runtime validation
- Write descriptive commit messages
- Update documentation for new features

---

##  License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

##  Author

**Kunal Shaw**

- GitHub: [@KUNALSHAWW](https://github.com/KUNALSHAWW)
- LinkedIn: [Connect with me](https://linkedin.com/in/kunalshaw)

---

<div align="center">

** Star this repo if you found it helpful!**

Made with  by [Kunal Shaw](https://github.com/KUNALSHAWW)

</div>
