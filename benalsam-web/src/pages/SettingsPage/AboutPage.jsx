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
  MapPin,
  Star,
  TrendingUp,
  Clock,
  Target
} from 'lucide-react';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';

const AboutPage = () => {
  const navigate = useNavigate();
  const { triggerHaptic } = useHapticFeedback();

  const handleGoBack = () => {
    navigate('/ayarlar');
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

  const renderFeatureCard = (feature, index) => {
    const IconComponent = feature.icon;

    return (
      <motion.div
        key={feature.title}
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
              <div>
                <h3 className="font-medium text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const renderTeamCard = (team, index) => {
    const IconComponent = team.icon;

    return (
      <motion.div
        key={team.name}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
      >
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <IconComponent size={20} className="text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">{team.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{team.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const renderContactCard = (contact, index) => {
    const IconComponent = contact.icon;

    return (
      <motion.div
        key={contact.title}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
      >
        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <IconComponent size={20} className="text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground">{contact.title}</h3>
                {contact.link ? (
                  <Button
                    variant="link"
                    className="p-0 h-auto text-primary hover:underline text-sm flex items-center"
                    onClick={() => window.open(contact.link, contact.link.startsWith('http') ? '_blank' : undefined)}
                  >
                    {contact.value}
                    <ExternalLink size={14} className="ml-1" />
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">{contact.value}</p>
                )}
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
          <h1 className="text-xl font-semibold text-foreground">Hakkında</h1>
        </div>

        <div className="w-10" /> {/* Spacer for centering */}
      </motion.div>

      {/* App Info */}
      <motion.div 
        className="text-center py-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
        >
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart size={40} className="text-primary" />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-foreground mb-2">{appInfo.name}</h2>
          <p className="text-lg text-muted-foreground mb-1">{appInfo.description}</p>
          <p className="text-sm text-muted-foreground mb-4">{appInfo.tagline}</p>
          <Badge variant="secondary" className="text-primary border-primary/20">
            v{appInfo.version}
          </Badge>
        </motion.div>
      </motion.div>

      {/* Info Card */}
      {renderInfoCard(
        'Platform Hakkında',
        'BenAlsam, kullanıcıların güvenle alım-satım yapabilmeleri için tasarlanmış modern bir platformdur.',
        <Info size={20} className="text-blue-600 dark:text-blue-400" />
      )}

      {/* Features */}
      <motion.div 
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h2 className="text-lg font-semibold text-foreground flex items-center">
          <Star className="w-5 h-5 mr-2 text-primary" />
          Özelliklerimiz
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature, index) => renderFeatureCard(feature, index))}
        </div>
      </motion.div>

      {/* Team */}
      <motion.div 
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h2 className="text-lg font-semibold text-foreground flex items-center">
          <Users className="w-5 h-5 mr-2 text-primary" />
          Ekibimiz
        </h2>
        <div className="space-y-3">
          {teamInfo.map((team, index) => renderTeamCard(team, index))}
        </div>
      </motion.div>

      {/* Contact */}
      <motion.div 
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <h2 className="text-lg font-semibold text-foreground flex items-center">
          <Mail className="w-5 h-5 mr-2 text-primary" />
          İletişim
        </h2>
        <div className="space-y-3">
          {contactInfo.map((contact, index) => renderContactCard(contact, index))}
        </div>
      </motion.div>

      {/* Statistics */}
      <motion.div 
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <motion.div 
          className="text-center"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">10K+</div>
              <div className="text-sm text-muted-foreground">Aktif Kullanıcı</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div 
          className="text-center"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">50K+</div>
              <div className="text-sm text-muted-foreground">Başarılı İşlem</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div 
          className="text-center"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">99%</div>
              <div className="text-sm text-muted-foreground">Müşteri Memnuniyeti</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div 
          className="text-center"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">24/7</div>
              <div className="text-sm text-muted-foreground">Destek</div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Mission & Vision */}
      <motion.div 
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <Card className="border-0 shadow-sm bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
                  <Target size={20} className="text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-medium text-green-900 dark:text-green-100 mb-2">Misyonumuz</h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Kullanıcılarımızın güvenle ve kolaylıkla alım-satım yapabilmeleri için en iyi platform deneyimini sunmak.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          <Card className="border-0 shadow-sm bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg">
                  <TrendingUp size={20} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-medium text-purple-900 dark:text-purple-100 mb-2">Vizyonumuz</h3>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    Türkiye\'nin en güvenilir ve kullanıcı dostu ilan platformu olmak.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Footer */}
      <motion.div 
        className="text-center py-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.0 }}
      >
        <Separator className="mb-4" />
        <p className="text-sm text-muted-foreground">
          © 2024 {appInfo.name}. Tüm hakları saklıdır.
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Güvenle al, güvenle sat
        </p>
      </motion.div>
    </motion.div>
  );
};

export default AboutPage; 