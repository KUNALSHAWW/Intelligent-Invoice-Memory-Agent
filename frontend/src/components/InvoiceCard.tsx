"use client";
import { motion } from "framer-motion";
import { InvoiceField } from "./InvoiceField";
import type { Invoice, ProposedCorrection } from "@/lib/api";

// ============================================================================
// INVOICE CARD COMPONENT - Defensive Rendering for All Fields
// ============================================================================

interface InvoiceCardProps {
  invoice: Invoice | null | undefined;
  title?: string;
  showRawData?: boolean;
}

export const InvoiceCard = ({ invoice, title = "Invoice Details", showRawData = false }: InvoiceCardProps) => {
  // Guard: If no invoice data, show placeholder
  if (!invoice) {
    return (
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-xs font-mono text-zinc-500 tracking-widest mb-4">
          {title}
        </h3>
        <p className="text-sm font-mono text-zinc-600 text-center py-8">
          No invoice data available.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl p-6"
    >
      <h3 className="text-xs font-mono text-zinc-500 tracking-widest mb-6">
        {title}
      </h3>

      {/* Primary Fields */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <InvoiceField label="Invoice ID" value={invoice.invoiceId} isMono />
        <InvoiceField label="Vendor" value={invoice.vendor} />
        <InvoiceField label="Invoice Date" value={invoice.invoiceDate} isMono />
        <InvoiceField label="Due Date" value={invoice.dueDate} isMono />
        <InvoiceField label="Service Date" value={invoice.serviceDate} isMono />
        <InvoiceField label="Currency" value={invoice.currency} isMono />
      </div>

      {/* Financial Fields */}
      <div className="border-t border-white/10 pt-4 mb-4">
        <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold block mb-4">
          Financial Summary
        </span>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <InvoiceField 
            label="Total Amount" 
            value={invoice.totalAmount !== null && invoice.totalAmount !== undefined 
              ? `${invoice.totalAmount.toFixed(2)}` 
              : null
            } 
            isMono 
          />
          <InvoiceField 
            label="Net Total" 
            value={invoice.netTotal !== null && invoice.netTotal !== undefined 
              ? `${invoice.netTotal.toFixed(2)}` 
              : null
            } 
            isMono 
          />
          <InvoiceField 
            label="VAT Amount" 
            value={invoice.vatAmount !== null && invoice.vatAmount !== undefined 
              ? `${invoice.vatAmount.toFixed(2)}` 
              : null
            } 
            isMono 
          />
          <InvoiceField 
            label="VAT Rate" 
            value={invoice.vatRate !== null && invoice.vatRate !== undefined 
              ? `${invoice.vatRate}%` 
              : null
            } 
            isMono 
          />
        </div>
      </div>

      {/* Confidence */}
      {invoice.confidence !== null && invoice.confidence !== undefined && (
        <div className="border-t border-white/10 pt-4">
          <InvoiceField 
            label="Confidence Score" 
            value={`${(invoice.confidence * 100).toFixed(1)}%`} 
            isMono 
          />
        </div>
      )}

      {/* Raw Data Debug (only if enabled) */}
      {showRawData && (
        <div className="border-t border-white/10 pt-4 mt-4">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold block mb-2">
            Raw Data
          </span>
          <pre className="text-xs font-mono text-zinc-500 bg-black/30 p-3 rounded-lg overflow-auto max-h-40">
            {invoice ? JSON.stringify(invoice, null, 2) : "No data"}
          </pre>
        </div>
      )}
    </motion.div>
  );
};

// ============================================================================
// CORRECTION CARD COMPONENT - Safe rendering for corrections
// ============================================================================

interface CorrectionCardProps {
  correction: ProposedCorrection | null | undefined;
  index?: number;
}

export const CorrectionCard = ({ correction, index = 0 }: CorrectionCardProps) => {
  if (!correction) {
    return null;
  }

  // Safely convert values to strings
  const currentVal = correction.currentValue !== null && correction.currentValue !== undefined 
    ? String(correction.currentValue) 
    : "N/A";
  const proposedVal = correction.proposedValue !== null && correction.proposedValue !== undefined 
    ? String(correction.proposedValue) 
    : "N/A";
  const confidence = correction.confidence !== null && correction.confidence !== undefined 
    ? `${(correction.confidence * 100).toFixed(0)}%` 
    : "N/A";

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-white/5"
    >
      <div>
        <p className="text-sm font-mono text-zinc-100">
          {correction.field || "Unknown Field"}
        </p>
        <p className="text-xs font-mono text-zinc-600">
          {correction.source || "Unknown Source"}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-mono text-zinc-300">
          {proposedVal}
        </p>
        <p className="text-xs font-mono text-zinc-600">
          {confidence} confidence
        </p>
      </div>
    </motion.div>
  );
};

export default InvoiceCard;
