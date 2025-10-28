'use client';

import { X } from 'lucide-react';

interface ActiveFilterBadgeProps {
  count: number;
  onClear: () => void;
}

export function ActiveFilterBadge({ count, onClear }: ActiveFilterBadgeProps) {
  if (count === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg animate-fadeIn animate-scaleIn">
      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
        <span className="inline-block animate-pulse">{count}</span> filtre aktif
      </span>
      <button
        onClick={onClear}
        className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-full transition-all duration-200 hover:scale-110 hover:rotate-90"
        aria-label="Clear filters"
      >
        <X className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      </button>
    </div>
  );
}

