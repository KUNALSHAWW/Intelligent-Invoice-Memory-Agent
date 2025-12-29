"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

// ============================================================================
// INVOICE FIELD COMPONENT - Safe value renderer with N/A fallback
// ============================================================================
// Solves React Error #418 (Hydration Mismatch) by ensuring consistent
// rendering of undefined/null values on both server and client.

interface InvoiceFieldProps {
  /** The value to display */
  value: string | number | null | undefined;
  /** Optional label for the field */
  label?: string;
  /** Optional suffix (e.g., "EUR", "%") */
  suffix?: string;
  /** Optional prefix (e.g., "$", "#") */
  prefix?: string;
  /** Fallback text when value is null/undefined (default: "N/A") */
  fallback?: string;
  /** Whether to animate the value appearance */
  animate?: boolean;
  /** Custom className for the value container */
  className?: string;
  /** Custom className for the label */
  labelClassName?: string;
  /** Format as percentage (multiplies by 100 and adds %) */
  asPercentage?: boolean;
  /** Format as currency (adds 2 decimal places) */
  asCurrency?: boolean;
  /** Custom formatter function */
  formatter?: (value: string | number) => ReactNode;
}

/**
 * InvoiceField - A safe field renderer that handles undefined/null values
 * to prevent React hydration mismatches.
 * 
 * @example
 * // Basic usage
 * <InvoiceField value={invoice.vendor} label="Vendor" />
 * 
 * @example
 * // With currency formatting
 * <InvoiceField value={invoice.totalAmount} asCurrency suffix="EUR" />
 * 
 * @example
 * // With percentage formatting
 * <InvoiceField value={invoice.confidenceScore} asPercentage />
 */
export function InvoiceField({
  value,
  label,
  suffix,
  prefix,
  fallback = "N/A",
  animate = true,
  className = "",
  labelClassName = "",
  asPercentage = false,
  asCurrency = false,
  formatter,
}: InvoiceFieldProps) {
  // Check if value is null, undefined, or empty string
  const hasValue = value !== null && value !== undefined && value !== "";
  
  // Format the value
  const formatValue = (): ReactNode => {
    if (!hasValue) {
      return <span className="text-zinc-600">{fallback}</span>;
    }

    // Use custom formatter if provided
    if (formatter) {
      return formatter(value);
    }

    let displayValue: string | number = value;

    // Apply percentage formatting
    if (asPercentage && typeof displayValue === "number") {
      displayValue = `${(displayValue * 100).toFixed(1)}%`;
    }

    // Apply currency formatting
    if (asCurrency && typeof displayValue === "number") {
      displayValue = displayValue.toFixed(2);
    }

    // Build the final string with prefix and suffix
    const parts: string[] = [];
    if (prefix) parts.push(prefix);
    parts.push(String(displayValue));
    if (suffix && !asPercentage) parts.push(suffix);

    return parts.join(" ");
  };

  const content = (
    <div className={`font-mono ${className}`}>
      {label && (
        <span className={`text-xs text-zinc-500 tracking-wider block mb-1 ${labelClassName}`}>
          {label}
        </span>
      )}
      <span className={hasValue ? "text-zinc-300" : ""}>
        {formatValue()}
      </span>
    </div>
  );

  // Wrap with motion.div for animation if enabled
  if (animate && hasValue) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {content}
      </motion.div>
    );
  }

  return content;
}

/**
 * InvoiceFieldRow - A row layout for label-value pairs
 */
interface InvoiceFieldRowProps extends InvoiceFieldProps {
  /** Layout orientation */
  layout?: "horizontal" | "vertical";
}

export function InvoiceFieldRow({
  label,
  layout = "horizontal",
  ...props
}: InvoiceFieldRowProps) {
  if (layout === "vertical") {
    return <InvoiceField label={label} {...props} />;
  }

  const hasValue = props.value !== null && props.value !== undefined && props.value !== "";

  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      {label && (
        <span className="text-xs font-mono text-zinc-500 tracking-wider">
          {label}
        </span>
      )}
      <InvoiceField
        {...props}
        label={undefined}
        className={`text-sm ${hasValue ? "text-zinc-300" : "text-zinc-600"}`}
      />
    </div>
  );
}

/**
 * SafeText - Simple inline text renderer with fallback
 */
export function SafeText({
  value,
  fallback = "N/A",
  className = "",
}: {
  value: string | number | null | undefined;
  fallback?: string;
  className?: string;
}) {
  const hasValue = value !== null && value !== undefined && value !== "";
  
  return (
    <span className={`${className} ${!hasValue ? "text-zinc-600" : ""}`}>
      {hasValue ? String(value) : fallback}
    </span>
  );
}

export default InvoiceField;
