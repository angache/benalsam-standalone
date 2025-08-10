import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Save, Mail, Phone, Link as LinkIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/stores';

const ContactSettings = () => {
  const { currentUser, setCurrentUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false); 
  const [socialLinks, setSocialLinks] = useState({ instagram: '', facebook: '', linkedin: '', x_twitter: '', other: '' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      setEmail(currentUser.email || '');
      setIsEmailVerified(!!currentUser.email_confirmed_at);
      setPhoneNumber(currentUser.phone_number || '');
      setIsPhoneVerified(currentUser.phone_verified || false);
      setSocialLinks(currentUser.social_links || { instagram: '', facebook: '', linkedin: '', x_twitter: '', other: '' });
      setIsLoading(false);
    }
  }, [currentUser]);

  const handleSocialLinkChange = (e) => {
    const { name, value } = e.target;
    setSocialLinks(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const updates = {
      id: currentUser.id,
      phone_number: phoneNumber || null,
      social_links: socialLinks,
      updated_at: new Date(),
    };

    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', currentUser.id)
      .select()
      .single();

    if (error) {
      toast({ title: "Güncelleme Hatası", description: error.message, variant: "destructive" });
    } else if (updatedProfile) {
      setCurrentUser(prev => ({ ...prev, ...updatedProfile }));
      toast({ title: "İletişim Bilgileri Güncellendi", description: "Değişiklikler başarıyla kaydedildi." });
    }
  };
  
  const handleVerifyEmail = async () => {
     toast({ title: "🚧 Bu özellik henüz uygulanmadı—ama merak etme! Bir sonraki istekte talep edebilirsin! 🚀" });
  };

  const handleVerifyPhone = async () => {
     toast({ title: "🚧 Bu özellik henüz uygulanmadı—ama merak etme! Bir sonraki istekte talep edebilirsin! 🚀" });
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div></div>;
  }

  return (
    <form onSubmit={handleSaveChanges} className="space-y-8">
      <div>
        <h3 className="text-lg font-medium mb-2">E-posta Adresi</h3>
        <div className="flex items-center gap-4">
          <Input type="email" value={email} disabled className="flex-grow bg-muted/50" icon={<Mail className="w-4 h-4 text-muted-foreground" />} />
          {isEmailVerified ? (
            <span className="flex items-center text-sm text-green-500"><CheckCircle className="w-4 h-4 mr-1" /> Doğrulandı</span>
          ) : (
            <Button type="button" variant="outline" onClick={handleVerifyEmail} className="text-orange-500 border-orange-500 hover:bg-orange-500/10">
              <AlertCircle className="w-4 h-4 mr-1" /> E-postayı Doğrula
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">E-posta adresinizi değiştirmek için Supabase Auth ayarlarını kullanmanız gerekebilir.</p>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-2">Telefon Numarası (İsteğe Bağlı)</h3>
        <div className="flex items-center gap-4">
          <Input 
            type="tel" 
            value={phoneNumber} 
            onChange={(e) => setPhoneNumber(e.target.value)} 
            placeholder="örn: 5xxxxxxxxx" 
            className="flex-grow"
            icon={<Phone className="w-4 h-4 text-muted-foreground" />}
          />
           {phoneNumber && (isPhoneVerified ? (
            <span className="flex items-center text-sm text-green-500"><CheckCircle className="w-4 h-4 mr-1" /> Doğrulandı</span>
          ) : (
            <Button type="button" variant="outline" onClick={handleVerifyPhone} className="text-orange-500 border-orange-500 hover:bg-orange-500/10">
              <AlertCircle className="w-4 h-4 mr-1" /> Telefonu Doğrula
            </Button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-2">Sosyal Medya Bağlantıları (İsteğe Bağlı)</h3>
        <div className="space-y-4">
          <Input name="instagram" value={socialLinks.instagram} onChange={handleSocialLinkChange} placeholder="Instagram profil URL'niz" icon={<LinkIcon className="w-4 h-4 text-muted-foreground" />} />
          <Input name="facebook" value={socialLinks.facebook} onChange={handleSocialLinkChange} placeholder="Facebook profil URL'niz" icon={<LinkIcon className="w-4 h-4 text-muted-foreground" />} />
          <Input name="linkedin" value={socialLinks.linkedin} onChange={handleSocialLinkChange} placeholder="LinkedIn profil URL'niz" icon={<LinkIcon className="w-4 h-4 text-muted-foreground" />} />
          <Input name="x_twitter" value={socialLinks.x_twitter} onChange={handleSocialLinkChange} placeholder="X (Twitter) profil URL'niz" icon={<LinkIcon className="w-4 h-4 text-muted-foreground" />} />
          <Input name="other" value={socialLinks.other} onChange={handleSocialLinkChange} placeholder="Diğer sosyal medya veya web sitesi URL'niz" icon={<LinkIcon className="w-4 h-4 text-muted-foreground" />} />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" className="btn-primary">
          <Save className="w-4 h-4 mr-2" /> Değişiklikleri Kaydet
        </Button>
      </div>
    </form>
  );
};

export default ContactSettings;