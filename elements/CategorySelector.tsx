'use client';

/**
 * plugin/gadgets/elements/CategorySelector.tsx
 *
 * Multi-Category Selector with proportional Tabs support:
 *  - Dynamically fetches all categories from `/builder-post/cats?type=product-category`.
 *  - Allows selecting multiple categories.
 *  - Supports custom tab labels (e.g. "New in", "Headphones", "Speakers").
 *  - Drag/reorder or move up/down to order tabs.
 */

import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { xFetch } from '@/lib/express';

export interface CategoryOption {
    _id: string;
    title: string;
    slug?: string;
    image?: string;
}

export interface CategoryTabConfig {
    id: string;       // category ID or 'all'
    label: string;    // Tab display name
}

export default function CategorySelector({
    value = [],
    onChange,
}: {
    value: CategoryTabConfig[] | string[];
    onChange: (tabs: CategoryTabConfig[]) => void;
}) {
    const [cats, setCats] = useState<CategoryOption[]>([]);
    const [loading, setLoading] = useState(false);

    // Normalize value to CategoryTabConfig[]
    const currentTabs: CategoryTabConfig[] = React.useMemo(() => {
        if (!Array.isArray(value)) return [];
        const cleanId = (raw: any): string => {
            if (!raw) return '';
            if (typeof raw === 'string') return raw;
            if (typeof raw === 'object') {
                if (typeof raw.id === 'string') return raw.id;
                if (typeof raw._id === 'string') return raw._id;
                if (raw.id) return cleanId(raw.id);
                if (raw._id) return cleanId(raw._id);
            }
            return String(raw);
        };

        return value.map((item) => {
            if (typeof item === 'string') {
                return { id: item, label: '' };
            }
            if (item && typeof item === 'object') {
                const id = cleanId(item.id ?? item._id ?? item);
                const label = typeof item.label === 'string' ? item.label : '';
                return { id, label };
            }
            return { id: 'all', label: 'New in' };
        });
    }, [value]);

    useEffect(() => {
        setLoading(true);
        xFetch('/builder-post/cats?type=product-category')
            .then((r) => r.json())
            .then((data) => {
                const list = data.cats || [];
                setCats(list);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const catMap = React.useMemo(() => {
        const map = new Map<string, CategoryOption>();
        for (const c of cats) {
            map.set(c._id, c);
        }
        return map;
    }, [cats]);

    const isSelected = (id: string) => currentTabs.some((t) => t.id === id);

    const toggleCategory = (catId: string, defaultTitle: string) => {
        if (isSelected(catId)) {
            onChange(currentTabs.filter((t) => t.id !== catId));
        } else {
            onChange([...currentTabs, { id: catId, label: defaultTitle }]);
        }
    };

    const updateLabel = (id: string, newLabel: string) => {
        onChange(
            currentTabs.map((t) => (t.id === id ? { ...t, label: newLabel } : t))
        );
    };

    const moveTab = (index: number, direction: 'up' | 'down') => {
        const next = [...currentTabs];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= next.length) return;
        const [moved] = next.splice(index, 1);
        next.splice(targetIndex, 0, moved);
        onChange(next);
    };

    const removeTab = (id: string) => {
        onChange(currentTabs.filter((t) => t.id !== id));
    };

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-xs text-gray-400 py-3">
                <Icon icon="svg-spinners:ring-resize" width={16} className="animate-spin text-blue-600" />
                <span>Loading categories...</span>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Active / Ordered Category Tabs */}
            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Active Category Tabs ({currentTabs.length})
                    </label>
                    <span className="text-[10px] text-gray-400">Order from left to right</span>
                </div>

                {currentTabs.length === 0 ? (
                    <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 text-[11px] text-amber-800 flex items-center gap-2">
                        <Icon icon="solar:info-circle-bold" width={16} className="shrink-0 text-amber-600" />
                        <span>No categories selected yet. Select from the available list below.</span>
                    </div>
                ) : (
                    <div className="space-y-1.5">
                        {currentTabs.map((tab, idx) => {
                            const cat = catMap.get(tab.id);
                            const displayName = tab.label || cat?.title || (tab.id === 'all' ? 'All Products' : 'Category');

                            return (
                                <div
                                    key={tab.id}
                                    className="flex items-center gap-2 p-2 bg-white rounded-xl border border-gray-200 shadow-2xs hover:border-blue-400 transition"
                                >
                                    {/* Reorder Buttons */}
                                    <div className="flex flex-col gap-0.5">
                                        <button
                                            type="button"
                                            disabled={idx === 0}
                                            onClick={() => moveTab(idx, 'up')}
                                            className="text-gray-400 hover:text-gray-800 disabled:opacity-20 cursor-pointer"
                                            title="Move Left/Up"
                                        >
                                            <Icon icon="solar:alt-arrow-up-linear" width={12} />
                                        </button>
                                        <button
                                            type="button"
                                            disabled={idx === currentTabs.length - 1}
                                            onClick={() => moveTab(idx, 'down')}
                                            className="text-gray-400 hover:text-gray-800 disabled:opacity-20 cursor-pointer"
                                            title="Move Right/Down"
                                        >
                                            <Icon icon="solar:alt-arrow-down-linear" width={12} />
                                        </button>
                                    </div>

                                    {/* Tab Label Input */}
                                    <div className="flex-1 min-w-0">
                                        <input
                                            type="text"
                                            value={tab.label}
                                            placeholder={cat?.title || 'Tab Name'}
                                            onChange={(e) => updateLabel(tab.id, e.target.value)}
                                            className="w-full text-xs font-semibold text-gray-800 bg-gray-50 px-2 py-1 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-600"
                                        />
                                        <span className="text-[10px] text-gray-400 truncate block mt-0.5 px-1 font-mono">
                                            {cat ? cat.title : (tab.id === 'all' ? 'All Category Products' : tab.id)}
                                        </span>
                                    </div>

                                    {/* Remove button */}
                                    <button
                                        type="button"
                                        onClick={() => removeTab(tab.id)}
                                        className="w-6 h-6 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center transition cursor-pointer"
                                        title="Remove Tab"
                                    >
                                        <Icon icon="solar:trash-bin-minimalistic-linear" width={14} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Available Categories Palette */}
            <div className="space-y-1.5 pt-2 border-t border-gray-100">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                    Available Categories
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto p-1 bg-gray-50 rounded-xl border border-gray-200/80">
                    {/* Optional "All / New In" special tab */}
                    <button
                        type="button"
                        onClick={() => toggleCategory('all', 'New in')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border cursor-pointer flex items-center gap-1.5 ${
                            isSelected('all')
                                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                        }`}
                    >
                        <Icon icon={isSelected('all') ? 'solar:check-circle-bold' : 'solar:add-circle-linear'} width={13} />
                        <span>All / New in</span>
                    </button>

                    {cats.map((cat) => {
                        const selected = isSelected(cat._id);
                        return (
                            <button
                                key={cat._id}
                                type="button"
                                onClick={() => toggleCategory(cat._id, cat.title)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border cursor-pointer flex items-center gap-1.5 ${
                                    selected
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                        : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                                }`}
                            >
                                <Icon icon={selected ? 'solar:check-circle-bold' : 'solar:add-circle-linear'} width={13} />
                                <span>{cat.title}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
