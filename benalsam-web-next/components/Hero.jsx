'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Plus, TrendingUp, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Hero = ({ onCreateClick, onDiscoverClick }) => {
  return (
    <section className="relative py-8 sm:py-12 md:py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="hero-gradient absolute inset-0"></div>
      <div className="pattern-grid absolute inset-0 opacity-20"></div>
      
              <div className="mx-auto w-full max-w-[1600px] 2xl:max-w-[1920px] px-1 sm:px-2 lg:px-4 xl:px-6 relative z-10">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-6 sm:mb-8 lg:mb-10"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 sm:mb-4 lg:mb-5 leading-tight">
              İhtiyacın Olan
              <span className="text-gradient block mt-1 sm:mt-2">Her Şeyi Bul</span>
            </h1>
            <p className="text-base md:text-lg lg:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Aradığın ürün veya hizmet için ilan ver, teklifler al. 
              <span className="text-orange-400 font-semibold block sm:inline mt-1 sm:mt-0"> Türkiye'nin en büyük alım ilanları platformu!</span>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-12 lg:mb-16"
          >
            <Button
              onClick={onCreateClick}
              size="lg"
              className="btn-primary text-white font-semibold px-6 lg:px-8 py-3 lg:py-4 text-base lg:text-lg animate-pulse-glow w-full sm:w-auto"
            >
              <Plus className="w-5 h-5 lg:w-6 lg:h-6 mr-2 sm:mr-3" />
              Hemen İlan Ver
            </Button>
            <Button
              onClick={onDiscoverClick}
              variant="outline"
              size="lg"
              className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10 px-6 lg:px-8 py-3 lg:py-4 text-base lg:text-lg w-full sm:w-auto"
            >
              <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 mr-2 sm:mr-3" />
              İlanları Keşfet
            </Button>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="glass-effect rounded-xl lg:rounded-2xl p-4 lg:p-6 card-hover animate-float"
              style={{ animationDelay: '0s' }}
            >
              <div className="w-10 h-10 lg:w-12 lg:h-12 gradient-orange rounded-lg lg:rounded-xl flex items-center justify-center mb-3 lg:mb-4 mx-auto">
                <Zap className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-1 sm:mb-2">Hızlı & Kolay</h3>
              <p className="text-slate-400 text-sm">
                Dakikalar içinde ilan oluştur, anında teklifler almaya başla
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="glass-effect rounded-xl lg:rounded-2xl p-4 lg:p-6 card-hover animate-float"
              style={{ animationDelay: '2s' }}
            >
              <div className="w-10 h-10 lg:w-12 lg:h-12 gradient-orange rounded-lg lg:rounded-xl flex items-center justify-center mb-3 lg:mb-4 mx-auto">
                <Users className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-1 sm:mb-2">Güvenilir Topluluk</h3>
              <p className="text-slate-400 text-sm">
                Binlerce doğrulanmış kullanıcı ile güvenli alışveriş yap
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="glass-effect rounded-xl lg:rounded-2xl p-4 lg:p-6 card-hover animate-float"
              style={{ animationDelay: '4s' }}
            >
              <div className="w-10 h-10 lg:w-12 lg:h-12 gradient-orange rounded-lg lg:rounded-xl flex items-center justify-center mb-3 lg:mb-4 mx-auto">
                <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-1 sm:mb-2">En İyi Fiyatlar</h3>
              <p className="text-slate-400 text-sm">
                Rekabetçi teklifler al, bütçene uygun seçenekleri keşfet
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;