import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Package, MessageSquare as MessageSquareIcon, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

const generateNotificationDetails = (notification) => {
  const { type, data } = notification;

  switch (type) {
    case 'NEW_OFFER':
      const offerorName = data?.offerorName || 'Bir kullanıcı';
      const listingTitle = data?.listingTitle || 'ilanınız';
      return {
        icon: <Package className="w-5 h-5 text-primary" />,
        text: <span><span className="font-semibold">{offerorName}</span>, <span className="font-semibold text-primary">{listingTitle}</span> için bir teklif yaptı.</span>,
        link: `/aldigim-teklifler`
      };
    case 'NEW_MESSAGE':
        const senderName = data?.senderName || 'Bir kullanıcı';
        const messageSnippet = data?.messageSnippet || '...';
        const conversationId = data?.conversationId;
        return {
          icon: <MessageSquareIcon className="w-5 h-5 text-blue-500" />,
          text: <span><span className="font-semibold">{senderName}</span> size bir mesaj gönderdi: <span className="italic text-muted-foreground">"{messageSnippet}..."</span></span>,
          link: `/mesajlar/${conversationId}`
        };
    case 'LISTING_APPROVED':
      return {
        icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
        text: <span>Tebrikler! <span className="font-semibold text-primary">"{data?.listingTitle || 'İlanınız'}"</span> onaylandı ve yayına alındı.</span>,
        link: `/ilan/${data?.listingId}`
      };
    case 'LISTING_REJECTED':
      return {
        icon: <XCircle className="w-5 h-5 text-destructive" />,
        text: <span>Üzgünüz, <span className="font-semibold text-primary">"{data?.listingTitle || 'ilanınız'}"</span> reddedildi. Detaylar için ilana gidin.</span>,
        link: `/ilan/${data?.listingId}`
      };
    default:
      return {
        icon: <Bell className="w-5 h-5 text-muted-foreground" />,
        text: 'Yeni bir bildiriminiz var.',
        link: '#'
      };
  }
};

const NotificationItem = ({ notification, onNotificationClick }) => {
  const navigate = useNavigate();
  const { icon, text, link } = useMemo(() => generateNotificationDetails(notification), [notification]);

  const handleClick = () => {
    if (link && link !== '#') {
      onNotificationClick(notification.id);
      navigate(link);
    }
  };

  return (
    <DropdownMenuItem 
      onClick={handleClick} 
      className={`flex items-start gap-3 p-3 cursor-pointer transition-colors hover:!bg-primary/10 ${!notification.is_read ? 'bg-primary/5' : ''}`}
    >
      <div className="flex-shrink-0 mt-1">{icon}</div>
      <div className="flex-grow">
        <p className="text-sm text-foreground">{text}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: tr })}
        </p>
      </div>
      {!notification.is_read && <div className="w-2 h-2 rounded-full bg-primary self-center flex-shrink-0"></div>}
    </DropdownMenuItem>
  );
};


const NotificationBell = ({ notifications = [], unreadCount = 0, onNotificationClick, onMarkAllAsRead }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <div className="absolute top-0 right-0 h-4 w-4 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
          <span className="sr-only">Bildirimler</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 md:w-96 glass-effect mt-2 mr-2 p-0" align="end">
        <DropdownMenuLabel className="flex justify-between items-center p-3">
          <span className="font-semibold text-lg">Bildirimler</span>
          {unreadCount > 0 && (
            <Button variant="link" size="sm" className="p-0 h-auto text-primary" onClick={onMarkAllAsRead}>
              Tümünü okundu işaretle
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="m-0" />
        <div className="max-h-96 overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map(n => (
              <NotificationItem key={n.id} notification={n} onNotificationClick={onNotificationClick} />
            ))
          ) : (
            <div className="text-center p-8">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Henüz bildiriminiz yok.</p>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;