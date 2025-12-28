# 🎬 Video Demo Script - Intelligent Invoice Memory Agent

## � Quick Demo (Automated)

For a quick automated demo in your terminal, run:

```bash
# Start backend first (in one terminal)
npm start

# Run demo (in another terminal)
npm run demo:run

# Or against production backend
npm run demo:run -- --url https://your-backend.onrender.com
```

---

## �📋 Pre-Recording Checklist

- [ ] Clear browser cache/history for clean UI
- [ ] Close unnecessary browser tabs
- [ ] Set screen resolution to 1920x1080
- [ ] Turn off notifications (Focus mode)
- [ ] Open the live app: https://intelligent-invoice-memory-agent.vercel.app/
- [ ] Have this script open on second monitor or printed

---

## 🎯 Demo Duration: ~5-7 minutes

---

## PART 1: Introduction (30 seconds)

### What to Show:
- Open the **Dashboard** page

### What to Say:
> "Hi, I'm Kunal Shaw, and this is the Intelligent Invoice Memory Agent - a production-ready system that learns from human corrections to automate invoice processing."

> "Unlike traditional ML systems that require massive training datasets, this uses a memory-based approach that learns incrementally from each user interaction."

### Actions:
1. Show the Dashboard with "SYSTEM STATUS: ONLINE"
2. Point to the metrics: "Memories Stored", "Patterns Learned"
3. Hover over a metric card to show the animation

---

## PART 2: Dashboard Overview (45 seconds)

### What to Show:
- Dashboard metrics
- Learned rules section
- System configuration

### What to Say:
> "The dashboard provides a real-time view of the system. Here we can see:
> - **Memories Stored**: The number of vendor-specific rules the system has learned
> - **Patterns Learned**: Cross-vendor patterns like VAT handling
> - **Automation Accuracy**: Calculated based on rule confidence scores"

> "Below, we see the **Learned Rules** - each rule maps a raw field to a standardized field for a specific vendor."

### Actions:
1. Scroll down to show the vendor rules list
2. Point out the confidence percentage and usage count
3. Show the system.config JSON block

---

## PART 3: Processing a New Invoice (2 minutes)

### What to Show:
- Navigate to `/invoice` (Invoice Processor page)

### What to Say:
> "Let's process an invoice. I'll navigate to the Invoice Processor."

### Actions:
1. Click "Process" in the navigation

### Scene 3a: Loading Demo Invoice
> "The system comes with demo invoices. Let me load one from 'Supplier GmbH'."

### Actions:
1. Click the "Supplier GmbH" button to load demo invoice
2. Point to the JSON structure on the left
3. Highlight the `extractedFields` containing "Leistungsdatum"

### Scene 3b: Processing Animation
> "Watch the Agent Mind on the right. When I click 'Process Invoice', you'll see the neural network animate through different phases."

### Actions:
1. Click "PROCESS INVOICE" button
2. **PAUSE** - Let the animation play through:
   - RECEIVING
   - RECALLING
   - ANALYZING
   - APPLYING
   - DECIDING
3. Point to each phase as it appears

### Scene 3c: Results Display
> "The system found memories for this vendor. It automatically applied the rule 'Leistungsdatum maps to serviceDate'."

> "Notice the **confidence score** - it's above 80%, so this would be auto-approved in production."

### Actions:
1. Point to the confidence meter
2. Show the "Proposed Corrections" section
3. Scroll to show the audit trail

---

## PART 4: Human Review Flow (1.5 minutes)

### What to Show:
- Process an invoice that requires human review

### What to Say:
> "Now let's see what happens when confidence is low. I'll modify the invoice to simulate a new vendor scenario."

### Actions:
1. In the JSON input, change the vendor to "New Vendor Ltd"
2. Click "PROCESS INVOICE"

### Scene 4a: Human Review Required
> "This time, the status shows 'AWAITING HUMAN' because:
> 1. No vendor rules exist for this new vendor
> 2. Confidence is below 80%"

> "The system presents a form for human corrections."

### Actions:
1. Point to the "AWAITING HUMAN" status
2. Show the review reasons
3. Scroll to the correction form

### Scene 4b: Submitting Corrections
> "I'll add a correction - let's say serviceDate should be '2024-01-15'."

### Actions:
1. Type "2024-01-15" in the serviceDate field
2. Click "SUBMIT CORRECTIONS & LEARN"
3. Watch the "LEARNING" animation

> "The system is now learning from this correction. Next time we process an invoice from 'New Vendor Ltd', it will remember this mapping."

---

## PART 5: Verifying Learning (1 minute)

### What to Show:
- Navigate to `/rules` (Rules Viewer)

### What to Say:
> "Let's verify the system learned. I'll go to the Rules page."

### Actions:
1. Click "Rules" in navigation
2. Find the new rule for "New Vendor Ltd"

> "Here it is - a new rule was created. The confidence starts at 50% and increases with each successful application."

### Actions:
1. Point to the new rule
2. Show the confidence and usage count
3. Click "PATTERNS" tab to show pattern detection

---

## PART 6: Technical Architecture (45 seconds)

### What to Show:
- Can show the GitHub repo or the README architecture diagram

### What to Say:
> "Under the hood, this system uses:
> - **Next.js 14** with the App Router for the frontend
> - **Express.js** with TypeScript for the backend API
> - **SQLite** for persistent storage
> - **Framer Motion** for the smooth animations you saw"

> "The frontend is deployed on **Vercel**, and the backend runs on **Render** with persistent disk storage."

---

## PART 7: Conclusion (30 seconds)

### What to Show:
- Return to Dashboard

### What to Say:
> "That's the Intelligent Invoice Memory Agent - a system that:
> 1. **Processes** invoices using learned memories
> 2. **Routes** low-confidence items for human review
> 3. **Learns** from every correction
> 4. **Improves** automatically over time"

> "The code is open source on GitHub. Link in the description. Thanks for watching!"

### Actions:
1. Show the updated metrics on Dashboard
2. End with a view of the glowing "SYSTEM STATUS: ONLINE"

---

## 🎥 Recording Tips

### Screen Recording Settings
- Resolution: 1920x1080
- Frame Rate: 60fps
- Format: MP4

### Audio Tips
- Use a good microphone
- Record in a quiet room
- Speak clearly and at moderate pace

### Post-Production
- Add intro/outro cards
- Add subtle background music
- Include captions/subtitles
- Add GitHub link overlay

---

## 📱 Social Media Clips

Consider creating shorter clips for social media:

1. **15-second clip**: Just the processing animation (Reels/TikTok)
2. **30-second clip**: Process → Learn → Verify flow (Twitter/X)
3. **1-minute clip**: Full feature overview (LinkedIn)

---

## 🔗 Links to Include

- **Live Demo**: https://intelligent-invoice-memory-agent.vercel.app/
- **GitHub**: https://github.com/KUNALSHAWW/Intelligent-Invoice-Memory-Agent
- **LinkedIn**: https://linkedin.com/in/kunalshaw

---

## 📝 Video Description Template

```
🧠 Intelligent Invoice Memory Agent - AI-Powered Invoice Processing

An AI system that learns from human corrections to automate invoice processing. Built with Next.js 14, TypeScript, Express.js, and SQLite.

✨ Features:
• Memory-based learning from corrections
• Real-time processing visualization
• Confidence-based routing
• Vendor-specific rule learning
• Modern monochrome UI

🔗 Links:
• Live Demo: https://intelligent-invoice-memory-agent.vercel.app/
• GitHub: https://github.com/KUNALSHAWW/Intelligent-Invoice-Memory-Agent

🛠 Tech Stack:
• Frontend: Next.js 14, Tailwind CSS, Framer Motion
• Backend: Express.js, TypeScript, SQLite
• Deployment: Vercel + Render

#AI #MachineLearning #TypeScript #NextJS #WebDevelopment #OpenSource
```

---

## ✅ Final Checklist

Before uploading:
- [ ] Video plays smoothly without lag
- [ ] Audio is clear and synced
- [ ] All UI elements are visible
- [ ] Links are correct in description
- [ ] Thumbnail is eye-catching
- [ ] Captions are accurate

**Good luck with your demo! 🎬**
