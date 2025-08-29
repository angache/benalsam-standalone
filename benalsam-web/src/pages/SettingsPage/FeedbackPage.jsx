import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  MessageSquare,
  Bug,
  Lightbulb,
  ThumbsUp,
  ThumbsDown,
  Star,
  Send,
  CheckCircle,
  AlertCircle,
  Info,
  Upload,
  X,
  Loader2,
  FileText
} from 'lucide-react';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import { useAuthStore } from '../../stores';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Checkbox } from '../../components/ui/checkbox';
import { useToast } from '../../components/ui/use-toast';

const FeedbackPage = () => {
  const navigate = useNavigate();
  const { triggerHaptic } = useHapticFeedback();
  const { currentUser } = useAuthStore();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    type: '',
    title: '',
    description: '',
    rating: 0,
    contactBack: false,
    email: currentUser?.email || ''
  });
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const feedbackTypes = [
    {
      id: 'feature',
      title: 'Özellik Önerisi',
      description: 'Yeni özellik veya iyileştirme önerisi',
      icon: Lightbulb,
      color: 'text-yellow-500'
    },
    {
      id: 'bug',
      title: 'Hata Bildirimi',
      description: 'Karşılaştığınız bir sorun veya hata',
      icon: Bug,
      color: 'text-red-500'
    },
    {
      id: 'praise',
      title: 'Olumlu Geri Bildirim',
      description: 'Beğendiğiniz özellikler hakkında',
      icon: ThumbsUp,
      color: 'text-green-500'
    },
    {
      id: 'complaint',
      title: 'Şikayet',
      description: 'Memnun olmadığınız bir durum',
      icon: ThumbsDown,
      color: 'text-orange-500'
    },
    {
      id: 'general',
      title: 'Genel Geri Bildirim',
      description: 'Diğer konular hakkında',
      icon: MessageSquare,
      color: 'text-blue-500'
    }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleScreenshotChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "Hata",
          description: "Dosya boyutu 10MB'dan küçük olmalıdır.",
          variant: "destructive",
        });
        return;
      }

      setScreenshot(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setScreenshotPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeScreenshot = () => {
    setScreenshot(null);
    setScreenshotPreview('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.type || !formData.title || !formData.description) {
      toast({
        title: "Hata",
        description: "Lütfen gerekli alanları doldurun.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      triggerHaptic();

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      setIsSubmitted(true);
      setFormData({
        type: '',
        title: '',
        description: '',
        rating: 0,
        contactBack: false,
        email: currentUser?.email || ''
      });
      setScreenshot(null);
      setScreenshotPreview('');

      toast({
        title: "Başarılı!",
        description: "Geri bildiriminiz başarıyla gönderildi! Teşekkür ederiz.",
      });
    } catch (error) {
      console.error('Error sending feedback:', error);
      toast({
        title: "Hata",
        description: "Geri bildirim gönderilirken bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    navigate('/ayarlar');
  };

  const renderFeedbackType = (type) => {
    const IconComponent = type.icon;
    const isSelected = formData.type === type.id;

    return (
      <motion.div
        key={type.id}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => handleInputChange('type', type.id)}
        className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
          isSelected
            ? 'border-primary bg-primary/5'
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
        }`}
      >
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary/10' : 'bg-gray-100 dark:bg-gray-700'}`}>
            <IconComponent size={20} className={type.color} />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 dark:text-white">{type.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{type.description}</p>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderStarRating = () => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleInputChange('rating', star)}
            className="p-1 hover:scale-110 transition-transform"
          >
            <Star
              size={24}
              className={`${
                star <= formData.rating
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300 dark:text-gray-600'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
          {formData.rating > 0 ? `${formData.rating}/5` : 'Değerlendirme yapın'}
        </span>
      </div>
    );
  };

  const renderInfoCard = (title, description, icon) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
              {icon}
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-blue-900 dark:text-blue-100">{title}</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">{description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={handleGoBack}
          className="hover:bg-accent"
        >
          <ArrowLeft size={20} />
        </Button>
        
        <div className="flex-1 text-center">
          <h1 className="text-xl font-semibold text-foreground">Geri Bildirim</h1>
        </div>

        <div className="w-10" /> {/* Spacer for centering */}
      </motion.div>

      {/* Info Card */}
      {renderInfoCard(
        'Geri Bildirim',
        'Deneyiminizi paylaşın. Önerileriniz ve geri bildirimleriniz platformumuzu geliştirmemize yardımcı olur.',
        <MessageSquare size={20} className="text-blue-600 dark:text-blue-400" />
      )}

      {isSubmitted ? (
        <motion.div 
          className="text-center py-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8">
              <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Geri Bildiriminiz Gönderildi!</h3>
              <p className="text-muted-foreground mb-4">
                Değerli geri bildiriminiz için teşekkür ederiz. Geliştirme ekibimiz inceleyecektir.
              </p>
              <Button
                onClick={() => setIsSubmitted(false)}
              >
                Yeni Geri Bildirim
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.form 
          onSubmit={handleSubmit} 
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Feedback Type Selection */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Geri Bildirim Türü</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {feedbackTypes.map(renderFeedbackType)}
            </div>
          </div>

          {/* Rating */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">
              Genel Değerlendirme
            </label>
            {renderStarRating()}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium text-foreground">
              Başlık *
            </label>
            <Input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Geri bildiriminizin kısa başlığı"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-foreground">
              Detaylı Açıklama *
            </label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={6}
              placeholder="Geri bildiriminizi detaylı olarak açıklayın..."
              required
            />
          </div>

          {/* Screenshot Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Ekran Görüntüsü (İsteğe Bağlı)
            </label>
            <div className="space-y-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleScreenshotChange}
                className="hidden"
                id="screenshot"
              />
              <label
                htmlFor="screenshot"
                className="flex items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors bg-muted/50"
              >
                <div className="text-center">
                  <Upload size={24} className="text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Ekran görüntüsü yüklemek için tıklayın
                  </p>
                </div>
              </label>
              
              {screenshotPreview && (
                <div className="relative">
                  <img
                    src={screenshotPreview}
                    alt="Screenshot preview"
                    className="w-full max-w-md rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={removeScreenshot}
                    className="absolute top-2 right-2 h-8 w-8"
                  >
                    <X size={16} />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Contact Back Option */}
          <div className="flex items-center space-x-3">
            <Checkbox
              id="contactBack"
              checked={formData.contactBack}
              onCheckedChange={(checked) => handleInputChange('contactBack', checked)}
            />
            <label htmlFor="contactBack" className="text-sm text-foreground">
              Size geri dönüş yapmamızı istiyorsanız işaretleyin
            </label>
          </div>

          {formData.contactBack && (
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                E-posta Adresiniz
              </label>
              <Input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Geri dönüş için e-posta adresiniz"
              />
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full md:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                <span>Gönderiliyor...</span>
              </>
            ) : (
              <>
                <Send size={20} className="mr-2" />
                <span>Geri Bildirim Gönder</span>
              </>
            )}
          </Button>
        </motion.form>
      )}

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="border-0 shadow-sm bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-800 rounded-lg">
                <Info size={20} className="text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-yellow-900 dark:text-yellow-100">Geri Bildirim İpuçları</h3>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-2 space-y-1">
                  <li>• Spesifik ve detaylı açıklamalar daha faydalıdır</li>
                  <li>• Ekran görüntüsü eklemek sorunu daha iyi anlamamızı sağlar</li>
                  <li>• Özellik önerilerinde kullanım senaryosunu belirtin</li>
                  <li>• Hata bildirimlerinde adımları sırasıyla açıklayın</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default FeedbackPage; 