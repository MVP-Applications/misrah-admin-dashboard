import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  MoreVertical, 
  Phone, 
  Video,
  MessageSquare
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { User } from '../../types';

interface MessagesViewProps {
  user: User;
}

export const MessagesView = ({ user }: MessagesViewProps) => {
  const [activeChat, setActiveChat] = useState<number | null>(0);
  const [messageText, setMessageText] = useState('');

  const contacts = [
    { id: 0, name: 'Zayed Al Mansouri', avatar: 'https://i.pravatar.cc/150?u=zayed', lastMsg: 'I will be arriving at 2 PM sharp tomorrow.', time: '10:32 AM', unread: 2, status: 'Arriving Tomorrow' },
    { id: 1, name: 'Fatima Rashid', avatar: 'https://i.pravatar.cc/150?u=fatima', lastMsg: 'Is it possible to have extra towels?', time: '09:15 AM', unread: 0, status: 'Hosting' },
    { id: 2, name: 'Omar Khalid', avatar: 'https://i.pravatar.cc/150?u=omar', lastMsg: 'The check-out instructions were clear, thanks!', time: 'Yesterday', unread: 0, status: 'Checked Out' },
    { id: 3, name: 'Support Node', avatar: 'https://i.pravatar.cc/150?u=support', lastMsg: 'Your property verification is complete.', time: 'Jan 12', unread: 0, status: 'System' },
  ];

  const chatMessages = [
    { id: 1, sender: 'guest', text: 'Hello Ahmed, I wanted to confirm my check-in time for Burj View Apartment.', time: '10:28 AM' },
    { id: 2, sender: 'host', text: 'Marhaba Zayed! Yes, I see your booking. We are preparing the apartment now.', time: '10:30 AM' },
    { id: 3, sender: 'guest', text: 'Excellent! I will be arriving at 2 PM sharp tomorrow. Is that okay?', time: '10:32 AM' },
  ];

  return (
    <div className="h-[calc(100vh-160px)] flex gap-6">
      <div className="w-1/3 flex flex-col bg-white rounded-[40px] border border-border-misrah overflow-hidden shadow-sm">
        <div className="p-8 space-y-6">
           <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black italic text-primary uppercase leading-none">Inquiries</h2>
              <button className="w-10 h-10 rounded-xl bg-primary text-accent flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg"><Plus size={18} /></button>
           </div>
           
           <div className="relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-text" size={16} />
             <input placeholder="Search thread..." className="w-full pl-12 pr-4 py-3.5 bg-surface border border-border-misrah rounded-2xl text-xs font-bold focus:border-accent outline-hidden transition-all" />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-2">
           {contacts.map(contact => (
             <button 
               key={contact.id}
               onClick={() => setActiveChat(contact.id)}
               className={`w-full flex items-center gap-4 p-5 rounded-[32px] transition-all group relative
                 ${activeChat === contact.id ? 'bg-[#1A1B2E] text-white shadow-xl shadow-primary/20' : 'hover:bg-surface'}`}
             >
                <div className="relative shrink-0">
                  <img src={contact.avatar} className="w-12 h-12 rounded-2xl object-cover" />
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${contact.id === 0 ? 'bg-success' : 'bg-muted-text'}`} />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between pointer-events-none">
                    <span className="text-[13px] font-black uppercase tracking-tight">{contact.name}</span>
                    <span className={`text-[9px] font-bold ${activeChat === contact.id ? 'text-accent' : 'text-muted-text'}`}>{contact.time}</span>
                  </div>
                  <p className={`text-[11px] font-medium mt-0.5 truncate w-40 ${activeChat === contact.id ? 'text-white/60' : 'text-muted-text group-hover:text-primary'}`}>
                    {contact.lastMsg}
                  </p>
                  <div className="mt-2 text-[8px] font-black uppercase tracking-[1px] opacity-40">{contact.status}</div>
                </div>
                {contact.unread > 0 && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 bg-accent text-primary rounded-full flex items-center justify-center text-[9px] font-black italic shadow-lg shadow-accent/20">
                    {contact.unread}
                  </div>
                )}
             </button>
           ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white rounded-[40px] border border-border-misrah overflow-hidden shadow-sm relative">
        {activeChat !== null ? (
          <>
            <div className="p-6 border-b border-border-misrah flex items-center justify-between bg-surface/30">
               <div className="flex items-center gap-4">
                  <img src={contacts[activeChat].avatar} className="w-11 h-11 rounded-2xl object-cover shadow-sm" />
                  <div>
                    <h3 className="text-sm font-black text-primary uppercase tracking-tight italic">{contacts[activeChat].name}</h3>
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                       <span className="text-[9px] font-black text-success uppercase tracking-widest">Global Sync Active</span>
                    </div>
                  </div>
               </div>
               <div className="flex gap-2">
                  <button className="w-10 h-10 rounded-xl bg-white border border-border-misrah flex items-center justify-center text-primary/60 hover:text-primary hover:border-accent transition-all"><Phone size={18} /></button>
                  <button className="w-10 h-10 rounded-xl bg-white border border-border-misrah flex items-center justify-center text-primary/60 hover:text-primary hover:border-accent transition-all"><Video size={18} /></button>
                  <button className="w-10 h-10 rounded-xl bg-white border border-border-misrah flex items-center justify-center text-primary/60 hover:text-primary hover:border-accent transition-all"><MoreVertical size={18} /></button>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-8">
               <div className="flex justify-center">
                 <Badge variant="gray">Booking Confirmed · Jan 12 - 15</Badge>
               </div>

               {chatMessages.map(msg => (
                 <div key={msg.id} className={`flex ${msg.sender === 'host' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[70%] space-y-1.5 ${msg.sender === 'host' ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div className={`p-5 rounded-[32px] text-sm font-medium leading-relaxed
                        ${msg.sender === 'host' 
                          ? 'bg-[#1A1B2E] text-white rounded-tr-none shadow-xl shadow-primary/10' 
                          : 'bg-surface text-primary rounded-tl-none border border-border-misrah/50'}`}>
                        {msg.text}
                      </div>
                      <span className="text-[9px] font-bold text-muted-text uppercase tracking-widest px-2">{msg.time} {msg.sender === 'host' && '· Read'}</span>
                   </div>
                 </div>
               ))}
            </div>

            <div className="p-8 pt-4">
               <div className="bg-surface rounded-[32px] border border-border-misrah p-3 px-6 flex items-center gap-4 group focus-within:border-accent transition-all">
                  <button className="text-muted-text hover:text-primary transition-colors"><Paperclip size={18} /></button>
                  <button className="text-muted-text hover:text-primary transition-colors"><ImageIcon size={18} /></button>
                  <input 
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    placeholder="Compose message node..." 
                    className="flex-1 bg-transparent border-0 text-sm font-medium focus:ring-0 outline-hidden" 
                  />
                  <button 
                    disabled={!messageText.trim()}
                    className="w-12 h-12 rounded-2xl bg-primary text-accent flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all transition-all"
                  >
                    <Send size={18} />
                  </button>
               </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4">
             <div className="w-20 h-20 rounded-[32px] bg-surface flex items-center justify-center text-[#D4C3B5] border border-border-misrah mb-4">
               <MessageSquare size={40} />
             </div>
             <h3 className="text-xl font-black italic text-primary uppercase">No Active Thread</h3>
             <p className="text-[11px] font-bold text-muted-text uppercase tracking-[2px] max-w-xs leading-relaxed">Select a mission-critical inquirer from your left panel to initiate communication</p>
          </div>
        )}
      </div>
    </div>
  );
};
