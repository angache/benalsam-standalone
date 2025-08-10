import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserMinus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.jsx';
import { unfollowUser } from '@/services/supabaseService';
import { generateBoringAvatarUrl } from '@/components/FollowingPage/utils.js';

const UserCard = ({ user, currentUserId, onUnfollow }) => {
  const [isUnfollowing, setIsUnfollowing] = useState(false);

  const handleUnfollow = async () => {
    setIsUnfollowing(true);
    const success = await unfollowUser(currentUserId, user.id);
    if (success) {
      onUnfollow(user.id);
    }
    setIsUnfollowing(false);
  };

  const displayName = user.name || user.username || "Kullanıcı";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
      className="glass-effect p-5 rounded-lg shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4"
    >
      <Link to={`/profil/${user.id}`} className="flex items-center gap-4 group w-full sm:w-auto">
        <Avatar className="w-16 h-16 border-2 border-primary/40 group-hover:border-primary transition-colors">
          <AvatarImage src={user.avatar_url || generateBoringAvatarUrl(displayName, user.id)} alt={displayName} />
          <AvatarFallback className="text-xl">{displayName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-grow">
          <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">{displayName}</h3>
          <p className="text-xs text-muted-foreground">{user.followers_count || 0} Takipçi • {user.following_count || 0} Takip Edilen</p>
          {user.bio && <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{user.bio}</p>}
        </div>
      </Link>
      {currentUserId && currentUserId !== user.id && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleUnfollow} 
          disabled={isUnfollowing}
          className="w-full sm:w-auto border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          {isUnfollowing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserMinus className="w-4 h-4 mr-2" />}
          Takipten Çık
        </Button>
      )}
    </motion.div>
  );
};

export default UserCard;