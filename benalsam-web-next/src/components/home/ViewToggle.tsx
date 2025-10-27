'use client';

import { Grid3x3, List, Grid2x2, LayoutGrid } from 'lucide-react';

export type ViewType = 'grid-2' | 'grid-3' | 'grid-4' | 'list';

interface ViewToggleProps {
  view: ViewType;
  onViewChange: (view: ViewType) => void;
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      {/* 2 Column Grid */}
      <button
        onClick={() => onViewChange('grid-2')}
        className={`
          p-2 rounded-md transition-all duration-200
          ${view === 'grid-2' 
            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm scale-105' 
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
          }
        `}
        title="2 Sütun"
      >
        <Grid2x2 className="w-4 h-4" />
      </button>

      {/* 3 Column Grid */}
      <button
        onClick={() => onViewChange('grid-3')}
        className={`
          p-2 rounded-md transition-all duration-200
          ${view === 'grid-3' 
            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm scale-105' 
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
          }
        `}
        title="3 Sütun"
      >
        <Grid3x3 className="w-4 h-4" />
      </button>

      {/* 4 Column Grid */}
      <button
        onClick={() => onViewChange('grid-4')}
        className={`
          p-2 rounded-md transition-all duration-200
          ${view === 'grid-4' 
            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm scale-105' 
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
          }
        `}
        title="4 Sütun"
      >
        <LayoutGrid className="w-4 h-4" />
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

      {/* List View */}
      <button
        onClick={() => onViewChange('list')}
        className={`
          p-2 rounded-md transition-all duration-200
          ${view === 'list' 
            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm scale-105' 
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
          }
        `}
        title="Liste Görünümü"
      >
        <List className="w-4 h-4" />
      </button>
    </div>
  );
}

