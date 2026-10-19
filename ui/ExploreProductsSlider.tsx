'use client';

/**
 * plugin/gadgets/ui/ExploreProductsSlider.tsx
 *
 * Explore Products Carousel for Gadgets:
 *  - Header: "Explore our products" (or custom title)
 *  - Left and Right circular navigation arrows (< and >)
 *  - Embla Carousel with responsive slides (default 4 on desktop, matching screenshot)
 *  - Products rendered using Box-2 (interactive color swatches with dynamic image switching)
 */

import React, { useState, useEffect, useCallback, useMemo, useRef, useId } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import useEmblaCarousel from 'embla-carousel-react';
import { getHooks } from '@/hook';
import { xFetch } from '@/lib/express';
import GadgetsBox2 from '../box/Box-2';
import type { CategoryTabConfig } from '../elements/CategorySelector';

export interface ExploreProductsSliderProps {
    titlePrefix?: string;
    titleHighlight?: string;
    categoryTabs?: CategoryTabConfig[];
    limit?: number;
    boxStyle?: string;
    slidesDesktop?: number;
    slidesTablet?: number;
    slidesMobile?: number;
    gapDesktop?: number;
    gapTablet?: number;
    gapMobile?: number;
    imageHeightDesktop?: number;
    imageHeightMobile?: number;
    showArrows?: boolean;
    viewAllLink?: string;
    products?: any[];
    productsByCategory?: Record<string, any[]>;
    currencySymbol?: string;
    permalinkMap?: Record<string, string>;
    margin?: any;
    padding?: any;
}

export default function ExploreProductsSlider({
    titlePrefix = 'Explore our',
    titleHighlight = 'products',
    categoryTabs = [],
    limit = 10,
    boxStyle = 'Gadgets Box 2',
    slidesDesktop = 4,
    slidesTablet = 2.5,
    slidesMobile = 1.3,
    gapDesktop = 4,
    gapTablet = 3,
    gapMobile = 2,
    imageHeightDesktop = 210,
    imageHeightMobile = 170,
    showArrows = true,
    viewAllLink = '',
    products = [],
    productsByCategory = {},
    currencySymbol = 'KSh',
    permalinkMap = {},
    margin,
    padding,
}: ExploreProductsSliderProps) {
    const rawId = useId();
    const sliderScope = `gadgets-explore-slider-${rawId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

    // Normalize category tabs
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
                return { id, label: id === 'all' ? 'All' : '' };
            }
            if (item && typeof item === 'object') {
                const rawItem = item as any;
                const id = cleanId(rawItem.id ?? rawItem._id ?? rawItem);
                const label = typeof rawItem.label === 'string' ? rawItem.label : '';
                return { id, label: label || (id === 'all' ? 'All' : 'Category') };
            }
            return { id: 'all', label: 'All' };
        }).filter((t) => Boolean(t.id));
    }, [categoryTabs]);

    const [activeTabId, setActiveTabId] = useState<string>(() => validTabs[0]?.id || 'all');

    useEffect(() => {
        if (validTabs.length > 0 && !validTabs.some((t) => t.id === activeTabId)) {
            setActiveTabId(validTabs[0]?.id || 'all');
        }
    }, [validTabs, activeTabId]);

    // Local products cache
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

        // Try local Next.js API first
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
        return boxes.find((b) => b.label === 'Gadgets Box 2')?.component ??
            boxes.find((b) => b.active === true)?.component ??
            boxes[0]?.component ??
            GadgetsBox2;
    }, [boxStyle]);

    // ── Embla Carousel Engine ──
    const [emblaRef, emblaApi] = useEmblaCarousel({
        loop: false,
        align: 'start',
        containScroll: 'trimSnaps',
        dragFree: true,
    });

    const [canPrev, setCanPrev] = useState(false);
    const [canNext, setCanNext] = useState(false);

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setCanPrev(emblaApi.canScrollPrev());
        setCanNext(emblaApi.canScrollNext());
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        onSelect();
        emblaApi.on('select', onSelect);
        emblaApi.on('reInit', onSelect);
        return () => {
            emblaApi.off('select', onSelect);
            emblaApi.off('reInit', onSelect);
        };
    }, [emblaApi, onSelect]);

    useEffect(() => {
        if (!emblaApi) return;
        try {
            const container = emblaApi.containerNode();
            if (container && container.children && container.children.length > 0) {
                emblaApi.scrollTo(0, true);
                emblaApi.reInit();
                onSelect();
            }
        } catch {
            // Unmounted
        }
    }, [emblaApi, activeTabId, onSelect, activeProductList.length]);

    const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
    const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

    // Responsive calculations
    const sDesk = Math.max(1, Number(slidesDesktop) || 4);
    const sTab = Math.max(1, Number(slidesTablet) || 2.5);
    const sMob = Math.max(1, Number(slidesMobile) || 1.3);

    const mobGap = Math.max(0, Number(gapMobile) || 2) * 4;
    const tabGap = Math.max(0, Number(gapTablet) || 3) * 4;
    const deskGap = Math.max(0, Number(gapDesktop) || 4) * 4;

    return (
        <section
            className={`w-full select-none font-sans py-4 sm:py-6 ${sliderScope}`}
            style={{ margin, padding }}
        >
            {/* Scoped CSS for Dynamic Responsive Columns */}
            <style dangerouslySetInnerHTML={{
                __html: `
                    .${sliderScope} .embla__viewport {
                        overflow: hidden;
                    }
                    .${sliderScope} .embla__container {
                        display: flex;
                        margin-left: -${mobGap}px;
                    }
                    .${sliderScope} .embla__slide {
                        flex: 0 0 calc(100% / ${sMob});
                        min-width: 0;
                        padding-left: ${mobGap}px;
                    }
                    @media (min-width: 768px) {
                        .${sliderScope} .embla__container {
                            margin-left: -${tabGap}px;
                        }
                        .${sliderScope} .embla__slide {
                            flex: 0 0 calc(100% / ${sTab});
                            padding-left: ${tabGap}px;
                        }
                    }
                    @media (min-width: 1024px) {
                        .${sliderScope} .embla__container {
                            margin-left: -${deskGap}px;
                        }
                        .${sliderScope} .embla__slide {
                            flex: 0 0 calc(100% / ${sDesk});
                            padding-left: ${deskGap}px;
                        }
                    }
                `
            }} />

            <div className="w-full space-y-6">
                {/* ── Header Row: Title & Category Tabs ── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="shrink-0">
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                            <span>{titlePrefix}</span>
                            <span className="text-gray-900 font-extrabold">{titleHighlight}</span>
                        </h2>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 max-w-full">
                        {validTabs.length > 1 && (
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
                                className="text-xs sm:text-sm font-bold text-gray-700 hover:text-blue-600 transition flex items-center gap-1 shrink-0 ml-1"
                            >
                                <span>View all</span>
                                <Icon icon="solar:arrow-right-linear" width={14} />
                            </Link>
                        )}
                    </div>
                </div>

                {/* ── Slider Track with Floating Side Arrows ── */}
                <div className="relative group/slider w-full">
                    {/* Left Circular Arrow button */}
                    {showArrows && (
                        <button
                            type="button"
                            onClick={scrollPrev}
                            disabled={!canPrev}
                            className={`absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-200 shadow-md cursor-pointer ${
                                canPrev
                                    ? 'bg-[#0f172a] text-white hover:bg-black hover:scale-105 active:scale-95'
                                    : 'bg-gray-100 text-gray-400 opacity-0 pointer-events-none'
                            }`}
                            aria-label="Previous products"
                        >
                            <Icon icon="solar:alt-arrow-left-linear" width={18} />
                        </button>
                    )}

                    {/* Embla Viewport */}
                    {loading && activeProductList.length === 0 ? (
                        <div className="flex items-center justify-center py-20 text-gray-400 gap-2.5 text-xs">
                            <Icon icon="svg-spinners:ring-resize" width={22} className="animate-spin text-blue-600" />
                            <span>Loading products...</span>
                        </div>
                    ) : activeProductList.length > 0 ? (
                        <div className="embla__viewport" ref={emblaRef}>
                            <div className="embla__container">
                                {activeProductList.map((prod, idx) => (
                                    <div
                                        key={`${prod._id || idx}-${idx}`}
                                        className="embla__slide"
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
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-400 bg-white rounded-3xl border border-gray-100 text-xs font-medium">
                            No products found for this category.
                        </div>
                    )}

                    {/* Right Circular Arrow button */}
                    {showArrows && (
                        <button
                            type="button"
                            onClick={scrollNext}
                            disabled={!canNext}
                            className={`absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-200 shadow-md cursor-pointer ${
                                canNext
                                    ? 'bg-[#0f172a] text-white hover:bg-black hover:scale-105 active:scale-95'
                                    : 'bg-gray-100 text-gray-400 opacity-0 pointer-events-none'
                            }`}
                            aria-label="Next products"
                        >
                            <Icon icon="solar:alt-arrow-right-linear" width={18} />
                        </button>
                    )}
                </div>
            </div>
        </section>
    );
}
