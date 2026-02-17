
/**
 * Distance Calculation Utility
 */

/**
 * Calculates the distance between two points using the Haversine formula.
 * @param lat1 Latitude of point 1
 * @param lng1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lng2 Longitude of point 2
 * @returns Distance in kilometers
 */
export function calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

/**
 * Converts degrees to radians
 */
function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}

/**
 * Formats distance for display
 * @param distanceKm Distance in kilometers
 * @returns Formatted string (e.g., "500 m", "2.5 km")
 */
export function formatDistance(distanceKm: number): string {
    if (distanceKm < 1) {
        return `${Math.round(distanceKm * 1000)} m`;
    }
    return `${distanceKm.toFixed(1)} km`;
}

/**
 * Calculates the extra charge based on distance.
 * Example logic: Free up to 3km, then ₹10 per km.
 * @param distanceKm Distance in kilometers
 * @returns Extra charge amount
 */
export function calculateDistanceCharge(distanceKm: number): number {
    const FREE_RADIUS_KM = 3;
    const RATE_PER_KM = 10; // ₹10 per km

    if (distanceKm <= FREE_RADIUS_KM) {
        return 0;
    }

    const chargeableDistance = distanceKm - FREE_RADIUS_KM;
    return Math.ceil(chargeableDistance * RATE_PER_KM);
}
