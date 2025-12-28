'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

// ============================================================================
// NAVIGATION COMPONENT
// ============================================================================

export function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card-dark">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <motion.div
                className="w-8 h-8 border border-white/30 rounded-sm flex items-center justify-center"
                whileHover={{ scale: 1.05, borderColor: 'rgba(255,255,255,0.5)' }}
              >
                <span className="font-mono text-xs font-bold">IM</span>
              </motion.div>
              <motion.div
                className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-white"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <span className="font-mono text-sm tracking-widest text-zinc-400 group-hover:text-white transition-colors">
              INVOICE.MEMORY
            </span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-8">
            <NavLink href="/">Dashboard</NavLink>
            <NavLink href="/invoice">Process</NavLink>
            <NavLink href="/rules">Rules</NavLink>
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm font-mono text-zinc-500 hover:text-white transition-colors tracking-wider"
    >
      {children}
    </Link>
  );
}

// ============================================================================
// METRIC CARD COMPONENT
// ============================================================================

interface MetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
}

export function MetricCard({ label, value, subtitle, icon }: MetricCardProps) {
  return (
    <motion.div
      className="glass-card rounded-xl p-6 relative overflow-hidden group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background glow on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-mono text-zinc-500 tracking-widest">
            {label}
          </span>
          {icon && (
            <div className="text-zinc-600">
              {icon}
            </div>
          )}
        </div>

        <div className="text-4xl font-mono font-bold text-white mb-1">
          {value}
        </div>

        {subtitle && (
          <p className="text-sm text-zinc-500 font-mono">
            {subtitle}
          </p>
        )}
      </div>

      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-16 h-16">
        <div className="absolute top-0 right-0 w-px h-8 bg-gradient-to-b from-white/20 to-transparent" />
        <div className="absolute top-0 right-0 w-8 h-px bg-gradient-to-l from-white/20 to-transparent" />
      </div>
    </motion.div>
  );
}

// ============================================================================
// CODE BLOCK COMPONENT
// ============================================================================

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  maxHeight?: string;
}

export function CodeBlock({ code, language = 'json', title, maxHeight = '400px' }: CodeBlockProps) {
  return (
    <div className="code-block">
      {title && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/50">
          <span className="text-xs font-mono text-zinc-500 tracking-wider">
            {title}
          </span>
          <span className="text-xs font-mono text-zinc-600">
            {language.toUpperCase()}
          </span>
        </div>
      )}
      <pre
        className="overflow-auto"
        style={{ maxHeight }}
      >
        <code className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
          {code}
        </code>
      </pre>
    </div>
  );
}

// ============================================================================
// STATUS BADGE COMPONENT
// ============================================================================

interface StatusBadgeProps {
  status: 'online' | 'offline' | 'processing' | 'error' | 'warning';
  label?: string;
  pulse?: boolean;
}

export function StatusBadge({ status, label, pulse = true }: StatusBadgeProps) {
  const statusConfig = {
    online: { color: 'bg-white', text: 'ONLINE' },
    offline: { color: 'bg-zinc-600', text: 'OFFLINE' },
    processing: { color: 'bg-white', text: 'PROCESSING' },
    error: { color: 'bg-zinc-500', text: 'ERROR' },
    warning: { color: 'bg-zinc-400', text: 'WARNING' },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <motion.div
        className={`w-2 h-2 rounded-full ${config.color}`}
        animate={pulse && status === 'online' ? {
          opacity: [1, 0.5, 1],
          scale: [1, 1.1, 1],
        } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <span className="text-xs font-mono tracking-wider text-zinc-400">
        {label || config.text}
      </span>
    </div>
  );
}

// ============================================================================
// BUTTON COMPONENTS
// ============================================================================

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  className = '',
  children,
  type = 'button',
}: ButtonProps) {
  const baseStyles = 'font-mono tracking-wider transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-white text-black hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-95',
    secondary: 'bg-transparent text-white border border-white/20 hover:bg-white/5 hover:border-white/30',
    ghost: 'bg-transparent text-zinc-400 hover:text-white hover:bg-white/5',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-8 py-3.5 text-base',
  };

  return (
    <motion.button
      type={type}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} rounded-md ${className}`}
      whileTap={{ scale: 0.95 }}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <motion.span
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          Processing...
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
}

// ============================================================================
// INPUT COMPONENT
// ============================================================================

interface InputProps {
  label?: string;
  error?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  type?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-mono text-zinc-500 tracking-wider">
          {label}
        </label>
      )}
      <input
        className={`input-dark w-full ${error ? 'border-zinc-500' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="text-xs font-mono text-zinc-500">{error}</p>
      )}
    </div>
  );
}

// ============================================================================
// TEXTAREA COMPONENT
// ============================================================================

interface TextareaProps {
  label?: string;
  error?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
  rows?: number;
}

export function Textarea({ label, error, className = '', ...props }: TextareaProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-mono text-zinc-500 tracking-wider">
          {label}
        </label>
      )}
      <textarea
        className={`input-dark w-full resize-none ${error ? 'border-zinc-500' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="text-xs font-mono text-zinc-500">{error}</p>
      )}
    </div>
  );
}

// ============================================================================
// DIVIDER COMPONENT
// ============================================================================

export function Divider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-4 my-8">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      {label && (
        <span className="text-xs font-mono text-zinc-600 tracking-widest">
          {label}
        </span>
      )}
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}

export default {
  Navigation,
  MetricCard,
  CodeBlock,
  StatusBadge,
  Button,
  Input,
  Textarea,
  Divider,
};
