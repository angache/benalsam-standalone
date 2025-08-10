import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';

const EmailInfo = ({ currentUser }) => {
  const [authUser, setAuthUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const getAuthUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setAuthUser(user);
      } catch (error) {
        console.error('Auth user fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getAuthUser();
  }, []);

  const isVerified = !!authUser?.email_confirmed_at;

  const handleResendVerification = async () => {
    if (!authUser?.email) return;

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: authUser.email,
      });

      if (error) {
        toast({ 
          title: "Hata", 
          description: "Doğrulama e-postası gönderilemedi. Lütfen tekrar deneyin.", 
          variant: "destructive" 
        });
      } else {
        toast({ 
          title: "Başarılı", 
          description: "Doğrulama e-postası tekrar gönderildi. Lütfen e-postanızı kontrol edin.", 
        });
      }
    } catch (error) {
      toast({ 
        title: "Hata", 
        description: "Beklenmedik bir hata oluştu. Lütfen tekrar deneyin.", 
        variant: "destructive" 
      });
    } finally {
      setIsResending(false);
    }
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-lg border p-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-lg border p-4 space-y-3"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Mail className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium">E-posta Adresiniz</span>
            <Badge 
              variant={isVerified ? "default" : "secondary"}
              className={isVerified ? "bg-green-500" : "bg-amber-500"}
            >
              {isVerified ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Doğrulandı
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Doğrulanmadı
                </>
              )}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground break-all">
            {authUser?.email}
          </p>
        </div>
      </div>

      {!isVerified && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3"
        >
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                E-posta adresiniz henüz doğrulanmadı
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mb-3">
                Hesabınızın güvenliği için lütfen e-posta adresinizi doğrulayın.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={handleResendVerification}
                disabled={isResending}
                className="text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30"
              >
                {isResending ? (
                  <>
                    <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Gönderiliyor...
                  </>
                ) : (
                  <>
                    <Mail className="w-3 h-3 mr-2" />
                    Tekrar Gönder
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {isVerified && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3"
        >
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                E-posta adresiniz doğrulandı
              </p>
              <p className="text-xs text-green-700 dark:text-green-300">
                Hesabınız güvenli ve aktif durumda.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default EmailInfo; 