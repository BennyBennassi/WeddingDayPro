// Format time from HH:MM to 24-hour format
export function formatTimeTo24h(time: string): string {
  return time;
}

// Format time from HH:MM to 12-hour format
export function formatTimeTo12h(time: string): string {
  const [hour, minute] = time.split(':').map(Number);
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
}

// Parse time string to minutes since midnight
export function parseTime(time: string): number {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
}

// Format minutes since midnight to HH:MM
export function formatTime(minutes: number): string {
  const hour = Math.floor(minutes / 60) % 24;
  const minute = minutes % 60;
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

// Add minutes to a time string
export function addMinutes(time: string, minutes: number): string {
  const parsedTime = parseTime(time);
  return formatTime(parsedTime + minutes);
}

// Calculate minutes between two time strings
export function minutesBetween(startTime: string, endTime: string): number {
  const start = parseTime(startTime);
  let end = parseTime(endTime);
  
  // Handle cases where end time is on the next day
  if (end < start) {
    end += 24 * 60;
  }
  
  return end - start;
}

// Calculate left position percentage for a time block
export function calculateTimePosition(time: string, startHour: number = 6): string {
  const minutes = parseTime(time);
  const startMinutes = startHour * 60;
  
  // Handle wraparound for times after midnight
  let adjustedMinutes = minutes;
  if (minutes < startMinutes) {
    adjustedMinutes += 24 * 60;
  }
  
  // Calculate position as percentage (24 hours = 100%)
  const position = ((adjustedMinutes - startMinutes) / (24 * 60)) * 100;
  return `${position}%`;
}

// Calculate width percentage for a time block
export function calculateTimeWidth(startTime: string, endTime: string): string {
  const start = parseTime(startTime);
  let end = parseTime(endTime);
  
  // Handle cases where end time is on the next day
  if (end < start) {
    end += 24 * 60;
  }
  
  // Calculate width as percentage (24 hours = 100%)
  const width = ((end - start) / (24 * 60)) * 100;
  return `${width}%`;
}

// Check if two time blocks overlap
export function doTimeBlocksOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = parseTime(start1);
  let e1 = parseTime(end1);
  const s2 = parseTime(start2);
  let e2 = parseTime(end2);
  
  // Handle cases where end times are on the next day
  if (e1 < s1) e1 += 24 * 60;
  if (e2 < s2) e2 += 24 * 60;
  
  return Math.max(s1, s2) < Math.min(e1, e2);
}
