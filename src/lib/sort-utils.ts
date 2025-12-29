/**
 * Natural number sorting collator for human-friendly string comparison.
 *
 * Handles numbers within strings intelligently:
 * - "Issue 2" comes before "Issue 10"
 * - "Batman #2" comes before "Batman #10"
 *
 * Options:
 * - numeric: true - Enables natural number sorting
 * - sensitivity: 'base' - Case-insensitive comparison
 */
export const naturalCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base'
})
