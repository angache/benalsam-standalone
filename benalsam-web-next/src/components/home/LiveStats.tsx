/**
 * LiveStats Component
 * Real-time statistics with animated counters
 */

'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Activity } from 'lucide-react'

export default function LiveStats() {
  const [stats, setStats] = useState({
    activeUsers: 1234,
    newListings: 45,
    messagesCount: 567,
  })

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 5),
        newListings: prev.newListings + Math.floor(Math.random() * 3),
        messagesCount: prev.messagesCount + Math.floor(Math.random() * 10),
      }))
    }, 10000) // Update every 10 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <section className="bg-primary/5 border-y py-6">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
          <Activity className="w-4 h-4 animate-pulse text-primary" />
          <span className="font-medium">Canlı İstatistikler</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <motion.div
            key={stats.activeUsers}
            initial={{ scale: 1.1, color: '#3b82f6' }}
            animate={{ scale: 1, color: 'inherit' }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-3xl font-bold mb-1">{stats.activeUsers.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Aktif Kullanıcı</div>
          </motion.div>

          <motion.div
            key={stats.newListings}
            initial={{ scale: 1.1, color: '#10b981' }}
            animate={{ scale: 1, color: 'inherit' }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-3xl font-bold mb-1">{stats.newListings}</div>
            <div className="text-sm text-muted-foreground">Yeni İlan (Son 1 Saat)</div>
          </motion.div>

          <motion.div
            key={stats.messagesCount}
            initial={{ scale: 1.1, color: '#8b5cf6' }}
            animate={{ scale: 1, color: 'inherit' }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-3xl font-bold mb-1">{stats.messagesCount.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Mesajlaşma (Bugün)</div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

