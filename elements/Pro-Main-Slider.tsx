'use client';

/**
 * cms/plugin/gadgets/elements/Pro-Main-Slider.tsx
 *
 * Exelic Gadgets Pro Main Slider Builder Element Definition:
 *  - Centers active slide with previous & next slides peeking in on the left and right.
 *  - Semi-transparent glassmorphism navigation arrows (< and >) at the left and right seams.
 *  - Play / Pause (|| / ▶) toggle button at the bottom-right of the center slide.
 *  - Smooth rounded corners (rounded-2xl sm:rounded-3xl) with subtle shadow.
 *  - Tab: Content configures Slide Banners (Desktop Image, Mobile Image, Link, Title, Badge).
 *  - Tab: Style configures Responsive Heights, Center Width %, Gaps, Border Radius, Side Dim, Autoplay, and Arrows.
 *  - Tab: Advanced configures Margin and Padding.
 */

import React from 'react';
import type { BuilderElementDef } from '@/hook';
import {
  Text,
  NumberControl,
  Toggle,
  ImageGallery,
  Url,
  Dimensions,
  Select,
} from '@/components/builder/controls';
import { Icon } from '@iconify/react';
import ProMainSlider, {
  DEFAULT_PRO_MAIN_SLIDES,
  type ProMainSlideItem,
} from '../ui/ProMainSlider';

/**
 * Slide Items Manager control for the sidebar under Tab: Content.
 */
function ProMainSlidesManager({
  value = [],
  onChange,
}: {
  value?: ProMainSlideItem[];
  onChange: (items: ProMainSlideItem[]) => void;
}) {
  const items = Array.isArray(value) && value.length > 0 ? value : DEFAULT_PRO_MAIN_SLIDES;

  const handleGallerySelect = (selected: any) => {
    let urls: string[] = [];
    if (Array.isArray(selected)) {
      urls = selected.filter(Boolean);
    } else if (typeof selected === 'string' && selected) {
      urls = [selected];
    }

    if (urls.length === 0) return;

    const newItems: ProMainSlideItem[] = urls.map((url, i) => ({
      id: `slide-${Date.now()}-${i}`,
      image: url,
      title: `Banner Slide ${items.length + i + 1}`,
      link: '',
      badge: '',
      target: '_self',
    }));

    onChange([...items, ...newItems]);
  };

  const handleUpdate = (idx: number, field: keyof ProMainSlideItem, val: any) => {
    const next = [...items];
    next[idx] = { ...next[idx], [field]: val };
    onChange(next);
  };

  const handleRemove = (idx: number) => {
    const next = items.filter((_, i) => i !== idx);
    onChange(next);
  };

  const handleDuplicate = (idx: number) => {
    const next = [...items];
    const copy: ProMainSlideItem = {
      ...next[idx],
      id: `slide-${Date.now()}`,
      title: `${next[idx].title || 'Slide'} (Copy)`,
    };
    next.splice(idx + 1, 0, copy);
    onChange(next);
  };

  const handleMove = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    onChange(next);
  };

  const handleAddNew = () => {
    const newItem: ProMainSlideItem = {
      id: `slide-${Date.now()}`,
      image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600&auto=format&fit=crop&q=85',
      title: `Slide ${items.length + 1}`,
      link: '',
      badge: '',
      target: '_self',
    };
    onChange([...items, newItem]);
  };

  return (
    <div className="space-y-4 pt-1 text-xs font-sans">
      {/* Media Gallery Selector */}
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
        <span className="text-xs font-semibold text-gray-700 block">
          Add / Select Slides from Media Library
        </span>
        <ImageGallery
          label=""
          value={items.map((i) => (typeof i.image === 'string' ? i.image : '')).filter(Boolean)}
          onChange={handleGallerySelect}
          multiple={true}
        />
      </div>

      {/* Slide Items List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-0.5">
          <span className="font-semibold text-gray-700 text-xs">
            Hero Slides ({items.length})
          </span>
          <button
            type="button"
            onClick={handleAddNew}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
          >
            <Icon icon="solar:add-circle-bold" width={14} />
            <span>Add Slide</span>
          </button>
        </div>

        <div className="space-y-3 max-h-130 overflow-y-auto pr-1">
          {items.map((item, idx) => (
            <div
              key={item.id || idx}
              className="p-3 bg-white border border-gray-200 rounded-xl space-y-3 shadow-2xs"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[11px] font-mono font-bold text-gray-600">
                    {idx + 1}
                  </span>
                  {item.image ? (
                    <img
                      src={item.image}
                      alt=""
                      className="w-10 h-7 object-cover rounded-md border border-gray-200 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-7 bg-gray-100 rounded-md flex items-center justify-center text-gray-400 shrink-0">
                      <Icon icon="solar:gallery-linear" width={14} />
                    </div>
                  )}
                  <span className="font-semibold text-gray-800 text-xs truncate max-w-36">
                    {item.title || `Slide #${idx + 1}`}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleMove(idx, idx - 1)}
                    disabled={idx === 0}
                    className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-25"
                    title="Move Up"
                  >
                    <Icon icon="solar:arrow-up-linear" width={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(idx, idx + 1)}
                    disabled={idx === items.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-25"
                    title="Move Down"
                  >
                    <Icon icon="solar:arrow-down-linear" width={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDuplicate(idx)}
                    className="p-1 text-gray-400 hover:text-blue-600"
                    title="Duplicate"
                  >
                    <Icon icon="solar:copy-linear" width={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="Delete"
                  >
                    <Icon icon="solar:trash-bin-trash-linear" width={14} />
                  </button>
                </div>
              </div>

              {/* Title & Badge */}
              <div className="grid grid-cols-2 gap-2">
                <Text
                  label="Title / Alt"
                  value={item.title || ''}
                  onChange={(val: string) => handleUpdate(idx, 'title', val)}
                  placeholder="e.g. EA SPORTS FC 27"
                />
                <Text
                  label="Badge Tag"
                  value={item.badge || ''}
                  onChange={(val: string) => handleUpdate(idx, 'badge', val)}
                  placeholder="e.g. New Release"
                />
              </div>

              {/* Desktop Image Selector */}
              <div>
                <label className="text-[11px] font-semibold text-gray-600 mb-1 block">
                  Desktop Banner Image
                </label>
                <ImageGallery
                  label=""
                  value={item.image}
                  onChange={(val: any) => handleUpdate(idx, 'image', Array.isArray(val) ? val[0] : val)}
                  multiple={false}
                />
              </div>

              {/* Mobile Image Selector (Optional) */}
              <div>
                <label className="text-[11px] font-semibold text-gray-600 mb-1 block">
                  Mobile Banner Image (Optional)
                </label>
                <ImageGallery
                  label=""
                  value={item.mobileImage || ''}
                  onChange={(val: any) =>
                    handleUpdate(idx, 'mobileImage', Array.isArray(val) ? val[0] : val)
                  }
                  multiple={false}
                />
              </div>

              {/* Link / URL */}
              <Url
                label="Slide Link"
                value={item.link || ''}
                onChange={(val: any) => handleUpdate(idx, 'link', val)}
                placeholder="/category/gaming or https://..."
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Builder Element Definition: gadgets-pro-main-slider
 */
const proMainSliderElement: BuilderElementDef = {
  type: 'gadgets-pro-main-slider',
  label: 'Pro Main Slider',
  category: 'gadgets',
  icon: 'solar:gallery-wide-bold',
  schema: {
    content: {
      slides: DEFAULT_PRO_MAIN_SLIDES,
    },
    style: {
      heightDesktop: 460,
      heightTablet: 360,
      heightMobile: 230,
      centerWidthDesktop: 1050,
      centerWidthUnit: 'px',
      gap: 20,
      borderRadius: 24,
      sideOpacity: 0.45,
      autoplay: true,
      autoplayInterval: 4500,
      pauseOnHover: true,
      showArrows: true,
      showPlayPause: true,
      showPagination: false,
    },
    advanced: {
      margin: { top: 0, right: 0, bottom: 30, left: 0, unit: 'px' },
      padding: { top: 0, right: 0, bottom: 0, left: 0, unit: 'px' },
    },
  },

  controls: [
    // ══════════════════════ TAB: CONTENT ══════════════════════
    {
      tab: 'Content',
      section: 'Slide Banners',
      controls: [
        {
          name: 'slides',
          label: 'Slides',
          responsive: false,
          render: (value: any, onChange: any) => (
            <ProMainSlidesManager value={value} onChange={onChange} />
          ),
        },
      ],
    },

    // ══════════════════════ TAB: STYLE ══════════════════════
    {
      tab: 'Style',
      section: 'Center Slide Width & Dimensions',
      controls: [
        {
          name: 'centerWidthDesktop',
          label: 'Desktop Center Slide Width',
          responsive: false,
          render: (value: any, onChange: any) => (
            <NumberControl
              label="Desktop Center Slide Width"
              value={value ?? 1050}
              onChange={onChange}
              min={300}
              max={2200}
            />
          ),
        },
        {
          name: 'centerWidthUnit',
          label: 'Width Unit (px / %)',
          responsive: false,
          render: (value: any, onChange: any) => (
            <Select
              label="Width Unit"
              value={value ?? 'px'}
              onChange={onChange}
              options={[
                { value: 'px', label: 'Pixels (px) - e.g. 1050px' },
                { value: '%', label: 'Percentage (%) - e.g. 76%' },
              ]}
            />
          ),
        },
        {
          name: 'heightDesktop',
          label: 'Desktop Height (px)',
          responsive: false,
          render: (value: any, onChange: any) => (
            <NumberControl
              label="Desktop Height (px)"
              value={value ?? 460}
              onChange={onChange}
              min={180}
              max={900}
            />
          ),
        },
        {
          name: 'heightTablet',
          label: 'Tablet Height (px)',
          responsive: false,
          render: (value: any, onChange: any) => (
            <NumberControl
              label="Tablet Height (px)"
              value={value ?? 360}
              onChange={onChange}
              min={150}
              max={700}
            />
          ),
        },
        {
          name: 'heightMobile',
          label: 'Mobile Height (px)',
          responsive: false,
          render: (value: any, onChange: any) => (
            <NumberControl
              label="Mobile Height (px)"
              value={value ?? 230}
              onChange={onChange}
              min={120}
              max={500}
            />
          ),
        },
        {
          name: 'gap',
          label: 'Gap Between Slides (px)',
          responsive: false,
          render: (value: any, onChange: any) => (
            <NumberControl
              label="Gap (px)"
              value={value ?? 20}
              onChange={onChange}
              min={0}
              max={60}
            />
          ),
        },
        {
          name: 'borderRadius',
          label: 'Slide Border Radius (px)',
          responsive: false,
          render: (value: any, onChange: any) => (
            <NumberControl
              label="Border Radius (px)"
              value={value ?? 24}
              onChange={onChange}
              min={0}
              max={50}
            />
          ),
        },
        {
          name: 'sideOpacity',
          label: 'Side Slide Peek Opacity (0.1 - 1)',
          responsive: false,
          render: (value: any, onChange: any) => (
            <NumberControl
              label="Side Slide Opacity"
              value={value ?? 0.45}
              onChange={onChange}
              min={0.1}
              max={1}
              step={0.05}
            />
          ),
        },
      ],
    },

    {
      tab: 'Style',
      section: 'Navigation & Autoplay',
      controls: [
        {
          name: 'showArrows',
          label: 'Show Navigation Arrows',
          responsive: false,
          render: (value: any, onChange: any) => (
            <Toggle
              label="Show Navigation Arrows"
              value={value ?? true}
              onChange={onChange}
            />
          ),
        },
        {
          name: 'showPlayPause',
          label: 'Show Play / Pause Button',
          responsive: false,
          render: (value: any, onChange: any) => (
            <Toggle
              label="Show Play / Pause Button"
              value={value ?? true}
              onChange={onChange}
            />
          ),
        },
        {
          name: 'autoplay',
          label: 'Enable Autoplay',
          responsive: false,
          render: (value: any, onChange: any) => (
            <Toggle
              label="Autoplay"
              value={value ?? true}
              onChange={onChange}
            />
          ),
        },
        {
          name: 'autoplayInterval',
          label: 'Autoplay Speed (ms)',
          responsive: false,
          render: (value: any, onChange: any) => (
            <NumberControl
              label="Autoplay Interval (ms)"
              value={value ?? 4500}
              onChange={onChange}
              min={1500}
              max={15000}
              step={500}
            />
          ),
        },
        {
          name: 'pauseOnHover',
          label: 'Pause Autoplay on Hover',
          responsive: false,
          render: (value: any, onChange: any) => (
            <Toggle
              label="Pause on Hover"
              value={value ?? true}
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

  render: (element: any) => <ProMainSlider schema={element?.schema} />,
};

export default proMainSliderElement;
