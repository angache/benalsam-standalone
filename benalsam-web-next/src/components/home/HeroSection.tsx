/**
 * Hero Section Component
 * 
 * Modern hero banner for homepage
 * Features gradient background, call-to-action, and key benefits
 */

'use client'

import { Button } from '@/components/ui/button'
import { Plus, TrendingUp, Users, Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function HeroSection() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-32">
        <div className="text-center">
          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
            <span className="block text-gray-900 dark:text-white">
              İhtiyacınız Olan Her Şey
            </span>
            <span 
              className="block mt-2"
              style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Burada Bulunur
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-600 dark:text-gray-300">
            Türkiye'nin en güvenilir alım-satım platformunda binlerce ilan arasından
            ihtiyacınıza uygun olanı bulun veya kendi ilanınızı verin.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="text-lg px-8 py-6 text-white"
              style={{ backgroundColor: 'var(--primary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary-hover)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary)' }}
              onClick={() => router.push(isAuthenticated ? '/ilan-olustur' : '/auth/login')}
            >
              <Plus className="w-5 h-5 mr-2" />
              Ücretsiz İlan Ver
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6"
              onClick={() => {
                const element = document.getElementById('featured-listings')
                element?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              İlanları İncele
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-6 h-6 text-primary mr-2" />
                <p className="text-3xl font-bold text-gray-900 dark:text-white">50K+</p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Aktif Kullanıcı</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="w-6 h-6 text-primary mr-2" />
                <p className="text-3xl font-bold text-gray-900 dark:text-white">100K+</p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Başarılı İşlem</p>
            </div>
            
            <div className="text-center col-span-2 md:col-span-1">
              <div className="flex items-center justify-center mb-2">
                <Shield className="w-6 h-6 text-primary mr-2" />
                <p className="text-3xl font-bold text-gray-900 dark:text-white">%99.9</p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Güvenlik Skoru</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg 
          viewBox="0 0 1440 120" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto"
        >
          <path 
            d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z" 
            className="fill-background"
          />
        </svg>
      </div>
    </section>
  )
}

