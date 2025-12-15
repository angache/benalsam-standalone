/**
 * Generate SEO-friendly slug from Turkish text
 */
export function slugify(text: string): string {
  const trMap: Record<string, string> = {
    'ç': 'c', 'Ç': 'C',
    'ğ': 'g', 'Ğ': 'G',
    'ı': 'i', 'I': 'i',
    'İ': 'i',
    'ö': 'o', 'Ö': 'O',
    'ş': 's', 'Ş': 'S',
    'ü': 'u', 'Ü': 'U'
  }

  return text
    .split('')
    .map(char => trMap[char] || char)
    .join('')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, '') // Trim hyphens from start/end
}

/**
 * Generate listing URL with slug and full UUID
 * Format: /ilan/[slug]-[full-uuid]
 * Example: /ilan/macbook-pro-m1-laptop-17e2939b-343a-45ca-9263-3162c4047638
 */
export function generateListingUrl(title: string, id: string): string {
  const slug = slugify(title)
  return `/ilan/${slug}-${id}`
}

/**
 * Extract UUID from slug URL
 * Handles both formats: 
 * - /ilan/[slug]-[full-uuid] (new format)
 * - /ilan/[full-uuid] (old format, backward compatible)
 */
export function extractIdFromSlug(slugOrId: string | undefined): string | null {
  // Guard against undefined/null
  if (!slugOrId || typeof slugOrId !== 'string') {
    return null
  }
  
  // If it's a full UUID (no slug), return as is (backward compatible)
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId)) {
    return slugOrId
  }
  
  // If it's slug-uuid format, extract the UUID (last 5 parts after last non-uuid segment)
  // Pattern: [slug]-[uuid: 8-4-4-4-12]
  const uuidRegex = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i
  const match = slugOrId.match(uuidRegex)
  
  if (match) {
    return match[1]
  }
  
  return null
}

