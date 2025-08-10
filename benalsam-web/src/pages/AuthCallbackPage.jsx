import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from '@/stores';
import { toast } from '@/components/ui/use-toast.js';

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const { setCurrentUser, setLoadingAuth: setAuthLoadingHook } = useAuthStore();
  const [message, setMessage] = useState('Doğrulama işleniyor, lütfen bekleyin...');
  const [error, setError] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      setAuthLoadingHook(true); 
      
      // Supabase JS SDK handles the session from the URL hash automatically.
      // We just need to wait for it and then get the session.
      // A small delay might be needed if Supabase hasn't processed the hash yet.
      await new Promise(resolve => setTimeout(resolve, 500));


      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Error getting session on callback:', sessionError);
        setError('Oturum alınırken bir hata oluştu. Lütfen tekrar deneyin.');
        setMessage('');
        setAuthLoadingHook(false);
        toast({ title: "Doğrulama Hatası", description: "Oturum bilgileri alınamadı.", variant: "destructive" });
        navigate('/');
        return;
      }

      if (session && session.user) {
        // The email_confirmed_at might not be immediately updated in the session object
        // after clicking the confirmation link. We might need to refresh the user or session.
        const { data: { user: refreshedUser }, error: refreshError } = await supabase.auth.refreshSession();
        const finalUser = refreshedUser || session.user;

        if (refreshError) {
            console.warn("Error refreshing session on callback, using existing session user data:", refreshError);
        }

        if (finalUser.email_confirmed_at || finalUser.phone_confirmed_at) {
          setMessage('E-posta adresiniz başarıyla doğrulandı! Yönlendiriliyorsunuz...');
          
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', finalUser.id)
            .single();

          if (profileError) {
            console.error('Error fetching profile after callback:', profileError);
            toast({ title: "Profil Yüklenemedi", description: "Profiliniz yüklenirken bir sorun oluştu.", variant: "destructive" });
          } else if (profile) {
            setCurrentUser(profile);
          }
          
          // The toast for email confirmation will now be handled by useAuthStore hook globally
          // to avoid duplication and ensure it shows only once.
          // toast({ title: "Doğrulama Başarılı!", description: "Hesabınız başarıyla doğrulandı." });
          navigate('/'); 
        } else {
           setError('E-posta adresiniz henüz doğrulanmamış görünüyor. Lütfen e-postanızı kontrol edin veya birkaç dakika sonra tekrar deneyin.');
           setMessage('');
           // Optionally, navigate to a page that suggests checking email or resending confirmation
           // navigate('/auth?action=login&needsConfirmation=true'); 
        }
      } else {
        setError('Doğrulama başarısız oldu. Geçerli bir oturum bulunamadı. Lütfen tekrar giriş yapmayı deneyin.');
        setMessage('');
        navigate('/?authError=true');
      }
      setAuthLoadingHook(false);
    };

    // Check if the URL contains auth tokens (Supabase redirects here after email click)
    const hash = window.location.hash;
    if (hash.includes('access_token') || hash.includes('error_description')) { // also check for error in hash
        handleAuthCallback();
    } else {
        // If no tokens in hash, it might be a direct navigation or already handled.
        // Redirect to home if no specific action is determined after a short delay.
        const timer = setTimeout(() => {
            setMessage('Doğrulama bilgisi bulunamadı veya zaten işlendi. Ana sayfaya yönlendiriliyorsunuz...');
            navigate('/');
        }, 2500); 
        return () => clearTimeout(timer);
    }

  }, [navigate, setCurrentUser, setAuthLoadingHook]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4 text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mb-8"></div>
      {message && <p className="text-xl font-semibold mb-4">{message}</p>}
      {error && <p className="text-xl text-destructive">{error}</p>}
      {!message && !error && <p className="text-xl">Yönlendiriliyorsunuz...</p>}
    </div>
  );
};

export default AuthCallbackPage;