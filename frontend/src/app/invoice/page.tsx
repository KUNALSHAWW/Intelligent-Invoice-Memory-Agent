"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";
import { AgentState, AgentThinking, type AgentPhase } from "@/components/AgentState";
import { Button, CodeBlock, Input, Textarea, Divider } from "@/components/ui";
import { SafeText } from "@/components/InvoiceField";
import {
  processInvoice,
  learnFromCorrections,
  DEMO_INVOICES,
  type Invoice,
  type ProcessingResult,
} from "@/lib/api";

// ============================================================================
// INVOICE PROCESSOR PAGE - The "Live" View
// ============================================================================

export default function InvoiceProcessorPage() {
  // State
  const [agentPhase, setAgentPhase] = useState<AgentPhase>("idle");
  const [agentDetails, setAgentDetails] = useState<{
    memoriesFound?: number;
    correctionsApplied?: number;
    confidenceScore?: number;
    requiresHumanReview?: boolean;
    errorMessage?: string;
  }>({});

  const [rawInvoice, setRawInvoice] = useState<string>(
    JSON.stringify(DEMO_INVOICES[0], null, 2)
  );
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [editedFields, setEditedFields] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLearning, setIsLearning] = useState(false);

  // Thinking messages for animation
  const thinkingMessages = {
    receiving: ["Parsing invoice data...", "Validating structure...", "Extracting vendor info..."],
    recalling: ["Searching memory banks...", "Loading vendor rules...", "Fetching patterns..."],
    analyzing: ["Matching patterns...", "Evaluating rules...", "Computing correlations..."],
    applying: ["Applying corrections...", "Mapping fields...", "Transforming data..."],
    deciding: ["Calculating confidence...", "Checking thresholds...", "Making decision..."],
    learning: ["Analyzing corrections...", "Updating rules...", "Storing patterns..."],
  };

  // Process Invoice Handler
  const handleProcess = useCallback(async () => {
    try {
      setIsProcessing(true);
      setResult(null);
      setEditedFields({});

      // Parse input
      let invoice: Invoice;
      try {
        invoice = JSON.parse(rawInvoice);
      } catch {
        setAgentPhase("error");
        setAgentDetails({ errorMessage: "Invalid JSON format" });
        return;
      }

      // Animate through phases
      const phases: AgentPhase[] = ["receiving", "recalling", "analyzing", "applying", "deciding"];

      for (const phase of phases) {
        setAgentPhase(phase);
        await new Promise((r) => setTimeout(r, 800 + Math.random() * 400));
      }

      // Call API
      const processingResult = await processInvoice(invoice);
      setResult(processingResult);

      // Update agent state
      setAgentDetails({
        memoriesFound:
          processingResult.auditTrail.find((a) => a.action === "RECALL")?.details
            ?.rulesFound as number | undefined,
        correctionsApplied: processingResult.proposedCorrections.length,
        confidenceScore: processingResult.confidenceScore,
        requiresHumanReview: processingResult.requiresHumanReview,
      });

      setAgentPhase(
        processingResult.requiresHumanReview ? "awaiting-human" : "complete"
      );

      // Pre-fill edited fields if human review needed
      if (processingResult.requiresHumanReview) {
        const fields: Record<string, string> = {};
        processingResult.proposedCorrections.forEach((c) => {
          fields[c.field] = String(c.proposedValue ?? "");
        });
        setEditedFields(fields);
      }
    } catch (error) {
      setAgentPhase("error");
      setAgentDetails({
        errorMessage: error instanceof Error ? error.message : "Processing failed",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [rawInvoice]);

  // Learn from corrections handler
  const handleLearn = useCallback(async () => {
    if (!result) return;

    try {
      setIsLearning(true);
      setAgentPhase("learning");

      await new Promise((r) => setTimeout(r, 1000));

      // Build final invoice with corrections
      const finalInvoice: Invoice = {
        ...result.processedInvoice,
        ...Object.fromEntries(
          Object.entries(editedFields).filter(([, v]) => v !== "")
        ),
      };

      await learnFromCorrections(
        result.originalInvoice.invoiceId,
        result.originalInvoice,
        finalInvoice
      );

      setAgentPhase("complete");
      setAgentDetails({
        ...agentDetails,
        requiresHumanReview: false,
      });
    } catch (error) {
      setAgentPhase("error");
      setAgentDetails({
        errorMessage: error instanceof Error ? error.message : "Learning failed",
      });
    } finally {
      setIsLearning(false);
    }
  }, [result, editedFields, agentDetails]);

  // Load demo invoice
  const loadDemoInvoice = (index: number) => {
    setRawInvoice(JSON.stringify(DEMO_INVOICES[index], null, 2));
    setResult(null);
    setAgentPhase("idle");
    setAgentDetails({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-t from-zinc-900 via-black to-black">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-mono font-bold tracking-tight mb-2">
            INVOICE PROCESSOR
          </h1>
          <p className="text-zinc-500 font-mono text-sm">
            Feed invoice data to the memory agent
          </p>
        </motion.div>

        {/* Demo Invoice Selector */}
        <div className="flex justify-center gap-3 mb-8">
          <span className="text-xs font-mono text-zinc-600 self-center mr-2">
            LOAD DEMO:
          </span>
          {DEMO_INVOICES.map((inv, i) => (
            <Button
              key={inv.invoiceId}
              variant="ghost"
              size="sm"
              onClick={() => loadDemoInvoice(i)}
            >
              <SafeText value={inv.vendor} fallback="Unknown Vendor" />
            </Button>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Raw Invoice Data */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <div className="glass-card rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-mono text-zinc-500 tracking-widest">
                  RAW INVOICE DATA
                </h2>
                <span className="text-xs font-mono text-zinc-600">
                  JSON INPUT
                </span>
              </div>

              <Textarea
                value={rawInvoice}
                onChange={(e) => setRawInvoice(e.target.value)}
                className="font-mono text-sm h-[400px]"
                placeholder="Paste invoice JSON here..."
              />

              <div className="mt-4">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={handleProcess}
                  loading={isProcessing}
                  disabled={isProcessing || isLearning}
                >
                  PROCESS INVOICE
                </Button>
              </div>
            </div>

            {/* Thinking Animation */}
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="glass-card rounded-xl p-4"
              >
                <AgentThinking
                  messages={
                    thinkingMessages[agentPhase as keyof typeof thinkingMessages] || []
                  }
                />
              </motion.div>
            )}
          </motion.div>

          {/* Right Column - Agent Mind */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Agent State Visualization */}
            <AgentState phase={agentPhase} details={agentDetails} />

            {/* Processing Result */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="glass-card rounded-xl p-6"
                >
                  <h3 className="text-xs font-mono text-zinc-500 tracking-widest mb-4">
                    PROCESSING RESULT
                  </h3>

                  {/* Confidence Score */}
                  <div className="mb-6">
                    <div className="flex justify-between text-sm font-mono mb-2">
                      <span className="text-zinc-500">Confidence Score</span>
                      <span
                        className={
                          (result.confidenceScore ?? 0) >= 0.8
                            ? "text-white"
                            : "text-zinc-400"
                        }
                      >
                        <SafeText 
                          value={result.confidenceScore != null 
                            ? `${(result.confidenceScore * 100).toFixed(1)}%` 
                            : null
                          } 
                          fallback="N/A" 
                        />
                      </span>
                    </div>
                    <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-white"
                        initial={{ width: 0 }}
                        animate={{ width: `${(result.confidenceScore ?? 0) * 100}%` }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                      />
                    </div>
                  </div>

                  {/* Proposed Corrections */}
                  {result.proposedCorrections && result.proposedCorrections.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-xs font-mono text-zinc-600 mb-3">
                        PROPOSED CORRECTIONS
                      </h4>
                      <div className="space-y-2">
                        {result.proposedCorrections.map((correction, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-white/5"
                          >
                            <div>
                              <p className="text-sm font-mono text-white">
                                <SafeText value={correction.field} fallback="Unknown Field" />
                              </p>
                              <p className="text-xs font-mono text-zinc-600">
                                <SafeText value={correction.source} fallback="Unknown Source" />
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-mono text-zinc-300">
                                <SafeText 
                                  value={correction.proposedValue != null 
                                    ? String(correction.proposedValue) 
                                    : null
                                  } 
                                  fallback="N/A" 
                                />
                              </p>
                              <p className="text-xs font-mono text-zinc-600">
                                <SafeText 
                                  value={correction.confidence != null 
                                    ? `${(correction.confidence * 100).toFixed(0)}% confidence` 
                                    : null
                                  } 
                                  fallback="N/A" 
                                />
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Review Reasons */}
                  {result.reviewReasons && result.reviewReasons.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-xs font-mono text-zinc-600 mb-3">
                        REVIEW REASONS
                      </h4>
                      <ul className="space-y-1">
                        {result.reviewReasons.map((reason, i) => (
                          <li
                            key={i}
                            className="text-xs font-mono text-zinc-500 flex items-start gap-2"
                          >
                            <span className="text-zinc-600"></span>
                            <SafeText value={reason} fallback="No reason provided" />
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Human Review Form */}
                  {result.requiresHumanReview && agentPhase === "awaiting-human" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-6 pt-6 border-t border-white/10"
                    >
                      <h4 className="text-xs font-mono text-zinc-500 tracking-widest mb-4">
                        HUMAN CORRECTIONS
                      </h4>

                      <div className="space-y-4">
                        {Object.entries(editedFields).map(([field, value]) => (
                          <Input
                            key={field}
                            label={field.toUpperCase()}
                            value={value ?? ""}
                            onChange={(e) =>
                              setEditedFields((prev) => ({
                                ...prev,
                                [field]: e.target.value,
                              }))
                            }
                            placeholder={`Enter ${field}...`}
                          />
                        ))}

                        {/* Additional field input */}
                        <div className="pt-4">
                          <AddFieldInput
                            onAdd={(field, value) =>
                              setEditedFields((prev) => ({
                                ...prev,
                                [field]: value,
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div className="mt-6">
                        <Button
                          variant="primary"
                          size="lg"
                          className="w-full"
                          onClick={handleLearn}
                          loading={isLearning}
                          disabled={isLearning}
                        >
                          SUBMIT CORRECTIONS & LEARN
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Audit Trail */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12"
          >
            <Divider label="AUDIT TRAIL" />
            <div className="mt-6">
              <CodeBlock
                title="audit.log"
                language="json"
                code={JSON.stringify(result.auditTrail ?? [], null, 2)}
                maxHeight="200px"
              />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// ADD FIELD INPUT COMPONENT
// ============================================================================

function AddFieldInput({
  onAdd,
}: {
  onAdd: (field: string, value: string) => void;
}) {
  const [field, setField] = useState("");
  const [value, setValue] = useState("");

  const handleAdd = () => {
    if (field && value) {
      onAdd(field, value);
      setField("");
      setValue("");
    }
  };

  return (
    <div className="flex gap-3">
      <Input
        placeholder="Field name"
        value={field}
        onChange={(e) => setField(e.target.value)}
        className="flex-1"
      />
      <Input
        placeholder="Value"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="flex-1"
      />
      <Button variant="secondary" onClick={handleAdd} disabled={!field || !value}>
        ADD
      </Button>
    </div>
  );
}
