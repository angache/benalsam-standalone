import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NotFoundPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="min-h-[calc(100vh-150px)] flex flex-col items-center justify-center text-center px-4"
    >
      <motion.div
        animate={{ rotate: [0, 10, -10, 10, -10, 0], scale: [1, 1.1, 1, 1.1, 1] }}
        transition={{ duration: 1, repeat: Infinity, repeatType: 'mirror', delay: 0.5 }}
      >
        <AlertTriangle className="w-32 h-32 text-orange-400 mb-8" />
      </motion.div>
      
      <h1 className="text-6xl font-bold text-gradient mb-4">404</h1>
      <h2 className="text-3xl font-semibold text-white mb-6">Sayfa Bulunamadı</h2>
      <p className="text-slate-400 text-lg mb-8 max-w-md">
        Oops! Aradığınız sayfa mevcut değil gibi görünüyor. Belki de yanlış bir yola saptınız.
      </p>
      
      <Link to="/">
        <Button size="lg" className="btn-primary text-white font-semibold px-8 py-4 text-lg">
          <Home className="w-5 h-5 mr-3" />
          Ana Sayfaya Dön
        </Button>
      </Link>
    </motion.div>
  );
};

export default NotFoundPage;