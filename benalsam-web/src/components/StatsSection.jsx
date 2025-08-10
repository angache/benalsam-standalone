import React from 'react';
import { motion } from 'framer-motion';
import { Users, ShoppingBag, TrendingUp, Zap } from 'lucide-react';

const stats = [
  {
    icon: Users,
    value: '50K+',
    label: 'Aktif Kullanıcı',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: ShoppingBag,
    value: '125K+',
    label: 'Toplam İlan',
    color: 'from-green-500 to-emerald-500'
  },
  {
    icon: TrendingUp,
    value: '89%',
    label: 'Başarı Oranı',
    color: 'from-orange-500 to-amber-500'
  },
  {
    icon: Zap,
    value: '24/7',
    label: 'Destek',
    color: 'from-purple-500 to-violet-500'
  }
];

const StatsSection = () => {
  return (
    <section className="py-8 sm:py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="glass-effect rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 text-center card-hover"
              >
                <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg lg:rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-2 sm:mb-3 lg:mb-4 mx-auto`}>
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gradient mb-1 sm:mb-2">
                  {stat.value}
                </div>
                <div className="text-slate-400 text-xs sm:text-sm font-medium">
                  {stat.label}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;