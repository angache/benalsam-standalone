'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Mail, 
  Phone, 
  MapPin,
  Heart
} from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg" style={{backgroundColor: 'var(--secondary)'}}>
                <span className="text-white font-bold text-sm flex items-center justify-center h-full">B</span>
              </div>
              <span className="text-xl font-bold" style={{color: 'var(--secondary)'}}>
                Benalsam
              </span>
            </div>
            <p className="text-muted-foreground text-sm">
              Türkiye'nin en güvenilir alım-satım platformu. 
              Binlerce ilan arasından ihtiyacınıza uygun olanı bulun.
            </p>
            <div className="flex gap-2">
              <Button size="icon" variant="outline" className="h-8 w-8">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" className="h-8 w-8">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" className="h-8 w-8">
                <Instagram className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold">Hızlı Linkler</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Ana Sayfa</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Kategoriler</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">İlan Ver</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Arama</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Favoriler</a></li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="font-semibold">Destek</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Yardım Merkezi</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">İletişim</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Güvenlik</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Gizlilik Politikası</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Kullanım Şartları</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h3 className="font-semibold">Bülten</h3>
            <p className="text-muted-foreground text-sm">
              Yeni ilanlar ve özel fırsatlardan haberdar olun.
            </p>
            <div className="space-y-2">
              <Input 
                placeholder="E-posta adresiniz" 
                className="h-9"
              />
              <Button className="w-full text-white" 
                style={{backgroundColor: 'var(--primary)'}}
                onMouseEnter={(e) => {e.currentTarget.style.backgroundColor = 'var(--primary-hover)'}}
                onMouseLeave={(e) => {e.currentTarget.style.backgroundColor = 'var(--primary)'}}
              >
                Abone Ol
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2025 BenAlsam. Tüm hakları saklıdır.
          </p>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span>Made with</span>
            <Heart className="h-4 w-4 text-red-500 fill-red-500" />
            <span>in Turkey</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
