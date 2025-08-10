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
  X
} from 'lucide-react';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import { useAuthStore } from '../../stores';

const FeedbackPage = () => {
  const navigate = useNavigate();
  const { triggerHaptic } = useHapticFeedback();
  const { currentUser } = useAuthStore();
  
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
        alert('Dosya boyutu 10MB\'dan küçük olmalıdır.');
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
      alert('Lütfen gerekli alanları doldurun.');
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

      alert('Geri bildiriminiz başarıyla gönderildi! Teşekkür ederiz.');
    } catch (error) {
      console.error('Error sending feedback:', error);
      alert('Geri bildirim gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    navigate('/ayarlar2');
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
    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <div className="flex items-start space-x-3">
        <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-blue-900 dark:text-blue-100">{title}</h3>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">{description}</p>
        </div>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handleGoBack}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        
        <div className="flex-1 text-center">
          <h1 className="text-xl font-semibold">Geri Bildirim</h1>
        </div>

        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Info Card */}
      {renderInfoCard(
        'Geri Bildirim',
        'Deneyiminizi paylaşın. Önerileriniz ve geri bildirimleriniz platformumuzu geliştirmemize yardımcı olur.',
        <MessageSquare size={20} className="text-blue-600 dark:text-blue-400" />
      )}

      {isSubmitted ? (
        <div className="text-center py-8">
          <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Geri Bildiriminiz Gönderildi!</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Değerli geri bildiriminiz için teşekkür ederiz. Geliştirme ekibimiz inceleyecektir.
          </p>
          <button
            onClick={() => setIsSubmitted(false)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
          >
            Yeni Geri Bildirim
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Feedback Type Selection */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Geri Bildirim Türü</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {feedbackTypes.map(renderFeedbackType)}
            </div>
          </div>

          {/* Rating */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Genel Değerlendirme
            </label>
            {renderStarRating()}
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Başlık *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Geri bildiriminizin kısa başlığı"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Detaylı Açıklama *
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              placeholder="Geri bildiriminizi detaylı olarak açıklayın..."
              required
            />
          </div>

          {/* Screenshot Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-primary transition-colors"
              >
                <div className="text-center">
                  <Upload size={24} className="text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
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
                  <button
                    type="button"
                    onClick={removeScreenshot}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Contact Back Option */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="contactBack"
              checked={formData.contactBack}
              onChange={(e) => handleInputChange('contactBack', e.target.checked)}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="contactBack" className="text-sm text-gray-700 dark:text-gray-300">
              Size geri dönüş yapmamızı istiyorsanız işaretleyin
            </label>
          </div>

          {formData.contactBack && (
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                E-posta Adresiniz
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Geri dönüş için e-posta adresiniz"
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full md:w-auto px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Gönderiliyor...</span>
              </>
            ) : (
              <>
                <Send size={20} />
                <span>Geri Bildirim Gönder</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* Tips */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 p-4">
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
      </div>
    </motion.div>
  );
};

export default FeedbackPage; 