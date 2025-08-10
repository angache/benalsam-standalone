import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.jsx";
import { Input } from '@/components/ui/input.jsx';
import { Send, MessageSquare, Bug, Lightbulb, Upload } from 'lucide-react';
import { useAuthStore } from '@/stores';

const FeedbackSection = () => {
  const { currentUser } = useAuthStore();
  const [feedbackType, setFeedbackType] = useState('suggestion');
  const [message, setMessage] = useState('');
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleScreenshotChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { 
        toast({ title: "Dosya Boyutu Büyük", description: "Ekran görüntüsü 2MB'den küçük olmalıdır.", variant: "destructive" });
        return;
      }
      setScreenshotFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setScreenshotPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!currentUser || !message.trim()) {
      toast({ title: "Eksik Bilgi", description: "Lütfen geri bildirim mesajınızı yazın.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    let screenshotUrl = null;

    if (screenshotFile) {
      const fileExt = screenshotFile.name.split('.').pop();
      const fileName = `feedback-${currentUser.id}-${Date.now()}.${fileExt}`;
      const filePath = `feedback_screenshots/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('item_images') // Using item_images bucket for now, can create a dedicated one
        .upload(filePath, screenshotFile, { cacheControl: '3600', upsert: true });

      if (uploadError) {
        toast({ title: "Ekran Görüntüsü Yükleme Hatası", description: uploadError.message, variant: "destructive" });
        setIsSubmitting(false);
        return;
      }
      const { data: urlData } = supabase.storage.from('item_images').getPublicUrl(filePath);
      screenshotUrl = urlData.publicUrl;
    }

    const feedbackData = {
      user_id: currentUser.id,
      feedback_type: feedbackType,
      message: message.trim(),
      screenshot_url: screenshotUrl,
    };

    const { error } = await supabase.from('user_feedback').insert([feedbackData]);
    setIsSubmitting(false);

    if (error) {
      toast({ title: "Geri Bildirim Gönderilemedi", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Geri Bildiriminiz Alındı!", description: "Değerli görüşleriniz için teşekkür ederiz." });
      setMessage('');
      setScreenshotFile(null);
      setScreenshotPreview('');
    }
  };

  const getIconForType = () => {
    switch(feedbackType) {
      case 'bug': return <Bug className="w-5 h-5 mr-2 text-destructive" />;
      case 'suggestion': return <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />;
      default: return <MessageSquare className="w-5 h-5 mr-2 text-primary" />;
    }
  };

  return (
    <form onSubmit={handleSubmitFeedback} className="space-y-6 p-6 border border-border rounded-lg glass-effect">
      <div className="flex items-center">
        {getIconForType()}
        <h3 className="text-lg font-medium">Geri Bildirim Gönder</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Platformumuzla ilgili düşüncelerinizi, önerilerinizi veya karşılaştığınız sorunları bizimle paylaşın.
      </p>
      
      <div>
        <label htmlFor="feedbackType" className="block text-sm font-medium mb-1">Geri Bildirim Türü</label>
        <Select value={feedbackType} onValueChange={setFeedbackType}>
          <SelectTrigger id="feedbackType" className="w-full sm:w-1/2">
            <SelectValue placeholder="Geri bildirim türünü seçin" />
          </SelectTrigger>
          <SelectContent className="dropdown-content">
            <SelectItem value="suggestion">Öneri / Fikir</SelectItem>
            <SelectItem value="bug">Hata Bildirimi</SelectItem>
            <SelectItem value="complaint">Şikayet</SelectItem>
            <SelectItem value="other">Diğer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium mb-1">Mesajınız</label>
        <Textarea 
          id="message" 
          value={message} 
          onChange={(e) => setMessage(e.target.value)} 
          placeholder="Düşüncelerinizi buraya yazın..." 
          required 
          className="min-h-[120px]"
        />
      </div>

      <div>
        <label htmlFor="screenshot" className="block text-sm font-medium mb-1">Ekran Görüntüsü (İsteğe Bağlı)</label>
        <div className="flex items-center gap-4">
          <label htmlFor="screenshotUpload" className="cursor-pointer">
            <Button type="button" variant="outline" asChild>
              <span><Upload className="w-4 h-4 mr-2" /> Görüntü Seç</span>
            </Button>
            <input type="file" id="screenshotUpload" accept="image/*" onChange={handleScreenshotChange} className="hidden" />
          </label>
          {screenshotPreview && (
            <div className="w-20 h-20 border border-border rounded-md overflow-hidden">
              <img-replace src={screenshotPreview} alt="Ekran görüntüsü önizlemesi" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">Max. 2MB. JPG, PNG, GIF formatları desteklenir.</p>
      </div>

      <Button type="submit" disabled={isSubmitting} className="btn-primary w-full sm:w-auto">
        {isSubmitting ? <Send className="w-4 h-4 mr-2 animate-pulse" /> : <Send className="w-4 h-4 mr-2" />}
        Geri Bildirimi Gönder
      </Button>
    </form>
  );
};

export default FeedbackSection;