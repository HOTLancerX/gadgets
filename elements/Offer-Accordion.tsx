'use client';

/**
 * cms/plugin/gadgets/elements/Offer-Accordion.tsx
 *
 * Gadgets Offer Accordion Builder Element Definition:
 *  - Displays multiple banner images side-by-side with angled diagonal cuts.
 *  - First and last card outer edges are straight vertical with smooth rounded corners.
 *  - Interior card cuts are angled diagonally (skewX(-7deg)).
 *  - Pure image + link showcase: no clutter or text overlays.
 *  - Tab: Content contains ONLY Images & Links using ImageGallery and Url controls.
 *  - Tab: Style contains Dimensions, Angle, and Autoplay settings.
 *  - Tab: Advanced contains Spacing (margin/padding).
 */

import React from 'react';
import type { BuilderElementDef } from '@/hook';
import {
    ImageGallery,
    Url,
    NumberControl,
    Toggle,
    Dimensions,
} from '@/components/builder/controls';
import { Icon } from '@iconify/react';
import OfferAccordion, {
    DEFAULT_OFFER_ITEMS,
    type OfferAccordionItem,
} from '../ui/OfferAccordion';

/**
 * Images & Links manager control for the sidebar under Tab: Content.
 * Uses ImageGallery and Url controls directly from cms/components/builder/controls.
 */
function OfferImagesManager({
    value = [],
    onChange,
}: {
    value?: OfferAccordionItem[];
    onChange: (items: OfferAccordionItem[]) => void;
}) {
    const items = Array.isArray(value) && value.length > 0 ? value : DEFAULT_OFFER_ITEMS;

    // Handle bulk or single image selection via ImageGallery
    const handleGallerySelect = (selected: any) => {
        let urls: string[] = [];
        if (Array.isArray(selected)) {
            urls = selected.filter(Boolean);
        } else if (typeof selected === 'string' && selected) {
            urls = [selected];
        }

        if (urls.length === 0) return;

        const newItems: OfferAccordionItem[] = urls.map((url, i) => ({
            id: `offer-${Date.now()}-${i}`,
            image: url,
            link: '',
        }));

        onChange([...items, ...newItems]);
    };

    const handleUpdate = (idx: number, field: keyof OfferAccordionItem, val: any) => {
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
        const copy: OfferAccordionItem = {
            ...next[idx],
            id: `offer-${Date.now()}`,
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

    return (
        <div className="space-y-4 pt-1 text-xs font-sans">
            {/* Media Gallery Selector (ImageGallery from controls) */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                <span className="text-xs font-semibold text-gray-700 block">
                    Add / Select Images from Media Library
                </span>
                <ImageGallery
                    label=""
                    value={items.map((i) => (typeof i.image === 'string' ? i.image : '')).filter(Boolean)}
                    onChange={handleGallerySelect}
                    multiple={true}
                />
            </div>

            {/* List of Image & Link Items */}
            <div className="space-y-3">
                <div className="flex items-center justify-between pb-0.5">
                    <span className="font-semibold text-gray-700 text-xs">
                        Images & Links ({items.length})
                    </span>
                </div>

                <div className="space-y-3 max-h-125 overflow-y-auto pr-1">
                    {items.map((item, idx) => (
                        <div
                            key={item.id || idx}
                            className="p-3 bg-white border border-gray-200 rounded-xl space-y-3 shadow-xs"
                        >
                            {/* Card Item Header */}
                            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[11px] font-mono font-bold text-gray-600">
                                        {idx + 1}
                                    </span>
                                    {item.image ? (
                                        <img
                                            src={item.image}
                                            alt=""
                                            className="w-8 h-8 object-cover rounded-md border border-gray-200 shrink-0"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center text-gray-400 shrink-0">
                                            <Icon icon="solar:gallery-linear" width={14} />
                                        </div>
                                    )}
                                    <span className="font-semibold text-gray-800 text-xs truncate">
                                        Item #{idx + 1}
                                    </span>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => handleMove(idx, idx - 1)}
                                        disabled={idx === 0}
                                        className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 hover:border-blue-400 text-gray-500 hover:text-blue-600 disabled:opacity-20 cursor-pointer transition-colors"
                                        title="Move Up"
                                    >
                                        <Icon icon="solar:arrow-up-linear" width={12} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleMove(idx, idx + 1)}
                                        disabled={idx === items.length - 1}
                                        className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 hover:border-blue-400 text-gray-500 hover:text-blue-600 disabled:opacity-20 cursor-pointer transition-colors"
                                        title="Move Down"
                                    >
                                        <Icon icon="solar:arrow-down-linear" width={12} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDuplicate(idx)}
                                        className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 hover:border-blue-400 text-gray-500 hover:text-blue-600 cursor-pointer transition-colors"
                                        title="Duplicate"
                                    >
                                        <Icon icon="solar:copy-linear" width={12} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleRemove(idx)}
                                        disabled={items.length <= 1}
                                        className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 hover:border-red-400 text-gray-500 hover:text-red-500 disabled:opacity-20 cursor-pointer transition-colors"
                                        title="Delete"
                                    >
                                        <Icon icon="solar:trash-bin-trash-linear" width={12} />
                                    </button>
                                </div>
                            </div>

                            {/* Image selector using ImageGallery control */}
                            <div className="space-y-1">
                                <ImageGallery
                                    label="Image"
                                    value={item.image || ''}
                                    onChange={(url: any) =>
                                        handleUpdate(idx, 'image', typeof url === 'string' ? url : url?.[0] || '')
                                    }
                                    multiple={false}
                                />
                            </div>

                            {/* Link selector using Url control */}
                            <div className="space-y-1">
                                <Url
                                    label="Link"
                                    value={item.link || ''}
                                    onChange={(v: any) => handleUpdate(idx, 'link', v)}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

const OfferAccordionElement: BuilderElementDef = {
    type: 'gadgets-offer-accordion',
    label: 'Gadgets Offer Accordion',
    category: 'gadgets',
    icon: 'solar:slider-minimalistic-horizontal-bold-duotone',
    schema: {
        content: {
            items: DEFAULT_OFFER_ITEMS,
        },
        style: {
            heightDesktop: 360,
            heightTablet: 300,
            heightMobile: 240,
            gap: 14,
            borderRadius: 22,
            skewAngle: -7,
            edgeOffset: 26,
            autoplay: true,
            autoplaySpeed: 4000,
            pauseOnHover: true,
            showArrows: true,
            showPlayPause: true,
            margin: { top: 0, right: 0, bottom: 0, left: 0, unit: 'px' },
            padding: { top: 0, right: 0, bottom: 0, left: 0, unit: 'px' },
        },
    },

    controls: [
        // ── Tab: Content (ONLY Images & Links) ──
        {
            tab: 'Content',
            section: 'Images & Links',
            controls: [
                {
                    name: 'items',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <OfferImagesManager value={value} onChange={onChange} />
                    ),
                },
            ],
        },

        // ── Tab: Style (Dimensions, Angle, and Slider Settings) ──
        {
            tab: 'Style',
            section: 'Dimensions & Layout',
            controls: [
                {
                    name: 'heightDesktop',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <NumberControl
                            label="Height Desktop (px)"
                            value={value ?? 360}
                            onChange={onChange}
                            min={200}
                            max={650}
                        />
                    ),
                },
                {
                    name: 'heightTablet',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <NumberControl
                            label="Height Tablet (px)"
                            value={value ?? 300}
                            onChange={onChange}
                            min={180}
                            max={500}
                        />
                    ),
                },
                {
                    name: 'heightMobile',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <NumberControl
                            label="Height Mobile (px)"
                            value={value ?? 240}
                            onChange={onChange}
                            min={150}
                            max={400}
                        />
                    ),
                },
                {
                    name: 'skewAngle',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <NumberControl
                            label="Internal Cut Angle / Skew (deg)"
                            value={value ?? -7}
                            onChange={onChange}
                            min={-20}
                            max={20}
                        />
                    ),
                },
                {
                    name: 'gap',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <NumberControl
                            label="Card Gap (px)"
                            value={value ?? 14}
                            onChange={onChange}
                            min={0}
                            max={32}
                        />
                    ),
                },
                {
                    name: 'borderRadius',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <NumberControl
                            label="Corner Radius (px)"
                            value={value ?? 22}
                            onChange={onChange}
                            min={0}
                            max={48}
                        />
                    ),
                },
            ],
        },
        {
            tab: 'Style',
            section: 'Slider & Autoplay Settings',
            controls: [
                {
                    name: 'autoplay',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <Toggle label="Autoplay" value={value ?? true} onChange={onChange} />
                    ),
                },
                {
                    name: 'autoplaySpeed',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <NumberControl
                            label="Autoplay Speed (ms)"
                            value={value ?? 4000}
                            onChange={onChange}
                            min={1500}
                            max={10000}
                            step={500}
                        />
                    ),
                },
                {
                    name: 'pauseOnHover',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <Toggle label="Pause on Hover" value={value ?? true} onChange={onChange} />
                    ),
                },
                {
                    name: 'showArrows',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <Toggle label="Show Prev/Next Arrows (< & >)" value={value ?? true} onChange={onChange} />
                    ),
                },
                {
                    name: 'showPlayPause',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <Toggle label="Show Play/Pause Button (||)" value={value ?? true} onChange={onChange} />
                    ),
                },
            ],
        },

        // ── Tab: Advanced ──
        {
            tab: 'Advanced',
            section: 'Spacing',
            controls: [
                {
                    name: 'margin',
                    responsive: true,
                    render: (value: any, onChange: any) => (
                        <Dimensions type="margin" label="Margin" value={value} onChange={onChange} />
                    ),
                },
                {
                    name: 'padding',
                    responsive: true,
                    render: (value: any, onChange: any) => (
                        <Dimensions type="padding" label="Padding" value={value} onChange={onChange} />
                    ),
                },
            ],
        },
    ],

    render: (element: any) => {
        return <OfferAccordion schema={element?.schema} />;
    },
};

export default OfferAccordionElement;
