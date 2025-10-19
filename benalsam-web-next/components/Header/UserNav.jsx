import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { LogOut, UserCircle, Settings, LogIn, UserPlus as UserPlusIcon, Package, Heart, Users, MessageSquare, FileText, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { checkUserPremiumStatus } from '@/services/premiumService';
import { generateBoringAvatarUrl } from '@/lib/avatarUtils';
import { useProfile } from '@/hooks/queries/useProfile';
import { preloadChunk } from '@/hooks/usePreload.js';

const UserNav = ({ currentUser, onLogout, onLoginClick, onRegisterClick, unreadMessagesCount }) => {
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  
  // Get full profile data with React Query
  const { data: profile } = useProfile(currentUser?.id);

  useEffect(() => {
    if (currentUser) {
      checkUserPremiumStatus(currentUser.id).then(setIsPremiumUser);
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="flex items-center gap-1 sm:gap-2">
        <Button variant="ghost" onClick={onLoginClick} className="text-foreground hover:bg-primary/10 hidden sm:flex text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2">
          <LogIn className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> Giriş
        </Button>
        <Button onClick={onRegisterClick} className="btn-primary text-primary-foreground hidden sm:flex text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2">
          <UserPlusIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> Kayıt
        </Button>
        <Button variant="ghost" size="icon" onClick={onLoginClick} className="text-foreground hover:bg-primary/10 sm:hidden w-8 h-8">
          <LogIn className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  // Use profile data if available, otherwise fall back to basic user data
  const displayName = profile?.name || currentUser.name || currentUser.user_metadata?.name || currentUser.email || 'Kullanıcı';
  const displayAvatar = profile?.avatar_url || currentUser.avatar_url || currentUser.user_metadata?.avatar_url || generateBoringAvatarUrl(displayName, currentUser.id);
  const fallbackName = displayName.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-7 w-7 sm:h-9 sm:w-9 rounded-full p-0">
          <Avatar className="h-6 w-6 sm:h-8 sm:w-8 border border-primary/50 hover:border-primary transition-colors">
            <AvatarImage src={displayAvatar} alt={displayName} key={displayAvatar} />
            <AvatarFallback className="text-xs sm:text-sm">{fallbackName}</AvatarFallback>
          </Avatar>
          {isPremiumUser && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <Crown className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48 sm:w-56 glass-effect mt-2" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-xs sm:text-sm font-medium leading-none text-foreground truncate">{displayName}</p>
              {isPremiumUser && (
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-1.5 py-0.5">
                  <Crown className="w-2.5 h-2.5 mr-1" />
                  Premium
                </Badge>
              )}
            </div>
            {currentUser.email && <p className="text-xs leading-none text-muted-foreground truncate">{currentUser.email}</p>}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/profil/${currentUser.id}`} 
            onMouseEnter={() => preloadChunk('profile')}
            className="cursor-pointer flex items-center text-xs sm:text-sm"
          >
            <UserCircle className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-primary" /> Profilim
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/mesajlarim" 
            onMouseEnter={() => preloadChunk('messaging')}
            className="cursor-pointer flex items-center text-xs sm:text-sm"
          >
            <MessageSquare className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-primary" />
            <span>Mesajlarım</span>
            {unreadMessagesCount > 0 && (
              <Badge className="ml-auto bg-primary text-primary-foreground h-5 px-2">{unreadMessagesCount}</Badge>
            )}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/ilanlarim" 
            onMouseEnter={() => preloadChunk('listings')}
            className="cursor-pointer flex items-center text-xs sm:text-sm"
          >
            <FileText className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-primary" /> İlanlarım
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/envanterim" 
            onMouseEnter={() => preloadChunk('listings')}
            className="cursor-pointer flex items-center text-xs sm:text-sm"
          >
            <Package className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-primary" /> Envanterim
          </Link>
        </DropdownMenuItem>
         <DropdownMenuItem asChild>
          <Link href="/favorilerim" 
            onMouseEnter={() => preloadChunk('listings')}
            className="cursor-pointer flex items-center text-xs sm:text-sm"
          >
            <Heart className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-primary" /> Favorilerim
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/takip-edilenler" 
            onMouseEnter={() => preloadChunk('profile')}
            className="cursor-pointer flex items-center text-xs sm:text-sm"
          >
            <Users className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-primary" /> Takip Ettiklerim
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/aldigim-teklifler" 
            onMouseEnter={() => preloadChunk('offers')}
            className="cursor-pointer flex items-center text-xs sm:text-sm"
          >
            <MessageSquare className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-primary" /> Aldığım Teklifler
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/gonderdigim-teklifler" 
            onMouseEnter={() => preloadChunk('offers')}
            className="cursor-pointer flex items-center text-xs sm:text-sm"
          >
            <MessageSquare className="mr-2 h-3 w-3 sm:h-4 sm:w-4 rotate-180 text-primary" /> Gönderdiğim Teklifler
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {!isPremiumUser && (
          <DropdownMenuItem asChild>
            <Link href="/ayarlar/premium" 
              onMouseEnter={() => preloadChunk('premium')}
              className="cursor-pointer flex items-center text-xs sm:text-sm group"
            >
              <div className="mr-2 h-3 w-3 sm:h-4 sm:w-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Crown className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent font-medium group-hover:from-yellow-500 group-hover:to-orange-500">
                Premium'a Geç
              </span>
              <Badge className="ml-auto bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-1.5 py-0.5">
                Yeni
              </Badge>
            </Link>
          </DropdownMenuItem>
        )}
        {isPremiumUser && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/premium-dashboard" 
                onMouseEnter={() => preloadChunk('premium')}
                className="cursor-pointer flex items-center text-xs sm:text-sm"
              >
                <Crown className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" /> Premium Dashboard
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/ayarlar/premium" 
                onMouseEnter={() => preloadChunk('premium')}
                className="cursor-pointer flex items-center text-xs sm:text-sm"
              >
                <Crown className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" /> Premium Ayarlar
              </Link>
            </DropdownMenuItem>
          </>
        )}
         <DropdownMenuItem asChild>
          <Link href="/ayarlar" 
            onMouseEnter={() => preloadChunk('profile')}
            className="cursor-pointer flex items-center text-xs sm:text-sm"
          >
            <Settings className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-primary" /> Ayarlar
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onLogout} className="cursor-pointer flex items-center text-destructive hover:!bg-destructive/10 hover:!text-destructive focus:!bg-destructive/20 focus:!text-destructive text-xs sm:text-sm">
          <LogOut className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Çıkış Yap
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserNav;