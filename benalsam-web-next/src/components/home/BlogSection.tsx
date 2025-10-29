/**
 * BlogSection Component
 * Latest blog posts and tips
 */

'use client'

import { BookOpen, ArrowRight, Calendar, Clock, TrendingUp, Shield, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { motion } from 'framer-motion'

const BLOG_POSTS = [
  {
    title: '2025 İlan Verme Trendleri',
    excerpt: 'Yeni yılda ilan verirken dikkat etmeniz gereken 10 önemli nokta...',
    category: 'İpuçları',
    date: '15 Ocak 2025',
    readTime: '5 dk',
    icon: TrendingUp,
    iconColor: 'text-blue-600',
    bgColor: 'from-blue-500/20 to-cyan-500/20',
  },
  {
    title: 'Güvenli İşlem Yapmanın Yolları',
    excerpt: 'Online alışverişte kendinizi nasıl korursunuz? İşte püf noktalar...',
    category: 'Güvenlik',
    date: '12 Ocak 2025',
    readTime: '7 dk',
    icon: Shield,
    iconColor: 'text-green-600',
    bgColor: 'from-green-500/20 to-emerald-500/20',
  },
  {
    title: 'İlanınızı Nasıl Öne Çıkarırsınız?',
    excerpt: 'Profesyonel fotoğraf çekimi ve açıklama yazma teknikleri...',
    category: 'Rehber',
    date: '10 Ocak 2025',
    readTime: '4 dk',
    icon: Camera,
    iconColor: 'text-purple-600',
    bgColor: 'from-purple-500/20 to-pink-500/20',
  },
]

export default function BlogSection() {
  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <BookOpen className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h2 className="text-3xl font-bold">Blog & İpuçları</h2>
            <p className="text-muted-foreground">Size yardımcı olacak rehberler</p>
          </div>
        </div>
        <Link href="/blog">
          <Button variant="outline" className="gap-2">
            Tümünü Gör
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* Blog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {BLOG_POSTS.map((post, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
          >
            <Link href={`/blog/${index + 1}`}>
              <div className="bg-card border rounded-xl overflow-hidden hover:shadow-lg transition-all group cursor-pointer h-full">
                {/* Image/Icon */}
                <div className={`bg-gradient-to-br ${post.bgColor} h-48 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <post.icon className={`w-24 h-24 ${post.iconColor}`} />
                </div>

                {/* Content */}
                <div className="p-6 space-y-3">
                  {/* Category & Meta */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="px-2 py-1 bg-amber-500/10 text-amber-700 rounded-full font-medium">
                      {post.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {post.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.readTime}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {post.excerpt}
                  </p>

                  {/* Read More */}
                  <div className="flex items-center gap-2 text-sm font-medium text-primary pt-2">
                    Devamını Oku
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

