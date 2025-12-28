'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

// ============================================================================
// AGENT STATE TYPES
// ============================================================================

export type AgentPhase = 
  | 'idle'
  | 'receiving'
  | 'recalling'
  | 'analyzing'
  | 'applying'
  | 'deciding'
  | 'complete'
  | 'awaiting-human'
  | 'learning'
  | 'error';

interface AgentStateProps {
  phase: AgentPhase;
  details?: {
    memoriesFound?: number;
    correctionsApplied?: number;
    confidenceScore?: number;
    requiresHumanReview?: boolean;
    errorMessage?: string;
  };
}

// ============================================================================
// PHASE CONFIGURATIONS
// ============================================================================

const phaseConfig: Record<AgentPhase, {
  title: string;
  subtitle: string;
  icon: string;
  animation: 'pulse' | 'spin' | 'bounce' | 'none';
}> = {
  idle: {
    title: 'STANDBY',
    subtitle: 'Awaiting invoice data...',
    icon: '◇',
    animation: 'pulse',
  },
  receiving: {
    title: 'RECEIVING',
    subtitle: 'Ingesting invoice data...',
    icon: '◈',
    animation: 'bounce',
  },
  recalling: {
    title: 'RECALLING',
    subtitle: 'Searching memory banks...',
    icon: '◉',
    animation: 'spin',
  },
  analyzing: {
    title: 'ANALYZING',
    subtitle: 'Pattern matching in progress...',
    icon: '◎',
    animation: 'spin',
  },
  applying: {
    title: 'APPLYING',
    subtitle: 'Executing learned rules...',
    icon: '◐',
    animation: 'spin',
  },
  deciding: {
    title: 'DECIDING',
    subtitle: 'Evaluating confidence threshold...',
    icon: '◑',
    animation: 'pulse',
  },
  complete: {
    title: 'COMPLETE',
    subtitle: 'Processing finished successfully',
    icon: '●',
    animation: 'none',
  },
  'awaiting-human': {
    title: 'AWAITING HUMAN',
    subtitle: 'Human review required',
    icon: '◯',
    animation: 'pulse',
  },
  learning: {
    title: 'LEARNING',
    subtitle: 'Integrating corrections into memory...',
    icon: '◉',
    animation: 'spin',
  },
  error: {
    title: 'ERROR',
    subtitle: 'Processing failed',
    icon: '✕',
    animation: 'none',
  },
};

// ============================================================================
// ANIMATED COMPONENTS
// ============================================================================

function NeuralNetwork({ isActive }: { isActive: boolean }) {
  const nodes = [
    { x: 50, y: 20 },
    { x: 20, y: 50 },
    { x: 80, y: 50 },
    { x: 35, y: 80 },
    { x: 65, y: 80 },
    { x: 50, y: 50 },
  ];

  const connections = [
    [0, 1], [0, 2], [0, 5],
    [1, 3], [1, 5],
    [2, 4], [2, 5],
    [5, 3], [5, 4],
  ];

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {/* Connections */}
      {connections.map(([from, to], i) => (
        <motion.line
          key={`line-${i}`}
          x1={nodes[from].x}
          y1={nodes[from].y}
          x2={nodes[to].x}
          y2={nodes[to].y}
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="0.5"
          initial={{ pathLength: 0 }}
          animate={{ 
            pathLength: isActive ? 1 : 0.3,
            stroke: isActive ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)',
          }}
          transition={{ duration: 0.5, delay: i * 0.05 }}
        />
      ))}
      
      {/* Nodes */}
      {nodes.map((node, i) => (
        <motion.circle
          key={`node-${i}`}
          cx={node.x}
          cy={node.y}
          r={i === 5 ? 4 : 2.5}
          fill={i === 5 ? 'white' : 'rgba(255,255,255,0.6)'}
          initial={{ scale: 0 }}
          animate={{ 
            scale: isActive ? [1, 1.2, 1] : 1,
            opacity: isActive ? 1 : 0.5,
          }}
          transition={{ 
            duration: 1,
            repeat: isActive ? Infinity : 0,
            delay: i * 0.1,
          }}
        />
      ))}

      {/* Pulse effect on center node */}
      {isActive && (
        <motion.circle
          cx={50}
          cy={50}
          r={4}
          fill="none"
          stroke="white"
          strokeWidth="0.5"
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 3, opacity: 0 }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </svg>
  );
}

function DataStream({ isActive }: { isActive: boolean }) {
  const lines = Array.from({ length: 8 }, (_, i) => i);
  
  return (
    <div className="absolute inset-0 overflow-hidden opacity-30">
      {lines.map((i) => (
        <motion.div
          key={i}
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-white to-transparent"
          style={{ top: `${(i + 1) * 12}%` }}
          initial={{ x: '-100%', opacity: 0 }}
          animate={isActive ? {
            x: ['100%', '-100%'],
            opacity: [0, 1, 0],
          } : { x: '-100%', opacity: 0 }}
          transition={{
            duration: 2,
            delay: i * 0.2,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AgentState({ phase, details }: AgentStateProps) {
  const config = phaseConfig[phase];
  const isProcessing = ['receiving', 'recalling', 'analyzing', 'applying', 'deciding', 'learning'].includes(phase);
  
  return (
    <div className="relative w-full">
      {/* Background glow */}
      <motion.div
        className="absolute inset-0 rounded-xl"
        animate={{
          boxShadow: isProcessing 
            ? '0 0 60px rgba(255,255,255,0.1)' 
            : '0 0 30px rgba(255,255,255,0.05)',
        }}
        transition={{ duration: 0.5 }}
      />

      {/* Main container */}
      <div className="relative glass-card rounded-xl p-6 overflow-hidden">
        {/* Data stream animation */}
        <DataStream isActive={isProcessing} />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-3 h-3 rounded-full bg-white"
              animate={{
                opacity: isProcessing ? [1, 0.3, 1] : (phase === 'complete' ? 1 : 0.5),
                scale: isProcessing ? [1, 1.2, 1] : 1,
              }}
              transition={{ duration: 1, repeat: isProcessing ? Infinity : 0 }}
            />
            <span className="text-xs font-mono text-zinc-500 tracking-widest">
              AGENT.STATUS
            </span>
          </div>
          <span className="text-xs font-mono text-zinc-600">
            {new Date().toISOString().split('T')[1].slice(0, 8)}
          </span>
        </div>

        {/* Neural Network Visualization */}
        <div className="relative h-32 mb-6">
          <NeuralNetwork isActive={isProcessing} />
        </div>

        {/* Phase Display */}
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            {/* Icon */}
            <motion.div
              className="text-4xl mb-3 font-light"
              animate={
                config.animation === 'spin' ? { rotate: 360 } :
                config.animation === 'pulse' ? { opacity: [1, 0.5, 1] } :
                config.animation === 'bounce' ? { y: [0, -5, 0] } :
                {}
              }
              transition={{
                duration: config.animation === 'spin' ? 2 : 1,
                repeat: Infinity,
                ease: config.animation === 'spin' ? 'linear' : 'easeInOut',
              }}
            >
              {config.icon}
            </motion.div>

            {/* Title */}
            <h3 className="text-xl font-mono font-bold tracking-wider mb-1">
              {config.title}
            </h3>

            {/* Subtitle */}
            <p className="text-sm text-zinc-500 font-mono">
              {config.subtitle}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Details Panel */}
        {details && Object.keys(details).length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-6 pt-6 border-t border-white/10"
          >
            <div className="grid grid-cols-2 gap-4">
              {details.memoriesFound !== undefined && (
                <DetailItem label="Memories Found" value={details.memoriesFound} />
              )}
              {details.correctionsApplied !== undefined && (
                <DetailItem label="Corrections" value={details.correctionsApplied} />
              )}
              {details.confidenceScore !== undefined && (
                <DetailItem 
                  label="Confidence" 
                  value={`${(details.confidenceScore * 100).toFixed(1)}%`} 
                  highlight={details.confidenceScore >= 0.8}
                />
              )}
              {details.requiresHumanReview !== undefined && (
                <DetailItem 
                  label="Review Status" 
                  value={details.requiresHumanReview ? 'REQUIRED' : 'AUTO-APPROVED'} 
                  highlight={!details.requiresHumanReview}
                />
              )}
            </div>
            {details.errorMessage && (
              <p className="mt-4 text-sm text-zinc-400 font-mono">
                {details.errorMessage}
              </p>
            )}
          </motion.div>
        )}

        {/* Processing bar */}
        {isProcessing && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20"
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </div>
    </div>
  );
}

function DetailItem({ 
  label, 
  value, 
  highlight = false 
}: { 
  label: string; 
  value: string | number; 
  highlight?: boolean;
}) {
  return (
    <div className="text-center">
      <p className="text-xs text-zinc-600 font-mono tracking-wider mb-1">
        {label}
      </p>
      <p className={`text-lg font-mono font-bold ${highlight ? 'text-white' : 'text-zinc-400'}`}>
        {value}
      </p>
    </div>
  );
}

// ============================================================================
// AGENT THINKING ANIMATION (Standalone)
// ============================================================================

export function AgentThinking({ messages }: { messages: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (messages.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [messages.length]);

  if (messages.length === 0) return null;

  return (
    <div className="flex items-center gap-3 py-2">
      <motion.div
        className="flex gap-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-white"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </motion.div>
      <AnimatePresence mode="wait">
        <motion.span
          key={currentIndex}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="text-sm font-mono text-zinc-400"
        >
          {messages[currentIndex]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

export default AgentState;
