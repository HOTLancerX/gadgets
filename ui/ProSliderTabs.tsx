'use client';

/**
 * cms/plugin/gadgets/ui/ProSliderTabs.tsx
 *
 * Horizontal scrollable product tabs component for Pro-Slider.
 * Displays product thumbnail, title, and status badge with active highlight.
 */

import React from 'react';
import type { ProSliderProductData } from '../types';

interface ProSliderTabsProps {
  products: ProSliderProductData[];
  activeTabIdx: number;
  onSelectTab: (index: number) => void;
}

export default function ProSliderTabs({
  products,
  activeTabIdx,
  onSelectTab,
}: ProSliderTabsProps) {
  if (!products || products.length === 0) return null;

  return (
    <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto no-scrollbar pb-6 pt-2 scroll-smooth">
      {products.map((prod, idx) => {
        const isActive = activeTabIdx === idx;
        const isComingSoon = prod.badge?.toLowerCase().includes('coming');

        return (
          <button
            key={prod.productId || idx}
            type="button"
            onClick={() => onSelectTab(idx)}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 shrink-0 text-left cursor-pointer border ${
              isActive
                ? 'bg-white border-gray-400 shadow-sm ring-1 ring-gray-400/20'
                : 'bg-gray-100 hover:bg-gray-200/80 border-transparent text-gray-700'
            }`}
          >
            {/* Product Thumbnail */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg overflow-hidden bg-white/70 p-0.5 shrink-0 flex items-center justify-center">
              {prod.thumbnail || prod.mainImage ? (
                <img
                  src={prod.thumbnail || prod.mainImage}
                  alt={prod.title}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center text-[10px] text-gray-400 font-bold">
                  {prod.title?.charAt(0) || 'P'}
                </div>
              )}
            </div>

            {/* Title & Badge */}
            <div className="min-w-0 pr-1">
              <p className="text-xs md:text-[13px] font-bold text-gray-900 truncate max-w-35 md:max-w-44 leading-tight">
                {prod.title}
              </p>
              <p
                className={`text-[11px] font-medium leading-tight mt-0.5 ${
                  isComingSoon ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                {prod.badge || 'New'}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
