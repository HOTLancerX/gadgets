'use client';

/**
 * cms/plugin/gadgets/elements/Highlights.tsx
 *
 * Gadgets Highlights Story & Video Reel Builder Element:
 *  - Matches the "Shop our highlights" design
 *  - Portrait cards with centered glass play buttons
 *  - Responsive grid layout (desktop, tablet, mobile columns + gaps)
 *  - Tab: Content allows selecting images via ImageGallery, links, video URLs, and section titles
 *  - Tab: Layout configures responsive grid columns, gaps, border radius, and aspect ratio
 *  - Tab: Advanced configures margin and padding
 */

import React from 'react';
import type { BuilderElementDef } from '@/hook';
import {
    Text,
    NumberControl,
    ImageGallery,
    Url,
    Dimensions,
    Select,
} from '@/components/builder/controls';
import { Icon } from '@iconify/react';
import HighlightsGrid, {
    DEFAULT_HIGHLIGHTS,
    type HighlightItem,
} from '../ui/HighlightsGrid';

function HighlightsManager({
    value = [],
    onChange,
}: {
    value?: HighlightItem[];
    onChange: (items: HighlightItem[]) => void;
}) {
    const items = Array.isArray(value) && value.length > 0 ? value : DEFAULT_HIGHLIGHTS;

    const handleGallerySelect = (selected: any) => {
        let urls: string[] = [];
        if (Array.isArray(selected)) {
            urls = selected.filter(Boolean);
        } else if (typeof selected === 'string' && selected) {
            urls = [selected];
        }

        if (urls.length === 0) return;

        const newItems: HighlightItem[] = urls.map((url, i) => ({
            id: `hl-${Date.now()}-${i}`,
            image: url,
            title: '',
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
            link: '',
        }));

        onChange([...items, ...newItems]);
    };

    const handleUpdate = (idx: number, field: keyof HighlightItem, val: any) => {
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
        const copy: HighlightItem = {
            ...next[idx],
            id: `hl-${Date.now()}`,
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
            {/* Gallery Bulk Uploader */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                <span className="text-xs font-semibold text-gray-700 block">
                    Add Images from Media Library
                </span>
                <ImageGallery
                    label=""
                    value={items.map((i) => i.image).filter(Boolean)}
                    onChange={handleGallerySelect}
                    multiple={true}
                />
            </div>

            {/* Items List */}
            <div className="space-y-3">
                <div className="flex items-center justify-between pb-0.5">
                    <span className="font-semibold text-gray-700 text-xs">
                        Highlight Cards ({items.length})
                    </span>
                </div>

                <div className="space-y-3 max-h-125 overflow-y-auto pr-1">
                    {items.map((item, idx) => (
                        <div
                            key={item.id || idx}
                            className="p-3 bg-white border border-gray-200 rounded-xl space-y-3 shadow-xs"
                        >
                            {/* Card Header & Controls */}
                            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[11px] font-mono font-bold text-gray-600">
                                        {idx + 1}
                                    </span>
                                    {item.image ? (
                                        <img
                                            src={item.image}
                                            alt=""
                                            className="w-8 h-10 object-cover rounded-md border border-gray-200 shrink-0"
                                        />
                                    ) : (
                                        <div className="w-8 h-10 bg-gray-100 rounded-md flex items-center justify-center text-gray-400 shrink-0">
                                            <Icon icon="solar:gallery-linear" width={14} />
                                        </div>
                                    )}
                                    <span className="font-semibold text-gray-800 text-xs truncate">
                                        {item.title || `Highlight #${idx + 1}`}
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

                            {/* Image control */}
                            <ImageGallery
                                label="Card Cover Image"
                                value={item.image || ''}
                                onChange={(url: any) =>
                                    handleUpdate(idx, 'image', typeof url === 'string' ? url : url?.[0] || '')
                                }
                                multiple={false}
                            />

                            {/* Caption / Title */}
                            <Text
                                label="Card Caption / Title"
                                value={item.title ?? ''}
                                onChange={(v: string) => handleUpdate(idx, 'title', v)}
                            />

                            {/* Video URL (Plays in popup) */}
                            <Text
                                label="Video URL (mp4 / YouTube)"
                                value={item.videoUrl ?? ''}
                                onChange={(v: string) => handleUpdate(idx, 'videoUrl', v)}
                            />

                            {/* Fallback Direct Link */}
                            <Url
                                label="Target Link (Optional)"
                                value={item.link ?? ''}
                                onChange={(v: any) => handleUpdate(idx, 'link', v)}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

const HighlightsElement: BuilderElementDef = {
    type: 'gadgets-highlights',
    label: 'Gadgets Highlights Grid',
    category: 'gadgets',
    icon: 'solar:videocamera-record-bold-duotone',
    schema: {
        content: {
            titlePrefix: 'Shop our',
            titleHighlight: 'highlights',
            items: DEFAULT_HIGHLIGHTS,
        },
        grid: {
            columnsDesktop: 6,
            columnsTablet: 3,
            columnsMobile: 2,
            gapDesktop: 3,
            gapTablet: 3,
            gapMobile: 2,
            borderRadius: 22,
            aspectRatio: '9/16',
        },
        style: {
            margin: { top: 0, right: 0, bottom: 0, left: 0, unit: 'px' },
            padding: { top: 0, right: 0, bottom: 0, left: 0, unit: 'px' },
        },
    },

    controls: [
        // ── Tab: Content ──
        {
            tab: 'Content',
            section: 'Header Titles',
            controls: [
                {
                    name: 'titlePrefix',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <Text label="Title Prefix" value={value ?? ''} onChange={onChange} />
                    ),
                },
                {
                    name: 'titleHighlight',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <Text label="Title Highlight (Orange)" value={value ?? ''} onChange={onChange} />
                    ),
                },
            ],
        },
        {
            tab: 'Content',
            section: 'Highlights Media Items',
            controls: [
                {
                    name: 'items',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <HighlightsManager value={value} onChange={onChange} />
                    ),
                },
            ],
        },

        // ── Tab: Layout ──
        {
            tab: 'Layout',
            section: 'Responsive Grid Columns',
            controls: [
                {
                    name: 'columnsDesktop',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <NumberControl label="Desktop Columns" value={value ?? 6} onChange={onChange} min={1} max={12} />
                    ),
                },
                {
                    name: 'columnsTablet',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <NumberControl label="Tablet Columns" value={value ?? 3} onChange={onChange} min={1} max={8} />
                    ),
                },
                {
                    name: 'columnsMobile',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <NumberControl label="Mobile Columns" value={value ?? 2} onChange={onChange} min={1} max={4} />
                    ),
                },
            ],
        },
        {
            tab: 'Layout',
            section: 'Grid Gaps & Style',
            controls: [
                {
                    name: 'gapDesktop',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <NumberControl label="Desktop Gap (0-12)" value={value ?? 3} onChange={onChange} min={0} max={12} />
                    ),
                },
                {
                    name: 'gapTablet',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <NumberControl label="Tablet Gap (0-12)" value={value ?? 3} onChange={onChange} min={0} max={12} />
                    ),
                },
                {
                    name: 'gapMobile',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <NumberControl label="Mobile Gap (0-12)" value={value ?? 2} onChange={onChange} min={0} max={12} />
                    ),
                },
                {
                    name: 'borderRadius',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <NumberControl label="Card Border Radius (px)" value={value ?? 22} onChange={onChange} min={0} max={40} />
                    ),
                },
                {
                    name: 'aspectRatio',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <Select
                            label="Card Aspect Ratio"
                            value={value ?? '9/16'}
                            onChange={onChange}
                            options={[
                                { label: 'Portrait Reel (9:16)', value: '9/16' },
                                { label: 'Vertical Photo (3:4)', value: '3/4' },
                                { label: 'Square (1:1)', value: '1/1' },
                            ]}
                        />
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
        const c = element.schema?.content ?? {};
        const g = element.schema?.grid ?? {};
        const s = element.schema?.style ?? {};
        const a = element.schema?.advanced ?? {};

        return (
            <HighlightsGrid
                titlePrefix={c.titlePrefix}
                titleHighlight={c.titleHighlight}
                items={c.items}
                columnsDesktop={g.columnsDesktop ?? 6}
                columnsTablet={g.columnsTablet ?? 3}
                columnsMobile={g.columnsMobile ?? 2}
                gapDesktop={g.gapDesktop ?? 3}
                gapTablet={g.gapTablet ?? 3}
                gapMobile={g.gapMobile ?? 2}
                borderRadius={g.borderRadius ?? 22}
                aspectRatio={g.aspectRatio ?? '9/16'}
                margin={a.margin ?? s.margin}
                padding={a.padding ?? s.padding}
            />
        );
    },
};

export default HighlightsElement;
