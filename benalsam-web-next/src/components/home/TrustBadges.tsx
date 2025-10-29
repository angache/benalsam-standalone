/**
 * TrustBadges Component
 * Display trust indicators and social proof
 */

'use client'

import { Shield, Clock, Award, Zap } from 'lucide-react'
import { motion } from 'framer-motion'

const TRUST_ITEMS = [
  {
    icon: Shield,
    title: '10,234',
    subtitle: 'Mutlu Kullanıcı',
    detail: '%98 Memnuniyet',
    color: 'text-blue-500',
  },
  {
    icon: Clock,
    title: '2 Saat',
    subtitle: 'Ort. Yanıt Süresi',
    detail: '7/24 Destek',
    color: 'text-green-500',
  },
  {
    icon: Award,
    title: '15,567',
    subtitle: 'Başarılı İşlem',
    detail: 'Bu Ay',
    color: 'text-purple-500',
  },
  {
    icon: Zap,
    title: 'Ücretsiz',
    subtitle: 'İlan Yayınla',
    detail: 'Sınırsız',
    color: 'text-orange-500',
  },
]

export default function TrustBadges() {
  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {TRUST_ITEMS.map((item, index) => {
          const Icon = item.icon
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card border rounded-lg p-6 text-center hover:shadow-lg transition-all hover:scale-105"
            >
              <Icon className={`w-8 h-8 mx-auto mb-3 ${item.color}`} />
              <div className="text-2xl font-bold mb-1">{item.title}</div>
              <div className="text-sm font-medium mb-1">{item.subtitle}</div>
              <div className="text-xs text-muted-foreground">{item.detail}</div>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}

