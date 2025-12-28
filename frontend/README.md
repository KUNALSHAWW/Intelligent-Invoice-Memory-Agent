# Invoice Memory Agent - Frontend UI

A sleek, monochrome luxury UI for the Intelligent Invoice Memory Agent, built with Next.js 14, TypeScript, Tailwind CSS, and Framer Motion.

## 🎨 Design Language

**Theme**: "Monochrome Luxury" - A classified intelligence tool aesthetic

- **Colors**: Strictly Black (#000), Zinc-900, Zinc-800, and White
- **Effects**: Glassmorphism, noise textures, subtle glows
- **Typography**: JetBrains Mono for data, Inter for UI
- **Animations**: Smooth Framer Motion transitions

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Backend server running (see FlowbitAI/README.md)

### Installation

```bash
npm install
```

### Development

```bash
# Make sure the backend is running first (default: http://localhost:3000)
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

### Production Build

```bash
npm run build
npm run start
```

## 📁 Project Structure

```
invoice-ui/
├── src/
│   ├── app/
│   │   ├── page.tsx           # Dashboard - System status & metrics
│   │   ├── invoice/
│   │   │   └── page.tsx       # Invoice Processor - The "Live" view
│   │   ├── rules/
│   │   │   └── page.tsx       # Memory Bank - All learned rules
│   │   ├── layout.tsx         # Root layout with navigation
│   │   └── globals.css        # Global styles & Tailwind config
│   ├── components/
│   │   ├── AgentState.tsx     # Agent "brain" animation component
│   │   └── ui.tsx             # Reusable UI components
│   └── lib/
│       └── api.ts             # Backend API client
├── tailwind.config.ts         # Tailwind configuration
└── .env.local                 # Environment variables
```

## 📄 Pages

### Dashboard (`/`)
- Hero section with system status (Online/Offline)
- Metrics cards: Memories Stored, Patterns Learned, Automation Accuracy
- List of learned vendor rules
- System configuration display

### Invoice Processor (`/invoice`)
- **Left Column**: Raw invoice JSON input with syntax highlighting
- **Right Column**: Agent Mind visualization
  - Neural network animation
  - Real-time phase indicators (Recalling → Analyzing → Deciding)
  - Confidence score display
- Human review form for corrections
- Submit corrections to train the system

### Rules (`/rules`)
- Tabbed view: Vendor Rules | Patterns
- Grouped by vendor with confidence and usage stats
- Raw JSON data view

## 🔌 API Connection

The frontend connects to the backend via environment variables:

```env
# .env.local
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
```

### API Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Check backend status |
| `/process` | POST | Process an invoice |
| `/learn` | POST | Submit corrections |
| `/rules` | GET | Get all vendor rules |
| `/patterns` | GET | Get all patterns |
| `/stats` | GET | Get database statistics |

## 🎯 Key Components

### `AgentState` Component
Animated visualization of the agent's processing phases:
- `idle` - Awaiting input
- `receiving` - Ingesting data
- `recalling` - Searching memory
- `analyzing` - Pattern matching
- `applying` - Executing rules
- `deciding` - Evaluating confidence
- `complete` - Processing finished
- `awaiting-human` - Human review required
- `learning` - Integrating corrections

### UI Components
- `Navigation` - Fixed top navigation bar
- `MetricCard` - Animated statistic display
- `CodeBlock` - Styled JSON/code display
- `StatusBadge` - Status indicator with pulse
- `Button` - Primary/Secondary/Ghost variants
- `Input` / `Textarea` - Dark-themed form inputs
- `Divider` - Labeled section divider

## 🚢 Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/invoice-ui.git
git push -u origin main
```

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Add environment variable:
   - `NEXT_PUBLIC_BACKEND_URL` = Your Render backend URL (e.g., `https://your-app.onrender.com`)
5. Click "Deploy"

### 3. Configure CORS

Make sure your backend allows requests from your Vercel domain:
```typescript
// Backend already has CORS enabled for all origins
app.use(cors());
```

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4
- **Animations**: Framer Motion
- **Fonts**: JetBrains Mono, Inter (via next/font)

## 📜 License

MIT
