import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sun, Moon, Search, Plus, Zap, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeContext } from '@/contexts/ThemeContext';
import NotificationBell from '@/components/NotificationBell';
import UserNav from '@/components/Header/UserNav';
import MobileMenu from '@/components/Header/MobileMenu';
import { preloadChunk } from '@/hooks/usePreload.js';

const Header = ({ 
  currentUser, 
  onLogout, 
  onLoginClick, 
  onRegisterClick, 
  onCreateClick, 
  notifications, 
  unreadCount, 
  unreadMessagesCount,
  onNotificationClick, 
  onMarkAllAsRead 
}) => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const closeMenu = () => setIsMobileMenuOpen(false);
    window.addEventListener('resize', closeMenu);
    return () => window.removeEventListener('resize', closeMenu);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 70, damping: 20, delay: 0.1 }}
        className="fixed top-0 left-0 right-0 z-50 h-14 sm:h-16 lg:h-20 bg-background/80 backdrop-blur-lg shadow-lg border-b border-border/50"
      >
        <div className="mx-auto w-full max-w-[1600px] 2xl:max-w-[1920px] px-1 sm:px-2 lg:px-4 xl:px-6 h-full flex items-center justify-between">
          <Link to="/" className="flex items-center min-w-0">
            <div className="flex items-center text-base sm:text-lg lg:text-2xl font-bold text-gradient">
              <Zap className="h-4 w-4 sm:h-5 sm:w-5 lg:h-8 lg:w-8 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="hidden xs:inline truncate">BenAlsam</span>
            </div>
          </Link>
          
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-3">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground hover:text-primary h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10">
              {theme === 'dark' ? <Sun className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" /> : <Moon className="h-3 w-3 sm:h-4 sm:h-4 lg:h-5 lg:w-5" />}
              <span className="sr-only">Toggle theme</span>
            </Button>
            
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10">
              <Search className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
              <span className="sr-only">Ara</span>
            </Button>
            
            {currentUser && (
              <NotificationBell 
                notifications={notifications}
                unreadCount={unreadCount}
                onNotificationClick={onNotificationClick}
                onMarkAllAsRead={onMarkAllAsRead}
              />
            )}

            <Button 
              onClick={onCreateClick} 
              onMouseEnter={() => preloadChunk('listings')}
              className="btn-primary text-primary-foreground hidden md:flex text-xs lg:text-sm px-2 lg:px-4 py-1 lg:py-2"
            >
              <Plus className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" /> İlan Oluştur
            </Button>
            
            <Button 
              onClick={onCreateClick} 
              onMouseEnter={() => preloadChunk('listings')}
              size="icon" 
              className="btn-primary text-primary-foreground md:hidden h-7 w-7 sm:h-8 sm:w-8"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>

            <div className="hidden lg:block">
              <UserNav 
                currentUser={currentUser}
                onLogout={onLogout}
                onLoginClick={onLoginClick}
                onRegisterClick={onRegisterClick}
                unreadMessagesCount={unreadMessagesCount}
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden text-muted-foreground hover:text-primary h-7 w-7 sm:h-8 sm:w-8"
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </div>
      </motion.header>
      <MobileMenu 
        isOpen={isMobileMenuOpen}
        setIsOpen={setIsMobileMenuOpen}
        currentUser={currentUser}
        onLogout={onLogout}
        onLoginClick={onLoginClick}
        onRegisterClick={onRegisterClick}
        onCreateClick={onCreateClick}
        unreadMessagesCount={unreadMessagesCount}
      />
    </>
  );
};

export default Header;