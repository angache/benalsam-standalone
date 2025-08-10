import React from 'react';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button.jsx';
import { ShieldAlert, UserX, FileText, ExternalLink } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog.jsx";

const AccountSettings = () => {

  const handleNotImplemented = (feature) => {
    toast({ title: `🚧 ${feature} (Yakında)`, description: "Bu özellik henüz uygulanmadı—ama merak etme! Bir sonraki istekte talep edebilirsin! 🚀" });
  };

  return (
    <div className="space-y-10">
      <div className="p-6 border border-border rounded-lg glass-effect">
        <h3 className="text-lg font-medium mb-3 flex items-center"><FileText className="w-5 h-5 mr-2 text-primary" /> Yasal Bilgiler</h3>
        <div className="space-y-3">
            <Button variant="link" className="p-0 h-auto text-foreground hover:text-primary flex items-center" onClick={() => handleNotImplemented("Gizlilik Politikası")}>
                Gizlilik Politikası <ExternalLink className="w-3 h-3 ml-1 opacity-70" />
            </Button>
            <Button variant="link" className="p-0 h-auto text-foreground hover:text-primary flex items-center" onClick={() => handleNotImplemented("Kullanım Şartları")}>
                Kullanım Şartları (Terms & Conditions) <ExternalLink className="w-3 h-3 ml-1 opacity-70" />
            </Button>
        </div>
      </div>

      <div className="p-6 border border-destructive/30 rounded-lg glass-effect">
        <h3 className="text-lg font-medium mb-3 flex items-center text-destructive"><ShieldAlert className="w-5 h-5 mr-2" /> Hesap Yönetimi</h3>
        <p className="text-sm text-muted-foreground mb-4">Hesabınızı devre dışı bırakabilir veya kalıcı olarak silebilirsiniz. Bu işlemler geri alınamaz.</p>
        <div className="flex flex-col sm:flex-row gap-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10 w-full sm:w-auto">
                <UserX className="w-4 h-4 mr-2" /> Hesabı Devre Dışı Bırak (Yakında)
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hesabı Devre Dışı Bırakmak Üzeresiniz</AlertDialogTitle>
                <AlertDialogDescription>
                  Bu özellik yakında aktif olacaktır. Hesabınızı devre dışı bıraktığınızda profiliniz ve ilanlarınız geçici olarak gizlenir. İstediğiniz zaman tekrar aktif edebilirsiniz.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>İptal</AlertDialogCancel>
                <AlertDialogAction disabled onClick={() => handleNotImplemented("Hesap Devre Dışı Bırakma")}>Devam Et</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full sm:w-auto">
                <UserX className="w-4 h-4 mr-2" /> Hesabı Kalıcı Olarak Sil (Yakında)
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-destructive">Hesabınızı Kalıcı Olarak Silmek İstediğinize Emin Misiniz?</AlertDialogTitle>
                <AlertDialogDescription>
                  Bu özellik yakında aktif olacaktır. Bu işlem tüm verilerinizi (profil, ilanlar, mesajlar, yorumlar) kalıcı olarak silecektir ve geri alınamaz.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>İptal</AlertDialogCancel>
                <AlertDialogAction className="bg-destructive hover:bg-destructive/90" disabled onClick={() => handleNotImplemented("Hesap Silme")}>Evet, Hesabımı Sil</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;