'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { UserMinus, Loader2, Users, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { unfollowUser } from '@/services/followService'
import { useToast } from '@/components/ui/use-toast'

interface User {
  id: string
  name?: string
  username?: string
  avatar_url?: string
  bio?: string
  followers_count?: number
  following_count?: number
}

interface UserCardProps {
  user: User
  currentUserId?: string
  onUnfollow: (userId: string) => void
}

const generateBoringAvatarUrl = (name: string, id: string): string => {
  const colors = [
    'FF6B6B', '4ECDC4', '45B7D1', 'FFA07A', '98D8C8',
    'F7DC6F', 'BB8FCE', '85C1E2', 'F8B739', '52BE80'
  ]
  const colorIndex = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
  const initials = name.charAt(0).toUpperCase()
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${colors[colorIndex]}&color=fff&size=128`
}

const UserCard: React.FC<UserCardProps> = ({ user, currentUserId, onUnfollow }) => {
  const [isUnfollowing, setIsUnfollowing] = useState(false)
  const { toast } = useToast()

  const handleUnfollow = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!currentUserId) return
    
    setIsUnfollowing(true)
    try {
      const success = await unfollowUser(currentUserId, user.id)
      if (success) {
        onUnfollow(user.id)
        toast({
          title: 'Takipten Çıkıldı',
          description: `${user.name || 'Kullanıcı'} takipten çıkarıldı.`,
        })
      }
    } catch (error) {
      console.error('Error unfollowing user:', error)
      toast({
        title: 'Hata',
        description: 'Takipten çıkılırken bir sorun oluştu.',
        variant: 'destructive',
      })
    } finally {
      setIsUnfollowing(false)
    }
  }

  const displayName = user.name || user.username || 'Kullanıcı'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      whileHover={{ y: -4 }}
      className="group relative bg-card rounded-xl border border-border/50 overflow-hidden hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-lg"
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative p-6 flex flex-col items-center h-full">
        {/* Avatar - Üstte */}
        <Link href={`/profil/${user.id}`} className="flex flex-col items-center w-full mb-4">
          <div className="relative mb-4">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Avatar className="w-20 h-20 border-2 border-primary/20 group-hover:border-primary/60 transition-all duration-300 relative z-10 shadow-lg">
              <AvatarImage 
                src={user.avatar_url || generateBoringAvatarUrl(displayName, user.id)} 
                alt={displayName}
                className="object-cover"
              />
              <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </Link>

        {/* Kullanıcı Bilgileri - Ortada */}
        <div className="w-full text-center space-y-2 flex-1 mb-4">
          <Link href={`/profil/${user.id}`} className="block">
            <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1 mb-2">
              {displayName}
            </h3>
          </Link>
          
          {/* Stats */}
          <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground mb-2">
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span className="font-medium">{user.followers_count || 0}</span>
              <span>Takipçi</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
            <div className="flex items-center gap-1">
              <UserPlus className="w-3.5 h-3.5" />
              <span className="font-medium">{user.following_count || 0}</span>
              <span>Takip</span>
            </div>
          </div>

          {/* Bio */}
          {user.bio && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {user.bio}
            </p>
          )}
        </div>

        {/* Takipten Çık Butonu - En Altta */}
        {currentUserId && currentUserId !== user.id && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleUnfollow} 
            disabled={isUnfollowing}
            className="w-full mt-auto border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-all duration-200 font-medium"
          >
            {isUnfollowing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Çıkılıyor...
              </>
            ) : (
              <>
                <UserMinus className="w-4 h-4 mr-2" />
                Takipten Çık
              </>
            )}
          </Button>
        )}
      </div>
    </motion.div>
  )
}

export default UserCard

