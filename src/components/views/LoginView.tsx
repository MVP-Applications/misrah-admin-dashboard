import React, { useState } from 'react';
import { Shield, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';

export const LoginView = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotNote, setShowForgotNote] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      const message = err && typeof err === 'object' && 'message' in err
        ? String((err as { message: unknown }).message)
        : 'Login failed. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

      <div className="w-full max-w-sm relative z-10 text-center">
        <div className="flex flex-col items-center mb-12">
           <div className="w-20 h-20 bg-accent flex items-center justify-center rounded-[32px] shadow-2xl shadow-accent/20 mb-8">
             <Shield size={40} className="text-primary" />
           </div>
           <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter leading-none mb-2">Misrah Elite</h1>
           <p className="text-[10px] font-black text-accent uppercase tracking-[4px] opacity-80">Strategic Hospitality Management</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-[48px] shadow-2xl space-y-8 text-left">
           <div className="space-y-4">
             <div className="space-y-2">
               <label htmlFor="email" className="text-[10px] font-black text-white/40 uppercase tracking-[2px]">Email</label>
               <input
                 id="email"
                 type="email"
                 autoComplete="email"
                 required
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 disabled={isSubmitting}
                 className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white font-bold focus:outline-none focus:border-accent transition-all disabled:opacity-50"
                 placeholder="admin@misrah.ae"
               />
             </div>
             <div className="space-y-2">
               <label htmlFor="password" className="text-[10px] font-black text-white/40 uppercase tracking-[2px]">Password</label>
               <input
                 id="password"
                 type="password"
                 autoComplete="current-password"
                 required
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 disabled={isSubmitting}
                 className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white font-bold focus:outline-none focus:border-accent transition-all disabled:opacity-50"
                 placeholder="••••••••"
               />
             </div>
           </div>

           {error && (
             <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest text-center leading-relaxed">
               {error}
             </p>
           )}

           <div className="space-y-4">
             <button
               type="submit"
               disabled={isSubmitting}
               className="w-full bg-accent text-primary py-5 rounded-[28px] text-[10px] font-black uppercase tracking-[3px] shadow-2xl shadow-accent/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 group disabled:opacity-60 disabled:hover:scale-100"
             >
               {isSubmitting ? (
                 <>
                   <Loader2 size={16} className="animate-spin" />
                   Authenticating
                 </>
               ) : (
                 <>
                   Initialize Interface
                   <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                 </>
               )}
             </button>

             {/* TODO: forgot/reset password flow is not implemented yet (deferred). */}
             <button
               type="button"
               onClick={() => setShowForgotNote(true)}
               className="w-full text-center text-[9px] font-bold text-white/30 hover:text-white/50 uppercase tracking-[2px] transition-colors"
             >
               Forgot password?
             </button>
             {showForgotNote && (
               <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest text-center leading-relaxed">
                 Coming soon — contact your administrator in the meantime.
               </p>
             )}
           </div>
        </form>

        <p className="mt-12 text-[9px] font-bold text-white/30 uppercase tracking-[2px]">Secure encrypted connection active · Production protocol v2.4</p>
      </div>
    </div>
  );
};
