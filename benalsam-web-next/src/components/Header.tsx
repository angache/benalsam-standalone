'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus, User, Menu, LogIn, LogOut, Settings, UserCircle, MessageCircle, FileText, Package, Heart, Users, MessageSquare, Send, Crown } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function Header() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-full mx-auto">
        {/* Logo */}
        <div 
          className="flex items-center gap-2 cursor-pointer" 
          onClick={() => router.push('/')}
        >
          <div className="h-8 w-8 rounded-lg" style={{backgroundColor: 'var(--secondary)'}}>
            <span className="text-white font-bold text-sm flex items-center justify-center h-full">B</span>
          </div>
          <span className="text-xl font-bold" style={{color: 'var(--secondary)'}}>
            Benalsam
          </span>
        </div>

        {/* Search Bar - Desktop */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Ne arıyorsunuz? (örn: iPhone 13, kiralık daire)"
              className="pl-10 pr-4"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Create Listing Button */}
          <Button 
            className="hidden sm:flex items-center gap-2 text-white"
            style={{backgroundColor: 'var(--primary)'}}
            onMouseEnter={(e) => {e.currentTarget.style.backgroundColor = 'var(--primary-hover)'}}
            onMouseLeave={(e) => {e.currentTarget.style.backgroundColor = 'var(--primary)'}}
            onClick={() => router.push('/ilan-olustur')}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden md:inline">İlan Ver</span>
          </Button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Menu */}
          {isLoading ? (
            <Button variant="outline" size="icon" disabled>
              <User className="h-4 w-4 animate-pulse" />
            </Button>
          ) : isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.avatar_url || undefined} alt={user.name} />
                    <AvatarFallback className="text-white" style={{backgroundColor: 'var(--secondary)'}}>
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push(`/profil/${user.id}`)}>
                  <UserCircle className="mr-2 h-4 w-4" style={{color: 'var(--secondary)'}} />
                  <span>Profilim</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/mesajlarim')}>
                  <MessageCircle className="mr-2 h-4 w-4" style={{color: 'var(--secondary)'}} />
                  <span>Mesajlarım</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/ilanlarim')}>
                  <FileText className="mr-2 h-4 w-4" style={{color: 'var(--secondary)'}} />
                  <span>İlanlarım</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/envanterim')}>
                  <Package className="mr-2 h-4 w-4" style={{color: 'var(--secondary)'}} />
                  <span>Envanterim</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/favorilerim')}>
                  <Heart className="mr-2 h-4 w-4" style={{color: 'var(--secondary)'}} />
                  <span>Favorilerim</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/takip-ettiklerim')}>
                  <Users className="mr-2 h-4 w-4" style={{color: 'var(--secondary)'}} />
                  <span>Takip Ettiklerim</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/alidigim-teklifler')}>
                  <MessageSquare className="mr-2 h-4 w-4" style={{color: 'var(--secondary)'}} />
                  <span>Aldığım Teklifler</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/gonderdigim-teklifler')}>
                  <Send className="mr-2 h-4 w-4" style={{color: 'var(--secondary)'}} />
                  <span>Gönderdiğim Teklifler</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/premium/dashboard')}>
                  <Crown className="mr-2 h-4 w-4" style={{color: 'var(--secondary)'}} />
                  <span>Premium Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/premium/settings')}>
                  <Settings className="mr-2 h-4 w-4" style={{color: 'var(--secondary)'}} />
                  <span>Premium Ayarlar</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/ayarlar')}>
                  <Settings className="mr-2 h-4 w-4" style={{color: 'var(--secondary)'}} />
                  <span>Ayarlar</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4 text-red-600" />
                  <span className="text-red-600">Çıkış Yap</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button 
              variant="outline" 
              onClick={() => router.push('/auth/login')}
              className="flex items-center gap-2"
            >
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Giriş Yap</span>
            </Button>
          )}

          {/* Mobile Menu */}
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
