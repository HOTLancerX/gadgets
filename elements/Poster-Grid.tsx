'use client';

/**
 * cms/plugin/gadgets/elements/Poster-Grid.tsx
 *
 * Gadgets Poster Product Grid Builder Element:
 *  - Matches the "Explore soundcore" design
 *  - High-impact vertical product cards with rounded corners
 *  - Bottom-left bold white product title + white pill "Add to cart" button
 *  - Supports dynamic catalog category source OR manual custom item list
 *  - Tab: Content configures Titles, Mode (Catalog / Manual), Categories, Manual Items, Limit, and Button Text
 *  - Tab: Layout configures Responsive Grid Columns (Desktop, Tablet, Mobile), Gaps, Border Radius, and Aspect Ratio
 *  - Tab: Advanced configures Margin and Padding
 */

import React from 'react';
import type { BuilderElementDef } from '@/hook';
import {
    Text,
    NumberControl,
    Select,
    ImageGallery,
    Url,
    Dimensions,
} from '@/components/builder/controls';
import { Icon } from '@iconify/react';
import CategorySelector from './CategorySelector';
import PosterProductGrid, {
    DEFAULT_POSTER_ITEMS,
    type PosterProductItem,
} from '../ui/PosterProductGrid';

function ManualPosterManager({
    value = [],
    onChange,
}: {
    value?: PosterProductItem[];
    onChange: (items: PosterProductItem[]) => void;
}) {
    const items = Array.isArray(value) && value.length > 0 ? value : DEFAULT_POSTER_ITEMS;

    const handleGallerySelect = (selected: any) => {
        let urls: string[] = [];
        if (Array.isArray(selected)) {
            urls = selected.filter(Boolean);
        } else if (typeof selected === 'string' && selected) {
            urls = [selected];
        }

        if (urls.length === 0) return;

        const newItems: PosterProductItem[] = urls.map((url, i) => ({
            id: `poster-${Date.now()}-${i}`,
            title: `Product ${items.length + i + 1}`,
            image: url,
            buttonText: 'Add to cart',
            link: '',
        }));

        onChange([...items, ...newItems]);
    };

    const handleUpdate = (idx: number, field: keyof PosterProductItem, val: any) => {
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
        const copy: PosterProductItem = {
            ...next[idx],
            id: `poster-${Date.now()}`,
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
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                <span className="text-xs font-semibold text-gray-700 block">
                    Add Poster Cards from Media Library
                </span>
                <ImageGallery
                    label=""
                    value={items.map((i) => i.image).filter(Boolean)}
                    onChange={handleGallerySelect}
                    multiple={true}
                />
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between pb-0.5">
                    <span className="font-semibold text-gray-700 text-xs">
                        Poster Cards ({items.length})
                    </span>
                </div>

                <div className="space-y-3 max-h-125 overflow-y-auto pr-1">
                    {items.map((item, idx) => (
                        <div
                            key={item.id || idx}
                            className="p-3 bg-white border border-gray-200 rounded-xl space-y-3 shadow-xs"
                        >
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
                                        {item.title || `Item #${idx + 1}`}
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

                            <Text
                                label="Product Title"
                                value={item.title ?? ''}
                                onChange={(v: string) => handleUpdate(idx, 'title', v)}
                            />

                            <ImageGallery
                                label="Poster Image"
                                value={item.image || ''}
                                onChange={(url: any) =>
                                    handleUpdate(idx, 'image', typeof url === 'string' ? url : url?.[0] || '')
                                }
                                multiple={false}
                            />

                            <Text
                                label="Button Text"
                                value={item.buttonText ?? 'Add to cart'}
                                onChange={(v: string) => handleUpdate(idx, 'buttonText', v)}
                            />

                            <Url
                                label="Product Link"
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

const PosterGridElement: BuilderElementDef = {
    type: 'gadgets-poster-grid',
    label: 'Gadgets Poster Grid',
    category: 'gadgets',
    icon: 'solar:album-bold-duotone',
    schema: {
        content: {
            titlePrefix: 'Explore',
            titleHighlight: 'soundcore',
            itemsMode: 'catalog',
            categoryTabs: [],
            manualItems: DEFAULT_POSTER_ITEMS,
            limit: 4,
            buttonText: 'Add to cart',
            currencySymbol: 'KSh',
        },
        grid: {
            columnsDesktop: 4,
            columnsTablet: 2,
            columnsMobile: 1,
            gapDesktop: 4,
            gapTablet: 3,
            gapMobile: 3,
            borderRadius: 24,
            aspectRatio: '3/4',
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
                        <Text label="Title Highlight" value={value ?? ''} onChange={onChange} />
                    ),
                },
                {
                    name: 'buttonText',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <Text label="Button Text" value={value ?? 'Add to cart'} onChange={onChange} />
                    ),
                },
                {
                    name: 'currencySymbol',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <Text label="Currency Symbol" value={value ?? 'KSh'} onChange={onChange} />
                    ),
                },
            ],
        },
        {
            tab: 'Content',
            section: 'Data Source',
            controls: [
                {
                    name: 'itemsMode',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <Select
                            label="Data Mode"
                            value={value ?? 'catalog'}
                            onChange={onChange}
                            options={[
                                { label: 'Connect to Catalog Category', value: 'catalog' },
                                { label: 'Manual Poster Cards', value: 'manual' },
                            ]}
                        />
                    ),
                },
                {
                    name: 'categoryTabs',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <CategorySelector value={value ?? []} onChange={onChange} />
                    ),
                },
                {
                    name: 'limit',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <NumberControl label="Product Limit" value={value ?? 4} onChange={onChange} min={1} max={24} />
                    ),
                },
                {
                    name: 'manualItems',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <ManualPosterManager value={value} onChange={onChange} />
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
                        <NumberControl label="Desktop Columns (≥1024px)" value={value ?? 4} onChange={onChange} min={1} max={12} />
                    ),
                },
                {
                    name: 'columnsTablet',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <NumberControl label="Tablet Columns (768px-1023px)" value={value ?? 2} onChange={onChange} min={1} max={8} />
                    ),
                },
                {
                    name: 'columnsMobile',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <NumberControl label="Mobile Columns (<768px)" value={value ?? 1} onChange={onChange} min={1} max={4} />
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
                        <NumberControl label="Desktop Gap (0-12)" value={value ?? 4} onChange={onChange} min={0} max={12} />
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
                        <NumberControl label="Mobile Gap (0-12)" value={value ?? 3} onChange={onChange} min={0} max={12} />
                    ),
                },
                {
                    name: 'borderRadius',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <NumberControl label="Card Border Radius (px)" value={value ?? 24} onChange={onChange} min={0} max={48} />
                    ),
                },
                {
                    name: 'aspectRatio',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <Select
                            label="Card Aspect Ratio"
                            value={value ?? '3/4'}
                            onChange={onChange}
                            options={[
                                { label: 'Portrait Poster (3:4)', value: '3/4' },
                                { label: 'Standard Vertical (4:5)', value: '4/5' },
                                { label: 'Reel Tall (9:16)', value: '9/16' },
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
            <PosterProductGrid
                titlePrefix={c.titlePrefix}
                titleHighlight={c.titleHighlight}
                categoryTabs={c.categoryTabs}
                itemsMode={c.itemsMode ?? 'catalog'}
                manualItems={c.manualItems}
                limit={c.limit ?? 4}
                buttonText={c.buttonText ?? 'Add to cart'}
                currencySymbol={c.currencySymbol ?? 'KSh'}
                columnsDesktop={g.columnsDesktop ?? 4}
                columnsTablet={g.columnsTablet ?? 2}
                columnsMobile={g.columnsMobile ?? 1}
                gapDesktop={g.gapDesktop ?? 4}
                gapTablet={g.gapTablet ?? 3}
                gapMobile={g.gapMobile ?? 3}
                borderRadius={g.borderRadius ?? 24}
                aspectRatio={g.aspectRatio ?? '3/4'}
                margin={a.margin ?? s.margin}
                padding={a.padding ?? s.padding}
            />
        );
    },
};

export default PosterGridElement;
