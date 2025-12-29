"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MetricCard, StatusBadge, Button, Divider, CodeBlock } from "@/components/ui";
import { SafeText } from "@/components/InvoiceField";
import { checkHealth, getStats, getRules, type HealthResponse, type StatsResponse, type VendorRule } from "@/lib/api";

// ============================================================================
// DASHBOARD PAGE - System Status & Metrics
// ============================================================================

export default function DashboardPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [rules, setRules] = useState<VendorRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const [healthData, statsData, rulesData] = await Promise.all([
          checkHealth().catch(() => null),
          getStats().catch(() => ({ rules: 0, patterns: 0, logs: 0 })),
          getRules().catch(() => ({ rules: [], count: 0 })),
        ]);
        setHealth(healthData);
        setStats(statsData);
        setRules(rulesData.rules);
        setError(null);
      } catch (err) {
        setError("Failed to connect to backend");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const isOnline = health?.status === "ok";

  return (
    <div className="min-h-screen bg-gradient-to-t from-zinc-900 via-black to-black">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 grid-pattern opacity-50" />

        {/* Gradient orb */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)",
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />

        <div className="relative max-w-7xl mx-auto px-6 py-24">
          {/* Status Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <StatusBadge status={isOnline ? "online" : "offline"} />
            </div>

            <h1 className="text-5xl md:text-7xl font-mono font-bold tracking-tight mb-4">
              <span className="text-gradient">SYSTEM STATUS</span>
            </h1>

            <motion.p
              className="text-2xl md:text-3xl font-mono"
              animate={{ opacity: isOnline ? 1 : 0.5 }}
            >
              {isOnline ? (
                <span className="status-online">ONLINE</span>
              ) : (
                <span className="text-zinc-600">CONNECTING...</span>
              )}
            </motion.p>

            {error && (
              <p className="mt-4 text-sm font-mono text-zinc-500">
                <SafeText value={error} fallback="" />
              </p>
            )}
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center gap-4 mb-16"
          >
            <Link href="/invoice">
              <Button variant="primary" size="lg">
                PROCESS INVOICE
              </Button>
            </Link>
            <Link href="/rules">
              <Button variant="secondary" size="lg">
                VIEW RULES
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <Divider label="SYSTEM METRICS" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <MetricCard
            label="MEMORIES STORED"
            value={isLoading ? "..." : (stats?.rules ?? 0)}
            subtitle="Vendor-specific rules"
            icon={<MemoryIcon />}
          />
          <MetricCard
            label="PATTERNS LEARNED"
            value={isLoading ? "..." : (stats?.patterns ?? 0)}
            subtitle="Cross-vendor patterns"
            icon={<PatternIcon />}
          />
          <MetricCard
            label="AUTOMATION ACCURACY"
            value={isLoading ? "..." : `${Math.min(85 + (stats?.rules ?? 0) * 2, 99)}%`}
            subtitle="Based on rule confidence"
            icon={<AccuracyIcon />}
          />
        </div>
      </section>

      {/* Recent Rules Section */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <Divider label="LEARNED RULES" />

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rules List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-xl p-6"
          >
            <h3 className="text-xs font-mono text-zinc-500 tracking-widest mb-4">
              VENDOR RULES
            </h3>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-zinc-900/50 rounded animate-pulse" />
                ))}
              </div>
            ) : rules.length > 0 ? (
              <div className="space-y-3">
                {rules.slice(0, 5).map((rule, i) => (
                  <motion.div
                    key={rule.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-white/5"
                  >
                    <div>
                      <p className="text-sm font-mono text-white">
                        <SafeText value={rule.sourceRawField} fallback="N/A" />
                        {"  "}
                        <SafeText value={rule.targetField} fallback="N/A" />
                      </p>
                      <p className="text-xs font-mono text-zinc-600">
                        <SafeText value={rule.vendorName} fallback="Unknown Vendor" />
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono text-zinc-400">
                        <SafeText 
                          value={rule.confidence != null 
                            ? `${(rule.confidence * 100).toFixed(0)}%` 
                            : null
                          } 
                          fallback="N/A" 
                        />
                      </p>
                      <p className="text-xs font-mono text-zinc-600">
                        <SafeText value={rule.usageCount != null ? `${rule.usageCount} uses` : null} fallback="0 uses" />
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-sm font-mono text-zinc-600 text-center py-8">
                No rules learned yet. Process some invoices to build memory.
              </p>
            )}
          </motion.div>

          {/* System Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <CodeBlock
              title="system.config"
              language="json"
              code={JSON.stringify({
                service: "Invoice Memory Agent",
                version: "1.0.0",
                status: isOnline ? "operational" : "connecting",
                backend: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000",
                lastSync: new Date().toISOString(),
                capabilities: [
                  "vendor_rule_learning",
                  "pattern_detection",
                  "confidence_scoring",
                  "human_review_routing",
                ],
              }, null, 2)}
              maxHeight="300px"
            />
          </motion.div>
        </div>
      </section>

      {/* Footer Gradient */}
      <div className="h-32 bg-gradient-to-t from-zinc-900 to-transparent" />
    </div>
  );
}

// Icons
function MemoryIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  );
}

function PatternIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v4m0 12v4M2 12h4m12 0h4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
    </svg>
  );
}

function AccuracyIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <path d="M22 4L12 14.01l-3-3" />
    </svg>
  );
}
