import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/app';
import type { JwtPayload } from '../types';

export const jwtUtils = {
  // Sign JWT token
  sign(payload: JwtPayload): string {
    return jwt.sign(payload, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn,
    } as any);
  },

  // Sign refresh token
  signRefresh(payload: JwtPayload): string {
    return jwt.sign(payload, jwtConfig.secret, {
      expiresIn: jwtConfig.refreshExpiresIn,
    } as any);
  },

  // Verify JWT token
  verify(token: string): JwtPayload {
    return jwt.verify(token, jwtConfig.secret) as JwtPayload;
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