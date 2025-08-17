import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Search, Plus, LogOut, UserCircle, Settings, LogIn, UserPlus as UserPlusIcon, Zap, Package, Heart, Users, MessageSquare, FileText, Menu, X, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { checkUserPremiumStatus } from '@/services/premiumService';
import { generateBoringAvatarUrl } from '@/lib/avatarUtils';
import { useProfile } from '@/hooks/queries/useProfile';

const MobileMenu = ({ isOpen, setIsOpen, currentUser, onLogout, onLoginClick, onRegisterClick, onCreateClick, unreadMessagesCount }) => {
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  
  // Get full profile data with React Query
  const { data: profile } = useProfile(currentUser?.id);

  useEffect(() => {
    if (currentUser) {
      checkUserPremiumStatus(currentUser.id).then(setIsPremiumUser);
    }
  }, [currentUser]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-72 max-w-[85vw] z-50 glass-effect border-l border-border/50 overflow-y-auto lg:hidden"
          >
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <Link to="/" className="flex items-center" onClick={() => setIsOpen(false)}>
                  <div className="flex items-center text-lg sm:text-xl font-bold text-gradient">
                    <Zap className="h-5 w-5 sm:h-6 sm:w-6 mr-1 sm:mr-2" />
                    BenAlsam
                  </div>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="text-muted-foreground hover:text-foreground w-8 h-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {!currentUser ? (
                <div className="space-y-3 mb-4 sm:mb-6">
                  <Button onClick={() => { onLoginClick(); setIsOpen(false); }} className="w-full btn-primary text-primary-foreground text-sm">
                    <LogIn className="w-4 h-4 mr-2" /> Giriş Yap
                  </Button>
                  <Button onClick={() => { onRegisterClick(); setIsOpen(false); }} variant="outline" className="w-full text-sm">
                    <UserPlusIcon className="w-4 h-4 mr-2" /> Kayıt Ol
                  </Button>
                </div>
              ) : (
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 glass-effect rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-primary/50">
                        <AvatarImage src={profile?.avatar_url || currentUser.avatar_url || currentUser.user_metadata?.avatar_url || generateBoringAvatarUrl(currentUser.name || currentUser.email, currentUser.id)} />
                        <AvatarFallback className="text-sm">{(profile?.name || currentUser.name || currentUser.email || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      {isPremiumUser && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                          <Crown className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-foreground text-sm truncate">{profile?.name || currentUser.name || currentUser.user_metadata?.name || currentUser.email}</p>
                        {isPremiumUser && (
                          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-1.5 py-0.5">
                            Premium
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
                    </div>
                  </div>
                </div>
              )}

              <nav className="space-y-1 sm:space-y-2">
                <Button onClick={() => { onCreateClick(); setIsOpen(false); }} className="w-full btn-primary text-primary-foreground justify-start text-sm">
                  <Plus className="w-4 h-4 mr-3" /> İlan Oluştur
                </Button>
                
                {currentUser && (
                  <>
                    <Link to={`/profil/${currentUser.id}`} onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start text-sm">
                        <UserCircle className="w-4 h-4 mr-3" /> Profilim
                      </Button>
                    </Link>
                     <Link to="/mesajlarim" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start text-sm">
                        <MessageSquare className="w-4 h-4 mr-3" /> 
                        <span>Mesajlarım</span>
                        {unreadMessagesCount > 0 && (
                          <Badge className="ml-auto bg-primary text-primary-foreground h-5 px-2">{unreadMessagesCount}</Badge>
                        )}
                      </Button>
                    </Link>
                    <Link to="/ilanlarim" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start text-sm">
                        <FileText className="w-4 h-4 mr-3" /> İlanlarım
                      </Button>
                    </Link>
                    <Link to="/envanterim" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start text-sm">
                        <Package className="w-4 h-4 mr-3" /> Envanterim
                      </Button>
                    </Link>
                    <Link to="/favorilerim" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start text-sm">
                        <Heart className="w-4 h-4 mr-3" /> Favorilerim
                      </Button>
                    </Link>
                    <Link to="/takip-edilenler" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start text-sm">
                        <Users className="w-4 h-4 mr-3" /> Takip Ettiklerim
                      </Button>
                    </Link>
                    <Link to="/aldigim-teklifler" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start text-sm">
                        <MessageSquare className="w-4 h-4 mr-3" /> Aldığım Teklifler
                      </Button>
                    </Link>
                    <Link to="/gonderdigim-teklifler" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start text-sm">
                        <MessageSquare className="w-4 h-4 mr-3 rotate-180" /> Gönderdiğim Teklifler
                      </Button>
                    </Link>
                    
                    {!isPremiumUser && (
                      <Link to="/ayarlar/premium" onClick={() => setIsOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start text-sm group bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border border-yellow-200 dark:border-yellow-800">
                          <div className="w-4 h-4 mr-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                            <Crown className="w-2.5 h-2.5 text-white" />
                          </div>
                          <span className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent font-medium">
                            Premium'a Geç
                          </span>
                          <Badge className="ml-auto bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-1.5 py-0.5">
                            Yeni
                          </Badge>
                        </Button>
                      </Link>
                    )}
                    
                    {isPremiumUser && (
                      <Link to="/ayarlar/premium" onClick={() => setIsOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start text-sm">
                          <Crown className="w-4 h-4 mr-3 text-yellow-500" /> Premium Üyelik
                        </Button>
                      </Link>
                    )}
                    
                    <Link to="/ayarlar" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start text-sm">
                        <Settings className="w-4 h-4 mr-3" /> Ayarlar
                      </Button>
                    </Link>
                    <Link to="/ayarlar" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start text-sm">
                                                  <Settings className="w-4 h-4 mr-3" /> Ayarlar
                        <Badge className="ml-auto bg-blue-500 text-white text-xs px-1.5 py-0.5">
                          Test
                        </Badge>
                      </Button>
                    </Link>
                    <Button onClick={() => { onLogout(); setIsOpen(false); }} variant="ghost" className="w-full justify-start text-destructive hover:bg-destructive/10 text-sm">
                      <LogOut className="w-4 h-4 mr-3" /> Çıkış Yap
                    </Button>
                  </>
                )}
              </nav>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;