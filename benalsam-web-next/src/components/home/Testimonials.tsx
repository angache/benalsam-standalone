/**
 * Testimonials Component
 * User reviews and social proof
 */

'use client'

import { Star, Quote } from 'lucide-react'
import { motion } from 'framer-motion'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const TESTIMONIALS = [
  {
    name: 'Ahmet Y.',
    role: 'İzmir',
    text: 'iPhone 15 arıyordum, ilan verdim. 2 saat içinde 12 teklif geldi, en uygununu seçtim!',
    rating: 5,
    avatar: 'AY',
  },
  {
    name: 'Elif K.',
    role: 'Ankara',
    text: 'Kiralık ev ilanı verdim, 15 dakika içinde 5 ev sahibi mesaj attı. Çok pratik!',
    rating: 5,
    avatar: 'EK',
  },
  {
    name: 'Mehmet B.',
    role: 'İstanbul',
    text: 'Araba arıyordum, galeriler bana teklif verdi. Fiyatları karşılaştırıp en iyisini aldım.',
    rating: 5,
    avatar: 'MB',
  },
]

export default function Testimonials() {
  return (
    <section className="bg-muted/30 py-16">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Kullanıcılarımız Ne Diyor?</h2>
          <p className="text-muted-foreground text-lg">
            Binlerce mutlu kullanıcımızdan bazıları
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-card border rounded-lg p-6 relative"
            >
              <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/20" />
              
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Text */}
              <p className="text-muted-foreground mb-6 italic">
                "{testimonial.text}"
              </p>

              {/* User */}
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {testimonial.avatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

