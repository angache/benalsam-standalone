import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  ExternalLink,
  Info
} from 'lucide-react';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import { useAuthStore } from '../../stores';

const ContactPage = () => {
  const navigate = useNavigate();
  const { triggerHaptic } = useHapticFeedback();
  const { currentUser } = useAuthStore();
  
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      alert('Lütfen tüm alanları doldurun.');
      return;
    }

    try {
      setIsSubmitting(true);
      triggerHaptic();

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      setIsSubmitted(true);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });

      alert('Mesajınız başarıyla gönderildi! En kısa sürede size dönüş yapacağız.');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Mesaj gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    navigate('/ayarlar2');
  };

  const contactMethods = [
    {
      id: 'email',
      title: 'E-posta',
      value: 'destek@benalsam.com',
      icon: Mail,
      link: 'mailto:destek@benalsam.com',
      description: 'En hızlı yanıt için e-posta gönderin'
    },
    {
      id: 'phone',
      title: 'Telefon',
      value: '0555 555 55 55',
      icon: Phone,
      link: 'tel:+905555555555',
      description: 'Pazartesi - Cuma, 09:00 - 18:00'
    },
    {
      id: 'address',
      title: 'Adres',
      value: 'İstanbul, Türkiye',
      icon: MapPin,
      link: null,
      description: 'Merkez ofisimiz'
    },
    {
      id: 'hours',
      title: 'Çalışma Saatleri',
      value: '09:00 - 18:00',
      icon: Clock,
      link: null,
      description: 'Pazartesi - Cuma'
    }
  ];

  const renderContactMethod = (method) => {
    const IconComponent = method.icon;

    return (
      <motion.div
        key={method.id}
        whileHover={{ scale: 1.02 }}
        className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary transition-colors"
      >
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <IconComponent size={20} className="text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 dark:text-white">{method.title}</h3>
            {method.link ? (
              <a
                href={method.link}
                className="text-primary hover:underline text-sm"
                target={method.link.startsWith('http') ? '_blank' : undefined}
                rel={method.link.startsWith('http') ? 'noopener noreferrer' : undefined}
              >
                {method.value}
                <ExternalLink size={14} className="inline ml-1" />
              </a>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">{method.value}</p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{method.description}</p>
          </div>
        </div>
      </motion.div>
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
          <h1 className="text-xl font-semibold">İletişim</h1>
        </div>

        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Info Card */}
      {renderInfoCard(
        'Bizimle İletişime Geçin',
        'Sorularınız, önerileriniz veya sorunlarınız için bizimle iletişime geçebilirsiniz. Size en kısa sürede dönüş yapacağız.',
        <MessageSquare size={20} className="text-blue-600 dark:text-blue-400" />
      )}

      {/* Contact Methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contactMethods.map(renderContactMethod)}
      </div>

      {/* Contact Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <MessageSquare size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Mesaj Gönder</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Formu doldurarak bize ulaşın</p>
          </div>
        </div>

        {isSubmitted ? (
          <div className="text-center py-8">
            <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Mesajınız Gönderildi!</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Teşekkür ederiz. En kısa sürede size dönüş yapacağız.
            </p>
            <button
              onClick={() => setIsSubmitted(false)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
            >
              Yeni Mesaj
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ad Soyad *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  E-posta *
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Konu *
              </label>
              <input
                type="text"
                id="subject"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Mesajınızın konusu"
                required
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mesaj *
              </label>
              <textarea
                id="message"
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                placeholder="Mesajınızı buraya yazın..."
                required
              />
            </div>

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
                  <span>Mesaj Gönder</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Response Time Info */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 p-4">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-yellow-100 dark:bg-yellow-800 rounded-lg">
            <Info size={20} className="text-yellow-600 dark:text-yellow-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-yellow-900 dark:text-yellow-100">Yanıt Süresi</h3>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-2 space-y-1">
              <li>• E-posta: 24 saat içinde</li>
              <li>• Telefon: Çalışma saatleri içinde</li>
              <li>• Acil durumlar için telefon tercih edilir</li>
              <li>• Hafta sonu e-posta yanıtları sınırlıdır</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ContactPage; 