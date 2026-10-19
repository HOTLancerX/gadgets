'use client';

/**
 * plugin/gadgets/ui/ProCategoryGrid.tsx
 *
 * Pro-Category Product Grid for Gadgets:
 *  - Title on the LEFT ("Find your Sound").
 *  - Category logic on the RIGHT:
 *      * If only 1 category is selected, do NOT show tab buttons; show the category name on the right.
 *      * If more than 1 category is selected, show the list of category tabs.
 *  - Responsive Grid layout & gaps computed dynamically from desktop, tablet, and mobile inputs:
 *      grid grid-cols-${mobColsClass} md:grid-cols-${tabColsClass} lg:grid-cols-${deskColsClass} ${mobGapClass} ${tabGapClass} ${deskGapClass} w-full
 *  - Dynamic Box style selection (defaults to Gadgets Box 1 with CSS variable image heights).
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { getHooks } from '@/hook';
import { xFetch } from '@/lib/express';
import GadgetsBox1 from '../box/Box-1';
import type { CategoryTabConfig } from '../elements/CategorySelector';

export interface ProCategoryGridProps {
    titlePrefix?: string;
    titleHighlight?: string;
    categoryTabs?: CategoryTabConfig[];
    limit?: number;
    boxStyle?: string;
    columnsDesktop?: number;
    columnsTablet?: number;
    columnsMobile?: number;
    gapDesktop?: number;
    gapTablet?: number;
    gapMobile?: number;
    imageHeightDesktop?: number;
    imageHeightMobile?: number;
    viewAllLink?: string;
    products?: any[];
    productsByCategory?: Record<string, any[]>;
    currencySymbol?: string;
    permalinkMap?: Record<string, string>;
    margin?: any;
    padding?: any;
}

export default function ProCategoryGrid({
    titlePrefix = 'Find your',
    titleHighlight = 'Sound',
    categoryTabs = [
        { id: 'all', label: 'New in' },
        { id: 'headphones', label: 'Headphones' },
        { id: 'speakers', label: 'Speakers' },
    ],
    limit = 10,
    boxStyle = 'Gadgets Box 1',
    columnsDesktop = 5,
    columnsTablet = 3,
    columnsMobile = 2,
    gapDesktop = 4,
    gapTablet = 3,
    gapMobile = 2,
    imageHeightDesktop = 210,
    imageHeightMobile = 170,
    viewAllLink = '',
    products = [],
    productsByCategory = {},
    currencySymbol = 'KSh',
    permalinkMap = {},
    margin,
    padding,
}: ProCategoryGridProps) {
    // ─── Clean and Normalize Category Tabs ───
    const validTabs: CategoryTabConfig[] = useMemo(() => {
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

        if (!Array.isArray(categoryTabs) || categoryTabs.length === 0) {
            return [];
        }

        return categoryTabs.map((item) => {
            if (typeof item === 'string') {
                const id = cleanId(item);
                return { id, label: id === 'all' ? 'New in' : '' };
            }
            if (item && typeof item === 'object') {
                const rawItem = item as any;
                const id = cleanId(rawItem.id ?? rawItem._id ?? rawItem);
                const label = typeof rawItem.label === 'string' ? rawItem.label : '';
                return { id, label: label || (id === 'all' ? 'New in' : 'Category') };
            }
            return { id: 'all', label: 'New in' };
        }).filter((t) => Boolean(t.id));
    }, [categoryTabs]);

    // Active category tab state
    const [activeTabId, setActiveTabId] = useState<string>(() => validTabs[0]?.id || 'all');

    useEffect(() => {
        if (validTabs.length > 0 && !validTabs.some((t) => t.id === activeTabId)) {
            setActiveTabId(validTabs[0]?.id || 'all');
        }
    }, [validTabs, activeTabId]);

    // Local cache of products per category tab
    const [productsCache, setProductsCache] = useState<Record<string, any[]>>(() => {
        const initial: Record<string, any[]> = { ...productsByCategory };
        const defaultTabId = validTabs[0]?.id || 'all';
        if (products && products.length > 0 && !initial[defaultTabId]) {
            initial[defaultTabId] = products;
        }
        return initial;
    });

    const hasInitialProducts = Boolean(
        (productsCache[activeTabId] && productsCache[activeTabId].length > 0) ||
        (products && products.length > 0)
    );

    const [loading, setLoading] = useState<boolean>(!hasInitialProducts);
    const inFlightRef = useRef<Record<string, boolean>>({});

    // Fetch products for active tab with local DB support
    useEffect(() => {
        const currentProducts = productsCache[activeTabId];
        if (currentProducts && currentProducts.length > 0) {
            setLoading(false);
            return;
        }

        if (inFlightRef.current[activeTabId]) return;
        inFlightRef.current[activeTabId] = true;

        setLoading(true);
        const safeLimit = Math.min(Number(limit) || 10, 48);
        const cleanCat = activeTabId === 'all' ? '' : activeTabId;

        // Try local Next.js API first (hits local MongoDB)
        const fetchLocal = async () => {
            try {
                const queryParams = new URLSearchParams({
                    type: 'product',
                    limit: String(safeLimit),
                });
                if (cleanCat) {
                    queryParams.set('category', cleanCat);
                }

                const res = await fetch(`/api/admin-posts?${queryParams.toString()}`);
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data.posts) && data.posts.length > 0) {
                        const infoMap: Record<string, Record<string, string>> = {};
                        if (Array.isArray(data.infos)) {
                            for (const info of data.infos) {
                                const pid = String(info.postId);
                                if (!infoMap[pid]) infoMap[pid] = {};
                                infoMap[pid][info.name] = info.value;
                            }
                        }
                        const formatted = data.posts.map((p: any) => ({
                            ...p,
                            info: infoMap[String(p._id)] || p.info || {},
                        }));
                        setProductsCache((prev) => ({ ...prev, [activeTabId]: formatted }));
                        setLoading(false);
                        inFlightRef.current[activeTabId] = false;
                        return true;
                    }
                }
            } catch {
                // fall through to xFetch
            }
            return false;
        };

        fetchLocal().then((handled) => {
            if (handled) return;

            // Fallback to xFetch /builder-post
            const params = new URLSearchParams({ type: 'product', limit: String(safeLimit) });
            if (cleanCat) params.set('cats', cleanCat);

            xFetch(`/builder-post?${params.toString()}`)
                .then((r) => r.json())
                .then((data) => {
                    const fetched = data.posts || data.products || [];
                    setProductsCache((prev) => ({ ...prev, [activeTabId]: fetched }));
                    setLoading(false);
                    inFlightRef.current[activeTabId] = false;
                })
                .catch(() => {
                    setProductsCache((prev) => ({ ...prev, [activeTabId]: [] }));
                    setLoading(false);
                    inFlightRef.current[activeTabId] = false;
                });
        });
    }, [activeTabId, limit, productsCache]);

    const activeProductList = productsCache[activeTabId] || [];

    // Synchronously resolve active Box Component
    const ActiveBox = useMemo(() => {
        const boxes = getHooks('root.pages').filter(
            (p) => p.type === 'product-box' && p.slug === 'dynamic'
        );
        if (boxStyle) {
            const found = boxes.find((b) => b.label === boxStyle)?.component;
            if (found) return found;
        }
        return boxes.find((b) => b.label === 'Gadgets Box 1')?.component ??
            boxes.find((b) => b.active === true)?.component ??
            boxes[0]?.component ??
            GadgetsBox1;
    }, [boxStyle]);

    // ─── Responsive Grid Layout & Gaps (as specified in news.md) ───
    const mobColsClass = Number(columnsMobile) || 1;
    const tabColsClass = Number(columnsTablet) || 2;
    const deskColsClass = Number(columnsDesktop) || 3;

    const mobGapClass = `gap-${gapMobile != null ? Number(gapMobile) : 3}`;
    const tabGapClass = `md:gap-${gapTablet != null ? Number(gapTablet) : 3}`;
    const deskGapClass = `lg:gap-${gapDesktop != null ? Number(gapDesktop) : 3}`;

    const gridClass = `grid grid-cols-${mobColsClass} md:grid-cols-${tabColsClass} lg:grid-cols-${deskColsClass} ${mobGapClass} ${tabGapClass} ${deskGapClass} w-full`;

    // Active category name for single-category mode
    const singleCategoryName = validTabs.length === 1 ? validTabs[0].label : '';

    return (
        <section
            className="w-full select-none font-sans py-4 sm:py-6"
            style={{ margin, padding }}
        >
            <div className="w-full space-y-6">
                {/* ── Header: Title on LEFT, Categories on RIGHT ── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {/* Left: Section Title */}
                    <div className="shrink-0">
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                            <span>{titlePrefix}</span>
                            <span className="bg-linear-to-r from-orange-500 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                                {titleHighlight}
                            </span>
                        </h2>
                    </div>

                    {/* Right: Category Tabs (only when more than one) */}
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 max-w-full">
                        {validTabs.length > 1 && (
                            /* Multiple Categories: Render Tab List */
                            <div className="flex items-center gap-2 shrink-0">
                                {validTabs.map((tab) => {
                                    const isActive = tab.id === activeTabId;
                                    return (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => setActiveTabId(tab.id)}
                                            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                                                isActive
                                                    ? 'bg-[#0f172a] text-white shadow-xs scale-102'
                                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                            }`}
                                        >
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {viewAllLink && (
                            <Link
                                href={viewAllLink}
                                className="text-xs sm:text-sm font-bold text-gray-700 hover:text-blue-600 transition flex items-center gap-1 shrink-0 ml-2"
                            >
                                <span>View all</span>
                                <Icon icon="solar:arrow-right-linear" width={14} />
                            </Link>
                        )}
                    </div>
                </div>

                {/* ── Product Grid Below ── */}
                {loading && activeProductList.length === 0 ? (
                    <div className="flex items-center justify-center py-20 text-gray-400 gap-2.5 text-xs">
                        <Icon icon="svg-spinners:ring-resize" width={22} className="animate-spin text-blue-600" />
                        <span>Loading category products...</span>
                    </div>
                ) : activeProductList.length > 0 ? (
                    <div className={gridClass}>
                        {activeProductList.map((prod, idx) => (
                            <div
                                key={`${prod._id || idx}-${idx}`}
                                className="w-full"
                            >
                                <ActiveBox
                                    data={prod}
                                    currencySymbol={currencySymbol}
                                    permalinkMap={permalinkMap}
                                    imageHeightDesktop={imageHeightDesktop}
                                    imageHeightMobile={imageHeightMobile}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-400 bg-white rounded-3xl border border-gray-100 text-xs font-medium">
                        No products found for this category.
                    </div>
                )}
            </div>
        </section>
    );
}
