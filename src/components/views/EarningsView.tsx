import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  Download, 
  Filter, 
  Wallet, 
  Banknote, 
  CreditCard,
  X,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  History,
  RotateCcw
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { StatCard } from '../ui/StatCard';
import { User } from '../../types';

interface EarningsViewProps {
  user: User;
}

export const EarningsView = ({ user }: EarningsViewProps) => {
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawStep, setWithdrawStep] = useState<'form' | 'processing' | 'success'>('form');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const transactions = [
    { id: 'tx1', status: 'Completed', amount: 4500, date: 'JAN 15', type: 'Payout', bank: 'ENBD (****4521)' },
    { id: 'tx2', status: 'Processing', amount: 2150, date: 'JAN 14', type: 'Booking', guest: 'Zayed Al Mansouri' },
    { id: 'tx3', status: 'Completed', amount: 5200, date: 'JAN 12', type: 'Payout', bank: 'ADCB (****7892)' },
    { id: 'tx8', status: 'Refunded', amount: 850, date: 'JAN 11', type: 'Refund', guest: 'M. Al Maktoum', adminOnly: true },
    { id: 'tx4', status: 'Completed', amount: 1800, date: 'JAN 10', type: 'Booking', guest: 'Sarah Jenkins' },
    { id: 'tx5', status: 'Completed', amount: 1800, date: 'JAN 08', type: 'Booking', guest: 'Omar Khalid' },
    { id: 'tx7', status: 'Refunded', amount: 1200, date: 'JAN 06', type: 'Refund', guest: 'Abdulla S.', adminOnly: true },
    { id: 'tx6', status: 'Completed', amount: 3200, date: 'JAN 05', type: 'Booking', guest: 'Laila R.' },
  ].filter(tx => !tx.adminOnly || user.role === 'admin');

  const handleWithdraw = () => {
    if (!withdrawAmount) return;
    setWithdrawStep('processing');
    setTimeout(() => {
      setWithdrawStep('success');
    }, 2000);
  };

  const closeWithdraw = () => {
    setIsWithdrawing(false);
    setTimeout(() => {
      setWithdrawStep('form');
      setWithdrawAmount('');
    }, 300);
  };

  return (
    <div className="relative space-y-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Dynamic Background Flair */}
      <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px] opacity-50" />
      <div className="absolute top-1/2 left-0 -z-10 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] opacity-30" />

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-8 border-b border-border-misrah/20">
        <div className="space-y-3">
          <Badge variant="gold" className="text-[9px]">Financial Node v2.0</Badge>
          <h1 className="text-5xl md:text-6xl font-sans font-black italic text-primary leading-none uppercase tracking-tighter">Earnings & Yield</h1>
          <p className="text-muted-text text-[10px] font-black uppercase tracking-[4px] opacity-60 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
            {user.role === 'admin' ? 'Total Treasury Monitoring' : 'Personal Revenue Analytics'}
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button className="flex items-center gap-2 px-8 py-4 rounded-2xl border border-border-misrah bg-white text-[10px] font-black uppercase tracking-[3px] hover:border-accent hover:shadow-lg transition-all shadow-sm group">
            <Download size={14} className="group-hover:-translate-y-0.5 transition-transform" />
            Audit Report
          </button>
          <button 
            onClick={() => setIsWithdrawing(true)}
            className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary text-accent text-[10px] font-black uppercase tracking-[3px] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all group"
          >
            <Banknote size={16} className="group-hover:translate-x-0.5 transition-transform" />
            Withdraw Now
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Revenue (AED)" value="35,400" change="↑ +12.5% VS DEC" icon={Wallet} dark />
        <StatCard label="In Escrow" value="12,150" change="SETTLEMENT FLOW" icon={History} />
        <StatCard label="Avg. Nightly Rate" value="1,150" change="↓ -2.1% SEASONALITY" icon={TrendingUp} />
        {user.role === 'admin' ? (
          <StatCard label="Total Refunded" value="2,050" change="↑ +5.2% SYSTEM" icon={RotateCcw} />
        ) : (
           <StatCard label="Active Nodes" value="8" change="FULLY DEPLOYED" icon={CheckCircle2} />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        <div className="lg:col-span-3 bg-white rounded-[48px] border border-border-misrah overflow-hidden shadow-sm flex flex-col h-[750px] hover:shadow-luxury transition-all duration-500">
           <div className="p-10 border-b border-border-misrah/50 flex items-center justify-between bg-surface/10 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-accent shadow-lg shadow-primary/20">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h2 className="text-2xl font-sans font-black italic text-primary uppercase tracking-tight">Revenue Matrix</h2>
                  <p className="text-[10px] font-black text-muted-text/50 uppercase tracking-[4px] mt-1">Cross-Asset Yield Analytics</p>
                </div>
              </div>
              <div className="flex bg-surface p-1.5 rounded-2xl border border-border-misrah/50 shadow-inner group">
                 {['D', 'W', 'M', 'Y'].map(t => (
                   <button key={t} className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black transition-all ${t === 'M' ? 'bg-primary text-accent shadow-lg shadow-primary/20' : 'text-muted-text/40 hover:text-primary hover:bg-white'}`}>{t}</button>
                 ))}
              </div>
           </div>
           
           <div className="flex-1 p-10 flex flex-col overflow-hidden">
              <div className="flex items-end gap-3 h-64 mb-16 px-2 shrink-0">
                {[45, 62, 38, 85, 42, 59, 73, 91, 55, 68, 82, 95].map((val, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-4 group h-full">
                    <div className="w-full relative bg-surface/50 rounded-2xl overflow-hidden h-full border border-border-misrah/10">
                       <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${val}%` }}
                        transition={{ duration: 1, delay: i * 0.05 }}
                        className="absolute inset-x-0 bottom-0 bg-linear-to-t from-primary/30 via-primary/60 to-accent rounded-t-xl group-hover:from-primary group-hover:to-accent transition-all duration-700" 
                       />
                       <div className="absolute inset-x-0 top-0 h-1 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-[9px] font-black text-muted-text/30 group-hover:text-primary transition-colors tracking-[1px] uppercase">{['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][i]}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-auto shrink-0">
                <div className="p-8 rounded-[40px] bg-surface/30 border border-border-misrah/50 hover:bg-white hover:shadow-luxury transition-all duration-500 border-b-4 border-b-success/30 relative overflow-hidden group">
                  <div className="relative z-10 flex items-center justify-between mb-8">
                    <span className="text-[10px] font-black text-primary/40 uppercase tracking-[4px]">Operational Occupancy</span>
                    <div className="w-10 h-10 flex items-center justify-center bg-success/10 text-success rounded-xl shadow-inner group-hover:scale-110 group-hover:rotate-12 transition-transform">
                      <ArrowUpRight size={18} />
                    </div>
                  </div>
                  <div className="relative z-10 text-5xl font-sans font-black italic text-primary">92.4%</div>
                  <div className="relative z-10 text-[9px] font-black text-success uppercase tracking-[3px] mt-4 px-4 py-2 bg-success/10 rounded-full w-fit flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    Above Forecast
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-success/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                </div>
                <div className="p-8 rounded-[40px] bg-surface/30 border border-border-misrah/50 hover:bg-white hover:shadow-luxury transition-all duration-500 border-b-4 border-b-secondary/30 relative overflow-hidden group">
                  <div className="relative z-10 flex items-center justify-between mb-8">
                    <span className="text-[10px] font-black text-primary/40 uppercase tracking-[4px]">Net Yield Momentum</span>
                    <div className="w-10 h-10 flex items-center justify-center bg-secondary/10 text-secondary rounded-xl shadow-inner group-hover:scale-110 group-hover:-rotate-12 transition-transform">
                      <TrendingUp size={18} />
                    </div>
                  </div>
                  <div className="relative z-10 text-5xl font-sans font-black italic text-primary">+8.4<span className="text-lg not-italic font-sans opacity-40 ml-1">%</span></div>
                  <div className="relative z-10 text-[9px] font-black text-secondary uppercase tracking-[3px] mt-4 px-4 py-2 bg-secondary/10 rounded-full w-fit flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                    Sector Leading
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                </div>
              </div>
           </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-[48px] border border-border-misrah overflow-hidden shadow-sm flex flex-col h-[750px] hover:shadow-luxury transition-all duration-500">
           <div className="p-10 border-b border-border-misrah/50 flex items-center justify-between bg-surface/10 backdrop-blur-md shrink-0">
              <div>
                <h2 className="text-2xl font-sans font-black italic text-primary uppercase tracking-tight">Ledger</h2>
                <p className="text-[10px] font-black text-muted-text/50 uppercase tracking-[4px] mt-1.5">Asset Protocol History</p>
              </div>
              <button className="w-12 h-12 rounded-2xl bg-white border border-border-misrah flex items-center justify-center text-primary hover:border-accent hover:shadow-lg transition-all shadow-sm">
                <Filter size={20} />
              </button>
           </div>

           <div className="divide-y divide-border-misrah/30 overflow-hidden flex-1">
             {transactions.slice(0, 7).map(tx => (
               <div key={tx.id} className="p-8 h-20 flex items-center justify-between hover:bg-surface/50 transition-all group cursor-pointer border-l-4 border-l-transparent hover:border-l-accent animate-in fade-in duration-500">
                  <div className="flex items-center gap-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-500 
                      ${tx.type === 'Payout' ? 'bg-primary border-primary text-accent shadow-lg shadow-primary/20' : 
                        tx.type === 'Refund' ? 'bg-danger/10 border-danger/20 text-danger' :
                        'bg-surface border-border-misrah text-accent shadow-inner group-hover:bg-white group-hover:border-accent'}`}>
                      {tx.type === 'Payout' ? <ArrowDownRight size={18} /> : 
                       tx.type === 'Refund' ? <RotateCcw size={18} /> :
                       <Banknote size={18} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-black text-primary uppercase tracking-tight">{tx.type}</span>
                        <Badge variant={
                          tx.status === 'Completed' ? 'green' : 
                          tx.status === 'Refunded' ? 'red' : 'gold'
                        } className="scale-75 origin-left">{tx.status}</Badge>
                      </div>
                      <p className="text-[8px] font-black text-muted-text/50 uppercase tracking-[3px]">{tx.date} · {tx.type === 'Payout' ? tx.bank : tx.guest}</p>
                    </div>
                  </div>
                  <div className={`text-xl font-sans font-black italic 
                    ${tx.type === 'Payout' ? 'text-primary' : 
                      tx.type === 'Refund' ? 'text-danger' : 
                      'text-accent'}`}>
                    {tx.type === 'Payout' || tx.type === 'Refund' ? '-' : '+'}{tx.amount.toLocaleString()} <span className="text-[9px] font-sans font-bold not-italic text-muted-text uppercase tracking-[2px] ml-1">AED</span>
                  </div>
               </div>
             ))}
             {transactions.length > 7 && (
                <button className="w-full py-6 text-[10px] font-black text-center text-muted-text/30 hover:text-primary uppercase tracking-[4px] transition-colors">
                  View Full History Protocol
                </button>
             )}
           </div>
        </div>
      </div>

      {/* Withdraw Modal */}
      <AnimatePresence>
        {isWithdrawing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeWithdraw}
              className="absolute inset-0 bg-primary/20 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="relative w-full max-w-xl bg-white rounded-[56px] border border-border-misrah shadow-luxury overflow-hidden p-12"
            >
              <button 
                onClick={closeWithdraw}
                className="absolute top-10 right-10 w-12 h-12 rounded-2xl bg-surface border border-border-misrah flex items-center justify-center text-muted-text hover:text-primary transition-all group"
              >
                <X size={20} className="group-hover:rotate-90 transition-transform" />
              </button>

              {withdrawStep === 'form' && (
                <div className="space-y-10">
                  <div className="space-y-4 text-center">
                    <div className="w-20 h-20 bg-primary/10 rounded-[32px] flex items-center justify-center mx-auto text-primary mb-6 shadow-inner">
                      <Wallet size={32} />
                    </div>
                    <h2 className="text-4xl font-sans font-black italic text-primary uppercase tracking-tighter">Settlement Flow</h2>
                    <p className="text-[10px] font-black text-muted-text/50 uppercase tracking-[4px]">Transfer funds to your verified node</p>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-primary/40 uppercase tracking-[4px] ml-4">Withdrawal Amount (AED)</label>
                      <div className="relative group">
                        <input 
                          type="number"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          placeholder="0,000.00"
                          className="w-full bg-surface border-2 border-border-misrah rounded-[32px] p-8 text-3xl font-sans font-black italic text-primary placeholder:text-muted-text/20 focus:border-accent focus:outline-none transition-all shadow-inner group-hover:border-border-misrah/50"
                        />
                        <div className="absolute right-8 top-1/2 -translate-y-1/2 text-muted-text/30 font-black italic mb-1 uppercase tracking-tighter">AED</div>
                      </div>
                      <div className="flex justify-between items-center px-4">
                        <span className="text-[10px] font-black text-muted-text/50 uppercase tracking-widest">Available Treasury: 23,250.00 AED</span>
                        <button 
                          onClick={() => setWithdrawAmount('23250')}
                          className="text-[10px] font-black text-accent hover:text-primary uppercase tracking-widest transition-colors underline underline-offset-4"
                        >
                          Withdraw Max
                        </button>
                      </div>
                    </div>

                    <div className="p-8 rounded-[32px] bg-surface/50 border border-border-misrah/50 flex items-center gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-white border border-border-misrah flex items-center justify-center text-primary shadow-sm">
                        <CreditCard size={24} />
                      </div>
                      <div className="flex-1">
                        <div className="text-[9px] font-black text-primary/30 uppercase tracking-[3px] mb-1">Destination Protocol</div>
                        <div className="text-sm font-black text-primary uppercase tracking-tight">ENBD (**** 4521)</div>
                      </div>
                      <Badge variant="blue" className="text-[9px]">Verified</Badge>
                    </div>

                    <button 
                      onClick={handleWithdraw}
                      disabled={!withdrawAmount || Number(withdrawAmount) <= 0}
                      className="w-full py-8 rounded-[32px] bg-primary text-accent text-sm font-black uppercase tracking-[4px] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale disabled:hover:scale-100 flex items-center justify-center gap-4 group"
                    >
                      Initialize Transfer
                      <ArrowUpRight size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </button>
                    
                    <div className="flex items-center justify-center gap-2 text-[8px] font-black text-muted-text/40 uppercase tracking-[3px]">
                      <AlertCircle size={10} />
                      Estimated settlement: 24-48 Business hours
                    </div>
                  </div>
                </div>
              )}

              {withdrawStep === 'processing' && (
                <div className="py-20 flex flex-col items-center justify-center space-y-10">
                  <div className="relative w-32 h-32">
                    <div className="absolute inset-0 rounded-full border-4 border-surface border-t-accent animate-spin" />
                    <div className="absolute inset-4 rounded-full border-4 border-surface border-b-primary animate-spin-reverse" />
                    <div className="absolute inset-0 flex items-center justify-center text-primary">
                      <TrendingUp size={32} />
                    </div>
                  </div>
                  <div className="text-center space-y-4">
                    <h3 className="text-3xl font-sans font-black italic text-primary uppercase tracking-tighter">Validating Node</h3>
                    <p className="text-[10px] font-black text-muted-text/50 uppercase tracking-[4px] animate-pulse">Syncing with banking ledger...</p>
                  </div>
                </div>
              )}

              {withdrawStep === 'success' && (
                <div className="py-10 space-y-10 text-center animate-in zoom-in-95 duration-500">
                  <div className="w-24 h-24 bg-success/10 rounded-[40px] flex items-center justify-center mx-auto text-success shadow-inner mb-6">
                    <CheckCircle2 size={48} />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-4xl font-sans font-black italic text-primary uppercase tracking-tighter">Transfer Initiated</h3>
                    <p className="text-[11px] font-black text-muted-text/60 uppercase tracking-[4px] leading-relaxed max-w-sm mx-auto">
                      Your settlement of <span className="text-primary">{Number(withdrawAmount).toLocaleString()}.00 AED</span> has been approved and is being routed to your node.
                    </p>
                  </div>
                  
                  <div className="p-8 rounded-[32px] bg-surface/50 border border-border-misrah/50 max-w-xs mx-auto">
                    <div className="text-[9px] font-black text-muted-text/40 uppercase tracking-[3px] mb-2">Protocol Reference</div>
                    <div className="text-sm font-mono font-bold text-primary uppercase opacity-60">MIS-TX-{Math.random().toString(36).substring(7).toUpperCase()}</div>
                  </div>

                  <button 
                    onClick={closeWithdraw}
                    className="w-full max-w-sm mx-auto py-7 rounded-[32px] bg-surface border-2 border-border-misrah hover:border-primary text-primary text-[10px] font-black uppercase tracking-[4px] transition-all"
                  >
                    Close Transaction
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
