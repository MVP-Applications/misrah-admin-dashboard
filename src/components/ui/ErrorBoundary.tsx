import React from 'react';
import { TriangleAlert } from 'lucide-react';

interface ErrorBoundaryProps {
  // Shown in the fallback, e.g. "Experiences".
  label: string;
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

// Turns a render crash into a visible, recoverable message instead of a
// blank screen, and logs it so the offending data can be found.
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // This project has no @types/react, so React.Component's members are
  // untyped here — declare the two this class uses.
  declare props: ErrorBoundaryProps;
  declare setState: (state: Partial<ErrorBoundaryState>) => void;
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error(`[${this.props.label}] render crash:`, error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="bg-danger/5 rounded-[48px] border border-danger/20 p-16 text-center shadow-sm space-y-4">
          <TriangleAlert size={40} className="mx-auto text-danger" />
          <h3 className="text-xl font-black italic text-danger uppercase">{this.props.label} failed to display</h3>
          <p className="text-[10px] font-bold text-danger/70 uppercase tracking-widest break-all">{this.state.error.message}</p>
          <button
            onClick={() => this.setState({ error: null })}
            className="mt-4 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[2px] bg-primary text-white hover:opacity-90 transition-all"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
