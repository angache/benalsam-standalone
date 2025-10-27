'use client';

import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { Clock, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export function RecentlyViewed() {
  const { items, clearAll } = useRecentlyViewed();

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="py-8 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Son Görüntülenenler</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Daha önce baktığınız ilanlar
              </p>
            </div>
          </div>
          
          <button
            onClick={clearAll}
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <X className="w-4 h-4" />
            Temizle
          </button>
        </div>

        {/* Horizontal Scroll */}
        <div className="overflow-x-auto pb-4 -mx-4 px-4">
          <div className="flex gap-4 min-w-max">
            {items.slice(0, 10).map((item) => (
              <Link
                key={item.id}
                href={`/ilan/${item.id}`}
                className="group flex-shrink-0 w-48 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-all overflow-hidden"
              >
                {/* Image */}
                <div className="relative h-32 bg-gray-100 dark:bg-gray-800">
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="192px"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      Resim yok
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-3">
                  <h3 className="text-sm font-semibold line-clamp-2 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {item.price.toLocaleString('tr-TR')} ₺
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

