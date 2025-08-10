import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Info,
  Heart,
  Users,
  Shield,
  Globe,
  Code,
  Award,
  ExternalLink,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';

const AboutPage = () => {
  const navigate = useNavigate();
  const { triggerHaptic } = useHapticFeedback();

  const handleGoBack = () => {
    navigate('/ayarlar2');
  };

  const appInfo = {
    name: 'BenAlsam',
    version: '2.0.0',
    description: 'Güvenilir ve kullanıcı dostu ilan platformu',
    tagline: 'Güvenle al, güvenle sat'
  };

  const features = [
    {
      icon: Shield,
      title: 'Güvenli Platform',
      description: 'SSL şifreleme ve güvenlik protokolleri ile korunan platform'
    },
    {
      icon: Users,
      title: 'Topluluk Odaklı',
      description: 'Binlerce kullanıcıdan oluşan güvenilir topluluk'
    },
    {
      icon: Globe,
      title: 'Geniş Kapsam',
      description: 'Türkiye genelinde hizmet veren platform'
    },
    {
      icon: Award,
      title: 'Kalite Garantisi',
      description: 'Kaliteli hizmet ve kullanıcı memnuniyeti odaklı yaklaşım'
    }
  ];

  const teamInfo = [
    {
      name: 'Geliştirme Ekibi',
      description: 'Modern teknolojiler kullanarak platformu sürekli geliştiriyoruz',
      icon: Code
    },
    {
      name: 'Destek Ekibi',
      description: '7/24 kullanıcı desteği sağlıyoruz',
      icon: Users
    },
    {
      name: 'Güvenlik Ekibi',
      description: 'Platform güvenliğini en üst seviyede tutuyoruz',
      icon: Shield
    }
  ];

  const contactInfo = [
    {
      title: 'E-posta',
      value: 'info@benalsam.com',
      icon: Mail,
      link: 'mailto:info@benalsam.com'
    },
    {
      title: 'Telefon',
      value: '0555 555 55 55',
      icon: Phone,
      link: 'tel:+905555555555'
    },
    {
      title: 'Adres',
      value: 'İstanbul, Türkiye',
      icon: MapPin,
      link: null
    }
  ];

  const renderFeatureCard = (feature) => {
    const IconComponent = feature.icon;

    return (
      <motion.div
        key={feature.title}
        whileHover={{ scale: 1.02 }}
        className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary transition-colors"
      >
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <IconComponent size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">{feature.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{feature.description}</p>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderTeamCard = (team) => {
    const IconComponent = team.icon;

    return (
      <div key={team.name} className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <IconComponent size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">{team.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{team.description}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderContactCard = (contact) => {
    const IconComponent = contact.icon;

    return (
      <div key={contact.title} className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <IconComponent size={20} className="text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 dark:text-white">{contact.title}</h3>
            {contact.link ? (
              <a
                href={contact.link}
                className="text-primary hover:underline text-sm flex items-center"
                target={contact.link.startsWith('http') ? '_blank' : undefined}
                rel={contact.link.startsWith('http') ? 'noopener noreferrer' : undefined}
              >
                {contact.value}
                <ExternalLink size={14} className="ml-1" />
              </a>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">{contact.value}</p>
            )}
          </div>
        </div>
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
          <h1 className="text-xl font-semibold">Hakkında</h1>
        </div>

        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* App Info */}
      <div className="text-center py-8">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart size={40} className="text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{appInfo.name}</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-1">{appInfo.description}</p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">{appInfo.tagline}</p>
        <div className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
          v{appInfo.version}
        </div>
      </div>

      {/* Info Card */}
      {renderInfoCard(
        'Platform Hakkında',
        'BenAlsam, kullanıcıların güvenle alım-satım yapabilmeleri için tasarlanmış modern bir platformdur.',
        <Info size={20} className="text-blue-600 dark:text-blue-400" />
      )}

      {/* Features */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Özelliklerimiz</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map(renderFeatureCard)}
        </div>
      </div>

      {/* Team */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Ekibimiz</h2>
        <div className="space-y-3">
          {teamInfo.map(renderTeamCard)}
        </div>
      </div>

      {/* Contact */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">İletişim</h2>
        <div className="space-y-3">
          {contactInfo.map(renderContactCard)}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-primary">10K+</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Aktif Kullanıcı</div>
        </div>
        <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-primary">50K+</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Başarılı İşlem</div>
        </div>
        <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-primary">99%</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Müşteri Memnuniyeti</div>
        </div>
        <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-primary">24/7</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Destek</div>
        </div>
      </div>

      {/* Mission & Vision */}
      <div className="space-y-4">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 p-4">
          <h3 className="font-medium text-green-900 dark:text-green-100 mb-2">Misyonumuz</h3>
          <p className="text-sm text-green-700 dark:text-green-300">
            Kullanıcılarımızın güvenle ve kolaylıkla alım-satım yapabilmeleri için en iyi platform deneyimini sunmak.
          </p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 p-4">
          <h3 className="font-medium text-purple-900 dark:text-purple-100 mb-2">Vizyonumuz</h3>
          <p className="text-sm text-purple-700 dark:text-purple-300">
            Türkiye\'nin en güvenilir ve kullanıcı dostu ilan platformu olmak.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          © 2024 {appInfo.name}. Tüm hakları saklıdır.
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Güvenle al, güvenle sat
        </p>
      </div>
    </motion.div>
  );
};

export default AboutPage; 