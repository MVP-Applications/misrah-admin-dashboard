import React from 'react';
import { Trash2, Star, Filter, ThumbsUp, MessageCircle } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { User } from '../../types';

interface ReviewsViewProps {
  user: User;
}

export const ReviewsView = ({ user }: ReviewsViewProps) => {
  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-black italic text-primary uppercase tracking-tighter leading-none">Guest Sentiment</h1>
          <p className="text-muted-text text-[10px] font-black uppercase tracking-[3px] mt-2 opacity-60">Verified Community Feedback</p>
        </div>
        <div className="flex gap-4">
           <button className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-border-misrah text-[10px] font-black uppercase tracking-[2px] hover:bg-white transition-all shadow-sm">
             <Filter size={14} />
             Filter by Property
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#1A2B47] rounded-[40px] p-8 text-center border border-primary/10 shadow-xl shadow-primary/20">
             <p className="text-[10px] font-black text-accent uppercase tracking-[2px] mb-4">Total Platform Score</p>
             <div className="text-7xl font-black italic text-white leading-none">4.92</div>
             <div className="flex justify-center gap-1 text-accent my-6">
               {[1,2,3,4,5].map(i => <Star key={i} size={18} fill="currentColor" />)}
             </div>
             <p className="text-xs font-medium text-white/50 leading-relaxed italic">"Exceptional consistency across all nodes in the hospitality layer."</p>
          </div>

          <div className="bg-white rounded-[32px] border border-border-misrah p-6 space-y-5 shadow-sm">
             <h3 className="text-[11px] font-black uppercase tracking-[2px] text-primary/40 border-b border-border-misrah pb-4 mb-4">Rating Breakdown</h3>
             {[
               { stars: 5, percent: 92 },
               { stars: 4, percent: 6 },
               { stars: 3, percent: 1 },
               { stars: 2, percent: 1 },
               { stars: 1, percent: 0 },
             ].map(rate => (
               <div key={rate.stars} className="flex items-center gap-4">
                  <span className="text-[10px] font-black text-primary/60 w-3">{rate.stars}</span>
                  <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full transition-all duration-1000" style={{ width: `${rate.percent}%` }} />
                  </div>
                  <span className="text-[10px] font-black text-primary/40 w-6 text-right">{rate.percent}%</span>
               </div>
             ))}
          </div>
        </div>

        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
          {[
            { id: 1, guest: 'Zayed Al Mansouri', avatar: 'https://i.pravatar.cc/150?u=zayed', rating: 5, date: '2h ago', property: 'Burj View Apartment', comment: 'The view of the Burj Khalifa from the balcony is breathtaking. The villa was clean, and the check-in process was very professional.', tags: ['Perfect View', 'Cleanliness'] },
            { id: 2, guest: 'Sarah Wilson', avatar: 'https://i.pravatar.cc/150?u=sarah', rating: 5, date: '1d ago', property: 'Palm Jumeirah Villa', comment: 'Absolutely stunning property. The private pool and beach access made our stay unforgettable. Highly recommend for families.', tags: ['Luxury', 'Families'] },
            { id: 3, guest: 'Omar Khalid', avatar: 'https://i.pravatar.cc/150?u=omar', rating: 4, date: '3d ago', property: 'Saadiyat Retreat', comment: 'Great location and peaceful atmosphere. Only minor issue was the slow response from the concierge on the first morning.', tags: ['Location', 'Peaceful'] },
            { id: 4, guest: 'Elena Petrova', avatar: 'https://i.pravatar.cc/150?u=elena', rating: 5, date: '5d ago', property: 'Modern Marina Duplex', comment: 'Sophisticated design and prime location. The smart home features were very impressive and easy to use.', tags: ['Smart Home', 'Design'] },
            { id: 5, guest: 'Mohammed Jassim', avatar: 'https://i.pravatar.cc/150?u=mohammed', rating: 5, date: '1w ago', property: 'Burj View Apartment', comment: 'Second time staying here. The quality never drops. Ahmed is an elite host who truly cares about guest experience.', tags: ['Host Quality', 'Consistency'] },
          ].map(review => (
            <div key={review.id} className="bg-white rounded-[40px] border border-border-misrah p-8 flex flex-col justify-between shadow-sm hover:shadow-luxury transition-all group lg:last:odd:col-span-2 lg:last:odd:w-1/2 mx-auto lg:last:odd:min-w-[400px]">
               <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={review.avatar} className="w-12 h-12 rounded-2xl object-cover border-2 border-surface shadow-sm" />
                      <div>
                        <h4 className="text-[13px] font-black text-primary uppercase tracking-tight">{review.guest}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex text-accent scale-75 origin-left">
                            {'★'.repeat(review.rating)}
                          </div>
                          <span className="text-[9px] font-bold text-muted-text uppercase">{review.date}</span>
                        </div>
                      </div>
                    </div>
                    {user.role === 'admin' && (
                      <button className="w-9 h-9 rounded-xl bg-danger/5 text-danger flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-danger hover:text-white shadow-sm shadow-danger/10">
                        <Trash2 size={14} />
                      </button>
                    )}
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black text-accent uppercase tracking-[1px] opacity-80">{review.property}</p>
                  <p className="text-[13px] font-medium leading-relaxed text-primary/80 italic line-clamp-3">"{review.comment}"</p>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {review.tags.map(tag => (
                    <Badge key={tag} variant="gray">{tag}</Badge>
                  ))}
                </div>
               </div>

               <div className="flex items-center gap-6 mt-8 pt-6 border-t border-border-misrah/50">
                  <button className="flex items-center gap-2 text-[9px] font-black text-primary/40 uppercase tracking-widest hover:text-accent transition-colors">
                    <ThumbsUp size={14} /> 
                    Helpful (12)
                  </button>
                  <button className="flex items-center gap-2 text-[9px] font-black text-primary/40 uppercase tracking-widest hover:text-accent transition-colors">
                    <MessageCircle size={14} /> 
                    Private Reply
                  </button>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
