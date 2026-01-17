/**
 * API Source Check Utility
 * Browser console'da VPS veya Local kullanımını kontrol etmek için
 */

import { config } from '@/config/environment'

/**
 * Browser console'da çalıştırılabilir fonksiyon
 * API kaynağını (VPS veya Local) gösterir
 */
export function checkApiSource() {
  const useVps = config.adminApi.url.includes('api.benalsam.com')
  
  console.log('🔍 API Source Check:')
  console.log('===================')
  console.log('📍 Admin API URL:', config.adminApi.url)
  console.log('📍 WebSocket URL:', config.adminApi.wsUrl)
  console.log('🌐 Source:', useVps ? '✅ VPS (api.benalsam.com)' : '❌ Local (localhost)')
  console.log('🔧 Environment:', config.isProduction ? 'Production' : 'Development')
  console.log('===================')
  
  return {
    url: config.adminApi.url,
    wsUrl: config.adminApi.wsUrl,
    isVps: useVps,
    environment: config.isProduction ? 'production' : 'development'
  }
}

/**
 * Window object'e ekle (browser console'dan erişilebilir)
 */
if (typeof window !== 'undefined') {
  (window as any).checkApiSource = checkApiSource
  (window as any).getApiConfig = () => config
}

