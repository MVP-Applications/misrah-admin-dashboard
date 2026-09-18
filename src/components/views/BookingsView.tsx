import React, { useCallback, useEffect, useState } from 'react';
import {
  format,
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
  Sparkles,
  Search,
  Clock,
  DollarSign,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { User, Booking } from '../../types';
import { listBookings, getBookingById, cancelBooking, rescheduleBooking } from '../../features/bookings/api';
import { toLegacyBooking, formatBookingDate } from '../../features/bookings/mappers';
import type { BookingDetail } from '../../features/bookings/types';
import {
  cancelExperienceBooking,
  completeExperienceBooking,
  getExperienceBookingById,
  listExperienceBookings,
} from '../../features/experienceBookings/api';
import type { ExperienceBookingDetail, ExperienceBookingListItem } from '../../features/experienceBookings/types';
import { listBookingStatuses, listExperienceBookingStatuses } from '../../features/enums/api';
import type { EnumOption } from '../../api/types';

interface BookingsViewProps {
  user: User;
}

const PAGE_SIZE = 10;

const STATUS_BADGE_VARIANT: Record<Booking['status'], string> = {
  Hosting: 'green',
  'Arriving Soon': 'gold',
  Confirmed: 'blue',
  Pending: 'gold',
  Past: 'gray',
  Cancelled: 'gray',
  Completed: 'green',
};

// "CONFIRMED" -> "Confirmed", "ARRIVING_SOON" -> "Arriving Soon" — display
// label for an /enums/* option; the actual filter value sent to the API is
// always option.value, never this.
function formatEnumLabel(key: string): string {
  return key
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

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

  // Stays | Experiences tab — mirrors the tab section in misrah-retreats-
  // admin's BookingsView, which filters one unified bookings list
  // client-side by booking type. This backend keeps the two as separate
  // resources/endpoints (/admin/bookings vs /admin/experience-bookings),
  // so the Experiences tab is its own fetch rather than a client-side
  // filter over the Stays list.
  const [activeTab, setActiveTab] = useState<'stays' | 'experiences'>('stays');

  // Search + status are one shared row (same position, same state) used by
  // whichever tab is active — sent as `search`/`status` to both
  // listBookings and listExperienceBookings. The status *options* shown
  // still depend on activeTab (bookings and experiences don't share a
  // status vocabulary), so switching tabs resets the filter back to 'all'
  // rather than carrying over a value that's meaningless for the other list.
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // GET /enums/booking-statuses + /enums/experience-booking-statuses —
  // populate the status dropdown's options from the real backend vocabulary
  // instead of a guessed/hardcoded list (a hardcoded 'completed' is what
  // caused the Booking Workflow bar's Mark-as-Completed button to
  // incorrectly stay hidden — see its gating below).
  const [bookingStatusOptions, setBookingStatusOptions] = useState<EnumOption[]>([]);
  const [experienceBookingStatusOptions, setExperienceBookingStatusOptions] = useState<EnumOption[]>([]);

  useEffect(() => {
    listBookingStatuses().then(setBookingStatusOptions).catch(() => {});
    listExperienceBookingStatuses().then(setExperienceBookingStatusOptions).catch(() => {});
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 400);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  // Resetting statusFilter on tab switch happens in the tab buttons' onClick
  // (batched with setActiveTab) rather than a useEffect keyed on activeTab —
  // an effect would still fire the new tab's first fetch with the stale
  // status value from the previous tab (since the fetch-effect and the
  // reset-effect commit in the same pass, one render behind each other),
  // causing one throwaway request before the corrected refetch.
  useEffect(() => {
    setPage(1);
    setExpPage(1);
  }, [debouncedSearch, statusFilter]);

  const [experienceBookings, setExperienceBookings] = useState<ExperienceBookingListItem[]>([]);
  const [expPage, setExpPage] = useState(1);
  const [expTotalPages, setExpTotalPages] = useState(1);
  const [expTotalCount, setExpTotalCount] = useState(0);
  const [isExpLoading, setIsExpLoading] = useState(true);
  const [expLoadError, setExpLoadError] = useState<string | null>(null);

  // GET /admin/experience-bookings/{id} — clicking a row in the Experiences
  // tab opens this detail view, mirroring the Stays tab's
  // selectedBookingId/bookingDetail pair above.
  const [selectedExperienceBookingId, setSelectedExperienceBookingId] = useState<string | null>(null);
  const [experienceBookingDetail, setExperienceBookingDetail] = useState<ExperienceBookingDetail | null>(null);
  const [isExpDetailLoading, setIsExpDetailLoading] = useState(false);
  const [expDetailError, setExpDetailError] = useState<string | null>(null);

  const fetchExperienceBookingDetail = useCallback(async (id: string) => {
    setIsExpDetailLoading(true);
    setExpDetailError(null);
    try {
      const detail = await getExperienceBookingById(id);
      setExperienceBookingDetail(detail);
    } catch (err) {
      setExpDetailError(err instanceof Error ? err.message : 'Failed to load experience booking details.');
    } finally {
      setIsExpDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedExperienceBookingId) {
      fetchExperienceBookingDetail(selectedExperienceBookingId);
    } else {
      setExperienceBookingDetail(null);
    }
  }, [selectedExperienceBookingId, fetchExperienceBookingDetail]);

  // PATCH /admin/experience-bookings/{id}/complete + .../cancel — the
  // "Booking Workflow" action bar on the experience-booking detail view.
  const [isCompletingExpBooking, setIsCompletingExpBooking] = useState(false);
  const [expActionError, setExpActionError] = useState<string | null>(null);
  const [expBookingToCancel, setExpBookingToCancel] = useState<ExperienceBookingDetail | null>(null);
  const [expCancelReason, setExpCancelReason] = useState('');
  const [isCancellingExpBooking, setIsCancellingExpBooking] = useState(false);

  const handleCompleteExperienceBooking = async () => {
    if (!experienceBookingDetail) return;
    setIsCompletingExpBooking(true);
    setExpActionError(null);
    try {
      await completeExperienceBooking(experienceBookingDetail._id);
      await fetchExperienceBookingDetail(experienceBookingDetail._id);
      fetchExperienceBookings(expPage);
    } catch (err) {
      setExpActionError(err instanceof Error ? err.message : 'Failed to mark this booking as completed.');
    } finally {
      setIsCompletingExpBooking(false);
    }
  };

  const handleConfirmCancelExperienceBooking = async () => {
    if (!expBookingToCancel) return;
    setIsCancellingExpBooking(true);
    setExpActionError(null);
    try {
      await cancelExperienceBooking(expBookingToCancel._id, { reason: expCancelReason.trim() || undefined });
      await fetchExperienceBookingDetail(expBookingToCancel._id);
      fetchExperienceBookings(expPage);
      setExpBookingToCancel(null);
      setExpCancelReason('');
    } catch (err) {
      setExpActionError(err instanceof Error ? err.message : 'Failed to cancel this booking.');
    } finally {
      setIsCancellingExpBooking(false);
    }
  };

  const fetchExperienceBookings = useCallback(
    (pageToLoad: number) => {
      setIsExpLoading(true);
      setExpLoadError(null);
      listExperienceBookings({
        page: pageToLoad,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      })
        .then((res) => {
          setExperienceBookings(res.data);
          setExpTotalPages(res.totalPages || 1);
          setExpTotalCount(res.totalCount || 0);
        })
        .catch((err) => setExpLoadError(err instanceof Error ? err.message : 'Failed to load experience bookings.'))
        .finally(() => setIsExpLoading(false));
    },
    [debouncedSearch, statusFilter],
  );

  useEffect(() => {
    if (activeTab === 'experiences') {
      fetchExperienceBookings(expPage);
    }
  }, [activeTab, fetchExperienceBookings, expPage]);

  const fetchBookings = useCallback(
    async (pageToLoad: number) => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const response = await listBookings({
          page: pageToLoad,
          limit: PAGE_SIZE,
          search: debouncedSearch || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        });
        setBookings(response.data.map(toLegacyBooking));
        setTotalPages(response.totalPages);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Failed to load bookings.');
      } finally {
        setIsLoading(false);
      }
    },
    [debouncedSearch, statusFilter],
  );

  useEffect(() => {
    if (activeTab === 'stays') {
      fetchBookings(page);
    }
  }, [activeTab, fetchBookings, page]);

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

  if (selectedExperienceBookingId) {
    const detail = experienceBookingDetail;
    const guestName = detail?.traveler?.name ?? detail?.contact?.name ?? 'Guest';
    const guestPhone = detail?.traveler?.phoneNumber ?? detail?.contact?.phone;
    // Neither traveler nor host carries a profileImage on this endpoint
    // (unlike property bookings) — always fall back to a generated avatar.
    const guestAvatar = `https://i.pravatar.cc/150?u=${detail?.traveler?._id ?? detail?._id ?? selectedExperienceBookingId}`;
    // Derived from the real /enums/experience-booking-statuses vocabulary
    // rather than hardcoded 'completed'/'cancelled' strings — a hardcoded
    // guess is exactly what caused Mark-as-Completed to stay hidden before.
    // Falls back to the lowercase guess only until that enum call resolves.
    const completedStatusValue = experienceBookingStatusOptions.find(o => o.key === 'COMPLETED')?.value ?? 'completed';
    const cancelledStatusValue = experienceBookingStatusOptions.find(o => o.key === 'CANCELLED')?.value ?? 'cancelled';

    return (
      <div className="space-y-8 w-full animate-in fade-in duration-300">
        <header className="flex items-center gap-4">
          <button
            onClick={() => setSelectedExperienceBookingId(null)}
            className="w-10 h-10 rounded-xl bg-white border border-border-misrah flex items-center justify-center hover:bg-surface transition-all text-primary"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black italic text-primary uppercase tracking-tight">Experience Booking Details</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-accent/20 text-primary border border-accent/40">
              <Sparkles size={11} className="text-accent" />
              Experience
            </span>
          </div>
        </header>

        {isExpDetailLoading ? (
          <div className="p-24 text-center">
            <Loader2 size={32} className="animate-spin mx-auto text-primary/30" />
          </div>
        ) : expDetailError ? (
          <div className="bg-danger/5 rounded-[48px] border border-danger/20 p-16 text-center shadow-sm space-y-4">
            <TriangleAlert size={40} className="mx-auto text-danger" />
            <p className="text-[10px] font-bold text-danger/70 uppercase tracking-widest">{expDetailError}</p>
            <button
              onClick={() => fetchExperienceBookingDetail(selectedExperienceBookingId)}
              className="mt-4 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[2px] bg-primary text-white hover:opacity-90 transition-all"
            >
              Retry
            </button>
          </div>
        ) : detail && (
          <>
            <div className="bg-[#0F1D33] rounded-[48px] p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
              <div className="relative z-10 flex items-center gap-6 w-full">
                <div className="w-24 h-24 rounded-[32px] overflow-hidden border-2 border-white/10 shrink-0">
                  <img src={guestAvatar} className="w-full h-full object-cover" alt="Guest" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-3xl font-black italic text-white uppercase leading-[0.9] tracking-tighter">
                    {guestName.split(' ').map((part, i) => (
                      <span key={i} className="block">{part}</span>
                    ))}
                  </h2>
                  <div className="flex items-center gap-2 pt-2">
                    <p className="text-[10px] font-black text-[#D4C3B5] uppercase tracking-[2px] opacity-90">Verified Guest</p>
                    {guestPhone && <span className="text-[10px] text-white/50">• {guestPhone}</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[11px] font-black italic text-primary/40 uppercase tracking-[2.5px] px-2">Experience Details</h3>

              <div className="bg-[#F8F9FA] rounded-[40px] p-6 sm:p-8 space-y-6 border border-[#F2E8DF]">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-3xl bg-white border border-[#F2E8DF] shadow-xs">
                  {(detail.experienceSnapshot.coverPhoto || detail.experienceSnapshot.images?.[0]) && (
                    <div className="w-24 h-20 rounded-2xl overflow-hidden shrink-0 bg-surface">
                      <img
                        src={detail.experienceSnapshot.coverPhoto || detail.experienceSnapshot.images?.[0]}
                        alt={detail.experienceSnapshot.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles size={13} className="text-accent" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-accent">
                        {detail.experienceSnapshot.category?.name?.en || 'Experience'}
                      </span>
                    </div>
                    <h4 className="text-lg font-black italic text-primary uppercase tracking-tight truncate">
                      {detail.experienceSnapshot.title}
                    </h4>
                    {detail.experienceSnapshot.titleAr && (
                      <p className="text-xs text-muted-text mt-0.5" dir="rtl">{detail.experienceSnapshot.titleAr}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-white rounded-[20px] flex items-center justify-center text-primary shadow-sm border border-[#F2E8DF] shrink-0">
                    <CalendarIcon size={24} />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-primary/30 uppercase tracking-[1.5px]">Date &amp; Scheduled Time</p>
                    <p className="text-lg font-black text-primary italic uppercase tracking-tight">
                      {formatBookingDate(detail.date)}{detail.timeSlot ? ` · ${detail.timeSlot}` : ''}
                    </p>
                    {detail.startTime && detail.endTime && (
                      <p className="text-[11px] text-muted-text font-bold">{detail.startTime} – {detail.endTime}</p>
                    )}
                  </div>
                </div>

                {detail.experienceSnapshot.duration != null && (
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-white rounded-[20px] flex items-center justify-center text-primary shadow-sm border border-[#F2E8DF] shrink-0">
                      <Clock size={24} />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-black text-primary/30 uppercase tracking-[1.5px]">Duration</p>
                      <p className="text-lg font-black text-primary italic uppercase tracking-tight">
                        {detail.experienceSnapshot.duration} {detail.experienceSnapshot.duration === 1 ? 'Hour' : 'Hours'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-white rounded-[20px] flex items-center justify-center text-primary shadow-sm border border-[#F2E8DF] shrink-0">
                    <UsersIcon size={24} />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-primary/30 uppercase tracking-[1.5px]">Party Size</p>
                    <p className="text-lg font-black text-primary italic uppercase tracking-tight">
                      {detail.guestCount} {detail.guestCount === 1 ? 'Guest' : 'Guests'}
                    </p>
                  </div>
                </div>

                {detail.addOns && detail.addOns.length > 0 && (
                  <div className="p-5 rounded-3xl bg-white border border-[#F2E8DF] space-y-3 shadow-xs">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-primary">
                      <Sparkles size={13} className="text-accent" />
                      <span>Included Add-ons &amp; Extras ({detail.addOns.length})</span>
                    </div>
                    <div className="space-y-2">
                      {detail.addOns.map((addon, idx) => (
                        <div key={addon._id ?? idx} className="flex items-center justify-between p-3 rounded-2xl bg-[#F8F9FA] border border-[#F2E8DF] text-xs">
                          <div>
                            <span className="font-black text-primary">{addon.title}</span>
                            {addon.quantity != null && addon.quantity > 1 && (
                              <span className="text-[10px] text-muted-text ml-1.5">× {addon.quantity}</span>
                            )}
                            {addon.description && <p className="text-[10px] text-muted-text mt-0.5">{addon.description}</p>}
                          </div>
                          <span className="font-black text-accent shrink-0 ml-3">
                            +{detail.pricing.currency} {(addon.totalPrice ?? addon.price).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-5 rounded-3xl bg-white border border-[#F2E8DF] space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-primary">
                      <DollarSign size={13} className="text-accent" />
                      <span>Price &amp; Payment</span>
                    </div>
                    {detail.payment?.status && (
                      <Badge variant={detail.payment.status === 'paid' ? 'green' : 'gold'}>{detail.payment.status}</Badge>
                    )}
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-muted-text font-medium">
                      <span>Base ({detail.pricing.currency} {detail.pricing.unitPrice.toLocaleString()} × {detail.guestCount})</span>
                      <span>{detail.pricing.currency} {detail.pricing.baseSubtotal.toLocaleString()}</span>
                    </div>
                    {detail.pricing.addOnsTotal > 0 && (
                      <div className="flex items-center justify-between text-muted-text font-medium">
                        <span>Add-ons</span>
                        <span>{detail.pricing.currency} {detail.pricing.addOnsTotal.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-muted-text font-medium">
                      <span>Service Fee</span>
                      <span>{detail.pricing.currency} {detail.pricing.serviceFee.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-text font-medium">
                      <span>Taxes</span>
                      <span>{detail.pricing.currency} {detail.pricing.taxes.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1.5 border-t border-[#F2E8DF] font-black text-primary text-sm">
                      <span>Total</span>
                      <span className="text-accent italic">{detail.pricing.currency} {detail.pricing.totalPayable.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {detail.specialRequests && (
                  <div className="p-4 rounded-2xl bg-white border border-[#F2E8DF] space-y-1">
                    <div className="text-[10px] font-black uppercase tracking-wider text-muted-text">Special Requests from Guest</div>
                    <p className="text-xs text-primary font-medium leading-relaxed italic">"{detail.specialRequests}"</p>
                  </div>
                )}
              </div>
            </div>

            {expActionError && (
              <div className="bg-danger/5 border border-danger/20 rounded-3xl p-5 flex items-center gap-3 text-danger">
                <TriangleAlert size={18} />
                <p className="text-[10px] font-black uppercase tracking-widest">{expActionError}</p>
              </div>
            )}

            {/* Booking Workflow — PATCH .../complete and .../cancel, see
                features/experienceBookings/api.ts. No confirm action here
                since only complete/cancel endpoints were given. */}
            <div className="p-6 rounded-3xl bg-surface border border-border-misrah flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-primary">Booking Workflow</h4>
                <p className="text-[11px] text-muted-text font-medium">
                  Current status: <strong className="text-primary uppercase">{detail.status}</strong>
                </p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {detail.status !== completedStatusValue && detail.status !== cancelledStatusValue && (
                  <button
                    type="button"
                    onClick={handleCompleteExperienceBooking}
                    disabled={isCompletingExpBooking}
                    className="flex-1 sm:flex-initial px-6 py-3 rounded-2xl bg-emerald-600 text-white text-xs font-black uppercase tracking-wider hover:bg-emerald-700 transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isCompletingExpBooking && <Loader2 size={14} className="animate-spin" />}
                    Mark as Completed
                  </button>
                )}
                {detail.status !== cancelledStatusValue && (
                  <button
                    type="button"
                    onClick={() => { setExpBookingToCancel(detail); setExpCancelReason(''); setExpActionError(null); }}
                    className="flex-1 sm:flex-initial px-5 py-3 rounded-2xl border border-danger/30 text-danger hover:bg-danger/10 text-xs font-black uppercase tracking-wider transition-all"
                  >
                    Cancel Booking
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {expBookingToCancel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              onClick={() => !isCancellingExpBooking && setExpBookingToCancel(null)}
              className="absolute inset-0 bg-primary/60 backdrop-blur-sm"
            />
            <div className="bg-white rounded-3xl w-full max-w-md p-6 sm:p-8 relative z-10 shadow-luxury space-y-6">
              <div className="space-y-2">
                <h3 className="text-xl font-black italic text-primary uppercase">Cancel Booking</h3>
                <p className="text-xs text-muted-text font-medium leading-relaxed">
                  Are you sure you want to cancel this reservation for{' '}
                  <strong className="text-primary font-black">
                    {expBookingToCancel.traveler?.name ?? expBookingToCancel.contact?.name ?? 'this guest'}
                  </strong>?
                </p>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-text block mb-1">
                  Reason (optional)
                </label>
                <textarea
                  value={expCancelReason}
                  onChange={e => setExpCancelReason(e.target.value)}
                  rows={3}
                  placeholder="e.g. Guest requested cancellation"
                  className="w-full p-3 bg-surface border border-border-misrah rounded-xl text-xs font-medium text-primary outline-none focus:border-accent"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={isCancellingExpBooking}
                  onClick={() => setExpBookingToCancel(null)}
                  className="flex-1 py-3.5 rounded-2xl border border-border-misrah text-xs font-black uppercase tracking-wider text-primary hover:bg-surface transition-colors disabled:opacity-50"
                >
                  Keep Booking
                </button>
                <button
                  type="button"
                  disabled={isCancellingExpBooking}
                  onClick={handleConfirmCancelExperienceBooking}
                  className="flex-1 py-3.5 bg-danger text-white rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-danger/90 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isCancellingExpBooking && <Loader2 size={14} className="animate-spin" />}
                  {isCancellingExpBooking ? 'Cancelling…' : 'Cancel Reservation'}
                </button>
              </div>
            </div>
          </div>
        )}
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
                    <p className="text-lg font-black text-primary italic uppercase tracking-tight">{formatBookingDate(bookingDetail.checkInDate)} - {formatBookingDate(bookingDetail.checkOutDate)}</p>
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

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2 p-1 bg-surface rounded-2xl border border-border-misrah self-start shrink-0">
          <button
            type="button"
            onClick={() => { setActiveTab('stays'); setStatusFilter('all'); }}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'stays' ? 'bg-primary text-accent shadow-xs' : 'text-muted-text hover:text-primary'
            }`}
          >
            <CalendarIcon size={13} />
            <span>Stays</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('experiences'); setStatusFilter('all'); }}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'experiences' ? 'bg-primary text-accent shadow-xs' : 'text-muted-text hover:text-primary'
            }`}
          >
            <Sparkles size={13} />
            <span>Experiences</span>
          </button>
        </div>

        {/* Shared search + status row — same state/params sent to whichever
            tab is active (listBookings or listExperienceBookings); only the
            status dropdown's options change, since the two don't share a
            status vocabulary. */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-text" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'stays' ? 'Search guest, property...' : 'Search guest, experience...'}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-border-misrah text-xs font-bold text-primary outline-none focus:border-accent shadow-2xs"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="py-2.5 px-3 rounded-xl bg-white border border-border-misrah text-xs font-black uppercase tracking-wider text-primary outline-none focus:border-accent shadow-2xs cursor-pointer shrink-0"
          >
            <option value="all">All Statuses</option>
            {(activeTab === 'stays' ? bookingStatusOptions : experienceBookingStatusOptions).map(opt => (
              <option key={opt.key} value={opt.value}>{formatEnumLabel(opt.key)}</option>
            ))}
          </select>
        </div>
      </div>

      {activeTab === 'stays' && (
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
      )}

      {activeTab === 'experiences' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-border-misrah shadow-sm overflow-hidden">
            {isExpLoading ? (
              <div className="p-24 text-center">
                <Loader2 size={32} className="animate-spin mx-auto text-primary/30" />
              </div>
            ) : expLoadError ? (
              <div className="p-16 text-center space-y-4">
                <TriangleAlert size={32} className="mx-auto text-danger" />
                <p className="text-[10px] font-bold text-danger/70 uppercase tracking-widest">{expLoadError}</p>
                <button
                  onClick={() => fetchExperienceBookings(expPage)}
                  className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[2px] bg-primary text-white hover:opacity-90 transition-all"
                >
                  Retry
                </button>
              </div>
            ) : experienceBookings.length === 0 ? (
              <div className="p-24 text-center">
                <p className="text-[10px] font-bold text-muted-text/50 uppercase tracking-widest">No experience bookings found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-surface">
                      <th className="px-6 py-4 text-[9px] font-bold text-muted-text uppercase tracking-widest border-b border-border-misrah">Guest</th>
                      <th className="px-6 py-4 text-[9px] font-bold text-muted-text uppercase tracking-widest border-b border-border-misrah">Experience</th>
                      <th className="px-6 py-4 text-[9px] font-bold text-muted-text uppercase tracking-widest border-b border-border-misrah">Date &amp; Time</th>
                      <th className="px-6 py-4 text-[9px] font-bold text-muted-text uppercase tracking-widest border-b border-border-misrah text-center">Guests</th>
                      <th className="px-6 py-4 text-[9px] font-bold text-muted-text uppercase tracking-widest border-b border-border-misrah">Total</th>
                      <th className="px-6 py-4 text-[9px] font-bold text-muted-text uppercase tracking-widest border-b border-border-misrah text-center">Status</th>
                      <th className="px-6 py-4 border-b border-border-misrah"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-misrah/50">
                    {experienceBookings.map(booking => (
                      <tr
                        key={booking._id}
                        className="hover:bg-surface transition-colors cursor-pointer group"
                        onClick={() => setSelectedExperienceBookingId(booking._id)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={`https://i.pravatar.cc/150?u=${booking.traveler?._id ?? booking._id}`}
                              className="w-9 h-9 rounded-full object-cover"
                            />
                            <div>
                              <div className="text-sm font-bold">{booking.traveler?.name ?? booking.contact?.name ?? 'Guest'}</div>
                              <div className="text-[10px] text-muted-text font-medium uppercase tracking-tight">Verified</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold">{booking.experienceSnapshot.title}</div>
                          {booking.experienceSnapshot.category?.name?.en && (
                            <div className="text-[10px] text-muted-text font-medium">{booking.experienceSnapshot.category.name.en}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-primary">
                          {formatBookingDate(booking.date)}{booking.timeSlot ? ` · ${booking.timeSlot}` : ''}
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-center text-primary">{booking.guestCount}</td>
                        <td className="px-6 py-4 text-base font-sans font-bold italic text-accent">
                          {booking.pricing.currency} {booking.pricing.totalPayable.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge variant={booking.status === 'confirmed' ? 'blue' : booking.status === 'completed' ? 'green' : booking.status === 'cancelled' ? 'gray' : 'gold'}>
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
            {!isExpLoading && !expLoadError && expTotalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border-misrah">
                <button
                  onClick={() => setExpPage(p => Math.max(1, p - 1))}
                  disabled={expPage <= 1}
                  className="w-9 h-9 rounded-xl bg-surface border border-border-misrah flex items-center justify-center text-primary/60 disabled:opacity-30 hover:border-accent transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-text">
                  Page {expPage} of {expTotalPages} · {expTotalCount} booking{expTotalCount === 1 ? '' : 's'}
                </span>
                <button
                  onClick={() => setExpPage(p => Math.min(expTotalPages, p + 1))}
                  disabled={expPage >= expTotalPages}
                  className="w-9 h-9 rounded-xl bg-surface border border-border-misrah flex items-center justify-center text-primary/60 disabled:opacity-30 hover:border-accent transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
