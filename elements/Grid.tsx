'use client';

/**
 * cms/plugin/gadgets/elements/Grid.tsx
 *
 * Exelic Gadgets Top Categories Grid Builder Element.
 * Features:
 *  - Dynamic title with dual-color / vibrant gradient ("Top Categories").
 *  - Responsive grid layout & gaps computed dynamically from desktop, tablet, and mobile inputs.
 *  - Configurable image heights (desktop & mobile) via CSS custom properties (--h-mob / --h-desk).
 *  - Category cards with product thumbnail image, title, and hover card background.
 *  - Manual upload/edit of category images, titles, and URLs via builder controls.
 *  - Add, duplicate, reorder, and remove category items.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import {
  Text,
  Toggle,
  NumberControl,
  ColorPickerPopup,
  Dimensions,
  ImageGallery,
  Url,
  Section,
} from '@/components/builder/controls';

export interface GadgetCategoryItem {
  id: string;
  title: string;
  image: string;
  link?: {
    url: string;
    target?: string;
    nofollow?: boolean;
  };
}

export const DEFAULT_GADGET_CATEGORIES: GadgetCategoryItem[] = [
  // ── Row 1 ──
  {
    id: 'cat_laptops',
    title: 'Laptops',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&auto=format&fit=crop&q=80',
    link: { url: '/category/laptops' },
  },
  {
    id: 'cat_smartphones',
    title: 'Smartphones',
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300&auto=format&fit=crop&q=80',
    link: { url: '/category/smartphones' },
  },
  {
    id: 'cat_smartwatch',
    title: 'Smartwatch',
    image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=300&auto=format&fit=crop&q=80',
    link: { url: '/category/smartwatch' },
  },
  {
    id: 'cat_buds',
    title: 'Buds',
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&auto=format&fit=crop&q=80',
    link: { url: '/category/buds' },
  },
  {
    id: 'cat_games',
    title: 'Games',
    image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=300&auto=format&fit=crop&q=80',
    link: { url: '/category/games' },
  },
  {
    id: 'cat_audio',
    title: 'Audio',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&auto=format&fit=crop&q=80',
    link: { url: '/category/audio' },
  },
  {
    id: 'cat_tablets',
    title: 'Tablets',
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=300&auto=format&fit=crop&q=80',
    link: { url: '/category/tablets' },
  },
  {
    id: 'cat_cameras',
    title: 'Cameras',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=300&auto=format&fit=crop&q=80',
    link: { url: '/category/cameras' },
  },

  // ── Row 2 ──
  {
    id: 'cat_power_banks',
    title: 'Power Banks',
    image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=300&auto=format&fit=crop&q=80',
    link: { url: '/category/power-banks' },
  },
  {
    id: 'cat_phone_cables',
    title: 'Phone Cables',
    image: 'https://images.unsplash.com/photo-1588508065123-287b28e013da?w=300&auto=format&fit=crop&q=80',
    link: { url: '/category/phone-cables' },
  },
  {
    id: 'cat_phone_chargers',
    title: 'Phone Chargers',
    image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=300&auto=format&fit=crop&q=80',
    link: { url: '/category/phone-chargers' },
  },
  {
    id: 'cat_controllers',
    title: 'Controllers',
    image: 'https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=300&auto=format&fit=crop&q=80',
    link: { url: '/category/controllers' },
  },
  {
    id: 'cat_mouse',
    title: 'Mouse',
    image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=300&auto=format&fit=crop&q=80',
    link: { url: '/category/mouse' },
  },
  {
    id: 'cat_keyboards',
    title: 'Keyboards',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300&auto=format&fit=crop&q=80',
    link: { url: '/category/keyboards' },
  },
  {
    id: 'cat_microphones',
    title: 'Microphones',
    image: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=300&auto=format&fit=crop&q=80',
    link: { url: '/category/microphones' },
  },
  {
    id: 'cat_speakers',
    title: 'Speakers',
    image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=300&auto=format&fit=crop&q=80',
    link: { url: '/category/speakers' },
  },
];

function CategoryCard({
  item,
  textColor,
  hoverTextColor,
  cardHoverBg,
  cardRadius,
  cardPaddingStyle,
  imageHeightDesktop,
  imageHeightMobile,
}: {
  item: GadgetCategoryItem;
  textColor: string;
  hoverTextColor: string;
  cardHoverBg: string;
  cardRadius: number;
  cardPaddingStyle: string;
  imageHeightDesktop: number;
  imageHeightMobile: number;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      href={item.link?.url || '#'}
      target={item.link?.target || '_self'}
      rel={item.link?.nofollow ? 'nofollow' : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group flex flex-col items-center justify-between text-center transition-all duration-300 cursor-pointer select-none h-full"
      style={{
        backgroundColor: isHovered ? cardHoverBg : 'transparent',
        borderRadius: `${cardRadius}px`,
        padding: cardPaddingStyle,
      }}
    >
      {/* Category Image Box with Configurable Heights via CSS Variables */}
      <div
        className="w-full overflow-hidden shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 mb-2 h-(--h-mob) md:h-(--h-desk)"
        style={{
          '--h-mob': `${imageHeightMobile}px`,
          '--h-desk': `${imageHeightDesktop}px`,
        } as React.CSSProperties}
      >
        {item.image ? (
          <img
            src={item.image}
            alt={item.title}
            className="h-full w-full object-contain drop-shadow-xs"
            loading="lazy"
          />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
            <Icon icon="solar:devices-bold" width={28} />
          </div>
        )}
      </div>

      {/* Category Title */}
      <div className="w-full">
        <span
          className="text-xs md:text-[13px] font-semibold leading-tight line-clamp-2 block transition-colors duration-200"
          style={{
            color: isHovered ? hoverTextColor : textColor,
          }}
        >
          {item.title}
        </span>
      </div>
    </Link>
  );
}

export function GadgetsGridFrontend({ element }: { element: any }) {
  const s = element?.schema || {};
  const content = s.content || {};
  const style = s.style || {};
  const advanced = s.advanced || {};

  const items: GadgetCategoryItem[] =
    Array.isArray(content.items) && content.items.length > 0
      ? content.items
      : DEFAULT_GADGET_CATEGORIES;

  const showTitle = content.show_title !== false;
  const titlePrefix = content.title_prefix ?? 'Top';
  const titleHighlight = content.title_highlight ?? 'Categories';

  // ─── Responsive Grid Columns ───
  const mobColsClass = Number(content.columnsMobile ?? content.mobile_cols) || 3;
  const tabColsClass = Number(content.columnsTablet ?? content.tablet_cols) || 4;
  const deskColsClass = Number(content.columnsDesktop ?? content.desktop_cols) || 8;

  // ─── Dynamic Responsive Gaps ───
  const mobGapClass = `gap-${style.gapMobile != null ? Number(style.gapMobile) : 2}`;
  const tabGapClass = `md:gap-${style.gapTablet != null ? Number(style.gapTablet) : 3}`;
  const deskGapClass = `lg:gap-${style.gapDesktop != null ? Number(style.gapDesktop) : 4}`;

  const gridClass = `grid grid-cols-${mobColsClass} md:grid-cols-${tabColsClass} lg:grid-cols-${deskColsClass} ${mobGapClass} ${tabGapClass} ${deskGapClass} w-full`;

  // ─── Configurable Image Heights ───
  const imageHeightDesktop = Number(style.imageHeightDesktop) || 80;
  const imageHeightMobile = Number(style.imageHeightMobile) || 60;

  // Dynamic styling tokens
  const titlePrefixColor = style.title_prefix_color || '#0f172a';
  const titleGradientFrom = style.title_gradient_from || '#f97316';
  const titleGradientVia = style.title_gradient_via || '#ec4899';
  const titleGradientTo = style.title_gradient_to || '#8b5cf6';

  const textColor = style.text_color || '#1e293b';
  const hoverTextColor = style.hover_text_color || '#0f172a';
  const cardHoverBg = style.card_hover_bg || '#f8fafc';
  const cardRadius = style.card_radius ?? 16;

  const cardPadding = style.card_padding || { top: 14, right: 10, bottom: 14, left: 10, unit: 'px' };
  const cardPaddingStyle = `${cardPadding.top ?? 14}${cardPadding.unit || 'px'} ${cardPadding.right ?? 10}${cardPadding.unit || 'px'} ${cardPadding.bottom ?? 14}${cardPadding.unit || 'px'} ${cardPadding.left ?? 10}${cardPadding.unit || 'px'}`;

  return (
    <div
      className="w-full font-sans select-none"
      style={{
        margin: advanced.margin,
        padding: advanced.padding,
      }}
    >
      <div className="w-full">
        {/* ─── Header: "Top Categories" with Vibrant Gradient ─── */}
        {showTitle && (
          <div className="mb-6 md:mb-8">
            <h2 className="text-2xl md:text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-2">
              <span style={{ color: titlePrefixColor }}>{titlePrefix}</span>
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(to right, ${titleGradientFrom}, ${titleGradientVia}, ${titleGradientTo})`,
                }}
              >
                {titleHighlight}
              </span>
            </h2>
          </div>
        )}

        {/* ─── Responsive Grid with Tailwind Column & Gap Classes ─── */}
        <div className={gridClass}>
          {items.map((item) => (
            <div key={item.id}>
              <CategoryCard
                item={item}
                textColor={textColor}
                hoverTextColor={hoverTextColor}
                cardHoverBg={cardHoverBg}
                cardRadius={cardRadius}
                cardPaddingStyle={cardPaddingStyle}
                imageHeightDesktop={imageHeightDesktop}
                imageHeightMobile={imageHeightMobile}
              />
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

const gadgetsGridElement = {
  type: 'gadgets-grid',
  label: 'Gadgets Category Grid',
  category: 'gadgets',
  icon: 'solar:widget-5-bold-duotone',

  schema: {
    content: {
      show_title: true,
      title_prefix: 'Top',
      title_highlight: 'Categories',
      columnsDesktop: 8,
      columnsTablet: 4,
      columnsMobile: 3,
      items: DEFAULT_GADGET_CATEGORIES,
    },

    style: {
      title_prefix_color: '#0f172a',
      title_gradient_from: '#f97316',
      title_gradient_via: '#ec4899',
      title_gradient_to: '#8b5cf6',
      text_color: '#1e293b',
      hover_text_color: '#0f172a',
      card_hover_bg: '#f8fafc',
      card_radius: 16,
      gapDesktop: 4,
      gapTablet: 3,
      gapMobile: 2,
      imageHeightDesktop: 80,
      imageHeightMobile: 60,
      card_padding: { top: 14, right: 10, bottom: 14, left: 10, unit: 'px' },
    },

    advanced: {
      margin: { top: 0, right: 0, bottom: 32, left: 0, unit: 'px' },
      padding: { top: 0, right: 0, bottom: 0, left: 0, unit: 'px' },
    },
  },

  controls: [
    // ══════════════════════ TAB: CONTENT ══════════════════════
    {
      tab: 'Content',
      section: 'Heading & Layout',
      controls: [
        {
          name: 'show_title',
          label: 'Show Section Title',
          responsive: false,
          render: (value: any, onChange: any) => (
            <Toggle label="Show Section Title" value={value ?? true} onChange={onChange} />
          ),
        },
        {
          name: 'title_prefix',
          label: 'Title Prefix (e.g. Top)',
          responsive: false,
          render: (value: any, onChange: any) => (
            <Text label="Title Prefix" value={value ?? 'Top'} onChange={onChange} />
          ),
        },
        {
          name: 'title_highlight',
          label: 'Title Highlight (Gradient Word)',
          responsive: false,
          render: (value: any, onChange: any) => (
            <Text label="Title Gradient Highlight" value={value ?? 'Categories'} onChange={onChange} />
          ),
        },
        {
          name: 'columnsDesktop',
          label: 'Desktop Columns',
          responsive: false,
          render: (value: any, onChange: any) => (
            <NumberControl label="Desktop Columns (1-12)" value={value ?? 8} onChange={onChange} min={1} max={12} step={1} />
          ),
        },
        {
          name: 'columnsTablet',
          label: 'Tablet Columns',
          responsive: false,
          render: (value: any, onChange: any) => (
            <NumberControl label="Tablet Columns (1-12)" value={value ?? 4} onChange={onChange} min={1} max={12} step={1} />
          ),
        },
        {
          name: 'columnsMobile',
          label: 'Mobile Columns',
          responsive: false,
          render: (value: any, onChange: any) => (
            <NumberControl label="Mobile Columns (1-6)" value={value ?? 3} onChange={onChange} min={1} max={6} step={1} />
          ),
        },
      ],
    },

    {
      tab: 'Content',
      section: 'Category Items',
      controls: [
        {
          name: 'items',
          label: 'Categories List',
          responsive: false,
          render: (value: any, onChange: any) => {
            const list: GadgetCategoryItem[] = Array.isArray(value) ? value : DEFAULT_GADGET_CATEGORIES;

            return (
              <div className="space-y-4">
                {list.map((item, idx) => (
                  <Section key={item.id || idx} label={`#${idx + 1}: ${item.title || 'Category'}`}>
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between pb-1">
                        <span className="text-[11px] font-bold text-gray-500">
                          Item #{idx + 1}
                        </span>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const next = [...list];
                              next.splice(idx + 1, 0, {
                                ...item,
                                id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                                title: `${item.title} (Copy)`,
                              });
                              onChange(next);
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 hover:border-blue-200 bg-white text-gray-500 hover:text-blue-500 cursor-pointer transition shadow-2xs"
                            title="Duplicate Category"
                          >
                            <Icon icon="solar:copy-linear" width={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const next = list.filter((_, i) => i !== idx);
                              onChange(next);
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 hover:border-red-200 bg-white text-gray-500 hover:text-red-500 cursor-pointer transition shadow-2xs"
                            title="Remove Category"
                          >
                            <Icon icon="solar:trash-bin-trash-linear" width={15} />
                          </button>
                        </div>
                      </div>

                      <Text
                        label="Category Title"
                        value={item.title || ''}
                        onChange={(v: string) => {
                          const next = [...list];
                          next[idx] = { ...next[idx], title: v };
                          onChange(next);
                        }}
                      />

                      <div className="relative">
                        <ImageGallery
                          label="Category Image"
                          value={item.image || ''}
                          onChange={(v: string) => {
                            const next = [...list];
                            next[idx] = { ...next[idx], image: v };
                            onChange(next);
                          }}
                        />
                        {item.image && (
                          <button
                            type="button"
                            onClick={() => {
                              const next = [...list];
                              next[idx] = { ...next[idx], image: '' };
                              onChange(next);
                            }}
                            className="absolute right-0 top-0 text-[11px] text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer border-none bg-transparent"
                          >
                            <Icon icon="solar:close-circle-bold" width={14} />
                            Remove
                          </button>
                        )}
                      </div>

                      <Url
                        label="Link URL"
                        value={item.link || { url: '' }}
                        onChange={(v: any) => {
                          const next = [...list];
                          next[idx] = { ...next[idx], link: v };
                          onChange(next);
                        }}
                      />
                    </div>
                  </Section>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    const newItem: GadgetCategoryItem = {
                      id: `cat_${Date.now()}`,
                      title: 'New Category',
                      image: '',
                      link: { url: '/category/new' },
                    };
                    onChange([...list, newItem]);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-xs"
                >
                  <Icon icon="solar:add-circle-bold" width={16} />
                  <span>Add Category Item</span>
                </button>
              </div>
            );
          },
        },
      ],
    },

    // ══════════════════════ TAB: STYLE ══════════════════════
    {
      tab: 'Style',
      section: 'Title Gradient & Colours',
      controls: [
        {
          name: 'title_prefix_color',
          label: 'Title Prefix Colour',
          responsive: false,
          render: (value: any, onChange: any) => (
            <ColorPickerPopup label="Prefix Colour (e.g. 'Top')" value={value ?? '#0f172a'} onChange={onChange} />
          ),
        },
        {
          name: 'title_gradient_from',
          label: 'Gradient Start (Orange)',
          responsive: false,
          render: (value: any, onChange: any) => (
            <ColorPickerPopup label="Gradient Start" value={value ?? '#f97316'} onChange={onChange} />
          ),
        },
        {
          name: 'title_gradient_via',
          label: 'Gradient Middle (Pink/Rose)',
          responsive: false,
          render: (value: any, onChange: any) => (
            <ColorPickerPopup label="Gradient Middle" value={value ?? '#ec4899'} onChange={onChange} />
          ),
        },
        {
          name: 'title_gradient_to',
          label: 'Gradient End (Purple)',
          responsive: false,
          render: (value: any, onChange: any) => (
            <ColorPickerPopup label="Gradient End" value={value ?? '#8b5cf6'} onChange={onChange} />
          ),
        },
      ],
    },

    {
      tab: 'Style',
      section: 'Card Appearance, Gaps & Heights',
      controls: [
        {
          name: 'text_color',
          label: 'Category Text Colour',
          responsive: false,
          render: (value: any, onChange: any) => (
            <ColorPickerPopup label="Category Text Colour" value={value ?? '#1e293b'} onChange={onChange} />
          ),
        },
        {
          name: 'hover_text_color',
          label: 'Hover Text Accent Colour',
          responsive: false,
          render: (value: any, onChange: any) => (
            <ColorPickerPopup label="Hover Text Accent Colour" value={value ?? '#0f172a'} onChange={onChange} />
          ),
        },
        {
          name: 'card_hover_bg',
          label: 'Card Hover Background Colour',
          responsive: false,
          render: (value: any, onChange: any) => (
            <ColorPickerPopup label="Card Hover Background" value={value ?? '#f8fafc'} onChange={onChange} />
          ),
        },
        {
          name: 'card_radius',
          label: 'Card Corner Radius (px)',
          responsive: false,
          render: (value: any, onChange: any) => (
            <NumberControl label="Card Corner Radius (px)" value={value ?? 16} onChange={onChange} min={0} max={36} step={1} />
          ),
        },
        {
          name: 'gapDesktop',
          label: 'Desktop Gap Step (0-12)',
          responsive: false,
          render: (value: any, onChange: any) => (
            <NumberControl label="Desktop Gap Step (0-12)" value={value ?? 4} onChange={onChange} min={0} max={12} step={1} />
          ),
        },
        {
          name: 'gapTablet',
          label: 'Tablet Gap Step (0-12)',
          responsive: false,
          render: (value: any, onChange: any) => (
            <NumberControl label="Tablet Gap Step (0-12)" value={value ?? 3} onChange={onChange} min={0} max={12} step={1} />
          ),
        },
        {
          name: 'gapMobile',
          label: 'Mobile Gap Step (0-12)',
          responsive: false,
          render: (value: any, onChange: any) => (
            <NumberControl label="Mobile Gap Step (0-12)" value={value ?? 2} onChange={onChange} min={0} max={12} step={1} />
          ),
        },
        {
          name: 'imageHeightDesktop',
          label: 'Desktop Image Height (px)',
          responsive: false,
          render: (value: any, onChange: any) => (
            <NumberControl label="Desktop Image Height (px)" value={value ?? 80} onChange={onChange} min={32} max={250} step={2} />
          ),
        },
        {
          name: 'imageHeightMobile',
          label: 'Mobile Image Height (px)',
          responsive: false,
          render: (value: any, onChange: any) => (
            <NumberControl label="Mobile Image Height (px)" value={value ?? 60} onChange={onChange} min={32} max={180} step={2} />
          ),
        },
        {
          name: 'card_padding',
          label: 'Card Padding',
          responsive: true,
          render: (value: any, onChange: any) => (
            <Dimensions type="padding" label="Card Padding" value={value} onChange={onChange} />
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

  render: (element: any) => <GadgetsGridFrontend element={element} />,
};

export default gadgetsGridElement;
