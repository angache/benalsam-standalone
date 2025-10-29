/**
 * LiveActivityTicker Component
 * Real-time activity feed with scrolling animation
 */

'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, MapPin, MessageCircle, Check } from 'lucide-react'

const ACTIVITIES = [
  { 
    type: 'listing',
    name: 'Ahmet Y.',
    action: 'iPhone 15 Pro Max arıyor',
    location: 'İzmir',
    time: '2 dakika önce',
    icon: User,
  },
  { 
    type: 'offer',
    name: 'Elif K.',
    action: '5 teklif aldı',
    location: 'Ankara',
    time: '5 dakika önce',
    icon: MessageCircle,
  },
  { 
    type: 'deal',
    name: 'Mehmet B.',
    action: 'Araba satın aldı',
    location: 'İstanbul',
    time: '10 dakika önce',
    icon: Check,
  },
  { 
    type: 'listing',
    name: 'Zeynep A.',
    action: 'Satılık daire arıyor',
    location: 'Bursa',
    time: '12 dakika önce',
    icon: User,
  },
  { 
    type: 'offer',
    name: 'Ali T.',
    action: '8 teklif aldı',
    location: 'Antalya',
    time: '15 dakika önce',
    icon: MessageCircle,
  },
]

export default function LiveActivityTicker() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % ACTIVITIES.length)
    }, 4000) // Change every 4 seconds

    return () => clearInterval(interval)
  }, [])

  const currentActivity = ACTIVITIES[currentIndex]
  const Icon = currentActivity.icon

  return (
    <section className="bg-primary/5 border-y py-4 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-center gap-4"
          >
            {/* Icon */}
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center
              ${currentActivity.type === 'listing' ? 'bg-blue-500/20 text-blue-600' : ''}
              ${currentActivity.type === 'offer' ? 'bg-green-500/20 text-green-600' : ''}
              ${currentActivity.type === 'deal' ? 'bg-purple-500/20 text-purple-600' : ''}
            `}>
              <Icon className="w-5 h-5" />
            </div>

            {/* Content */}
            <div className="flex-1 max-w-2xl">
              <p className="text-sm font-medium">
                <span className="font-semibold">{currentActivity.name}</span>
                {' '}
                <span className="text-muted-foreground">{currentActivity.action}</span>
              </p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {currentActivity.location}
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                  {currentActivity.time}
                </span>
              </div>
            </div>

            {/* Progress Dots */}
            <div className="hidden md:flex items-center gap-1.5">
              {ACTIVITIES.map((_, index) => (
                <div
                  key={index}
                  className={`
                    h-1.5 rounded-full transition-all duration-300
                    ${index === currentIndex ? 'w-8 bg-primary' : 'w-1.5 bg-muted'}
                  `}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}

