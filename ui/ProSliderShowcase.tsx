'use client';

/**
 * cms/plugin/gadgets/ui/ProSliderShowcase.tsx
 *
 * 2-Column Product Showcase Stage for Pro-Slider.
 * Left: Large interactive product image (updates on variant selection).
 * Right: Status badge, Title, Hero Highlight, Tagline, Variant Selector, Price, and CTA.
 */

import React from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import type { ProSliderProductData } from '../types';
import ProSliderVariants from './ProSliderVariants';

interface ProSliderShowcaseProps {
  product: ProSliderProductData;
  activeVariantIdx: number;
  onSelectVariant: (index: number) => void;
  accentColor?: string;
  ctaText?: string;
  currencySymbol?: string;
}

export default function ProSliderShowcase({
  product,
  activeVariantIdx,
  onSelectVariant,
  accentColor = '#0053e2',
  ctaText = 'Explore product',
  currencySymbol = 'KSh',
}: ProSliderShowcaseProps) {
  if (!product) return null;

  // Determine active display image: active variant image if available, else product main image
  const activeVariant = product.variants?.[activeVariantIdx];
  const currentImage = activeVariant?.image || product.mainImage || product.thumbnail || '';

  // Determine active price: variant price if available, else product price
  const displayPrice =
    activeVariant?.price !== undefined && activeVariant.price > 0
      ? activeVariant.price
      : product.price;

  const formattedPrice =
    typeof displayPrice === 'number'
      ? Number(displayPrice).toLocaleString('en-US')
      : displayPrice || '0';

  const productUrl = product.postUrl || `/product/${product.slug}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-6 md:items-center">
      {/* ─── Left Column: Large Interactive Product Image ─── */}
      <div className="flex items-center justify-center relative">
        <div className="w-full flex items-center justify-center">
          {currentImage ? (
            <img
              key={currentImage}
              src={currentImage}
              alt={product.title}
              className="max-h-115 w-auto object-contain transition-all duration-300 hover:scale-102 mix-blend-multiply brightness-105 select-none pointer-events-none"
              draggable={false}
              loading="lazy"
            />
          ) : (
            <div className="w-64 h-64 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400">
              <Icon icon="solar:devices-bold-duotone" width={64} />
            </div>
          )}
        </div>
      </div>

      {/* ─── Right Column: Details & Actions ─── */}
      <div className="space-y-8 text-left">
        
        {/* Status Badge (e.g. "• New", "• Coming Soon") */}
        <div>
          <div
            className="flex items-center gap-1.5 text-xs font-bold mb-2"
            style={{ color: accentColor }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: accentColor }}
            />
            <span>{product.badge || 'New'}</span>
          </div>

          {/* Product Full Title */}
          <h3 className="text-2xl md:text-3xl font-bold text-gray-950 tracking-tight leading-tight">
            {product.title}
          </h3>
        </div>

        {/* Hero Feature Highlight Headline
        {product.highlightTitle && (
          <div
            className="text-gray-800 description pb-6"
            dangerouslySetInnerHTML={{ __html: product.highlightTitle }}
          />
        )}
        */}

        {/* Subtitle / Tagline */}
        {product.subtitle && (
          <p className="text-sm md:text-base text-gray-500 font-medium">
            {product.subtitle}
          </p>
        )}

        {/* Color / Variant Switcher Pills */}
        {product.variants && product.variants.length > 0 && (
          <ProSliderVariants
            variants={product.variants}
            activeVariantIdx={activeVariantIdx}
            onSelectVariant={onSelectVariant}
            accentColor={accentColor}
          />
        )}

        {/* Price & Stock Status */}
        <div className="flex items-baseline gap-2">
          <span className="text-lg md:text-xl font-bold text-gray-950">
            {currencySymbol} {formattedPrice}
          </span>
          {product.stockStatus && (
            <span className="text-xs text-gray-500 font-medium ml-3 px-2 py-0.5 bg-gray-100 rounded-full">
              {product.stockStatus}
            </span>
          )}
        </div>

        {/* Explore Product CTA Button */}
        <div>
          <Link
            href={productUrl}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-white text-sm md:text-base font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            style={{ backgroundColor: accentColor }}
          >
            <span>{ctaText}</span>
            <Icon icon="solar:arrow-right-up-linear" width={18} height={18} />
          </Link>
        </div>

      </div>

    </div>
  );
}
