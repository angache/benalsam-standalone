import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, Package, DollarSign, MessageSquare, Loader2, Image as ImageIcon, FileText, Sparkles, Crown, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from '@/components/ui/checkbox';
import { 
  checkPremiumFeature,
  addOfferAttachment,
  showPremiumUpgradeToast
} from '@/services/premiumService';
import { generateAISuggestion } from '@/services/aiServiceManager';

const MakeOfferForm = React.memo(({ 
  listing, 
  inventoryItems, 
  userPlan, 
  currentUser,
  onSubmit,
  isSubmitting,
  onOpenPremiumModal
}) => {
  const navigate = useNavigate();
  const [selectedItemId, setSelectedItemId] = useState('');
  const [offeredPrice, setOfferedPrice] = useState('');
  const [message, setMessage] = useState('');
  const [useAISuggestion, setUseAISuggestion] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [errors, setErrors] = useState({});

  // Debug logs for component props
  console.log('🔍 [MakeOfferForm] Component rendered with:', {
    hasListing: !!listing,
    listingId: listing?.id,
    listingTitle: listing?.title,
    hasCurrentUser: !!currentUser,
    currentUserId: currentUser?.id,
    currentUserEmail: currentUser?.email,
    inventoryCount: inventoryItems?.length || 0,
    hasUserPlan: !!userPlan,
    isSubmitting
  });

  const handleGenerateAISuggestion = async () => {
    console.log('🔍 [MakeOfferForm] AI suggestion requested:', {
      hasListing: !!listing,
      hasCurrentUser: !!currentUser,
      listingTitle: listing?.title
    });

    if (!listing || !currentUser) {
      console.log('🔍 [MakeOfferForm] Missing listing or currentUser for AI suggestion');
      return;
    }
    
    const canUseAI = await checkPremiumFeature(currentUser.id, 'ai_suggestions');
    console.log('🔍 [MakeOfferForm] AI feature check:', { canUseAI, userId: currentUser.id });
    
    if (!canUseAI) {
      console.log('🔍 [MakeOfferForm] AI feature not available, showing premium modal');
      showPremiumUpgradeToast('ai_suggestion', 0, 0);
      onOpenPremiumModal();
      return;
    }

    const suggestion = await generateAISuggestion(listing.title, listing.description, listing.budget);
    console.log('🔍 [MakeOfferForm] AI suggestion generated:', { suggestion });
    setAiSuggestion(suggestion);
    setMessage(suggestion);
    setUseAISuggestion(true);
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    console.log('🔍 [MakeOfferForm] File upload attempted:', { 
      fileCount: files.length,
      hasCurrentUser: !!currentUser,
      userId: currentUser?.id
    });

    if (files.length === 0) return;

    const canAttachFiles = await checkPremiumFeature(currentUser.id, 'file_attachments');
    console.log('🔍 [MakeOfferForm] File attachment feature check:', { canAttachFiles, userId: currentUser.id });
    
    if (!canAttachFiles) {
      console.log('🔍 [MakeOfferForm] File attachment not available, showing premium modal');
      showPremiumUpgradeToast('file_attachment', 0, 0);
      onOpenPremiumModal();
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'text/plain'];
    
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        console.log('🔍 [MakeOfferForm] File too large:', { fileName: file.name, fileSize: file.size });
        toast({ title: "Dosya Çok Büyük", description: `${file.name} dosyası 5MB'dan büyük.`, variant: "destructive" });
        return false;
      }
      if (!allowedTypes.includes(file.type)) {
        console.log('🔍 [MakeOfferForm] Unsupported file type:', { fileName: file.name, fileType: file.type });
        toast({ title: "Desteklenmeyen Dosya", description: `${file.name} dosya tipi desteklenmiyor.`, variant: "destructive" });
        return false;
      }
      return true;
    });

    console.log('🔍 [MakeOfferForm] Valid files added:', { validCount: validFiles.length });
    setAttachments(prev => [...prev, ...validFiles]);
  };

  const removeAttachment = (index) => {
    console.log('🔍 [MakeOfferForm] Removing attachment:', { index });
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    console.log('🔍 [MakeOfferForm] Validating form:', {
      selectedItemId,
      offeredPrice,
      hasMessage: !!message.trim(),
      attachmentCount: attachments.length
    });

    const newErrors = {};
    if (offeredPrice !== '' && (isNaN(parseFloat(offeredPrice)) || parseFloat(offeredPrice) < 0)) {
      newErrors.offeredPrice = 'Geçerli bir teklif fiyatı girin (0 veya daha büyük).';
    } else if (offeredPrice === '' && !selectedItemId) {
      newErrors.offeredPrice = 'Lütfen bir ürün seçin veya bir nakit teklifi yapın.';
    }
    if (!message.trim()) newErrors.message = 'Lütfen bir teklif mesajı yazın.';
    
    console.log('🔍 [MakeOfferForm] Validation errors:', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🔍 [MakeOfferForm] Form submission started:', {
      hasCurrentUser: !!currentUser,
      currentUserId: currentUser?.id,
      selectedItemId,
      offeredPrice,
      hasMessage: !!message.trim(),
      attachmentCount: attachments.length,
      isSubmitting
    });

    if (!currentUser) {
      console.log('🔍 [MakeOfferForm] No currentUser in form submit');
      toast({ title: "Giriş Gerekli", description: "Teklif yapmak için giriş yapmalısınız.", variant: "destructive" });
      return;
    }

    if (!validateForm()) {
      console.log('🔍 [MakeOfferForm] Form validation failed');
      return;
    }

    const offerData = {
      selectedItemId,
      offeredPrice: offeredPrice ? parseFloat(offeredPrice) : null,
      message: message.trim(),
      attachments
    };

    console.log('🔍 [MakeOfferForm] Submitting offer data:', offerData);
    await onSubmit(offerData);
  };

  const selectedInventoryItem = inventoryItems.find(item => item.id === selectedItemId);
  const isPremiumUser = userPlan?.plan_slug !== 'basic';
  const isInventoryEmpty = inventoryItems.length === 0;
  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 glass-effect rounded-2xl">
      {isInventoryEmpty && (
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 mt-0.5 flex-shrink-0 text-blue-400" />
            <div>
              <h4 className="font-semibold text-blue-300">Daha Güçlü Teklifler İçin İpucu!</h4>
              <p className="text-sm mt-1 text-blue-300/80">
                Envanteriniz şu an boş. Teklifinize envanterinizden bir ürün eklemek, karşı tarafın teklifinizi daha ciddiye almasını sağlayabilir. Dilerseniz sadece nakit teklif de yapabilirsiniz.
              </p>
              <Button 
                type="button" 
                variant="link" 
                className="p-0 h-auto mt-2 text-blue-400 hover:text-blue-300"
                onClick={() => navigate('/envanterim/yeni')}
              >
                Envanterime Ürün Ekle →
              </Button>
            </div>
          </div>
        </div>
      )}
      <fieldset disabled={isSubmitting}>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            <Package className="w-4 h-4 inline mr-2 text-primary" /> Teklif Edilecek Envanter Ürünü (Opsiyonel)
          </label>
          <Select value={selectedItemId} onValueChange={setSelectedItemId}>
            <SelectTrigger className={`w-full bg-input border-border text-foreground ${errors.selectedItemId ? 'border-destructive' : ''}`}>
              <SelectValue placeholder="Envanterinizden bir ürün seçin..." />
            </SelectTrigger>
            <SelectContent className="dropdown-content max-h-60">
              {inventoryItems.map(item => (
                <SelectItem key={item.id} value={item.id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={item.main_image_url || item.image_url} alt={item.name} />
                      <AvatarFallback><ImageIcon className="w-3 h-3" /></AvatarFallback>
                    </Avatar>
                    <span>{item.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.selectedItemId && <p className="text-destructive text-xs mt-1">{errors.selectedItemId}</p>}
          {selectedInventoryItem && (
            <div className="mt-2 p-3 bg-muted/30 rounded-md border border-border/50 flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={selectedInventoryItem.main_image_url || selectedInventoryItem.image_url} alt={selectedInventoryItem.name} />
                <AvatarFallback><ImageIcon className="w-6 h-6" /></AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">{selectedInventoryItem.name}</p>
                <p className="text-xs text-muted-foreground">{selectedInventoryItem.category}</p>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            <DollarSign className="w-4 h-4 inline mr-2 text-primary" /> Ek Nakit Teklifi (₺) (Opsiyonel)
          </label>
          <input 
            type="number" 
            value={offeredPrice} 
            onChange={(e) => setOfferedPrice(e.target.value)} 
            placeholder="0" 
            min="0"
            className={`w-full px-4 py-2.5 bg-input border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none input-glow ${errors.offeredPrice ? 'border-destructive' : 'border-border'}`} 
          />
          {errors.offeredPrice && <p className="text-destructive text-xs mt-1">{errors.offeredPrice}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-foreground">
              <MessageSquare className="w-4 h-4 inline mr-2 text-primary" /> Teklif Mesajınız *
            </label>
            {isPremiumUser && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateAISuggestion}
                className="text-xs"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                AI Öneri
              </Button>
            )}
          </div>
          
          {aiSuggestion && (
            <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">AI Önerisi</span>
              </div>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">{aiSuggestion}</p>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="use-ai" 
                  checked={useAISuggestion}
                  onCheckedChange={setUseAISuggestion}
                />
                <label htmlFor="use-ai" className="text-xs text-blue-700 dark:text-blue-300">
                  Bu AI önerisini kullan
                </label>
              </div>
            </div>
          )}
          
          <textarea 
            value={message} 
            onChange={(e) => setMessage(e.target.value)} 
            placeholder="Teklifiniz hakkında ek detaylar, takas koşulları vb."
            rows={4} 
            className={`w-full px-4 py-2.5 bg-input border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none input-glow resize-none ${errors.message ? 'border-destructive' : 'border-border'}`} 
          />
          {errors.message && <p className="text-destructive text-xs mt-1">{errors.message}</p>}
        </div>

        {isPremiumUser && userPlan?.plan_slug === 'corporate' && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              <FileText className="w-4 h-4 inline mr-2 text-primary" /> Dosya Ekleri (Opsiyonel)
              <Badge variant="secondary" className="ml-2 text-xs">Kurumsal</Badge>
            </label>
            <input
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.pdf,.txt"
              onChange={handleFileUpload}
              className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
            <p className="text-xs text-muted-foreground mt-1">
              JPG, PNG, PDF, TXT dosyaları desteklenir. Maksimum 5MB.
            </p>
            
            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      Kaldır
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </fieldset>

      <div className="flex gap-4 pt-3">
        <Button type="button" variant="outline" className="flex-1 border-muted-foreground/50 text-muted-foreground hover:bg-muted-foreground/10">
          İptal
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1 btn-primary text-primary-foreground">
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
          {isSubmitting ? 'Gönderiliyor...' : 'Teklifi Gönder'}
        </Button>
      </div>
    </form>
  );
});

export default MakeOfferForm;