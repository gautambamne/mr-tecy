/**
 * Service Category Constants
 * 
 * Centralized definitions for all service categories.
 * DO NOT hardcode category values elsewhere in the codebase.
 */

// Service categories (lowercase for consistency)
export const SERVICE_CATEGORIES = ['car', 'bike', 'electrician', 'other'] as const;

// TypeScript type derived from the constant
export type ServiceCategory = typeof SERVICE_CATEGORIES[number];

// Display names for UI (properly capitalized)
export const CATEGORY_DISPLAY_NAMES: Record<ServiceCategory, string> = {
    car: 'Car',
    bike: 'Bike',
    electrician: 'Electrician',
    other: 'Other',
};

// Legacy category migration mapping
export const LEGACY_CATEGORY_MIGRATION: Record<string, ServiceCategory> = {
    // Old values (case-insensitive) -> New values
    'vehicle': 'car',
    'Vehicle': 'car',
    'appliance': 'bike',
    'Appliance': 'bike',
    'electronics': 'electrician',
    'Electronics': 'electrician',
    'plumbing': 'other',
    'Plumbing': 'other',
    'cleaning': 'other',
    'Cleaning': 'other',
};

/**
 * Migrates a legacy category value to the new standardized format.
 * If the category is already in the new format, it is returned as-is.
 * 
 * @param category - The category value to migrate
 * @returns The migrated category value
 */
export function migrateLegacyCategory(category: string): ServiceCategory {
    // Check if it's already a valid new category
    if (SERVICE_CATEGORIES.includes(category as ServiceCategory)) {
        return category as ServiceCategory;
    }

    // Try to migrate from legacy value
    const migrated = LEGACY_CATEGORY_MIGRATION[category];
    if (migrated) {
        return migrated;
    }

    // Default fallback
    console.warn(`Unknown category "${category}", defaulting to "other"`);
    return 'other';
}

/**
 * Validates if a string is a valid service category
 */
export function isValidCategory(category: string): category is ServiceCategory {
    return SERVICE_CATEGORIES.includes(category as ServiceCategory);
}
