import React, { memo, useMemo } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { User, Shield, Bell, MessageSquare, Palette, Crown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const SettingsLayout = memo(() => {
  const location = useLocation();
  const pathname = useMemo(() => location.pathname, [location.pathname]);
  
  const menuItems = useMemo(() => [
    { path: '/ayarlar', icon: User, label: 'Profil Ayarları', exact: true },
    { path: '/ayarlar/hesap', icon: Shield, label: 'Hesap Güvenliği' },
    { path: '/ayarlar/bildirimler', icon: Bell, label: 'Bildirim Ayarları' },
    { path: '/ayarlar/iletisim', icon: MessageSquare, label: 'İletişim Tercihleri' },
    { path: '/ayarlar/platform', icon: Palette, label: 'Platform Ayarları' },
    { 
      path: '/ayarlar/premium', 
      icon: Crown, 
      label: 'Premium Üyelik',
      badge: 'Yeni',
      badgeColor: 'bg-gradient-to-r from-yellow-400 to-orange-500'
    },
  ], []);

  const isActive = useMemo(() => (path, exact = false) => {
    if (exact) {
      return pathname === path;
    }
    return pathname.startsWith(path);
  }, [pathname]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gradient mb-2">Ayarlar</h1>
        <p className="text-muted-foreground">Hesap ve platform tercihlerinizi yönetin</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path, item.exact);
              
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={active ? "default" : "ghost"}
                    className={`w-full justify-start text-left h-auto p-3 ${
                      active 
                        ? 'bg-primary text-primary-foreground shadow-md' 
                        : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.badge && (
                          <Badge 
                            className={`text-xs px-2 py-0.5 text-white ${
                              item.badgeColor || 'bg-primary'
                            }`}
                          >
                            {item.badge}
                          </Badge>
                        )}
                        <ChevronRight className="w-3 h-3 opacity-50" />
                      </div>
                    </div>
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="glass-effect rounded-2xl p-6 min-h-[600px]">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
});

export default SettingsLayout;