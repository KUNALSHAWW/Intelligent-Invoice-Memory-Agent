"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { CodeBlock, Divider } from "@/components/ui";
import { getRules, getPatterns, type VendorRule, type CorrectionPattern } from "@/lib/api";

// ============================================================================
// RULES PAGE - View All Learned Rules & Patterns
// ============================================================================

export default function RulesPage() {
  const [rules, setRules] = useState<VendorRule[]>([]);
  const [patterns, setPatterns] = useState<CorrectionPattern[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"rules" | "patterns">("rules");

  useEffect(() => {
    async function fetchData() {
      try {
        const [rulesData, patternsData] = await Promise.all([
          getRules().catch(() => ({ rules: [], count: 0 })),
          getPatterns().catch(() => ({ patterns: [], count: 0 })),
        ]);
        setRules(rulesData.rules);
        setPatterns(patternsData.patterns);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

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
            MEMORY BANK
          </h1>
          <p className="text-zinc-500 font-mono text-sm">
            All learned rules and patterns
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex justify-center gap-4 mb-8">
          <TabButton
            active={activeTab === "rules"}
            onClick={() => setActiveTab("rules")}
            count={rules.length}
          >
            VENDOR RULES
          </TabButton>
          <TabButton
            active={activeTab === "patterns"}
            onClick={() => setActiveTab("patterns")}
            count={patterns.length}
          >
            PATTERNS
          </TabButton>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="glass-card rounded-xl p-12 text-center">
            <motion.div
              className="w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <p className="mt-4 text-sm font-mono text-zinc-500">Loading...</p>
          </div>
        ) : activeTab === "rules" ? (
          <RulesView rules={rules} />
        ) : (
          <PatternsView patterns={patterns} />
        )}

        {/* Raw Data */}
        <Divider label="RAW DATA" />
        <div className="mt-6">
          <CodeBlock
            title={activeTab === "rules" ? "rules.json" : "patterns.json"}
            language="json"
            code={JSON.stringify(activeTab === "rules" ? rules : patterns, null, 2)}
            maxHeight="300px"
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TAB BUTTON
// ============================================================================

function TabButton({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count: number;
}) {
  return (
    <motion.button
      onClick={onClick}
      className={`
        px-6 py-3 rounded-lg font-mono text-sm tracking-wider transition-all
        ${active 
          ? "bg-white text-black" 
          : "bg-transparent text-zinc-500 border border-white/10 hover:border-white/20 hover:text-zinc-300"
        }
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
      <span className={`ml-2 ${active ? "text-zinc-600" : "text-zinc-600"}`}>
        ({count})
      </span>
    </motion.button>
  );
}

// ============================================================================
// RULES VIEW
// ============================================================================

function RulesView({ rules }: { rules: VendorRule[] }) {
  if (rules.length === 0) {
    return (
      <EmptyState message="No vendor rules learned yet. Process some invoices with corrections to build memory." />
    );
  }

  // Group by vendor
  const groupedRules = rules.reduce((acc, rule) => {
    if (!acc[rule.vendorName]) {
      acc[rule.vendorName] = [];
    }
    acc[rule.vendorName].push(rule);
    return acc;
  }, {} as Record<string, VendorRule[]>);

  return (
    <div className="space-y-8">
      {Object.entries(groupedRules).map(([vendor, vendorRules], groupIndex) => (
        <motion.div
          key={vendor}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: groupIndex * 0.1 }}
          className="glass-card rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
              <span className="font-mono text-xs text-white">
                {vendor.charAt(0)}
              </span>
            </div>
            <div>
              <h3 className="font-mono text-white">{vendor}</h3>
              <p className="text-xs font-mono text-zinc-600">
                {vendorRules.length} rule{vendorRules.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {vendorRules.map((rule, i) => (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="text-zinc-600 font-mono text-lg">→</div>
                  <div>
                    <p className="font-mono text-white">
                      <span className="text-zinc-500">{rule.sourceRawField}</span>
                      {" → "}
                      <span>{rule.targetField}</span>
                    </p>
                    <p className="text-xs font-mono text-zinc-600 mt-1">
                      Action: {rule.action}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-right">
                  <div>
                    <p className="text-sm font-mono text-zinc-300">
                      {(rule.confidence * 100).toFixed(0)}%
                    </p>
                    <p className="text-xs font-mono text-zinc-600">confidence</p>
                  </div>
                  <div>
                    <p className="text-sm font-mono text-zinc-300">
                      {rule.usageCount}
                    </p>
                    <p className="text-xs font-mono text-zinc-600">uses</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ============================================================================
// PATTERNS VIEW
// ============================================================================

function PatternsView({ patterns }: { patterns: CorrectionPattern[] }) {
  if (patterns.length === 0) {
    return (
      <EmptyState message="No cross-vendor patterns detected yet. Process more invoices to discover patterns." />
    );
  }

  return (
    <div className="glass-card rounded-xl p-6">
      <h3 className="text-xs font-mono text-zinc-500 tracking-widest mb-6">
        DETECTED PATTERNS
      </h3>

      <div className="space-y-4">
        {patterns.map((pattern, i) => (
          <motion.div
            key={pattern.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-4 bg-black/30 rounded-lg border border-white/5"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-white mb-1">
                  {pattern.targetField}
                </p>
                <p className="text-xs font-mono text-zinc-600">
                  Type: {pattern.patternType}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono text-zinc-300">
                  {pattern.usageCount} uses
                </p>
              </div>
            </div>

            <div className="mt-3 p-2 bg-black/50 rounded font-mono text-xs text-zinc-500">
              Trigger: {pattern.triggerCondition}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// EMPTY STATE
// ============================================================================

function EmptyState({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-card rounded-xl p-12 text-center"
    >
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-900 flex items-center justify-center">
        <span className="text-2xl">◇</span>
      </div>
      <p className="font-mono text-zinc-500 max-w-md mx-auto">{message}</p>
    </motion.div>
  );
}
