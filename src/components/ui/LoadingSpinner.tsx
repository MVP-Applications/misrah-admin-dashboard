import React from 'react';
import { Loader2 } from 'lucide-react';

// The one loading indicator for page / section / list loading states, so every
// screen looks the same while it loads. Small spinners inside buttons keep
// using <Loader2 size={14} className="animate-spin" /> directly.
export const LoadingSpinner = ({ className = '' }: { className?: string }) => (
  <Loader2 size={32} role="status" aria-label="Loading" className={`animate-spin text-primary/30 ${className}`} />
);
