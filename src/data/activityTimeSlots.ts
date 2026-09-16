export interface TimeSlotPreset {
  label: string;
  time: string;
}

export const STANDARD_TIME_SLOT_PRESETS: TimeSlotPreset[] = [
  { label: 'Morning', time: '09:00 - 11:00' },
  { label: 'Midday', time: '11:30 - 13:30' },
  { label: 'Afternoon', time: '14:00 - 16:00' },
  { label: 'Sunset', time: '16:30 - 18:30' },
  { label: 'Evening', time: '19:00 - 21:00' },
  { label: 'Late Night', time: '21:30 - 23:30' }
];

export const getCategoryDefaultTimeSlots = (categoryId: string): string[] => {
  switch (categoryId) {
    case 'culinary':
      return ['17:00 - 19:30', '19:30 - 22:00'];
    case 'marine-beach':
      return ['08:30 - 11:30', '13:00 - 16:00', '16:30 - 19:00'];
    case 'sports-adventure':
      return ['07:00 - 08:30', '16:30 - 18:00', '18:30 - 20:00'];
    case 'wellness':
      return ['08:00 - 09:30', '17:00 - 18:30'];
    case 'leisure-events':
      return ['18:00 - 21:00', '21:00 - 00:00'];
    case 'heritage-culture':
      return ['10:00 - 12:30', '16:00 - 18:30'];
    case 'photography-content':
      return ['06:30 - 08:30', '17:00 - 19:00'];
    case 'farm-nature':
      return ['09:00 - 11:30', '15:30 - 18:00'];
    case 'arts-workshops':
      return ['11:00 - 13:00', '16:00 - 18:00'];
    default:
      return ['10:00 - 12:00', '16:30 - 18:30', '19:00 - 21:00'];
  }
};
