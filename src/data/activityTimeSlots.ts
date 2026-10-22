// Experience time slots are single start times in 12-hour AM/PM form
// (e.g. "07:00 AM") — the exact format the experiences API takes and returns.

export interface TimeSlotPreset {
  label: string;
  time: string;
}

export const STANDARD_TIME_SLOT_PRESETS: TimeSlotPreset[] = [
  { label: 'Morning', time: '09:00 AM' },
  { label: 'Midday', time: '11:30 AM' },
  { label: 'Afternoon', time: '02:00 PM' },
  { label: 'Sunset', time: '04:30 PM' },
  { label: 'Evening', time: '07:00 PM' },
  { label: 'Late Night', time: '09:30 PM' }
];

export const getCategoryDefaultTimeSlots = (categoryId: string): string[] => {
  switch (categoryId) {
    case 'culinary':
      return ['05:00 PM', '07:30 PM'];
    case 'marine-beach':
      return ['08:30 AM', '01:00 PM', '04:30 PM'];
    case 'sports-adventure':
      return ['07:00 AM', '04:30 PM', '06:30 PM'];
    case 'wellness':
      return ['08:00 AM', '05:00 PM'];
    case 'leisure-events':
      return ['06:00 PM', '09:00 PM'];
    case 'heritage-culture':
      return ['10:00 AM', '04:00 PM'];
    case 'photography-content':
      return ['06:30 AM', '05:00 PM'];
    case 'farm-nature':
      return ['09:00 AM', '03:30 PM'];
    case 'arts-workshops':
      return ['11:00 AM', '04:00 PM'];
    default:
      return ['10:00 AM', '04:30 PM', '07:00 PM'];
  }
};
