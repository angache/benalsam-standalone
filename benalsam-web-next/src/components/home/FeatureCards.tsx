/**
 * Feature Cards Component
 * 
 * Displays key platform features and benefits
 */

'use client'

import { Shield, Zap, Star, CheckCircle, Clock, Award } from 'lucide-react'

export default function FeatureCards() {
  const features = [
    {
      icon: Shield,
      title: 'Güvenli Alışveriş',
      description: 'Doğrulanmış kullanıcılar ve güvenli ödeme sistemi ile alışverişiniz güvence altında.',
      color: 'green',
    },
    {
      icon: Zap,
      title: 'Hızlı İletişim',
      description: 'Anında mesajlaşma ile satıcılarla direkt iletişime geçin, hızlıca anlaşın.',
      color: 'blue',
    },
    {
      icon: Star,
      title: 'Kalite Garantisi',
      description: 'Detaylı ürün açıklamaları, çoklu fotoğraflar ve kullanıcı değerlendirmeleri.',
      color: 'purple',
    },
  ]

  const colorMap = {
    green: {
      bg: 'bg-green-100 dark:bg-green-900/20',
      icon: 'text-green-600 dark:text-green-400',
    },
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900/20',
      icon: 'text-blue-600 dark:text-blue-400',
    },
    purple: {
      bg: 'bg-purple-100 dark:bg-purple-900/20',
      icon: 'text-purple-600 dark:text-purple-400',
    },
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {features.map((feature, index) => {
        const Icon = feature.icon
        const colors = colorMap[feature.color as keyof typeof colorMap]
        
        return (
          <div
            key={index}
            className="bg-card border rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-primary/30"
          >
            <div className={`w-14 h-14 ${colors.bg} rounded-xl flex items-center justify-center mb-4`}>
              <Icon className={`w-7 h-7 ${colors.icon}`} />
            </div>
            
            <h3 className="text-lg font-semibold mb-2 text-foreground">
              {feature.title}
            </h3>
            
            <p className="text-sm text-muted-foreground leading-relaxed">
              {feature.description}
            </p>
          </div>
        )
      })}
    </div>
  )
}

