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
    title: '10,000+',
    subtitle: 'Mutlu Kullanıcı',
    color: 'text-blue-500',
  },
  {
    icon: Clock,
    title: '7/24',
    subtitle: 'Canlı Destek',
    color: 'text-green-500',
  },
  {
    icon: Award,
    title: '100%',
    subtitle: 'Güvenli İşlem',
    color: 'text-purple-500',
  },
  {
    icon: Zap,
    title: 'Ücretsiz',
    subtitle: 'İlan Yayınla',
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
              className="bg-card border rounded-lg p-6 text-center hover:shadow-lg transition-shadow"
            >
              <Icon className={`w-8 h-8 mx-auto mb-3 ${item.color}`} />
              <div className="text-2xl font-bold mb-1">{item.title}</div>
              <div className="text-sm text-muted-foreground">{item.subtitle}</div>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}

