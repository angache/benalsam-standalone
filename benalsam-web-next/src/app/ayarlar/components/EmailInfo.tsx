'use client'

/**
 * Email Info Component
 * 
 * Displays user email and verification status
 */

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mail, CheckCircle2, XCircle } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

interface EmailInfoProps {
  user: User
}

export default function EmailInfo({ user }: EmailInfoProps) {
  const isEmailVerified = user.email_confirmed_at !== null

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail size={24} className="text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{user.email}</span>
              {isEmailVerified ? (
                <Badge variant="default" className="bg-green-500 text-white">
                  <CheckCircle2 size={12} className="mr-1" />
                  Doğrulanmış
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400">
                  <XCircle size={12} className="mr-1" />
                  Doğrulanmamış
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {isEmailVerified
                ? 'E-posta adresiniz doğrulanmış'
                : 'E-posta adresinizi doğrulamak için e-postanızı kontrol edin'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

