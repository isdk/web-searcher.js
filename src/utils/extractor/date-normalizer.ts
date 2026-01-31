/**
 * Normalizes a date string into a standard ISO 8601 format (UTC).
 * It handles various formats (YYYY-MM-DD, RFC2822, etc.) and performs
 * aggressive cleaning and sanity checks.
 *
 * @param dateStr - The raw date string to normalize.
 * @returns An ISO 8601 string (e.g., "2024-01-20T00:00:00.000Z") or null if invalid.
 */
export function normalizeDate(dateStr: string | null): string | null {
  if (!dateStr) return null

  try {
    let trimmed = dateStr.trim()
    if (!trimmed) return null

    // 1. More aggressive cleaning
    // Remove common prefixes: "Published on:", "Last updated at:", etc.
    trimmed = trimmed.replace(
      /^(?:last|first|posted|originally)\s*(?:published|updated|date|posted|modified)\s*(?:on|at)?[:\s]*/i,
      ''
    )
    // Fallback for simpler prefixes
    trimmed = trimmed.replace(
      /^(?:published|updated|date|posted|modified)\s*(?:on|at)?[:\s]*/i,
      ''
    )

    // Remove common suffixes: " (Updated)", "| News", "by Admin", " - 5 min read"
    trimmed = trimmed.split(/[\(|\|]|by\s+|[-–—]\s*\d+\s*min/i)[0].trim()

    const date = new Date(trimmed)
    if (!isNaN(date.getTime())) {
      const year = date.getUTCFullYear()
      const currentYear = new Date().getUTCFullYear()
      // Generous sanity check:
      // -10000 covers recorded human history (e.g., Tao Te Ching).
      // currentYear + 20 covers near-future dates (e.g., pre-orders).
      if (year >= -10000 && year <= currentYear + 20) {
        return date.toISOString()
      }
    }
  } catch (e) {
    // Ignore parsing errors
  }

  return null
}
