import jwt from 'jsonwebtoken';
import { StringValue } from 'ms';
import { jwtConfig } from '../config/app';
import { jwtSecurityService } from '../services/jwtSecurityService';
import type { JwtPayload } from '../types';

export const jwtUtils = {
  // Sign JWT token with enhanced security
  sign(payload: JwtPayload): string {
    return jwtSecurityService.sign(payload, {
      expiresIn: jwtConfig.expiresIn as StringValue,
    });
  },

  // Sign refresh token with enhanced security
  signRefresh(payload: JwtPayload): string {
    return jwtSecurityService.signRefresh(payload, {
      expiresIn: jwtConfig.refreshExpiresIn as StringValue,
    });
  },

  // Verify JWT token with enhanced security
  async verify(token: string): Promise<JwtPayload> {
    const result = await jwtSecurityService.verify(token);
    if (!result.valid) {
      throw new Error(result.error || 'Invalid token');
    }
    return result.payload as JwtPayload;
  },

  // Verify Supabase JWT token
  verifySupabaseToken(token: string): any {
    try {
      // Boş token kontrolü
      if (!token || token.trim() === '') {
        throw new Error('Empty token');
      }
      
      // Supabase JWT'yi decode et (signature doğrulaması yapmadan)
      const decoded = jwt.decode(token);
      if (!decoded || typeof decoded === 'string') {
        throw new Error('Invalid token format');
      }
      
      // Token'ın geçerlilik süresini kontrol et
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < now) {
        throw new Error('Token expired');
      }
      
      return decoded;
    } catch (error) {
      throw new Error('Invalid Supabase token');
    }
  },

  // Decode JWT token without verification
  decode(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch (error) {
      return null;
    }
  }
}; 