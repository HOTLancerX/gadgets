'use client';

/**
 * cms/plugin/gadgets/ui/ProSliderVariants.tsx
 *
 * Variant / Color pill switcher component for Pro-Slider.
 * Inspired by cms/plugin/product/product/Variant.tsx.
 * Supports image thumbnails, color swatches, and pill labels.
 */

import React from 'react';
import type { ProSliderVariant } from '../types';

interface ProSliderVariantsProps {
  variants: ProSliderVariant[];
  activeVariantIdx: number;
  onSelectVariant: (index: number) => void;
  accentColor?: string;
}

export default function ProSliderVariants({
  variants,
  activeVariantIdx,
  onSelectVariant,
  accentColor = '#0053e2',
}: ProSliderVariantsProps) {
  if (!variants || variants.length === 0) return null;

  return (
    <div className="pt-2">
      <div className="flex flex-wrap items-center gap-2.5">
        {variants.map((v, vIdx) => {
          const isSelected = activeVariantIdx === vIdx;

          return (
            <button
              key={`${v.sku || v.name || 'variant'}_${vIdx}`}
              type="button"
              onClick={() => onSelectVariant(vIdx)}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full transition-all duration-150 cursor-pointer ${
                isSelected
                  ? 'border-2 bg-white shadow-xs'
                  : 'border border-gray-200 bg-white hover:border-gray-400 text-gray-700'
              }`}
              style={{
                borderColor: isSelected ? accentColor : undefined,
              }}
              aria-pressed={isSelected}
              aria-label={`Select variant ${v.name}`}
            >
              {/* Variant Swatch: Image or Color circle */}
              {v.image ? (
                <div className="w-5 h-5 rounded overflow-hidden shrink-0 bg-gray-50 flex items-center justify-center">
                  <img
                    src={v.image}
                    alt={v.name}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                </div>
              ) : v.color ? (
                <span
                  className="w-3.5 h-3.5 rounded-full border border-gray-300 shrink-0 shadow-2xs"
                  style={{ backgroundColor: v.color }}
                />
              ) : null}

              <span
                className={`text-xs font-semibold ${
                  isSelected ? 'text-gray-950 font-bold' : 'text-gray-800'
                }`}
              >
                {v.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
