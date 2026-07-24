import React, { useCallback, useEffect, useState } from 'react';
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  addMonths,
  subMonths,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Minus,
  Plus,
  MessageSquare,
  Phone,
  Calendar as CalendarIcon,
  MapPin,
  Users as UsersIcon,
  Eye,
  Loader2,
  TriangleAlert,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { User, Booking } from '../../types';
import { listBookings, getBookingById, cancelBooking, rescheduleBooking } from '../../features/bookings/api';
import type { BookingListItem, BookingDetail } from '../../features/bookings/types';

interface BookingsViewProps {
  user: User;
}

const PAGE_SIZE = 10;

// Mirrors the backend's own status derivation (applyBookingStatusFilter in
// misra-api-nest/src/modules/booking/booking.service.ts) rather than
// inventing new logic: 'ongoing' there means confirmed + checkInDate <= today
// <= checkOutDate, which is exactly what "Hosting" means in this UI.
function deriveDisplayStatus(status: string, checkInDate: string, checkOutDate: string): Booking['status'] {
  if (status === 'cancelled') return 'Cancelled';
  if (status === 'completed') return 'Past';
  if (status === 'confirmed') {
    const now = new Date();
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    if (checkIn <= now && now <= checkOut) return 'Hosting';
    return 'Confirmed';
  }
  return 'Pending';
}

function formatDate(iso: string): string {
  try {
    return format(parseISO(iso), 'MMM d, yyyy');
  } catch {
    return iso;
  }
}

// Adapts the real API shape into the legacy Booking shape the list table
// already expects — same pattern as App.tsx's toLegacyUser. traveler has no
// avatar/profileImage field on the list endpoint (confirmed from the
// backend's populate `.select('name email phoneNumber')`), so a placeholder
// avatar is used there; the detail endpoint DOES resolve a real one (see
// toDetailAvatar below).
function toLegacyBooking(item: BookingListItem): Booking {
  return {
    id: item._id,
    guestName: item.traveler?.name ?? 'Guest',
    guestAvatar: `https://i.pravatar.cc/150?u=${item.traveler?._id ?? item._id}`,
    propertyName: item.propertySnapshot?.title ?? 'Property',
    checkIn: formatDate(item.checkInDate),
    checkOut: formatDate(item.checkOutDate),
    guests: (item.guests?.adults ?? 0) + (item.guests?.children ?? 0),
    total: item.pricing?.totalPayable ?? 0,
    status: deriveDisplayStatus(item.status, item.checkInDate, item.checkOutDate),
  };
}

const STATUS_BADGE_VARIANT: Record<Booking['status'], string> = {
  Hosting: 'green',
  'Arriving Soon': 'gold',
  Confirmed: 'blue',
  Pending: 'gold',
  Past: 'gray',
  Cancelled: 'gray',
};

function toDetailAvatar(detail: BookingDetail): string {
  return detail.traveler?.profileImage || `https://i.pravatar.cc/150?u=${detail.traveler?._id ?? detail._id}`;
}

export const BookingsView = ({ user }: BookingsViewProps) => {
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [bookingDetail, setBookingDetail] = useState<BookingDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [isManaging, setIsManaging] = useState(false);
  const [rescheduleAdults, setRescheduleAdults] = useState(2);
  const [rescheduleChildren, setRescheduleChildren] = useState(0);
  const [rescheduleCheckIn, setRescheduleCheckIn] = useState<Date | null>(null);
  const [rescheduleCheckOut, setRescheduleCheckOut] = useState<Date | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchBookings = useCallback(async (pageToLoad: number) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const response = await listBookings({ page: pageToLoad, limit: PAGE_SIZE });
      setBookings(response.data.map(toLegacyBooking));
      setTotalPages(response.totalPages);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load bookings.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings(page);
  }, [fetchBookings, page]);

  const fetchDetail = useCallback(async (id: string) => {
    setIsDetailLoading(true);
    setDetailError(null);
    try {
      const detail = await getBookingById(id);
      setBookingDetail(detail);
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : 'Failed to load booking details.');
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedBookingId) {
      fetchDetail(selectedBookingId);
    } else {
      setBookingDetail(null);
    }
  }, [selectedBookingId, fetchDetail]);

  const closeDetail = () => {
    setSelectedBookingId(null);
    setIsManaging(false);
  };

  const openManage = () => {
    if (!bookingDetail) return;
    setRescheduleAdults(bookingDetail.guests?.adults ?? 1);
    setRescheduleChildren(bookingDetail.guests?.children ?? 0);
    const checkIn = new Date(bookingDetail.checkInDate);
    const checkOut = new Date(bookingDetail.checkOutDate);
    setRescheduleCheckIn(checkIn);
    setRescheduleCheckOut(checkOut);
    setCalendarMonth(checkIn);
    setSaveError(null);
    setIsManaging(true);
  };

  const handleDayClick = (day: Date) => {
    if (isBefore(day, new Date()) && !isToday(day)) return; // can't pick a past date
    if (!rescheduleCheckIn || rescheduleCheckOut) {
      setRescheduleCheckIn(day);
      setRescheduleCheckOut(null);
      return;
    }
    if (isBefore(day, rescheduleCheckIn) || isSameDay(day, rescheduleCheckIn)) {
      setRescheduleCheckIn(day);
      setRescheduleCheckOut(null);
      return;
    }
    setRescheduleCheckOut(day);
  };

  const handleSaveReschedule = async () => {
    if (!bookingDetail || !rescheduleCheckIn || !rescheduleCheckOut) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await rescheduleBooking(bookingDetail._id, {
        checkInDate: rescheduleCheckIn.toISOString(),
        checkOutDate: rescheduleCheckOut.toISOString(),
        guests: { adults: rescheduleAdults, children: rescheduleChildren },
      });
      await fetchDetail(bookingDetail._id);
      await fetchBookings(page);
      setIsManaging(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to reschedule this booking.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!bookingDetail) return;
    if (!window.confirm(`Are you sure you want to cancel the reservation for ${bookingDetail.traveler?.name ?? bookingDetail.contact?.name ?? 'this guest'}?`)) {
      return;
    }
    setIsCancelling(true);
    setCancelError(null);
    try {
      await cancelBooking(bookingDetail._id, {});
      await fetchBookings(page);
      closeDetail();
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Failed to cancel this booking.');
    } finally {
      setIsCancelling(false);
    }
  };

  if (selectedBookingId && isManaging && bookingDetail) {
    const calendarStart = startOfWeek(startOfMonth(calendarMonth));
    const calendarEnd = endOfWeek(endOfMonth(calendarMonth));
    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

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
            onClick={handleSaveReschedule}
            disabled={isSaving || !rescheduleCheckIn || !rescheduleCheckOut}
            className="flex items-center gap-2 px-6 py-3 bg-[#0F1D33] text-accent rounded-full text-[10px] font-black uppercase tracking-[2px] shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save
          </button>
        </header>

        {saveError && (
          <div className="bg-danger/5 border border-danger/20 rounded-3xl p-5 flex items-center gap-3 text-danger">
            <TriangleAlert size={18} />
            <p className="text-[10px] font-black uppercase tracking-widest">{saveError}</p>
          </div>
        )}

        <div className="bg-[#FBFBFC] rounded-[48px] p-10 border border-[#F2E8DF] shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setCalendarMonth(m => subMonths(m, 1))}
              className="w-9 h-9 rounded-xl bg-white border border-[#F2E8DF] flex items-center justify-center text-primary/60 hover:border-accent transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-black italic text-primary uppercase tracking-tight">{format(calendarMonth, 'MMMM yyyy')}</span>
            <button
              onClick={() => setCalendarMonth(m => addMonths(m, 1))}
              className="w-9 h-9 rounded-xl bg-white border border-[#F2E8DF] flex items-center justify-center text-primary/60 hover:border-accent transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-y-8 text-center relative z-10">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
              <span key={`${day}-${idx}`} className="text-[10px] font-black text-primary/20 uppercase tracking-widest">{day}</span>
            ))}

            {calendarDays.map(day => {
              const isCurrentMonth = isSameMonth(day, calendarMonth);
              const isStart = rescheduleCheckIn ? isSameDay(day, rescheduleCheckIn) : false;
              const isEnd = rescheduleCheckOut ? isSameDay(day, rescheduleCheckOut) : false;
              const isInRange = !!(rescheduleCheckIn && rescheduleCheckOut && day > rescheduleCheckIn && day < rescheduleCheckOut);
              const isPast = isBefore(day, new Date()) && !isToday(day);

              return (
                <div key={day.toString()} className="relative h-12 flex items-center justify-center">
                  {isInRange && <div className="absolute inset-0 bg-[#F2E8DF]/50" />}
                  {isStart && rescheduleCheckOut && <div className="absolute inset-0 left-1/2 bg-[#F2E8DF]/50" />}
                  {isEnd && <div className="absolute inset-0 right-1/2 bg-[#F2E8DF]/50" />}

                  <button
                    onClick={() => handleDayClick(day)}
                    disabled={!isCurrentMonth || isPast}
                    className={`relative z-10 w-12 h-12 rounded-full text-[13px] font-black transition-all
                      ${(isStart || isEnd) ? 'bg-[#122341] text-[#D4C3B5] shadow-xl shadow-primary/20 scale-110' : ''}
                      ${isInRange ? 'text-primary' : 'text-primary/60'}
                      ${!isCurrentMonth ? 'opacity-0 pointer-events-none' : ''}
                      ${isPast ? 'opacity-20 cursor-not-allowed' : ''}
                    `}
                  >
                    {format(day, 'd')}
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
                  onClick={() => setRescheduleAdults(Math.max(1, rescheduleAdults - 1))}
                  className="w-12 h-12 rounded-2xl bg-[#FBFBFC] border border-[#F2E8DF] flex items-center justify-center text-primary/40 hover:text-primary transition-all active:scale-90"
                >
                  <Minus size={20} />
                </button>
                <span className="text-xl font-black text-primary w-6 text-center">{rescheduleAdults}</span>
                <button
                  onClick={() => setRescheduleAdults(rescheduleAdults + 1)}
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
                  onClick={() => setRescheduleChildren(Math.max(0, rescheduleChildren - 1))}
                  className="w-12 h-12 rounded-2xl bg-[#FBFBFC] border border-[#F2E8DF] flex items-center justify-center text-primary/40 hover:text-primary transition-all active:scale-90"
                >
                  <Minus size={20} />
                </button>
                <span className="text-xl font-black text-primary w-6 text-center">{rescheduleChildren}</span>
                <button
                  onClick={() => setRescheduleChildren(rescheduleChildren + 1)}
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

  if (selectedBookingId) {
    return (
      <div className="space-y-8 w-full">
        <header className="flex items-center gap-4">
          <button
            onClick={closeDetail}
            className="w-10 h-10 rounded-xl bg-white border border-border-misrah flex items-center justify-center hover:bg-surface transition-all text-primary"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-xl font-black italic text-primary uppercase tracking-tight">Booking Details</h1>
        </header>

        {isDetailLoading ? (
          <div className="p-24 text-center">
            <Loader2 size={32} className="animate-spin mx-auto text-primary/30" />
          </div>
        ) : detailError ? (
          <div className="bg-danger/5 rounded-[48px] border border-danger/20 p-16 text-center shadow-sm space-y-4">
            <TriangleAlert size={40} className="mx-auto text-danger" />
            <p className="text-[10px] font-bold text-danger/70 uppercase tracking-widest">{detailError}</p>
            <button
              onClick={() => fetchDetail(selectedBookingId)}
              className="mt-4 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[2px] bg-primary text-white hover:opacity-90 transition-all"
            >
              Retry
            </button>
          </div>
        ) : bookingDetail && (
          <>
            <div className="bg-[#0F1D33] rounded-[48px] p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full blur-2xl" />

              <div className="relative z-10 flex flex-col items-center">
                <div className="flex items-center gap-6 w-full mb-8">
                  <div className="w-24 h-24 rounded-[32px] overflow-hidden border-2 border-white/10 shrink-0">
                    <img src={toDetailAvatar(bookingDetail)} className="w-full h-full object-cover" alt="Guest" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black italic text-white uppercase leading-[0.9] tracking-tighter">
                      {(bookingDetail.traveler?.name ?? bookingDetail.contact?.name ?? 'Guest').split(' ').map((part, i) => (
                        <span key={i} className="block">{part}</span>
                      ))}
                    </h2>
                    <p className="text-[10px] font-black text-[#D4C3B5] uppercase tracking-[2px] opacity-80 pt-2">
                      {bookingDetail.status === 'cancelled' ? 'Cancelled' : 'Verified Guest'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full">
                  <a
                    href={
                      bookingDetail.traveler?.phoneNumber || bookingDetail.contact?.phone
                        ? `tel:${bookingDetail.traveler?.phoneNumber ?? bookingDetail.contact?.phone}`
                        : undefined
                    }
                    aria-disabled={!(bookingDetail.traveler?.phoneNumber || bookingDetail.contact?.phone)}
                    onClick={(e) => {
                      if (!(bookingDetail.traveler?.phoneNumber || bookingDetail.contact?.phone)) e.preventDefault();
                    }}
                    className="bg-white/10 hover:bg-white/20 text-white rounded-[24px] py-4 flex items-center justify-center gap-3 transition-all active:scale-95 border border-white/5 col-span-2"
                  >
                    <Phone size={18} className="text-[#D4C3B5]" />
                    <span className="text-[10px] font-black uppercase tracking-[2px]">Call Guest</span>
                  </a>
                </div>
                <p className="mt-3 text-[9px] font-bold text-white/30 uppercase tracking-[1.5px]">
                  Messaging isn't wired up yet — coming soon.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-[11px] font-black italic text-primary/40 uppercase tracking-[2.5px]">Stay Details</h3>
                {bookingDetail.status !== 'cancelled' && bookingDetail.status !== 'completed' && (
                  <button
                    onClick={openManage}
                    className="text-[10px] font-black uppercase tracking-[1.5px] text-primary border-b-2 border-primary/20 hover:border-accent transition-colors"
                  >
                    Manage
                  </button>
                )}
              </div>

              <div className="bg-[#F8F9FA] rounded-[40px] p-6 space-y-8 border border-[#F2E8DF]">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-white rounded-[20px] flex items-center justify-center text-primary shadow-sm border border-[#F2E8DF]">
                    <CalendarIcon size={24} />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-primary/30 uppercase tracking-[1.5px]">Dates</p>
                    <p className="text-lg font-black text-primary italic uppercase tracking-tight">{formatDate(bookingDetail.checkInDate)} - {formatDate(bookingDetail.checkOutDate)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-white rounded-[20px] flex items-center justify-center text-primary shadow-sm border border-[#F2E8DF]">
                    <MapPin size={24} />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-primary/30 uppercase tracking-[1.5px]">Property</p>
                    <p className="text-lg font-black text-primary italic uppercase tracking-tight leading-tight">{bookingDetail.propertySnapshot?.title ?? 'Property'}</p>
                    {bookingDetail.propertySnapshot?.city?.name && (
                      <p className="text-[10px] font-bold text-muted-text uppercase tracking-widest">{bookingDetail.propertySnapshot.city.name}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-white rounded-[20px] flex items-center justify-center text-primary shadow-sm border border-[#F2E8DF]">
                    <UsersIcon size={24} />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-primary/30 uppercase tracking-[1.5px]">Occupants</p>
                    <p className="text-lg font-black text-primary italic uppercase tracking-tight">{(bookingDetail.guests?.adults ?? 0) + (bookingDetail.guests?.children ?? 0)} People</p>
                  </div>
                </div>
              </div>
            </div>

            {cancelError && (
              <div className="bg-danger/5 border border-danger/20 rounded-3xl p-5 flex items-center gap-3 text-danger">
                <TriangleAlert size={18} />
                <p className="text-[10px] font-black uppercase tracking-widest">{cancelError}</p>
              </div>
            )}

            {bookingDetail.status !== 'cancelled' && (
              <button
                onClick={handleCancel}
                disabled={isCancelling}
                className="w-full text-danger/40 hover:text-danger text-[10px] font-black uppercase tracking-[3px] py-4 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isCancelling && <Loader2 size={14} className="animate-spin" />}
                Cancel Booking
              </button>
            )}
          </>
        )}
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
        {isLoading ? (
          <div className="p-24 text-center">
            <Loader2 size={32} className="animate-spin mx-auto text-primary/30" />
          </div>
        ) : loadError ? (
          <div className="p-16 text-center space-y-4">
            <TriangleAlert size={32} className="mx-auto text-danger" />
            <p className="text-[10px] font-bold text-danger/70 uppercase tracking-widest">{loadError}</p>
            <button
              onClick={() => fetchBookings(page)}
              className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[2px] bg-primary text-white hover:opacity-90 transition-all"
            >
              Retry
            </button>
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-24 text-center">
            <p className="text-[10px] font-bold text-muted-text/50 uppercase tracking-widest">No bookings found</p>
          </div>
        ) : (
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
                {bookings.map(booking => (
                  <tr key={booking.id} className="hover:bg-surface transition-colors cursor-pointer group" onClick={() => setSelectedBookingId(booking.id)}>
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
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-primary">{booking.checkIn}</td>
                    <td className="px-6 py-4 text-xs font-medium text-primary">{booking.checkOut}</td>
                    <td className="px-6 py-4 text-xs font-bold text-center text-primary">{booking.guests}</td>
                    <td className="px-6 py-4 text-base font-sans font-bold italic text-accent">{booking.total.toLocaleString()} AED</td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant={STATUS_BADGE_VARIANT[booking.status]}>
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
        )}
        {!isLoading && !loadError && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border-misrah">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="w-9 h-9 rounded-xl bg-surface border border-border-misrah flex items-center justify-center text-primary/60 disabled:opacity-30 hover:border-accent transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-text">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="w-9 h-9 rounded-xl bg-surface border border-border-misrah flex items-center justify-center text-primary/60 disabled:opacity-30 hover:border-accent transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
