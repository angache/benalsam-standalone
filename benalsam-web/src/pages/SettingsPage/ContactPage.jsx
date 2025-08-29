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
  Info,
  User,
  FileText,
  Loader2
} from 'lucide-react';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import { useAuthStore } from '../../stores';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { useToast } from '../../components/ui/use-toast';

const ContactPage = () => {
  const navigate = useNavigate();
  const { triggerHaptic } = useHapticFeedback();
  const { currentUser } = useAuthStore();
  const { toast } = useToast();
  
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
      toast({
        title: "Hata",
        description: "Lütfen tüm alanları doldurun.",
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
        name: '',
        email: '',
        subject: '',
        message: ''
      });

      toast({
        title: "Başarılı!",
        description: "Mesajınız başarıyla gönderildi! En kısa sürede size dönüş yapacağız.",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Hata",
        description: "Mesaj gönderilirken bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    navigate('/ayarlar');
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

  const renderContactMethod = (method, index) => {
    const IconComponent = method.icon;

    return (
      <motion.div
        key={method.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        whileHover={{ 
          scale: 1.02,
          y: -5,
          transition: { duration: 0.2 }
        }}
      >
        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <IconComponent size={20} className="text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground">{method.title}</h3>
                {method.link ? (
                  <Button
                    variant="link"
                    className="p-0 h-auto text-primary hover:underline text-sm"
                    onClick={() => window.open(method.link, method.link.startsWith('http') ? '_blank' : undefined)}
                  >
                    {method.value}
                    <ExternalLink size={14} className="ml-1" />
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">{method.value}</p>
                )}
                <p className="text-xs text-muted-foreground/60 mt-1">{method.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const renderInfoCard = (title, description, icon) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
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
          <h1 className="text-xl font-semibold text-foreground">İletişim</h1>
        </div>

        <div className="w-10" /> {/* Spacer for centering */}
      </motion.div>

      {/* Info Card */}
      {renderInfoCard(
        'Bizimle İletişime Geçin',
        'Sorularınız, önerileriniz veya sorunlarınız için bizimle iletişime geçebilirsiniz. Size en kısa sürede dönüş yapacağız.',
        <MessageSquare size={20} className="text-blue-600 dark:text-blue-400" />
      )}

      {/* Contact Methods */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {contactMethods.map((method, index) => renderContactMethod(method, index))}
      </motion.div>

      {/* Contact Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MessageSquare size={20} className="text-primary" />
              </div>
              <div>
                <CardTitle className="text-foreground">Mesaj Gönder</CardTitle>
                <p className="text-sm text-muted-foreground">Formu doldurarak bize ulaşın</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>

        {isSubmitted ? (
          <motion.div 
            className="text-center py-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
            >
              <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
            </motion.div>
            <h3 className="text-lg font-medium text-foreground mb-2">Mesajınız Gönderildi!</h3>
            <p className="text-muted-foreground mb-4">
              Teşekkür ederiz. En kısa sürede size dönüş yapacağız.
            </p>
            <Button
              onClick={() => setIsSubmitted(false)}
              className="bg-primary hover:bg-primary/80"
            >
              Yeni Mesaj
            </Button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-foreground flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  Ad Soyad *
                </label>
                <Input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Adınız ve soyadınız"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground flex items-center">
                  <Mail className="w-4 h-4 mr-1" />
                  E-posta *
                </label>
                <Input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="ornek@email.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="subject" className="text-sm font-medium text-foreground flex items-center">
                <FileText className="w-4 h-4 mr-1" />
                Konu *
              </label>
              <Input
                type="text"
                id="subject"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                placeholder="Mesajınızın konusu"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium text-foreground flex items-center">
                <MessageSquare className="w-4 h-4 mr-1" />
                Mesaj *
              </label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                rows={6}
                placeholder="Mesajınızı buraya yazın..."
                className="resize-none"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full md:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span>Gönderiliyor...</span>
                </>
              ) : (
                <>
                  <Send size={20} className="mr-2" />
                  <span>Mesaj Gönder</span>
                </>
              )}
            </Button>
                      </form>
          )}
        </CardContent>
      </Card>
    </motion.div>

      {/* Response Time Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="border-0 shadow-sm bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20">
          <CardContent className="p-4">
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
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default ContactPage; 