import { auth } from '../config/firebase';
import logger from '../config/logger';

export class AuthService {
  /**
   * Custom claims ile token oluştur
   */
  async createCustomToken(uid: string, claims: any = {}): Promise<string> {
    try {
      const customClaims = {
        role: 'admin',
        service: 'realtime',
        firebase_secret: process.env['FIREBASE_SECRET'] || 'd73a1ab1f2f8dd10efaca107899a2ec4ca06afcdc2ded4d7c4623fe206333a13',
        ...claims
      };

      const customToken = await auth.createCustomToken(uid, customClaims);
      logger.info('✅ Custom token created', { uid, claims: customClaims });
      
      return customToken;
    } catch (error) {
      logger.error('❌ Failed to create custom token:', error);
      throw error;
    }
  }

  /**
   * Service account için token oluştur
   */
  async createServiceToken(): Promise<string> {
    try {
      const serviceUid = 'service-account-realtime';
      const customClaims = {
        role: 'admin',
        service: 'realtime',
        firebase_secret: process.env['FIREBASE_SECRET'] || 'd73a1ab1f2f8dd10efaca107899a2ec4ca06afcdc2ded4d7c4623fe206333a13',
        iss: 'https://securetoken.google.com/benalsam-2025'
      };

      const customToken = await auth.createCustomToken(serviceUid, customClaims);
      logger.info('✅ Service token created', { serviceUid, claims: customClaims });
      
      return customToken;
    } catch (error) {
      logger.error('❌ Failed to create service token:', error);
      throw error;
    }
  }

  /**
   * Token'ı verify et
   */
  async verifyToken(token: string): Promise<any> {
    try {
      const decodedToken = await auth.verifyIdToken(token);
      logger.info('✅ Token verified', { uid: decodedToken.uid, claims: decodedToken });
      
      return decodedToken;
    } catch (error) {
      logger.error('❌ Failed to verify token:', error);
      throw error;
    }
  }
}
