import React, { useState } from 'react';
import { 
  ChevronLeft, 
  Save, 
  Minus, 
  Plus, 
  MessageSquare, 
  Phone, 
  Calendar as CalendarIcon, 
  MapPin, 
  Users as UsersIcon,
  Eye
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { User, Booking } from '../../types';
import { BOOKINGS } from '../../constants';

interface BookingsViewProps {
  user: User;
}

export const BookingsView = ({ user }: BookingsViewProps) => {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isManaging, setIsManaging] = useState(false);
  const [guestsCount, setGuestsCount] = useState(2);
  const [childrenCount, setChildrenCount] = useState(0);

  if (selectedBooking && isManaging) {
    return (
      <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsManaging(false)}
              className="w-10 h-10 rounded-xl bg-white border border-[#F2E8DF] flex items-center justify-center hover:bg-surface transition-all text-primary"
            >
              <ChevronLeft size={20} />
            </button>
            <h1 className="text-3xl font-black italic text-primary uppercase leading-none tracking-tighter">
              Update<br/>Booking
            </h1>
          </div>
          <button 
            onClick={() => {
              alert('Booking synchronization successful. Resource allocated.');
              setIsManaging(false);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-[#0F1D33] text-accent rounded-full text-[10px] font-black uppercase tracking-[2px] shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Save size={14} />
            Save
          </button>
        </header>

        <div className="bg-[#FBFBFC] rounded-[48px] p-10 border border-[#F2E8DF] shadow-sm relative overflow-hidden">
          <div className="grid grid-cols-7 gap-y-8 text-center relative z-10">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
              <span key={`${day}-${idx}`} className="text-[10px] font-black text-primary/20 uppercase tracking-widest">{day}</span>
            ))}
            
            {Array.from({ length: 31 }).map((_, i) => {
              const day = i + 1;
              const isStart = day === 12;
              const isEnd = day === 15;
              const isInRange = day > 12 && day < 15;
              
              return (
                <div key={day} className="relative h-12 flex items-center justify-center">
                  {isInRange && <div className="absolute inset-0 bg-[#F2E8DF]/50" />}
                  {isStart && <div className="absolute inset-0 left-1/2 bg-[#F2E8DF]/50" />}
                  {isEnd && <div className="absolute inset-0 right-1/2 bg-[#F2E8DF]/50" />}
                  
                  <button className={`relative z-10 w-12 h-12 rounded-full text-[13px] font-black transition-all
                    ${(isStart || isEnd) ? 'bg-[#122341] text-[#D4C3B5] shadow-xl shadow-primary/20 scale-110' : ''}
                    ${isInRange ? 'text-primary' : 'text-primary/60'}
                    ${day > 31 ? 'opacity-0' : 'opacity-100'}
                  `}>
                    {day}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[11px] font-black italic text-primary/40 uppercase tracking-[2.5px] px-2">Guest Allocation</h3>
          
          <div className="bg-white rounded-[40px] p-8 space-y-10 border border-[#F2E8DF] shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-primary uppercase tracking-tight italic">Adult Guests</h4>
                <p className="text-[9px] font-black text-primary/30 uppercase tracking-[1.5px] mt-0.5">Adjust Count</p>
              </div>
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setGuestsCount(Math.max(1, guestsCount - 1))}
                  className="w-12 h-12 rounded-2xl bg-[#FBFBFC] border border-[#F2E8DF] flex items-center justify-center text-primary/40 hover:text-primary transition-all active:scale-90"
                >
                  <Minus size={20} />
                </button>
                <span className="text-xl font-black text-primary w-6 text-center">{guestsCount}</span>
                <button 
                  onClick={() => setGuestsCount(guestsCount + 1)}
                  className="w-12 h-12 rounded-2xl bg-[#FBFBFC] border border-[#F2E8DF] flex items-center justify-center text-primary/40 hover:text-primary transition-all active:scale-90"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>

            <div className="h-px bg-[#F2E8DF]" />

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-primary uppercase tracking-tight italic">Children</h4>
                <p className="text-[9px] font-black text-primary/30 uppercase tracking-[1.5px] mt-0.5">Adjust Count</p>
              </div>
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setChildrenCount(Math.max(0, childrenCount - 1))}
                  className="w-12 h-12 rounded-2xl bg-[#FBFBFC] border border-[#F2E8DF] flex items-center justify-center text-primary/40 hover:text-primary transition-all active:scale-90"
                >
                  <Minus size={20} />
                </button>
                <span className="text-xl font-black text-primary w-6 text-center">{childrenCount}</span>
                <button 
                  onClick={() => setChildrenCount(childrenCount + 1)}
                  className="w-12 h-12 rounded-2xl bg-[#FBFBFC] border border-[#F2E8DF] flex items-center justify-center text-primary/40 hover:text-primary transition-all active:scale-90"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedBooking) {
    return (
      <div className="space-y-8 w-full">
        <header className="flex items-center gap-4">
          <button 
            onClick={() => setSelectedBooking(null)}
            className="w-10 h-10 rounded-xl bg-white border border-border-misrah flex items-center justify-center hover:bg-surface transition-all text-primary"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-xl font-black italic text-primary uppercase tracking-tight">Booking Details</h1>
        </header>

        <div className="bg-[#0F1D33] rounded-[48px] p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="flex items-center gap-6 w-full mb-8">
              <div className="w-24 h-24 rounded-[32px] overflow-hidden border-2 border-white/10 shrink-0">
                <img src={selectedBooking.guestAvatar} className="w-full h-full object-cover" alt="Guest" />
              </div>
              <div className="space-y-1">
                <h2 className="text-3xl font-black italic text-white uppercase leading-[0.9] tracking-tighter">
                  {selectedBooking.guestName.split(' ').map((part, i) => (
                    <span key={i} className="block">{part}</span>
                  ))}
                </h2>
                <p className="text-[10px] font-black text-[#D4C3B5] uppercase tracking-[2px] opacity-80 pt-2">
                  Verified Guest
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full">
              <button 
                onClick={() => alert(`Opening message thread with ${selectedBooking.guestName}...`)}
                className="bg-white/10 hover:bg-white/20 text-white rounded-[24px] py-4 flex items-center justify-center gap-3 transition-all active:scale-95 border border-white/5"
              >
                <MessageSquare size={18} className="text-[#D4C3B5]" />
                <span className="text-[10px] font-black uppercase tracking-[2px]">Message</span>
              </button>
              <button 
                onClick={() => alert(`Initiating secure call to ${selectedBooking.guestName}...`)}
                className="bg-white/10 hover:bg-white/20 text-white rounded-[24px] py-4 flex items-center justify-center gap-3 transition-all active:scale-95 border border-white/5"
              >
                <Phone size={18} className="text-[#D4C3B5]" />
                <span className="text-[10px] font-black uppercase tracking-[2px]">Call</span>
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[11px] font-black italic text-primary/40 uppercase tracking-[2.5px]">Stay Details</h3>
            <button 
              onClick={() => setIsManaging(true)}
              className="text-[10px] font-black uppercase tracking-[1.5px] text-primary border-b-2 border-primary/20 hover:border-accent transition-colors"
            >
              Manage
            </button>
          </div>

          <div className="bg-[#F8F9FA] rounded-[40px] p-6 space-y-8 border border-[#F2E8DF]">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-white rounded-[20px] flex items-center justify-center text-primary shadow-sm border border-[#F2E8DF]">
                <CalendarIcon size={24} />
              </div>
              <div className="space-y-0.5">
                <p className="text-[9px] font-black text-primary/30 uppercase tracking-[1.5px]">Dates</p>
                <p className="text-lg font-black text-primary italic uppercase tracking-tight">{selectedBooking.checkIn} - {selectedBooking.checkOut.split(',')[0]}</p>
              </div>
            </div>

            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-white rounded-[20px] flex items-center justify-center text-primary shadow-sm border border-[#F2E8DF]">
                <MapPin size={24} />
              </div>
              <div className="space-y-0.5">
                <p className="text-[9px] font-black text-primary/30 uppercase tracking-[1.5px]">Property</p>
                <p className="text-lg font-black text-primary italic uppercase tracking-tight leading-tight">{selectedBooking.propertyName}</p>
              </div>
            </div>

            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-white rounded-[20px] flex items-center justify-center text-primary shadow-sm border border-[#F2E8DF]">
                <UsersIcon size={24} />
              </div>
              <div className="space-y-0.5">
                <p className="text-[9px] font-black text-primary/30 uppercase tracking-[1.5px]">Occupants</p>
                <p className="text-lg font-black text-primary italic uppercase tracking-tight">{selectedBooking.guests} People</p>
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={() => {
            if (window.confirm(`Are you sure you want to cancel the reservation for ${selectedBooking.guestName}?`)) {
              setSelectedBooking(null);
            }
          }}
          className="w-full text-danger/40 hover:text-danger text-[10px] font-black uppercase tracking-[3px] py-4 transition-colors"
        >
          Cancel Booking
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-4xl font-black italic text-primary">Bookings</h1>
        <p className="text-muted-text text-sm mt-1">All confirmed and upcoming reservations across your portfolio</p>
      </header>

      <div className="bg-white rounded-2xl border border-border-misrah shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface">
                <th className="px-6 py-4 text-[9px] font-bold text-muted-text uppercase tracking-widest border-b border-border-misrah">Guest</th>
                <th className="px-6 py-4 text-[9px] font-bold text-muted-text uppercase tracking-widest border-b border-border-misrah">Property</th>
                <th className="px-6 py-4 text-[9px] font-bold text-muted-text uppercase tracking-widest border-b border-border-misrah">Check-In</th>
                <th className="px-6 py-4 text-[9px] font-bold text-muted-text uppercase tracking-widest border-b border-border-misrah">Check-Out</th>
                <th className="px-6 py-4 text-[9px] font-bold text-muted-text uppercase tracking-widest border-b border-border-misrah text-center">Guests</th>
                <th className="px-6 py-4 text-[9px] font-bold text-muted-text uppercase tracking-widest border-b border-border-misrah">Total</th>
                <th className="px-6 py-4 text-[9px] font-bold text-muted-text uppercase tracking-widest border-b border-border-misrah text-center">Status</th>
                <th className="px-6 py-4 border-b border-border-misrah"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-misrah/50">
              {BOOKINGS.map(booking => (
                <tr key={booking.id} className="hover:bg-surface transition-colors cursor-pointer group" onClick={() => setSelectedBooking(booking)}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={booking.guestAvatar} className="w-9 h-9 rounded-full object-cover" />
                      <div>
                        <div className="text-sm font-bold">{booking.guestName}</div>
                        <div className="text-[10px] text-muted-text font-medium uppercase tracking-tight">Verified</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold">{booking.propertyName}</div>
                    <div className="text-[10px] text-muted-text">Downtown Dubai</div>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-primary">{booking.checkIn}</td>
                  <td className="px-6 py-4 text-xs font-medium text-primary">{booking.checkOut}</td>
                  <td className="px-6 py-4 text-xs font-bold text-center text-primary">{booking.guests}</td>
                  <td className="px-6 py-4 text-base font-sans font-bold italic text-accent">{booking.total.toLocaleString()} AED</td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant={booking.status === 'Hosting' ? 'green' : booking.status === 'Arriving Soon' ? 'gold' : booking.status === 'Confirmed' ? 'blue' : 'gray'}>
                      {booking.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="w-8 h-8 rounded-lg bg-surface border border-border-misrah flex items-center justify-center text-muted-text group-hover:bg-primary group-hover:text-white transition-all">
                      <Eye size={14} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
