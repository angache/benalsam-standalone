/**
 * AppDownloadBanner Component
 * Promote mobile app with QR code and download buttons
 */

'use client'

import { Smartphone, QrCode, Apple, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

export default function AppDownloadBanner() {
  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl overflow-hidden relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 p-8 md:p-12">
          {/* Left Side - Content */}
          <div className="text-white space-y-6">
            <div className="inline-block p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Smartphone className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-3">
                Mobil Uygulamayı İndir
              </h2>
              <p className="text-white/90 text-lg">
                Her yerden ilan ver, teklifleri anında gör. İlk kullanımda özel fırsatlar seni bekliyor!
              </p>
            </div>

            {/* Features */}
            <ul className="space-y-3">
              {[
                '✨ Anında bildirimler',
                '📱 Kolay ilan oluşturma',
                '💬 Hızlı mesajlaşma',
                '🎁 İlk ilanına özel bonus',
              ].map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-white/90">
                  {feature}
                </li>
              ))}
            </ul>

            {/* Download Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                className="bg-black hover:bg-black/90 text-white gap-2"
                onClick={() => window.open('https://apps.apple.com', '_blank')}
              >
                <Apple className="w-5 h-5" />
                <div className="text-left">
                  <div className="text-[10px]">Download on the</div>
                  <div className="text-sm font-semibold">App Store</div>
                </div>
              </Button>

              <Button
                size="lg"
                className="bg-black hover:bg-black/90 text-white gap-2"
                onClick={() => window.open('https://play.google.com', '_blank')}
              >
                <Play className="w-5 h-5 fill-current" />
                <div className="text-left">
                  <div className="text-[10px]">GET IT ON</div>
                  <div className="text-sm font-semibold">Google Play</div>
                </div>
              </Button>
            </div>
          </div>

          {/* Right Side - QR Code & Phone Mockup */}
          <div className="flex items-center justify-center">
            <div className="relative">
              {/* QR Code */}
              <div className="bg-white p-6 rounded-2xl shadow-2xl">
                <div className="flex flex-col items-center gap-3">
                  <QrCode className="w-32 h-32 text-gray-800" />
                  <p className="text-sm text-gray-600 text-center">
                    Kameranı tut ve<br />hemen indir!
                  </p>
                </div>
              </div>

              {/* Phone Mockup (Optional) */}
              <div className="hidden lg:block absolute -right-24 top-1/2 -translate-y-1/2">
                <div className="w-48 h-96 bg-white/10 backdrop-blur-sm rounded-3xl border-4 border-white/30 p-2">
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
                    <Smartphone className="w-16 h-16 text-white/50" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

