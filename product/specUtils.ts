/**
 * plugin/gadgets/product/specUtils.ts
 *
 * Isomorphic utility functions for specifications.
 * Safe to import and call in both React Server Components and Client Components.
 */

const INVALID_SPEC_PLACEHOLDERS = new Set([
    "not specified",
    "not-specified",
    "not_specified",
    "notspecified",
    "not available",
    "not-available",
    "not_available",
    "n/a",
    "na",
    "none",
    "null",
    "undefined",
    "unknown",
    "unspecified",
]);

/**
 * Checks if a specification field value is valid and informative.
 * Excludes empty strings and placeholders like "Not specified", "N/A", "-", etc.
 */
export function isValidSpecValue(val: unknown): boolean {
    if (typeof val !== "string") return false;
    const trimmed = val.trim();
    if (!trimmed) return false;

    const normalized = trimmed.toLowerCase().replace(/^[.\-—_\s]+|[.\-—_\s]+$/g, "");
    if (!normalized) return false;

    return !INVALID_SPEC_PLACEHOLDERS.has(normalized);
}
