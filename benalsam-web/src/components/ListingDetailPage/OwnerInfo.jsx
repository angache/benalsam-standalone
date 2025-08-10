import React from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { User, Star } from 'lucide-react';

const OwnerInfo = ({ owner }) => {
  if (!owner) return null;

  return (
    <div className="glass-effect rounded-2xl p-6 shadow-xl">
      <h2 className="text-xl font-semibold text-white mb-5">İlan Sahibi</h2>
      <Link to={`/profil/${owner.id}`} className="flex items-center space-x-4 group">
        <Avatar className="h-16 w-16 border-2 border-primary/60 glow-orange-soft">
          <AvatarImage src={owner.avatar_url || `https://source.boringavatars.com/beam/120/${owner.name?.replace(/\s+/g, '') || 'user'}?colors=ff6b35,f7931e,ff8c42,1a0f0a,2d1810`} alt={owner.name} />
          <AvatarFallback className="bg-slate-700 text-white text-2xl">{owner.name?.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-lg text-white group-hover:text-primary transition-colors">{owner.name}</p>
          <div className="flex items-center text-sm text-yellow-400">
            <Star className="w-4 h-4 fill-current mr-1" />
            <span>{owner.rating?.toFixed(1) || 'N/A'}</span>
            <span className="text-slate-400 ml-1">değerlendirme</span>
          </div>
        </div>
      </Link>
      <Button asChild variant="outline" className="w-full mt-5 border-primary/50 text-primary hover:bg-primary/10 transition-colors">
        <Link to={`/profil/${owner.id}`}>
          <User className="w-4 h-4 mr-2" /> Profile Git
        </Link>
      </Button>
    </div>
  );
};

export default OwnerInfo;