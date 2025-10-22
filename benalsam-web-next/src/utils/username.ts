/**
 * Generate a unique username from a name
 * @param name - The user's full name
 * @returns A URL-safe username
 */
export function generateUsername(name: string): string {
  if (!name) return `user-${Date.now()}`
  
  // Convert to lowercase, remove special characters, replace spaces with hyphens
  let username = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
  
  // If empty after cleaning, generate fallback
  if (!username) {
    username = `user-${Date.now()}`
  }
  
  return username
}

/**
 * Generate a unique username with number suffix if needed
 * @param baseUsername - The base username
 * @param existingUsernames - Array of existing usernames to check against
 * @returns A unique username
 */
export function ensureUniqueUsername(
  baseUsername: string, 
  existingUsernames: string[] = []
): string {
  let username = baseUsername
  let counter = 1
  
  while (existingUsernames.includes(username)) {
    username = `${baseUsername}-${counter}`
    counter++
  }
  
  return username
}

/**
 * Validate username format
 * @param username - The username to validate
 * @returns Object with isValid boolean and error message
 */
export function validateUsername(username: string): { isValid: boolean; error?: string } {
  if (!username) {
    return { isValid: false, error: 'Username is required' }
  }
  
  if (username.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters' }
  }
  
  if (username.length > 30) {
    return { isValid: false, error: 'Username must be less than 30 characters' }
  }
  
  // Only allow letters, numbers, and hyphens
  if (!/^[a-z0-9-]+$/.test(username)) {
    return { isValid: false, error: 'Username can only contain lowercase letters, numbers, and hyphens' }
  }
  
  // Cannot start or end with hyphen
  if (username.startsWith('-') || username.endsWith('-')) {
    return { isValid: false, error: 'Username cannot start or end with a hyphen' }
  }
  
  // Cannot have consecutive hyphens
  if (username.includes('--')) {
    return { isValid: false, error: 'Username cannot have consecutive hyphens' }
  }
  
  return { isValid: true }
}
