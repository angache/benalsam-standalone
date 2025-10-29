/**
 * HowItWorks Component
 * Explain the platform in 3 simple steps
 */

'use client'

import { Search, MessageCircle, Handshake } from 'lucide-react'
import { motion } from 'framer-motion'

const STEPS = [
  {
    icon: Search,
    title: 'İlanını Oluştur',
    description: 'Ne arıyorsan ilan ver, binlerce satıcı görsün',
    color: 'bg-blue-500/10 text-blue-500',
  },
  {
    icon: MessageCircle,
    title: 'Teklifleri Al',
    description: 'Satıcılar sana teklif göndersin, sen seç',
    color: 'bg-green-500/10 text-green-500',
  },
  {
    icon: Handshake,
    title: 'En İyi Teklifi Kabul Et',
    description: 'Fiyatları karşılaştır, anlaş ve al',
    color: 'bg-purple-500/10 text-purple-500',
  },
]

export default function HowItWorks() {
  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-3">Nasıl Çalışır?</h2>
        <p className="text-muted-foreground text-lg">
          3 basit adımda alışverişe başla
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {STEPS.map((step, index) => {
          const Icon = step.icon
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="relative text-center"
            >
              {/* Step Number */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                {index + 1}
              </div>

              {/* Icon */}
              <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl ${step.color} flex items-center justify-center`}>
                <Icon className="w-10 h-10" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold mb-3">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>

              {/* Connector Line (except last) */}
              {index < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-border" />
              )}
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}

