import CryptoJS from 'crypto-js';

/**
 * TOTP (Time-based One-Time Password) utility functions
 * Uses CryptoJS for secure cryptographic operations
 */

export interface TOTPConfig {
  secret: string;
  digits?: number;
  period?: number;
  algorithm?: 'SHA1' | 'SHA256' | 'SHA512';
}

export interface TOTPResult {
  code: string;
  remainingTime: number;
  period: number;
}

/**
 * Generate a secure random secret for TOTP
 * @param length Secret length (default: 32)
 * @returns Base32 encoded secret
 */
export const generateSecret = async (length: number = 32): Promise<string> => {
  try {
    // Generate a random string and hash it to create a secure secret
    const timestamp = Date.now().toString();
    const randomString = Math.random().toString(36).substring(2) + timestamp;
    
    // Use CryptoJS to create a hash
    const hash = CryptoJS.SHA256(randomString).toString(CryptoJS.enc.Hex);
    
    // Convert hash to base32
    const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    
    // Take first 32 characters from hash and convert to base32
    for (let i = 0; i < Math.min(length, hash.length); i += 2) {
      const hexByte = parseInt(hash.slice(i, i + 2), 16);
      const base32Index = hexByte % 32;
      result += base32Chars[base32Index];
    }
    
    // Ensure we have the right length
    while (result.length < length) {
      result += base32Chars[Math.floor(Math.random() * 32)];
    }
    
    return result.slice(0, length);
  } catch (error) {
    console.error('Error generating secret:', error);
    throw new Error('Failed to generate secret');
  }
};

/**
 * Convert base32 string to bytes
 */
const base32ToBytes = (base32: string): Uint8Array => {
  const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bytes = new Uint8Array(Math.ceil(base32.length * 5 / 8));
  let byteIndex = 0;
  let bitBuffer = 0;
  let bitCount = 0;
  
  for (let i = 0; i < base32.length; i++) {
    const char = base32[i].toUpperCase();
    const value = base32Chars.indexOf(char);
    
    if (value === -1) {
      throw new Error(`Invalid base32 character: ${char}`);
    }
    
    bitBuffer = (bitBuffer << 5) | value;
    bitCount += 5;
    
    while (bitCount >= 8) {
      bitCount -= 8;
      bytes[byteIndex++] = (bitBuffer >> bitCount) & 0xFF;
    }
  }
  
  return bytes.slice(0, byteIndex);
};

/**
 * HMAC-SHA1 implementation using CryptoJS
 */
const hmacSHA1 = async (key: Uint8Array, message: Uint8Array): Promise<Uint8Array> => {
  try {
    // Convert Uint8Array to CryptoJS format
    const keyWordArray = CryptoJS.lib.WordArray.create(key);
    const messageWordArray = CryptoJS.lib.WordArray.create(message);
    
    // Calculate HMAC-SHA1 using CryptoJS
    const hmac = CryptoJS.HmacSHA1(messageWordArray, keyWordArray);
    
    // Convert result back to Uint8Array
    const hmacHex = hmac.toString(CryptoJS.enc.Hex);
    const hmacBytes = new Uint8Array(hmacHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
    
    return hmacBytes;
  } catch (error) {
    console.error('Error in HMAC-SHA1:', error);
    throw error;
  }
};

/**
 * Generate TOTP code using universal implementation (compatible with all authenticators)
 * @param config TOTP configuration
 * @returns TOTP code and remaining time
 */
export const generateTOTP = async (config: TOTPConfig): Promise<TOTPResult> => {
  try {
    const { secret, digits = 6, period = 30, algorithm = 'SHA1' } = config;
    
    // Get current time in seconds (UTC)
    const time = Math.floor(Date.now() / 1000);
    const timeStep = Math.floor(time / period);
    const remainingTime = period - (time % period);
    
    // Normalize secret (remove padding, uppercase)
    const normalizedSecret = secret.replace(/=/g, '').toUpperCase();
    
    // Convert secret from base32 to bytes
    const secretBytes = base32ToBytes(normalizedSecret);
    
    // Create time-based message (8 bytes, big-endian)
    const message = new ArrayBuffer(8);
    const view = new DataView(message);
    view.setBigUint64(0, BigInt(timeStep), false); // Big-endian
    const messageBytes = new Uint8Array(message);
    
    // Generate HMAC using CryptoJS
    const hmac = await hmacSHA1(secretBytes, messageBytes);
    
    // Extract 4-byte code from HMAC (RFC 6238)
    const offset = hmac[hmac.length - 1] & 0x0F;
    const codeBytes = new Uint8Array(4);
    for (let i = 0; i < 4; i++) {
      codeBytes[i] = hmac[offset + i];
    }
    
    // Convert to number (big-endian)
    const codeNumber = ((codeBytes[0] & 0x7F) << 24) |
                      ((codeBytes[1] & 0xFF) << 16) |
                      ((codeBytes[2] & 0xFF) << 8) |
                      (codeBytes[3] & 0xFF);
    
    // Generate code with specified digits
    const code = (codeNumber % Math.pow(10, digits)).toString().padStart(digits, '0');
    
    return {
      code,
      remainingTime,
      period
    };
  } catch (error) {
    console.error('Error generating TOTP:', error);
    throw new Error('Failed to generate TOTP code');
  }
};

/**
 * Verify TOTP code using universal implementation (compatible with all authenticators)
 * @param code Code to verify
 * @param config TOTP configuration
 * @param window Time window for verification (default: 1)
 * @returns True if code is valid
 */
export const verifyTOTP = async (
  code: string,
  config: TOTPConfig,
  window: number = 1
): Promise<boolean> => {
  try {
    const { period = 30 } = config;
    const time = Math.floor(Date.now() / 1000);
    const timeStep = Math.floor(time / period);
    

    
    // Check current and adjacent time steps (wider window for compatibility)
    for (let i = -window; i <= window; i++) {
      const testTimeStep = timeStep + i;
      const testConfig = { ...config, period };
      
      // Temporarily modify time for testing
      const originalDateNow = Date.now;
      Date.now = () => (testTimeStep * period) * 1000;
      
      try {
        const result = await generateTOTP(testConfig);
        if (result.code === code) {
          return true;
        }
      } finally {
        Date.now = originalDateNow;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error verifying TOTP:', error);
    return false;
  }
};

/**
 * Generate QR code URL for TOTP setup
 * @param secret TOTP secret
 * @param accountName Account name (email)
 * @param issuer Issuer name (app name)
 * @returns QR code URL
 */
export const generateQRCodeURL = (
  secret: string,
  accountName: string,
  issuer: string = 'Benalsam'
): string => {
  const encodedSecret = encodeURIComponent(secret);
  const encodedAccount = encodeURIComponent(accountName);
  const encodedIssuer = encodeURIComponent(issuer);
  
  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${encodedSecret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
};

/**
 * Format secret for manual entry
 * @param secret TOTP secret
 * @param groupSize Group size for formatting (default: 4)
 * @returns Formatted secret
 */
export const formatSecretForDisplay = (secret: string, groupSize: number = 4): string => {
  const groups = [];
  for (let i = 0; i < secret.length; i += groupSize) {
    groups.push(secret.slice(i, i + groupSize));
  }
  return groups.join(' ');
}; 