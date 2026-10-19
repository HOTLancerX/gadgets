'use client';

/**
 * cms/plugin/gadgets/elements/Pro-Slider.tsx
 *
 * Exelic Gadgets Pro-Slider Builder Element Definition.
 * Server-rendered on live pages via lib/builderData.tsx & ui/ProSliderServer.tsx.
 * Provides interactive tabs & live preview inside the builder canvas.
 */

import React, { useState, useEffect } from 'react';
import {
  Text,
  Select,
  ColorPickerPopup,
  Dimensions,
} from '@/components/builder/controls';
import { xFetch } from '@/lib/express';
import type { ProSliderTabConfig, ProSliderProductData, ProSliderVariant } from '../types';
import ProSliderClient, { FALLBACK_PRO_PRODUCTS } from '../ui/ProSliderClient';
import ProductTabsManager from '../ui/ProductTabsManager';

/**
 * Preview component used inside the page builder editor canvas.
 * Resolves configured product IDs on-the-fly so the builder canvas looks live and interactive.
 */
function ProSliderBuilderPreview({ element }: { element: any }) {
  const s = element?.schema || {};
  const content = s.content || {};
  const style = s.style || {};
  const advanced = s.advanced || {};

  const productTabs: ProSliderTabConfig[] = content.productTabs || [];
  const [resolvedProducts, setResolvedProducts] = useState<ProSliderProductData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!productTabs.length) {
      setResolvedProducts([]);
      return;
    }

    const ids = productTabs.map((t) => t.productId).filter((id) => id && id.length === 24);
    if (!ids.length) {
      setResolvedProducts([]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    fetch(`/api/admin-posts?type=product&ids=${ids.join(',')}`)
      .then((r) => r.json())
      .then((data) => {
        if (!isMounted) return;
        const posts: any[] = data.posts || [];
        const infos: any[] = data.infos || [];
        const postMap = new Map(posts.map((p) => [p._id, p]));

        const list: ProSliderProductData[] = [];
        for (const tab of productTabs) {
          const post = postMap.get(tab.productId);
          if (!post) continue;

          const postInfos = infos.filter((i: any) => i.postId === post._id);
          const info: Record<string, string> = {};
          for (const inf of postInfos) {
            info[inf.name] = inf.value;
          }

          let img = info.image || info.thumbnail || '';
          if (!img && info.images) {
            try {
              const arr = JSON.parse(info.images);
              if (Array.isArray(arr) && arr[0]) img = arr[0];
            } catch {}
          }

          let variants: ProSliderVariant[] = [];
          if (info._variate) {
            try {
              const parsed = JSON.parse(info._variate);
              if (Array.isArray(parsed.variants)) {
                const seen = new Set<string>();
                for (const v of parsed.variants) {
                  const colorVal = v.options?.Color || v.options?.color || v.color;
                  const name =
                    v.title ||
                    v.name ||
                    colorVal ||
                    (v.options ? Object.values(v.options).join(' / ') : '') ||
                    'Variant';

                  const dedupeKey = `${name}_${v.color || ''}_${v.image || ''}`;
                  if (seen.has(dedupeKey)) continue;
                  seen.add(dedupeKey);

                  variants.push({
                    name,
                    color: v.color || (typeof colorVal === 'string' && colorVal.startsWith('#') ? colorVal : undefined),
                    image: v.image || (Array.isArray(v.images) ? v.images[0] : undefined) || img,
                    price: parseFloat(v.price) || parseFloat(parsed.price) || 0,
                    sku: v.sku || '',
                  });
                }
              }
            } catch {}
          }

          list.push({
            productId: post._id,
            title: post.title || 'Product',
            slug: post.slug || 'product',
            postUrl: `/product/${post.slug || ''}`,
            thumbnail: img,
            mainImage: img,
            badge: tab.badge?.trim() || 'New',
            highlightTitle:
              tab.highlightTitle?.trim() ||
              info.highlight ||
              info.shortDescription ||
              'Flagship Innovation',
            subtitle:
              tab.subtitle?.trim() ||
              info.subtitle ||
              'Experience next-generation performance',
            price: parseFloat(info.price) || parseFloat(info.regularPrice) || 59999,
            stockStatus: info.stock_status || 'In stock',
            variants,
          });
        }

        setResolvedProducts(list);
      })
      .catch(() => {
        if (isMounted) setResolvedProducts([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [JSON.stringify(productTabs)]);

  const productsToRender =
    resolvedProducts.length > 0
      ? resolvedProducts
      : productTabs.length > 0
      ? [] // loading
      : FALLBACK_PRO_PRODUCTS;

  return (
    <div className="relative">
      {loading && productTabs.length > 0 && (
        <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-2xs flex items-center justify-center">
          <span className="text-xs text-blue-600 font-semibold animate-pulse">
            Updating product tabs preview...
          </span>
        </div>
      )}
      <ProSliderClient
        products={productsToRender}
        accentColor={style.accentColor || '#0053e2'}
        ctaText={content.ctaText || 'Explore product'}
        currencySymbol={content.currencySymbol || 'KSh'}
        tabsPosition={content.tabsPosition || 'top'}
        margin={advanced.margin}
        padding={advanced.padding}
      />
    </div>
  );
}

const proSliderElement = {
  type: 'gadgets-pro-slider',
  label: 'Gadgets Pro Slider',
  category: 'gadgets',
  icon: 'solar:devices-bold-duotone',

  schema: {
    content: {
      productTabs: [],
      ctaText: 'Explore product',
      currencySymbol: 'KSh',
      tabsPosition: 'top',
    },
    style: {
      accentColor: '#0053e2',
    },
    advanced: {
      margin: { top: 0, right: 0, bottom: 40, left: 0, unit: 'px' },
      padding: { top: 0, right: 0, bottom: 0, left: 0, unit: 'px' },
    },
  },

  controls: [
    // ══════════════════════ TAB: CONTENT ══════════════════════
    {
      tab: 'Content',
      section: 'Product Tabs Selection',
      controls: [
        {
          name: 'productTabs',
          label: 'Product Tabs',
          responsive: false,
          render: (value: any, onChange: any) => (
            <ProductTabsManager value={value || []} onChange={onChange} />
          ),
        },
        {
          name: 'tabsPosition',
          label: 'Tabs Placement',
          responsive: false,
          render: (value: any, onChange: any) => (
            <Select
              label="Tabs Position (Up / Down)"
              value={value || 'top'}
              onChange={onChange}
              options={[
                { value: 'top', label: 'Top (Up - Above Showcase)' },
                { value: 'bottom', label: 'Bottom (Down - Below Showcase)' },
              ]}
            />
          ),
        },
        {
          name: 'ctaText',
          label: 'CTA Button Text',
          responsive: false,
          render: (value: any, onChange: any) => (
            <Text
              label="CTA Button Text"
              value={value || 'Explore product'}
              onChange={onChange}
            />
          ),
        },
        {
          name: 'currencySymbol',
          label: 'Currency Symbol Override',
          responsive: false,
          render: (value: any, onChange: any) => (
            <Text
              label="Currency Symbol"
              value={value || 'KSh'}
              onChange={onChange}
            />
          ),
        },
      ],
    },

    // ══════════════════════ TAB: STYLE ══════════════════════
    {
      tab: 'Style',
      section: 'Colors & Branding',
      controls: [
        {
          name: 'accentColor',
          label: 'Accent / Brand Color',
          responsive: false,
          render: (value: any, onChange: any) => (
            <ColorPickerPopup
              label="Accent / Brand Color"
              value={value || '#0053e2'}
              onChange={onChange}
            />
          ),
        },
      ],
    },

    // ══════════════════════ TAB: ADVANCED ══════════════════════
    {
      tab: 'Advanced',
      section: 'Spacing',
      controls: [
        {
          name: 'margin',
          label: 'Margin',
          responsive: true,
          render: (value: any, onChange: any) => (
            <Dimensions type="margin" label="Margin" value={value} onChange={onChange} />
          ),
        },
        {
          name: 'padding',
          label: 'Padding',
          responsive: true,
          render: (value: any, onChange: any) => (
            <Dimensions type="padding" label="Padding" value={value} onChange={onChange} />
          ),
        },
      ],
    },
  ],

  render: (element: any) => <ProSliderBuilderPreview element={element} />,
};

export default proSliderElement;
