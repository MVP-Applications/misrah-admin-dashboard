import React from 'react';
import { Badge } from '../ui/Badge';

export const NotificationsView = () => {
  const notifications = [
    { id: 1, type: 'booking', title: 'New Booking Inquiry', desc: 'Zayed Al Mansouri requested Burj View Apt for Jan 12-15', time: '2 mins ago', unread: true },
    { id: 2, type: 'payout', title: 'Payout Successful', desc: 'AED 4,500 has been transferred to your verified ENBD node.', time: '2 hours ago', unread: true },
    { id: 3, type: 'review', title: 'New Guest Sentiment', desc: 'Sarah Wilson left a 5-star review for Palm Jumeirah Villa.', time: '5 hours ago', unread: false },
    { id: 4, type: 'system', title: 'Security Sync Complete', desc: 'Your security protocols were successfully updated across all nodes.', time: '1 day ago', unread: false },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      <header>
        <h1 className="text-4xl font-black italic text-primary uppercase tracking-tighter">Activity Feed</h1>
        <p className="text-muted-text text-sm mt-1 uppercase tracking-widest font-black">Strategic intelligence & Platform updates</p>
      </header>

      <div className="space-y-4">
        {notifications.map(notif => (
          <div key={notif.id} className={`flex items-start gap-6 p-8 rounded-[40px] border transition-all hover:shadow-luxury
            ${notif.unread ? 'bg-white border-accent shadow-sm' : 'bg-[#FCFAF8]/50 border-border-misrah opacity-80'}`}>
            <div className={`mt-1.5 w-3 h-3 rounded-full shrink-0 ${notif.unread ? 'bg-accent shadow-[0_0_12px_rgba(201,168,76,0.6)]' : 'bg-muted-text/30'}`} />
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="text-[13px] font-black text-primary uppercase tracking-tight">{notif.title}</h3>
                <span className="text-[9px] font-bold text-muted-text uppercase tracking-widest">{notif.time}</span>
              </div>
              <p className="text-xs text-[#D4C3B5] font-medium leading-relaxed">{notif.desc}</p>
              <div className="pt-3 flex gap-2">
                <button className="px-4 py-2 bg-[#FCFAF8] rounded-xl text-[9px] font-black uppercase tracking-wider text-primary hover:bg-accent hover:text-white transition-all">View Details</button>
                {notif.type === 'booking' && (
                  <button className="px-4 py-2 bg-primary rounded-xl text-[9px] font-black uppercase tracking-wider text-accent hover:opacity-90 transition-all">Quick Approve</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
