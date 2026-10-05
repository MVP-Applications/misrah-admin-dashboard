import React, { useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ChevronLeft, Save, Minus, Plus, Sparkles, Loader2, TriangleAlert, Gift } from 'lucide-react';
import {
  getExperienceAvailability,
  previewExperienceReschedule,
  rescheduleExperienceBooking,
} from '../../features/experienceBookings/api';
import type { ExperienceAvailability, ExperienceBookingDetail } from '../../features/experienceBookings/types';
import { getExperienceById } from '../../features/experiences/api';
import type { ApiExperienceAddOn } from '../../features/experiences/types';

// "Update Experience Booking" — the Manage view from misrah-retreats-admin's
// BookingsView, wired to PATCH /experience-booking/{id}/reschedule. Status
// isn't part of that endpoint, so the retreats status selector isn't here.


interface ExperienceBookingManageViewProps {
  detail: ExperienceBookingDetail;
  onBack: () => void;
  onSaved: () => void;
}

const toDateInput = (value?: string) => {
  if (!value) return '';
  try {
    return format(parseISO(value), 'yyyy-MM-dd');
  } catch {
    return value.slice(0, 10);
  }
};

export const ExperienceBookingManageView = ({ detail, onBack, onSaved }: ExperienceBookingManageViewProps) => {
  const pricing = detail.pricing;
  const currency = pricing?.currency || detail.experienceSnapshot.currency || 'AED';

  const [date, setDate] = useState(toDateInput(detail.date));
  const [timeSlot, setTimeSlot] = useState(detail.timeSlot || detail.startTime || '');
  const [guestCount, setGuestCount] = useState(detail.guestCount || 1);
  // Booked add-ons with editable quantity (0 = remove), keyed by their
  // position in the booking — the booking's own add-on ids aren't what the
  // reschedule endpoint accepts (see resolvedAddOns below).
  const bookingAddOnKey = (idx: number) => `booked-${idx}`;
  const [addOnQuantities, setAddOnQuantities] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    (detail.addOns || []).forEach((a, idx) => {
      initial[bookingAddOnKey(idx)] = a.quantity ?? 1;
    });
    return initial;
  });

  // Add-ons the experience currently offers (public GET /experience/{id}).
  // Reschedule only accepts these — sending the booking's stored copy id gives
  // "Add-on '…' is not offered for this experience".
  const [offeredAddOns, setOfferedAddOns] = useState<ApiExperienceAddOn[] | null>(null);
  // Preview/save wait for this lookup so add-on ids are final before sending.
  const hasBookedAddOns = (detail.addOns || []).length > 0;
  const [isAddOnLookupDone, setIsAddOnLookupDone] = useState(!hasBookedAddOns || !detail.experienceId);
  useEffect(() => {
    if (!detail.experienceId || !hasBookedAddOns) return;
    let cancelled = false;
    getExperienceById(detail.experienceId)
      .then(exp => { if (!cancelled) setOfferedAddOns(Array.isArray(exp.addOns) ? exp.addOns : []); })
      .catch(() => { if (!cancelled) setOfferedAddOns(null); })
      .finally(() => { if (!cancelled) setIsAddOnLookupDone(true); });
    return () => { cancelled = true; };
  }, [detail.experienceId, hasBookedAddOns]);

  // Booked add-on → the experience's current add-on (by id, then by title).
  // `sendId` is what goes in addOns[].addOnId; null = no longer offered.
  const resolvedAddOns = useMemo(
    () =>
      (detail.addOns || []).map((a, idx) => {
        const key = bookingAddOnKey(idx);
        if (!offeredAddOns) {
          // Couldn't load the experience — follow the documented body, which
          // identifies add-ons by title.
          return { key, booked: a, sendId: a.title, isOffered: true };
        }
        const ids = [a.addOnId, a._id].filter(Boolean);
        const match =
          offeredAddOns.find(o => o._id && ids.includes(o._id)) ??
          offeredAddOns.find(o => o.title?.trim().toLowerCase() === a.title?.trim().toLowerCase());
        return { key, booked: a, sendId: match ? match._id || match.title : null, isOffered: !!match };
      }),
    [detail.addOns, offeredAddOns],
  );
  const [reason, setReason] = useState('');

  const [availability, setAvailability] = useState<ExperienceAvailability | null>(null);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const originalDate = toDateInput(detail.date);
  // The backend rejects reschedules (and previews) to a past date.
  const today = format(new Date(), 'yyyy-MM-dd');
  const isPastDate = !!date && date < today;
  const originalSlot = detail.timeSlot || detail.startTime || '';
  // Server preview result — the only source used for the saved total.
  const [preview, setPreview] = useState<{ priceDifference: number | null; newTotal: number | null } | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Time slots for the selected date (public availability endpoint).
  useEffect(() => {
    const experienceId = detail.experienceId;
    setAvailability(null);
    setAvailabilityError(null);
    if (!experienceId || !date) return;
    let cancelled = false;
    setIsLoadingSlots(true);
    getExperienceAvailability(experienceId, date)
      .then(result => { if (!cancelled) setAvailability(result); })
      .catch(err => { if (!cancelled) setAvailabilityError(err instanceof Error ? err.message : 'Could not load time slots.'); })
      .finally(() => { if (!cancelled) setIsLoadingSlots(false); });
    return () => { cancelled = true; };
  }, [detail.experienceId, date]);

  // Slots for the chosen date. The booking's own slot (on its original date)
  // stays selectable even if the API now reports it full — it's this
  // booking's seat.
  const slotOptions = useMemo(() => {
    const list = (availability?.slots ?? []).map(s => ({
      value: s.timeSlot || s.startTime,
      label: s.endTime ? `${s.startTime || s.timeSlot} – ${s.endTime}` : (s.timeSlot || s.startTime),
      isAvailable: s.isAvailable || (date === originalDate && (s.timeSlot || s.startTime) === originalSlot),
      isCurrent: date === originalDate && (s.timeSlot || s.startTime) === originalSlot,
    })).filter(s => s.value);
    if (date === originalDate && originalSlot && !list.some(s => s.value === originalSlot)) {
      list.unshift({ value: originalSlot, label: originalSlot, isAvailable: true, isCurrent: true });
    }
    return list;
  }, [availability, date, originalDate, originalSlot]);

  // Keep a valid slot selected once a date's slots load, so the price preview
  // can run: keep the current one if it's still bookable, else prefer the
  // booking's original time, else the first available slot.
  useEffect(() => {
    if (isLoadingSlots || !availability) return;
    const current = slotOptions.find(s => s.value === timeSlot);
    if (current && current.isAvailable) return;
    const sameTime = slotOptions.find(s => s.value === originalSlot && s.isAvailable);
    const firstAvailable = slotOptions.find(s => s.isAvailable);
    const next = (sameTime ?? firstAvailable)?.value ?? '';
    if (next !== timeSlot) setTimeSlot(next);
  }, [slotOptions, timeSlot, isLoadingSlots, availability, originalSlot]);

  const maxGuests = availability?.maxGuests && availability.maxGuests > 0 ? availability.maxGuests : undefined;
  const isDateUnavailable = availability?.isDateAvailable === false && date !== originalDate;

  const addOnsPayload = useMemo(
    () =>
      resolvedAddOns
        .filter(r => r.isOffered && r.sendId && (addOnQuantities[r.key] ?? 0) > 0)
        .map(r => ({ addOnId: r.sendId as string, quantity: addOnQuantities[r.key] })),
    [resolvedAddOns, addOnQuantities],
  );

  // Local estimate from the booking's own pricing — used if the preview
  // endpoint doesn't return a usable total.
  const estimatedTotal = useMemo(() => {
    if (!pricing) return 0;
    const unit = pricing.unitPrice ?? detail.experienceSnapshot.price ?? 0;
    const base = pricing.priceType === 'per_person' ? unit * guestCount : unit;
    const addOnsTotal = resolvedAddOns.reduce((sum, r) => {
      const qty = r.isOffered ? addOnQuantities[r.key] ?? 0 : 0;
      const perUnit = r.booked.pricingModel === 'per_person' ? r.booked.price * guestCount : r.booked.price;
      return sum + perUnit * qty;
    }, 0);
    const subtotal = base + addOnsTotal;
    // Scale fees/taxes with the subtotal, as a proportion of the original.
    const originalSubtotal = pricing.subtotal || pricing.baseSubtotal + pricing.addOnsTotal || 0;
    const feeRatio = originalSubtotal > 0 ? ((pricing.serviceFee || 0) + (pricing.taxes || 0)) / originalSubtotal : 0;
    return Math.round((subtotal * (1 + feeRatio)) * 100) / 100;
  }, [pricing, detail, guestCount, addOnQuantities, resolvedAddOns]);

  // Server-side preview (debounced) whenever the inputs change.
  useEffect(() => {
    if (!date || !timeSlot || isPastDate || !isAddOnLookupDone) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    const handle = setTimeout(() => {
      setIsPreviewing(true);
      previewExperienceReschedule(detail._id, { date, timeSlot, guestCount, addOns: addOnsPayload, reason: reason || undefined }, currency)
        .then(result => { if (!cancelled) { setPreview(result); setPreviewError(null); } })
        .catch(err => { if (!cancelled) { setPreview(null); setPreviewError(err instanceof Error ? err.message : 'Could not calculate the new price.'); } })
        .finally(() => { if (!cancelled) setIsPreviewing(false); });
    }, 500);
    return () => { cancelled = true; clearTimeout(handle); };
  }, [detail._id, date, timeSlot, guestCount, addOnsPayload, reason, isPastDate, isAddOnLookupDone, currency]);

  const originalTotal = pricing?.totalPayable ?? 0;
  const round2 = (n: number) => Math.round(n * 100) / 100;
  // Saved total = current total + the server's priceDifference (what the
  // backend re-validates). Falls back to a server-given new total; never to
  // the local estimate, which caused "Price mismatch" rejections.
  const serverTotal = preview
    ? preview.priceDifference !== null
      ? round2(originalTotal + preview.priceDifference)
      : preview.newTotal
    : null;
  const totalPayable = serverTotal ?? estimatedTotal;
  const difference = preview?.priceDifference ?? round2(totalPayable - originalTotal);
  const isPriceConfirmed = serverTotal !== null;

  const handleSave = async () => {
    if (!date || !timeSlot) {
      setSaveError('Please choose a date and an available time slot.');
      return;
    }
    if (!isPriceConfirmed || isPreviewing) {
      setSaveError(previewError ? `Can't save yet: ${previewError}` : 'Please wait for the new price to be calculated.');
      return;
    }
    if (isPastDate) {
      setSaveError('Choose today or a future date — bookings can’t be moved to a past date.');
      return;
    }
    if (isDateUnavailable) {
      setSaveError('This experience is not available on the selected date.');
      return;
    }
    if (maxGuests && guestCount > maxGuests) {
      setSaveError(`Maximum ${maxGuests} guests for this experience.`);
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      await rescheduleExperienceBooking(detail._id, {
        date,
        timeSlot,
        guestCount,
        addOns: addOnsPayload,
        reason: reason.trim() || undefined,
        pricing: { totalPayable },
      }, currency);
      onSaved();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update this booking.');
    } finally {
      setIsSaving(false);
    }
  };

  const stepper = (value: number, onChange: (v: number) => void, min: number, max?: number) => (
    <div className="flex items-center gap-6">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-12 h-12 rounded-2xl bg-[#FBFBFC] border border-[#F2E8DF] flex items-center justify-center text-primary/40 hover:text-primary transition-all active:scale-90"
      >
        <Minus size={20} />
      </button>
      <span className="text-xl font-black text-primary w-6 text-center">{value}</span>
      <button
        type="button"
        onClick={() => onChange(max !== undefined ? Math.min(max, value + 1) : value + 1)}
        disabled={max !== undefined && value >= max}
        className="w-12 h-12 rounded-2xl bg-[#FBFBFC] border border-[#F2E8DF] flex items-center justify-center text-primary/40 hover:text-primary transition-all active:scale-90 disabled:opacity-30"
      >
        <Plus size={20} />
      </button>
    </div>
  );

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-white border border-[#F2E8DF] flex items-center justify-center hover:bg-surface transition-all text-primary"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-black italic text-primary uppercase leading-none tracking-tighter">
              Update<br />
              Experience Booking
            </h1>
            <p className="text-xs text-muted-text mt-1 font-bold">{detail.experienceSnapshot.title}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || isPreviewing || !isPriceConfirmed}
          className="flex items-center gap-2 px-6 py-3 bg-[#0F1D33] text-accent rounded-full text-[10px] font-black uppercase tracking-[2px] shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
        >
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save Changes
        </button>
      </header>

      {saveError && (
        <div className="bg-danger/5 border border-danger/20 rounded-3xl p-5 flex items-center gap-3 text-danger">
          <TriangleAlert size={18} />
          <p className="text-[10px] font-black uppercase tracking-widest">{saveError}</p>
        </div>
      )}

      {/* Schedule — date & time slot */}
      <div className="bg-[#FBFBFC] rounded-[40px] p-8 border border-[#F2E8DF] shadow-sm relative overflow-hidden space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 text-accent flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-tight text-primary">Experience Schedule</h3>
              <p className="text-[10px] font-bold text-muted-text">
                {date || 'Select a date'} · {timeSlot || 'Select a slot'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-text">Date:</span>
            <input
              type="date"
              value={date}
              min={today}
              onChange={e => setDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-border-misrah bg-white text-xs font-bold text-primary outline-none focus:border-accent"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-muted-text">
            <span>Time Slot</span>
            {isLoadingSlots && <Loader2 size={12} className="animate-spin text-accent" />}
          </div>
          {isPastDate ? (
            <p className="p-4 rounded-2xl border border-dashed border-amber-500/40 bg-amber-500/10 text-center text-[10px] font-black uppercase tracking-widest text-amber-700">
              This date has passed — pick today or a future date to reschedule
            </p>
          ) : isDateUnavailable ? (
            <p className="p-4 rounded-2xl border border-dashed border-danger/30 bg-danger/5 text-center text-[10px] font-black uppercase tracking-widest text-danger">
              Not available on this date — pick another
            </p>
          ) : availabilityError ? (
            <p className="p-4 rounded-2xl border border-dashed border-danger/30 bg-danger/5 text-center text-[10px] font-black uppercase tracking-widest text-danger">
              {availabilityError}
            </p>
          ) : !isLoadingSlots && slotOptions.length === 0 ? (
            <p className="p-4 rounded-2xl border border-dashed border-border-misrah text-center text-[10px] font-black uppercase tracking-widest text-muted-text/60">
              {date ? 'No time slots on this date' : 'Select a date to see time slots'}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {slotOptions.map(slot => (
                <button
                  key={slot.value}
                  type="button"
                  disabled={!slot.isAvailable}
                  onClick={() => setTimeSlot(slot.value)}
                  title={slot.isAvailable ? undefined : 'Fully booked'}
                  className={`py-3 px-4 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border flex flex-col items-center gap-0.5 disabled:cursor-not-allowed ${
                    timeSlot === slot.value
                      ? 'bg-primary text-accent border-primary shadow-xs'
                      : slot.isAvailable
                        ? 'bg-white border-border-misrah text-primary hover:bg-surface'
                        : 'bg-surface border-border-misrah text-muted-text/40 line-through'
                  }`}
                >
                  <span>{slot.label}</span>
                  {(slot.isCurrent || !slot.isAvailable) && (
                    <span className="text-[8px] tracking-widest no-underline opacity-70">{slot.isCurrent ? 'Current' : 'Full'}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Party allocation */}
      <div className="space-y-4">
        <h3 className="text-[11px] font-black italic text-primary/40 uppercase tracking-[2.5px] px-2">Experience Party Allocation</h3>
        <div className="bg-white rounded-[40px] p-8 space-y-8 border border-[#F2E8DF] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-black text-primary uppercase tracking-tight italic">Number of Guests / Participants</h4>
              <p className="text-[9px] font-black text-primary/30 uppercase tracking-[1.5px] mt-0.5">
                Adjust Count{maxGuests ? ` · Max ${maxGuests}` : ''}
              </p>
            </div>
            {stepper(guestCount, setGuestCount, 1, maxGuests)}
          </div>
        </div>
      </div>

      {/* Add-ons */}
      {(detail.addOns || []).length > 0 && (
        <div className="space-y-4">
          <h3 className="text-[11px] font-black italic text-primary/40 uppercase tracking-[2.5px] px-2">Booked Add-ons & Extras</h3>
          <div className="bg-white rounded-[40px] p-8 space-y-6 border border-[#F2E8DF] shadow-sm">
            {resolvedAddOns.map(({ key, booked: addOn, isOffered }, idx) => {
              return (
                <div key={key} className={`flex items-center justify-between gap-4 ${idx > 0 ? 'pt-6 border-t border-[#F2E8DF]' : ''} ${!isOffered ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0">
                      <Gift size={18} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-black text-primary uppercase tracking-tight italic truncate">{addOn.title}</h4>
                      <p className="text-[9px] font-black text-primary/30 uppercase tracking-[1.5px] mt-0.5">
                        {currency} {addOn.price} · {addOn.pricingModel === 'per_person' ? 'Per Person' : addOn.pricingModel === 'hourly' ? 'Hourly' : 'Fixed'}
                      </p>
                      {!isOffered && (
                        <p className="text-[9px] font-black text-danger uppercase tracking-[1.5px] mt-0.5">
                          No longer offered — will be removed
                        </p>
                      )}
                    </div>
                  </div>
                  {isOffered
                    ? stepper(addOnQuantities[key] ?? 0, v => setAddOnQuantities(prev => ({ ...prev, [key]: v })), 0)
                    : <span className="text-xs font-black text-muted-text/50 uppercase tracking-widest shrink-0">Removed</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reason */}
      <div className="space-y-4">
        <h3 className="text-[11px] font-black italic text-primary/40 uppercase tracking-[2.5px] px-2">Reason For Change</h3>
        <textarea
          rows={3}
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="e.g. Travel plan changed"
          className="w-full bg-white rounded-[28px] p-6 border border-[#F2E8DF] shadow-sm text-xs font-medium text-primary outline-none focus:border-accent"
        />
      </div>

      {/* Pricing summary */}
      <div className="bg-[#0F1D33] rounded-[40px] p-8 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[2px] text-white/50 flex items-center gap-2">
            New Total Payable
            {isPreviewing && <Loader2 size={12} className="animate-spin text-accent" />}
          </p>
          <p className="text-3xl font-black italic text-accent mt-1">
            {currency} {totalPayable.toLocaleString()}
          </p>
          <p className="text-[10px] font-bold text-white/40 mt-1">
            {isPreviewing
              ? 'Calculating…'
              : isPriceConfirmed
                ? 'Calculated by server preview'
                : previewError
                  ? `Estimate only — ${previewError}`
                  : isPastDate || !date
                    ? 'Estimate only — pick today or a future date to calculate the price'
                    : !timeSlot
                      ? 'Estimate only — select a time slot to calculate the price'
                      : 'Estimate only — waiting for server price'}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-[10px] font-black uppercase tracking-[2px] text-white/50">Current Total</p>
          <p className="text-lg font-black text-white">{currency} {originalTotal.toLocaleString()}</p>
          <p className={`text-[10px] font-black uppercase tracking-wider mt-1 ${difference > 0 ? 'text-amber-300' : difference < 0 ? 'text-emerald-300' : 'text-white/40'}`}>
            {difference > 0 ? `+${currency} ${difference.toLocaleString()} to collect` : difference < 0 ? `${currency} ${Math.abs(difference).toLocaleString()} to refund` : 'No price change'}
          </p>
        </div>
      </div>
    </div>
  );
};
