'use client';

/**
 * cms/plugin/gadgets/ui/ProSliderClient.tsx
 *
 * Interactive Client Component for Gadgets Pro-Slider.
 * Manages active tab index, variant switching, and coordinates
 * ProSliderTabs and ProSliderShowcase.
 */

import React, { useState, useEffect } from 'react';
import type { ProSliderProductData } from '../types';
import ProSliderTabs from './ProSliderTabs';
import ProSliderShowcase from './ProSliderShowcase';
import useSettings from '@/lib/useSettings';

export const FALLBACK_PRO_PRODUCTS: ProSliderProductData[] = [
  {
    productId: 'demo-iphone-duo',
    title: 'iPhone Duo 256GB',
    slug: 'iphone-duo-256gb',
    postUrl: '/product/iphone-duo-256gb',
    thumbnail: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=200&auto=format&fit=crop&q=80',
    mainImage: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80',
    badge: 'Coming Soon',
    highlightTitle: 'Dual Display Innovation',
    subtitle: 'The future of mobile multitasking',
    price: 189999,
    stockStatus: 'Pre-order',
    variants: [
      {
        name: 'Silver',
        color: '#e2e8f0',
        image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80',
      },
      {
        name: 'Space Black',
        color: '#1e293b',
        image: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&auto=format&fit=crop&q=80',
      },
    ],
  },
  {
    productId: 'demo-iphone-18-pro-max',
    title: 'iPhone 18 Pro Max',
    slug: 'iphone-18-pro-max',
    postUrl: '/product/iphone-18-pro-max',
    thumbnail: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=200&auto=format&fit=crop&q=80',
    mainImage: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80',
    badge: 'New',
    highlightTitle: 'A19 Pro Bionic Chip',
    subtitle: 'Extreme performance & ray tracing',
    price: 194999,
    stockStatus: 'In stock',
    variants: [
      {
        name: 'Deep Crimson',
        color: '#5b1d24',
        image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80',
      },
      {
        name: 'Titanium Black',
        color: '#27272a',
        image: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&auto=format&fit=crop&q=80',
      },
    ],
  },
  {
    productId: 'demo-redmi-note-17-pro-max',
    title: 'Redmi Note 17 Pro Max 5G',
    slug: 'redmi-note-17-pro-max-5g',
    postUrl: '/product/redmi-note-17-pro-max-5g',
    thumbnail: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200&auto=format&fit=crop&q=80',
    mainImage: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80',
    badge: 'New',
    highlightTitle: '10000mAh battery',
    subtitle: 'Titan power, go max',
    price: 61499,
    stockStatus: 'In stock',
    variants: [
      {
        name: 'Black',
        color: '#1e293b',
        image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80',
      },
      {
        name: 'Green',
        color: '#065f46',
        image: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800&auto=format&fit=crop&q=80',
      },
      {
        name: 'Cloud Blush',
        color: '#fce7f3',
        image: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&auto=format&fit=crop&q=80',
      },
    ],
  },
];

export interface ProSliderClientProps {
  products?: ProSliderProductData[];
  accentColor?: string;
  ctaText?: string;
  currencySymbol?: string;
  tabsPosition?: 'top' | 'bottom';
  margin?: any;
  padding?: any;
}

export default function ProSliderClient({
  products,
  accentColor = '#0053e2',
  ctaText = 'Explore product',
  currencySymbol: initialCurrency,
  tabsPosition = 'top',
  margin,
  padding,
}: ProSliderClientProps) {
  const { settings } = useSettings();

  const activeProducts =
    Array.isArray(products) && products.length > 0
      ? products
      : FALLBACK_PRO_PRODUCTS;

  const [activeTabIdx, setActiveTabIdx] = useState<number>(0);
  const [activeVariantIdx, setActiveVariantIdx] = useState<number>(0);

  // Reset active variant when tab changes
  useEffect(() => {
    setActiveVariantIdx(0);
  }, [activeTabIdx]);

  const currencySymbol =
    (settings?.product_currency_symbol ||
      settings?.currency_symbol ||
      initialCurrency ||
      'KSh') as string;

  const activeProduct = activeProducts[activeTabIdx] || activeProducts[0];

  const tabsComponent = (
    <ProSliderTabs
      products={activeProducts}
      activeTabIdx={activeTabIdx}
      onSelectTab={setActiveTabIdx}
    />
  );

  return (
    <div
      className="w-full font-sans select-none"
      style={{
        margin: typeof margin === 'string' ? margin : undefined,
        padding: typeof padding === 'string' ? padding : undefined,
      }}
    >
      <div>
        {/* Render Tabs on Top */}
        {tabsPosition === 'top' && tabsComponent}

        {/* ─── Active Product Showcase ─── */}
        <ProSliderShowcase
          product={activeProduct}
          activeVariantIdx={activeVariantIdx}
          onSelectVariant={setActiveVariantIdx}
          accentColor={accentColor}
          ctaText={ctaText}
          currencySymbol={currencySymbol}
        />

        {/* Render Tabs at Bottom */}
        {tabsPosition === 'bottom' && (
          <div className="pt-8 md:pt-12">
            {tabsComponent}
          </div>
        )}
      </div>
    </div>
  );
}
