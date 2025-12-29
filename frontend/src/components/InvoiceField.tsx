"use client";
import { motion } from "framer-motion";

interface InvoiceFieldProps {
  label: string;
  value: string | number | null | undefined;
  isMono?: boolean;
}

export const InvoiceField = ({ label, value, isMono = false }: InvoiceFieldProps) => {
  // STRICT VALIDATION: Check for null, undefined, or empty string. 
  // Allow 0 (number) to pass through.
  const isValid = value !== null && value !== undefined && value !== "";
  const displayValue = isValid ? value : "N/A";
  const isMissing = !isValid;

  return (
    <div className="flex flex-col gap-1 mb-4 min-w-[120px]">
      <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
        {label}
      </span>
      <div className="relative overflow-hidden">
        <motion.span
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`block text-sm ${
            isMono ? "font-mono tracking-tight" : "font-sans"
          } ${isMissing ? "text-zinc-700 italic" : "text-zinc-100"}`}
        >
          {displayValue}
        </motion.span>
      </div>
    </div>
  );
};

// Inline SafeText for simple text rendering without label
interface SafeTextProps {
  value: string | number | null | undefined;
  fallback?: string;
  className?: string;
}

export const SafeText = ({ value, fallback = "N/A", className = "" }: SafeTextProps) => {
  const isValid = value !== null && value !== undefined && value !== "";
  return (
    <span className={`${className} ${!isValid ? "text-zinc-700 italic" : ""}`}>
      {isValid ? value : fallback}
    </span>
  );
};

export default InvoiceField;
