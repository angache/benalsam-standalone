'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus, User, Menu, LogIn, LogOut, Settings, UserCircle, MessageCircle, FileText, Package, Heart, Users, MessageSquare, Send, Crown, Grid3x3, ChevronDown } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/contexts/NotificationContext'
import { useQuery } from '@tanstack/react-query'
import { categoryService } from '@/services/categoryService'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { logger } from '@/utils/production-logger'

export default function Header() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const { unreadCount, requestPermission } = useNotifications()
  const [searchQuery, setSearchQuery] = useState('')
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  // Fetch categories for mega menu
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getCategories(),
    staleTime: 5 * 60 * 1000,
  })

  const topCategories = categories?.filter(cat => cat.level === 0 && cat.is_active).slice(0, 6) || []

  logger.debug('[Header] Rendering with unreadCount', { unreadCount })

  const handleLogout = async () => {
    await logout()
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/ara?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-full mx-auto">
        {/* Logo & Category Menu */}
        <div className="flex items-center gap-4">
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

          {/* Category Mega Menu - Desktop */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="hidden lg:flex items-center gap-1">
                <Grid3x3 className="h-4 w-4" />
                <span>Kategoriler</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="start">
              <DropdownMenuLabel>Popüler Kategoriler</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="grid grid-cols-2 gap-1 p-2">
                {topCategories.map((category) => (
                  <DropdownMenuItem
                    key={category.id}
                    onClick={() => router.push(`/kategori/${category.slug || category.id}`)}
                    className="cursor-pointer"
                  >
                    <span className="truncate">{category.name}</span>
                    {category.listing_count && category.listing_count > 0 && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {category.listing_count}
                      </span>
                    )}
                  </DropdownMenuItem>
                ))}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push('/kategoriler')}
                className="cursor-pointer font-medium"
                style={{ color: 'var(--primary)' }}
              >
                Tüm Kategoriler →
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Search Bar - Desktop */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Ne arıyorsunuz? (örn: iPhone 13, kiralık daire)"
              className="pl-10 pr-4"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(e)
                }
              }}
            />
            {searchQuery && (
              <Button
                type="submit"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 px-3"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                Ara
              </Button>
            )}
          </div>
        </form>

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
                  {/* Unread message badge */}
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white dark:border-gray-900">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
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
                  <span className="flex items-center gap-2">
                    Mesajlarım
                    {unreadCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/mesajlarim-v2')}>
                  <MessageCircle className="mr-2 h-4 w-4" style={{color: 'var(--primary)'}} />
                  <span className="flex items-center gap-2 flex-1">
                    Mesajlarım 2.0
                    <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full">NEW</span>
                    {unreadCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </span>
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
                <DropdownMenuItem onClick={requestPermission}>
                  <MessageSquare className="mr-2 h-4 w-4" style={{color: 'var(--secondary)'}} />
                  <span>Bildirimler</span>
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
          <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Menü</SheetTitle>
              </SheetHeader>
              
              <div className="mt-6 space-y-4">
                {/* User Info */}
                {isAuthenticated && user ? (
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback style={{ backgroundColor: 'var(--secondary)' }} className="text-white">
                        {user.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                ) : (
                  <Button 
                    className="w-full"
                    onClick={() => {
                      setShowMobileMenu(false)
                      router.push('/auth/login')
                    }}
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    Giriş Yap
                  </Button>
                )}

                <Separator />

                {/* Quick Actions */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground px-2">Hızlı İşlemler</p>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      setShowMobileMenu(false)
                      router.push('/ilan-olustur')
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" style={{ color: 'var(--primary)' }} />
                    İlan Ver
                  </Button>
                  {isAuthenticated && (
                    <>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                          setShowMobileMenu(false)
                          router.push('/mesajlarim-v2')
                        }}
                      >
                        <MessageCircle className="mr-2 h-4 w-4" />
                        <span className="flex-1 text-left">Mesajlarım</span>
                        {unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                          setShowMobileMenu(false)
                          router.push('/ilanlarim')
                        }}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        İlanlarım
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                          setShowMobileMenu(false)
                          router.push('/favorilerim')
                        }}
                      >
                        <Heart className="mr-2 h-4 w-4" />
                        Favorilerim
                      </Button>
                    </>
                  )}
                </div>

                <Separator />

                {/* Categories */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground px-2">Kategoriler</p>
                  {topCategories.map((category) => (
                    <Button
                      key={category.id}
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        setShowMobileMenu(false)
                        router.push(`/kategori/${category.slug || category.id}`)
                      }}
                    >
                      <span className="truncate">{category.name}</span>
                      {category.listing_count && category.listing_count > 0 && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          {category.listing_count}
                        </span>
                      )}
                    </Button>
                  ))}
                  <Button
                    variant="ghost"
                    className="w-full justify-start font-medium"
                    style={{ color: 'var(--primary)' }}
                    onClick={() => {
                      setShowMobileMenu(false)
                      router.push('/kategoriler')
                    }}
                  >
                    Tüm Kategoriler →
                  </Button>
                </div>

                {isAuthenticated && (
                  <>
                    <Separator />
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-red-600"
                      onClick={() => {
                        setShowMobileMenu(false)
                        handleLogout()
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Çıkış Yap
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
