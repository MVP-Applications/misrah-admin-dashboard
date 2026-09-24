import React, { useState, useMemo } from 'react';
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
  RotateCcw,
  Search,
  FileText,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Building2,
  ArrowRight
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { StatCard } from '../ui/StatCard';
import { User } from '../../types';

interface EarningsViewProps {
  user: User;
}

interface TransactionRecord {
  id: string;
  ref: string;
  status: 'Completed' | 'Processing' | 'Refunded';
  amount: number;
  date: string;
  fullDate: string;
  type: 'Payout' | 'Booking' | 'Refund';
  bank?: string;
  guest?: string;
  asset?: string;
  channel?: string;
  hash: string;
  adminOnly?: boolean;
}

export const EarningsView = ({ user }: EarningsViewProps) => {
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawStep, setWithdrawStep] = useState<'form' | 'processing' | 'success'>('form');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  // Full History Protocol Modal State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Payout' | 'Booking' | 'Refund'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Completed' | 'Processing' | 'Refunded'>('All');
  const [selectedTxForVoucher, setSelectedTxForVoucher] = useState<TransactionRecord | null>(null);
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState(false);

  const allTransactions: TransactionRecord[] = useMemo(() => [
    { id: 'tx1', ref: 'MIS-TX-98421', status: 'Completed', amount: 4500, date: 'JAN 15', fullDate: '15 Jan 2026, 14:32 GST', type: 'Payout', bank: 'ENBD (****4521)', channel: 'Direct Clearing / UAE Central Bank', hash: '0x8f29...b4c1' },
    { id: 'tx2', ref: 'MIS-TX-98418', status: 'Processing', amount: 2150, date: 'JAN 14', fullDate: '14 Jan 2026, 19:15 GST', type: 'Booking', guest: 'Zayed Al Mansouri', asset: 'Palm Jumeirah Ultra Villa', channel: 'Apple Pay / Visa Platinum', hash: '0x3a19...d902' },
    { id: 'tx3', ref: 'MIS-TX-98390', status: 'Completed', amount: 5200, date: 'JAN 12', fullDate: '12 Jan 2026, 11:04 GST', type: 'Payout', bank: 'ADCB (****7892)', channel: 'Automated Batch Settlement', hash: '0x17c0...fe24' },
    { id: 'tx8', ref: 'MIS-TX-98355', status: 'Refunded', amount: 850, date: 'JAN 11', fullDate: '11 Jan 2026, 09:45 GST', type: 'Refund', guest: 'M. Al Maktoum', asset: 'Dubai Marina Luxury Yacht', channel: 'Force Majeure Weather Adjustment', hash: '0x6e2a...98a3', adminOnly: true },
    { id: 'tx4', ref: 'MIS-TX-98312', status: 'Completed', amount: 1800, date: 'JAN 10', fullDate: '10 Jan 2026, 16:20 GST', type: 'Booking', guest: 'Sarah Jenkins', asset: 'Sunset Desert Dune Safari', channel: 'Mastercard World Elite', hash: '0x41f9...cb10' },
    { id: 'tx5', ref: 'MIS-TX-98288', status: 'Completed', amount: 1800, date: 'JAN 08', fullDate: '08 Jan 2026, 13:50 GST', type: 'Booking', guest: 'Omar Khalid', asset: 'Downtown Sky Penthouse', channel: 'Misrah Instant Reserve', hash: '0x92db...517e' },
    { id: 'tx7', ref: 'MIS-TX-98240', status: 'Refunded', amount: 1200, date: 'JAN 06', fullDate: '06 Jan 2026, 10:12 GST', type: 'Refund', guest: 'Abdulla S.', asset: 'Al Barari Royal Oasis', channel: 'Early Checkout Settlement', hash: '0x741a...a820', adminOnly: true },
    { id: 'tx6', ref: 'MIS-TX-98205', status: 'Completed', amount: 3200, date: 'JAN 05', fullDate: '05 Jan 2026, 18:02 GST', type: 'Booking', guest: 'Laila R.', asset: 'Al Barari Royal Oasis', channel: 'Amex Centurion Direct', hash: '0xbb29...41cf' },
    { id: 'tx9', ref: 'MIS-TX-98180', status: 'Completed', amount: 4100, date: 'DEC 30', fullDate: '30 Dec 2025, 21:10 GST', type: 'Booking', guest: 'Alexander Wright', asset: 'JBR Skyline Haven', channel: 'Visa Infinite', hash: '0x51c9...33aa' },
    { id: 'tx10', ref: 'MIS-TX-98144', status: 'Completed', amount: 6800, date: 'DEC 28', fullDate: '28 Dec 2025, 12:40 GST', type: 'Payout', bank: 'FAB (****1190)', channel: 'Quarterly Disbursal Protocol', hash: '0x88ea...611b' },
    { id: 'tx11', ref: 'MIS-TX-98092', status: 'Completed', amount: 5500, date: 'DEC 24', fullDate: '24 Dec 2025, 15:30 GST', type: 'Booking', guest: 'Fatima Al Nuaimi', asset: 'Palm Jumeirah Ultra Villa', channel: 'Direct Escrow Transfer', hash: '0x4f12...7e99' },
    { id: 'tx12', ref: 'MIS-TX-98040', status: 'Completed', amount: 2600, date: 'DEC 20', fullDate: '20 Dec 2025, 17:15 GST', type: 'Booking', guest: 'Carlos Mendez', asset: 'Private Yacht Sunset Cruise', channel: 'Apple Pay Gateway', hash: '0x29cc...09a1' },
    { id: 'tx13', ref: 'MIS-TX-97995', status: 'Refunded', amount: 650, date: 'DEC 18', fullDate: '18 Dec 2025, 14:05 GST', type: 'Refund', guest: 'Elena Rostova', asset: 'Al Marmoom Stargazing Camp', channel: 'Mutual Cancellation Protocol', hash: '0x77ab...21c4', adminOnly: true },
    { id: 'tx14', ref: 'MIS-TX-97950', status: 'Completed', amount: 7400, date: 'DEC 15', fullDate: '15 Dec 2025, 11:22 GST', type: 'Payout', bank: 'ENBD (****4521)', channel: 'Scheduled Treasury Route', hash: '0x99dd...184f' },
    { id: 'tx15', ref: 'MIS-TX-97880', status: 'Completed', amount: 3800, date: 'DEC 12', fullDate: '12 Dec 2025, 20:00 GST', type: 'Booking', guest: 'Tariq Al Hashemi', asset: 'Downtown Sky Penthouse', channel: 'GCC Net Debit', hash: '0x10ae...42fa' },
  ], []);

  const transactions = useMemo(() => {
    return allTransactions.filter(tx => !tx.adminOnly || user.role === 'admin');
  }, [allTransactions, user.role]);

  // Filtered transactions for the Full History Protocol Modal
  const filteredHistory = useMemo(() => {
    return transactions.filter(tx => {
      // Type filter
      if (typeFilter !== 'All' && tx.type !== typeFilter) return false;
      // Status filter
      if (statusFilter !== 'All' && tx.status !== statusFilter) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchRef = tx.ref.toLowerCase().includes(q);
        const matchGuest = tx.guest ? tx.guest.toLowerCase().includes(q) : false;
        const matchBank = tx.bank ? tx.bank.toLowerCase().includes(q) : false;
        const matchAsset = tx.asset ? tx.asset.toLowerCase().includes(q) : false;
        const matchChannel = tx.channel ? tx.channel.toLowerCase().includes(q) : false;
        return matchRef || matchGuest || matchBank || matchAsset || matchChannel;
      }
      return true;
    });
  }, [transactions, typeFilter, statusFilter, searchQuery]);

  // Summary figures for filtered protocol
  const totalInflow = useMemo(() => {
    return filteredHistory.filter(t => t.type === 'Booking').reduce((acc, curr) => acc + curr.amount, 0);
  }, [filteredHistory]);

  const totalOutflow = useMemo(() => {
    return filteredHistory.filter(t => t.type === 'Payout' || t.type === 'Refund').reduce((acc, curr) => acc + curr.amount, 0);
  }, [filteredHistory]);

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

  // CSV Export implementation
  const handleExportCSV = () => {
    const headers = ['Reference ID', 'Date & Time', 'Type', 'Beneficiary / Counterparty', 'Asset / Channel', 'Status', 'Amount (AED)', 'Hash'];
    const rows = filteredHistory.map(tx => [
      `"${tx.ref}"`,
      `"${tx.fullDate}"`,
      `"${tx.type}"`,
      `"${tx.type === 'Payout' ? tx.bank || 'Bank' : tx.guest || 'Counterparty'}"`,
      `"${tx.asset || tx.channel || 'Standard Protocol'}"`,
      `"${tx.status}"`,
      `"${tx.amount}"`,
      `"${tx.hash}"`
    ]);

    const csvString = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `misrah-treasury-protocol-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 3000);
  };

  const handleCopyRef = (ref: string) => {
    navigator.clipboard?.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 2000);
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
      {/* Export Confirmation Toast */}
      <AnimatePresence>
        {exportNotice && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 right-8 z-50 bg-primary text-accent px-6 py-3.5 rounded-2xl shadow-2xl border border-accent/20 flex items-center gap-3 text-xs font-black uppercase tracking-wider"
          >
            <CheckCircle2 size={16} className="text-accent" />
            <span>Treasury Audit CSV Dispatched Successfully</span>
          </motion.div>
        )}
      </AnimatePresence>

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

           <div className="divide-y divide-border-misrah/30 overflow-y-auto flex-1 scrollbar-hide">
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
             {/* WORKING "View Full History Protocol" Button */}
             <div className="p-4 bg-surface/30">
               <button 
                 onClick={() => setIsHistoryOpen(true)}
                 className="w-full py-5 rounded-2xl border-2 border-dashed border-border-misrah hover:border-accent bg-white hover:bg-accent/5 text-[11px] font-black text-center text-primary hover:text-accent uppercase tracking-[4px] transition-all flex items-center justify-center gap-3 shadow-xs group"
               >
                 <span>View Full History Protocol ({transactions.length} Records)</span>
                 <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
               </button>
             </div>
           </div>
        </div>
      </div>

      {/* FULL HISTORY PROTOCOL MODAL */}
      <AnimatePresence>
        {isHistoryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryOpen(false)}
              className="absolute inset-0 bg-primary/40 backdrop-blur-xl"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-5xl bg-white rounded-[40px] md:rounded-[56px] border border-border-misrah shadow-luxury overflow-hidden flex flex-col max-h-[90vh] z-10"
            >
              {/* Modal Header */}
              <div className="p-6 md:p-10 border-b border-border-misrah/50 bg-surface/20 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-accent shadow-xl shadow-primary/20 shrink-0">
                    <History size={26} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-2xl md:text-3xl font-sans font-black italic text-primary uppercase tracking-tight">
                        Treasury History Protocol
                      </h2>
                      <Badge variant="gold" className="text-[8px] uppercase">
                        {user.role === 'admin' ? 'Master Audit Node' : 'Verified Node'}
                      </Badge>
                    </div>
                    <p className="text-[10px] font-black text-muted-text uppercase tracking-[3px]">
                      Cryptographic Settlement Log · Cross-Asset Financial Ledger
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-surface border border-border-misrah hover:border-accent text-primary text-[10px] font-black uppercase tracking-wider transition-all shadow-xs"
                    title="Export filtered records to CSV"
                  >
                    <Download size={14} className="text-accent" />
                    <span>Export CSV</span>
                  </button>
                  <button 
                    onClick={() => setIsHistoryOpen(false)}
                    className="w-11 h-11 rounded-2xl bg-surface border border-border-misrah flex items-center justify-center text-muted-text hover:text-primary transition-all group"
                  >
                    <X size={18} className="group-hover:rotate-90 transition-transform" />
                  </button>
                </div>
              </div>

              {/* KPI Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 md:px-10 border-b border-border-misrah/30 bg-surface/10 shrink-0">
                <div className="p-4 rounded-2xl bg-white border border-border-misrah/40 shadow-2xs">
                  <span className="text-[9px] font-black text-muted-text/60 uppercase tracking-widest block mb-1">Total Records</span>
                  <div className="text-xl font-black text-primary italic">{filteredHistory.length} Transactions</div>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-border-misrah/40 shadow-2xs">
                  <span className="text-[9px] font-black text-success/80 uppercase tracking-widest block mb-1">Total Inflow (+)</span>
                  <div className="text-xl font-black text-success italic">+{totalInflow.toLocaleString()} AED</div>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-border-misrah/40 shadow-2xs">
                  <span className="text-[9px] font-black text-danger/80 uppercase tracking-widest block mb-1">Total Outflow (-)</span>
                  <div className="text-xl font-black text-danger italic">-{totalOutflow.toLocaleString()} AED</div>
                </div>
                <div className="p-4 rounded-2xl bg-primary text-accent border border-primary shadow-sm">
                  <span className="text-[9px] font-black text-white/60 uppercase tracking-widest block mb-1">Net Balance</span>
                  <div className="text-xl font-black text-accent italic">+{(totalInflow - totalOutflow).toLocaleString()} AED</div>
                </div>
              </div>

              {/* Filter Controls Bar */}
              <div className="p-6 md:px-10 border-b border-border-misrah/30 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-white shrink-0">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-text/50" />
                  <input
                    type="text"
                    placeholder="Search by Ref ID, guest, bank, or property..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-surface border border-border-misrah rounded-2xl text-xs font-medium text-primary placeholder:text-muted-text/40 outline-none focus:border-accent transition-all"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-text/40 hover:text-primary"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Type Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-wider text-muted-text/50 mr-1 hidden sm:inline">Type:</span>
                  {(['All', 'Booking', 'Payout', 'Refund'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setTypeFilter(type)}
                      className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                        typeFilter === type
                          ? 'bg-primary text-accent shadow-xs'
                          : 'bg-surface border border-border-misrah text-muted-text hover:text-primary'
                      }`}
                    >
                      {type}
                    </button>
                  ))}

                  <div className="h-4 w-[1px] bg-border-misrah mx-1 hidden sm:block"></div>

                  {/* Status Filters */}
                  <span className="text-[9px] font-black uppercase tracking-wider text-muted-text/50 mr-1 hidden sm:inline">Status:</span>
                  {(['All', 'Completed', 'Processing', 'Refunded'] as const).map(st => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                        statusFilter === st
                          ? 'bg-primary text-accent shadow-xs'
                          : 'bg-surface border border-border-misrah text-muted-text hover:text-primary'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transactions List */}
              <div className="flex-1 overflow-y-auto divide-y divide-border-misrah/30 p-6 md:p-10 space-y-3">
                {filteredHistory.length === 0 ? (
                  <div className="py-20 text-center space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-surface border border-border-misrah flex items-center justify-center mx-auto text-muted-text/40">
                      <FileText size={28} />
                    </div>
                    <div>
                      <h4 className="text-base font-black uppercase text-primary">No Matching Ledger Protocols</h4>
                      <p className="text-xs text-muted-text mt-1">Try resetting your search query or filter tags.</p>
                    </div>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setTypeFilter('All');
                        setStatusFilter('All');
                      }}
                      className="px-6 py-2.5 bg-surface hover:bg-white border border-border-misrah rounded-xl text-xs font-black uppercase tracking-wider text-primary"
                    >
                      Clear All Filters
                    </button>
                  </div>
                ) : (
                  filteredHistory.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-5 rounded-3xl border border-border-misrah/50 hover:border-accent hover:shadow-md bg-white hover:bg-surface/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                    >
                      <div className="flex items-start md:items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 transition-all ${
                          tx.type === 'Payout' ? 'bg-primary border-primary text-accent' : 
                          tx.type === 'Refund' ? 'bg-danger/10 border-danger/20 text-danger' : 
                          'bg-surface border-border-misrah text-accent'
                        }`}>
                          {tx.type === 'Payout' ? <ArrowDownRight size={20} /> : 
                           tx.type === 'Refund' ? <RotateCcw size={20} /> : 
                           <Banknote size={20} />}
                        </div>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span className="text-sm font-black text-primary uppercase tracking-tight">
                              {tx.type}
                            </span>
                            <span 
                              onClick={() => handleCopyRef(tx.ref)}
                              className="text-[10px] font-mono font-bold text-muted-text/80 bg-surface px-2 py-0.5 rounded-md border border-border-misrah/50 flex items-center gap-1 cursor-pointer hover:border-accent"
                              title="Click to copy Reference"
                            >
                              <span>{tx.ref}</span>
                              {copiedRef === tx.ref ? <Check size={10} className="text-success" /> : <Copy size={10} className="opacity-40" />}
                            </span>
                            <Badge variant={
                              tx.status === 'Completed' ? 'green' : 
                              tx.status === 'Refunded' ? 'red' : 'gold'
                            } className="text-[8px] uppercase">
                              {tx.status}
                            </Badge>
                          </div>

                          <div className="text-xs text-muted-text font-medium flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span>{tx.fullDate}</span>
                            <span className="w-1 h-1 bg-muted-text/30 rounded-full"></span>
                            <span className="font-bold text-primary">
                              {tx.type === 'Payout' ? tx.bank : tx.guest}
                            </span>
                            {tx.asset && (
                              <>
                                <span className="w-1 h-1 bg-muted-text/30 rounded-full"></span>
                                <span className="text-muted-text/80 italic">{tx.asset}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-6 pt-2 md:pt-0 border-t md:border-t-0 border-border-misrah/30">
                        <div className="text-right">
                          <div className={`text-2xl font-sans font-black italic tracking-tight ${
                            tx.type === 'Payout' ? 'text-primary' : 
                            tx.type === 'Refund' ? 'text-danger' : 
                            'text-accent'
                          }`}>
                            {tx.type === 'Payout' || tx.type === 'Refund' ? '-' : '+'}{tx.amount.toLocaleString()} 
                            <span className="text-[10px] font-sans font-bold not-italic text-muted-text uppercase tracking-wider ml-1.5">AED</span>
                          </div>
                          <div className="text-[9px] font-mono text-muted-text/50">
                            Hash: {tx.hash}
                          </div>
                        </div>

                        <button
                          onClick={() => setSelectedTxForVoucher(tx)}
                          className="px-4 py-2 bg-surface hover:bg-primary hover:text-accent border border-border-misrah rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                        >
                          Voucher
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 md:px-10 border-t border-border-misrah/50 bg-surface/10 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 text-xs font-medium text-muted-text">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-accent" />
                  <span>Misrah Regional Central Treasury Node · SHA-256 Ledger Consensus</span>
                </div>
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="px-8 py-3 bg-primary text-accent rounded-2xl text-[10px] font-black uppercase tracking-[2px] hover:scale-105 transition-transform"
                >
                  Return to Dashboard
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TRANSACTION VOUCHER SLIP MODAL */}
      <AnimatePresence>
        {selectedTxForVoucher && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTxForVoucher(null)}
              className="absolute inset-0 bg-primary/50 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[40px] border border-border-misrah shadow-2xl p-8 space-y-6 z-10"
            >
              <button 
                onClick={() => setSelectedTxForVoucher(null)}
                className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-surface border border-border-misrah flex items-center justify-center text-muted-text hover:text-primary transition-all"
              >
                <X size={16} />
              </button>

              <div className="text-center space-y-2 pt-2">
                <div className="w-16 h-16 rounded-2xl bg-accent text-primary flex items-center justify-center mx-auto shadow-lg shadow-accent/20">
                  <ShieldCheck size={32} />
                </div>
                <h3 className="text-2xl font-black italic text-primary uppercase">Protocol Voucher</h3>
                <p className="text-[9px] font-mono text-muted-text uppercase tracking-widest">
                  {selectedTxForVoucher.ref}
                </p>
              </div>

              <div className="bg-surface/50 p-5 rounded-2xl border border-border-misrah/60 space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-border-misrah/30">
                  <span className="text-muted-text">Execution Date:</span>
                  <span className="font-bold text-primary">{selectedTxForVoucher.fullDate}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-misrah/30">
                  <span className="text-muted-text">Type:</span>
                  <span className="font-bold text-primary uppercase">{selectedTxForVoucher.type}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-misrah/30">
                  <span className="text-muted-text">Counterparty:</span>
                  <span className="font-bold text-primary">{selectedTxForVoucher.type === 'Payout' ? selectedTxForVoucher.bank : selectedTxForVoucher.guest}</span>
                </div>
                {selectedTxForVoucher.asset && (
                  <div className="flex justify-between py-1 border-b border-border-misrah/30">
                    <span className="text-muted-text">Asset / Entity:</span>
                    <span className="font-bold text-primary text-right">{selectedTxForVoucher.asset}</span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-border-misrah/30">
                  <span className="text-muted-text">Status:</span>
                  <Badge variant={selectedTxForVoucher.status === 'Completed' ? 'green' : selectedTxForVoucher.status === 'Refunded' ? 'red' : 'gold'}>
                    {selectedTxForVoucher.status}
                  </Badge>
                </div>
                <div className="flex justify-between py-1 border-b border-border-misrah/30">
                  <span className="text-muted-text">Settlement Channel:</span>
                  <span className="font-bold text-primary text-right">{selectedTxForVoucher.channel || 'Direct Clearing'}</span>
                </div>
                <div className="flex justify-between pt-2 text-sm">
                  <span className="font-black text-primary uppercase">Net Amount:</span>
                  <span className="font-black italic text-accent text-lg">
                    {selectedTxForVoucher.amount.toLocaleString()} AED
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    handleCopyRef(selectedTxForVoucher.ref);
                  }}
                  className="w-full py-3.5 rounded-xl bg-surface hover:bg-surface/80 border border-border-misrah text-primary text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                >
                  <Copy size={14} />
                  <span>{copiedRef === selectedTxForVoucher.ref ? 'Copied to Clipboard!' : 'Copy Reference Code'}</span>
                </button>
                <button
                  onClick={() => setSelectedTxForVoucher(null)}
                  className="w-full py-3.5 rounded-xl bg-primary text-accent text-xs font-black uppercase tracking-wider hover:scale-[1.02] transition-transform"
                >
                  Dismiss Slip
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
