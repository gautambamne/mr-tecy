/**
 * Time Overlap Utility
 * 
 * Provides utilities for detecting time overlaps between booking slots.
 * Used for real-time partner availability checking.
 */

/**
 * Check if two time ranges overlap
 * 
 * Overlap Logic:
 * Two ranges overlap if:
 *   selectedStart < existingEnd AND selectedEnd > existingStart
 * 
 * Examples:
 * - [10:00-12:00] vs [11:00-13:00] → TRUE (partial overlap)
 * - [10:00-12:00] vs [14:00-16:00] → FALSE (no overlap)
 * - [10:00-12:00] vs [10:00-12:00] → TRUE (exact match)
 * - [10:00-14:00] vs [11:00-12:00] → TRUE (contained within)
 * 
 * @param selectedStart - Start time of the new booking
 * @param selectedEnd - End time of the new booking
 * @param existingStart - Start time of existing booking
 * @param existingEnd - End time of existing booking
 * @returns true if the time ranges overlap
 */
export function checkTimeOverlap(
    selectedStart: Date,
    selectedEnd: Date,
    existingStart: Date,
    existingEnd: Date
): boolean {
    // Convert to timestamps for reliable comparison
    const selStart = selectedStart.getTime();
    const selEnd = selectedEnd.getTime();
    const exStart = existingStart.getTime();
    const exEnd = existingEnd.getTime();

    // Check overlap condition
    return selStart < exEnd && selEnd > exStart;
}

/**
 * Calculate the end time of a booking based on start time and duration
 * 
 * @param startTime - The scheduled start time
 * @param durationHours - Duration in hours (default: 2 hours for standard slots)
 * @returns End time of the booking
 */
export function calculateBookingEndTime(
    startTime: Date,
    durationHours: number = 2
): Date {
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + durationHours);
    return endTime;
}

/**
 * Get start and end of a day for Firestore queries
 * 
 * @param date - The date to get boundaries for
 * @returns Object with startOfDay and endOfDay timestamps
 */
export function getDayBoundaries(date: Date): { startOfDay: Date; endOfDay: Date } {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return { startOfDay, endOfDay };
}

/**
 * Parse time slot string to Date object
 * 
 * @param date - The base date
 * @param timeString - Time string in "HH:mm" format (e.g., "09:00")
 * @returns Date object with the specified time
 */
export function parseTimeSlot(date: Date, timeString: string): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
}

/**
 * Format time range for display
 * 
 * @param start - Start time
 * @param end - End time
 * @returns Formatted string like "9:00 AM - 11:00 AM"
 */
export function formatTimeRange(start: Date, end: Date): string {
    const formatTime = (date: Date) => {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        const displayMinutes = minutes.toString().padStart(2, '0');
        return `${displayHours}:${displayMinutes} ${ampm}`;
    };

    return `${formatTime(start)} - ${formatTime(end)}`;
}
