import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, ArrowUpRightSquare, Twitter, Facebook, Instagram, Linkedin } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import AdBanner from '@/components/AdBanner';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: "BenAlsam Hakkında",
      content: "BenAlsam, kullanıcıların ikinci el eşyalarını ve hizmetlerini güvenle takas edebilecekleri, topluluk odaklı bir platformdur. Amacımız, sürdürülebilir tüketimi teşvik etmek ve insanları bir araya getirmektir.",
    },
    {
      title: "İletişim",
      links: [
        { text: "destek@benalsam.com", icon: <Mail className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-primary" />, href: "mailto:destek@benalsam.com" },
        { text: "+90 (555) 123 4567", icon: <Phone className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-primary" />, href: "tel:+905551234567" },
        { text: "Takas Sokak, No:1, İstanbul", icon: <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-primary" />, href: "#" },
      ],
    },
    {
      title: "Faydalı Linkler",
      links: [
        { text: "Ana Sayfa", href: "/" },
        { text: "Envanterim", href: "/envanterim" },
        { text: "Profilim", href: "/profil/me" }, 
        { text: "Gönderdiğim Teklifler", href: "/gonderdigim-teklifler" },
        { text: "Aldığım Teklifler", href: "/aldigim-teklifler" },
      ],
    },
     {
      title: "Bizi Takip Edin",
      social: [
        { icon: <Twitter className="w-4 h-4 sm:w-5 sm:h-5 hover:text-primary transition-colors" />, href: "#", name: "Twitter" },
        { icon: <Facebook className="w-4 h-4 sm:w-5 sm:h-5 hover:text-primary transition-colors" />, href: "#", name: "Facebook" },
        { icon: <Instagram className="w-4 h-4 sm:w-5 sm:h-5 hover:text-primary transition-colors" />, href: "#", name: "Instagram" },
        { icon: <Linkedin className="w-4 h-4 sm:w-5 sm:h-5 hover:text-primary transition-colors" />, href: "#", name: "LinkedIn" },
      ],
    }
  ];

  return (
    <footer className="bg-card text-card-foreground border-t border-border/50 mt-8 sm:mt-12 lg:mt-16">
      <div className="mx-auto w-full max-w-[1600px] 2xl:max-w-[1920px] px-1 sm:px-2 lg:px-4 xl:px-6 pt-8 sm:pt-12">
        <AdBanner placement="footer_banner" />
      </div>
      <div className="mx-auto w-full max-w-[1600px] 2xl:max-w-[1920px] px-1 sm:px-2 lg:px-4 xl:px-6 pt-8 sm:pt-12 pb-6 sm:pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {footerSections.map((section) => (
            <div key={section.title}>
              <p className="font-semibold text-base sm:text-lg text-foreground mb-3 sm:mb-4">{section.title}</p>
              {section.content && <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{section.content}</p>}
              {section.links && (
                <ul className="space-y-1 sm:space-y-2">
                  {section.links.map((link) => (
                    <li key={link.text}>
                      <Link
                        to={link.href}
                        className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors flex items-center"
                      >
                        {link.icon}
                        <span>{link.text}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {section.social && (
                <div className="flex space-x-3 sm:space-x-4 mt-1">
                    {section.social.map((socialLink) => (
                        <a 
                            key={socialLink.name} 
                            href={socialLink.href} 
                            aria-label={socialLink.name}
                            className="text-muted-foreground hover:text-primary transition-colors"
                            onClick={(e) => {
                              e.preventDefault();
                              toast({ title: "🚧 Çok Yakında!", description: `${socialLink.name} sayfamız henüz hazır değil.`});
                            }}
                        >
                           {socialLink.icon}
                        </a>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="border-t border-border/50 mt-6 sm:mt-8 lg:mt-10 pt-6 sm:pt-8 text-center">
          <p className="text-xs sm:text-sm text-muted-foreground">
            &copy; {currentYear} BenAlsam. Tüm hakları saklıdır.
            <Link to="/" className="ml-2 text-primary hover:underline flex items-center justify-center mt-1">
              <ArrowUpRightSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> BenAlsam Projesi
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;