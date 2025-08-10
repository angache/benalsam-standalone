import React from 'react';
import { Zap } from 'lucide-react';

const PlaceholderSettings = ({ title }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-8 glass-effect rounded-lg">
      <Zap className="w-16 h-16 text-primary mb-6 opacity-70" />
      <h2 className="text-2xl font-semibold text-foreground mb-3">{title} Ayarları</h2>
      <p className="text-muted-foreground max-w-md">
        Bu özellik şu anda geliştirme aşamasındadır ve yakında kullanımınıza sunulacaktır. Anlayışınız için teşekkür ederiz!
      </p>
      <p className="text-sm text-muted-foreground mt-2">
        🚧 Bu özellik henüz uygulanmadı—ama merak etme! Bir sonraki istekte talep edebilirsin! 🚀
      </p>
    </div>
  );
};

export default PlaceholderSettings;