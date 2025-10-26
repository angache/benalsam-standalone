/**
 * Quick Actions Component
 * 
 * Quick access buttons for common user actions
 */

'use client'

import { Button } from '@/components/ui/button'
import { Plus, Heart, MessageCircle, Package, Search, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function QuickActions() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  const actions = [
    {
      icon: Plus,
      label: 'İlan Ver',
      description: 'Ücretsiz ilan oluştur',
      href: isAuthenticated ? '/ilan-olustur' : '/auth/login',
      variant: 'primary' as const,
    },
    {
      icon: Heart,
      label: 'Favorilerim',
      description: 'Beğendiğin ilanlar',
      href: isAuthenticated ? '/favorilerim' : '/auth/login',
      variant: 'outline' as const,
    },
    {
      icon: MessageCircle,
      label: 'Mesajlarım',
      description: 'Sohbetlerin',
      href: isAuthenticated ? '/mesajlarim-v2' : '/auth/login',
      variant: 'outline' as const,
    },
    {
      icon: Package,
      label: 'İlanlarım',
      description: 'İlan yönetimi',
      href: isAuthenticated ? '/ilanlarim' : '/auth/login',
      variant: 'outline' as const,
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {actions.map((action, index) => {
        const Icon = action.icon
        const isPrimary = action.variant === 'primary'
        
        return (
          <Button
            key={action.label}
            onClick={() => router.push(action.href)}
            className={`
              h-auto flex-col gap-2 p-6 text-white
              ${isPrimary 
                ? 'shadow-lg hover:shadow-xl' 
                : 'border-2 hover:border-primary/50 bg-background hover:bg-primary/5 text-foreground'
              }
            `}
            style={isPrimary ? { backgroundColor: 'var(--primary)' } : undefined}
            onMouseEnter={(e) => {
              if (isPrimary) e.currentTarget.style.backgroundColor = 'var(--primary-hover)'
            }}
            onMouseLeave={(e) => {
              if (isPrimary) e.currentTarget.style.backgroundColor = 'var(--primary)'
            }}
            variant={isPrimary ? 'default' : 'outline'}
          >
            <Icon className={`w-6 h-6 ${isPrimary ? 'text-white' : 'text-primary'}`} />
            <div className="text-center">
              <p className={`font-semibold ${isPrimary ? 'text-white' : 'text-foreground'}`}>
                {action.label}
              </p>
              <p className={`text-xs ${isPrimary ? 'text-white/80' : 'text-muted-foreground'}`}>
                {action.description}
              </p>
            </div>
          </Button>
        )
      })}
    </div>
  )
}

