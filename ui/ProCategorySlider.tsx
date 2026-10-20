'use client';

/**
 * plugin/gadgets/ui/ProCategorySlider.tsx
 *
 * Pro-Category Tabs & Slider for Gadgets:
 *  - Header layout: Title on the LEFT ("Find your Sound").
 *  - Category logic on the RIGHT:
 *      * If only 1 category is selected, do NOT show tab buttons; show the category name on the right.
 *      * If more than 1 category is selected, show the list of category tabs.
 *      * Sleek circular arrow navigation buttons (< and >).
 *  - Single line responsive slider powered by Embla Carousel (embla-carousel-react).
 *  - Dynamic Box style selection (defaults to Gadgets Box 1 with CSS variable image heights).
 */

import React, { useState, useEffect, useCallback, useMemo, useRef, useId } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import useEmblaCarousel from 'embla-carousel-react';
import { getHooks } from '@/hook';
import { xFetch } from '@/lib/express';
import GadgetsBox1 from '../box/Box-1';
import type { CategoryTabConfig } from '../elements/CategorySelector';

export interface ProCategorySliderProps {
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

export default function ProCategorySlider({
    titlePrefix = 'Find your',
    titleHighlight = 'Sound',
    categoryTabs = [
        { id: 'all', label: 'New in' },
        { id: 'headphones', label: 'Headphones' },
        { id: 'speakers', label: 'Speakers' },
    ],
    limit = 10,
    boxStyle = 'Gadgets Box 1',
    slidesDesktop = 5,
    slidesTablet = 3,
    slidesMobile = 1.5,
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
}: ProCategorySliderProps) {
    const rawId = useId();
    const sliderScope = `gadgets-cat-slider-${rawId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

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

    // Fetch products for active tab with local DB fallback
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
            // Embla not mounted yet or nodes unmounted
        }
    }, [emblaApi, activeTabId, onSelect, activeProductList.length]);

    const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
    const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

    // Responsive calculations
    const sDesk = Math.max(1, Number(slidesDesktop) || 5);
    const sTab = Math.max(1, Number(slidesTablet) || 3);
    const sMob = Math.max(1, Number(slidesMobile) || 1.5);

    const mobGap = Math.max(0, Number(gapMobile) || 2) * 4;
    const tabGap = Math.max(0, Number(gapTablet) || 3) * 4;
    const deskGap = Math.max(0, Number(gapDesktop) || 4) * 4;

    const singleCategoryName = validTabs.length === 1 ? validTabs[0].label : '';

    return (
        <section
            className={`w-full select-none font-sans py-4 md:py-6 ${sliderScope}`}
            style={{ margin, padding }}
        >
            {/* Scoped CSS for Dynamic Responsive Columns in One Line */}
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

            <div className="w-full space-y-5">
                {/* ── Header: Title on LEFT, Categories on RIGHT ── */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Left: Section Title */}
                    <div className="shrink-0">
                        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                            <span>{titlePrefix}</span>
                            <span className="bg-linear-to-r from-orange-500 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                                {titleHighlight}
                            </span>
                        </h2>
                    </div>

                    {/* Right: Category Tabs (only when more than one) & Carousel Navigation */}
                    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-0.5 max-w-full">
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
                                            className={`px-4 py-2 rounded-full text-xs md:text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap ${
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

                        {/* Optional View All link */}
                        {viewAllLink && (
                            <Link
                                href={viewAllLink}
                                className="text-xs md:text-sm font-bold text-gray-700 hover:text-blue-600 transition flex items-center gap-1 shrink-0 ml-1"
                            >
                                <span>View all</span>
                                <Icon icon="solar:arrow-right-linear" width={14} />
                            </Link>
                        )}

                        {/* Carousel Arrows */}
                        {showArrows && (
                            <div className="flex items-center gap-1.5 shrink-0 ml-1">
                                <button
                                    type="button"
                                    onClick={scrollPrev}
                                    disabled={!canPrev}
                                    className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center transition shadow-2xs cursor-pointer ${
                                        canPrev
                                            ? 'bg-gray-100 hover:bg-gray-200 text-gray-800 hover:scale-105 active:scale-95'
                                            : 'bg-gray-50 text-gray-300 border border-gray-100 cursor-not-allowed opacity-50'
                                    }`}
                                    aria-label="Previous products"
                                >
                                    <Icon icon="solar:alt-arrow-left-linear" width={16} />
                                </button>
                                <button
                                    type="button"
                                    onClick={scrollNext}
                                    disabled={!canNext}
                                    className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center transition shadow-xs cursor-pointer ${
                                        canNext
                                            ? 'bg-[#0f172a] hover:bg-[#1e293b] text-white hover:scale-105 active:scale-95'
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                                    }`}
                                    aria-label="Next products"
                                >
                                    <Icon icon="solar:alt-arrow-right-linear" width={16} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Product List Below ── */}
                {loading && activeProductList.length === 0 ? (
                    <div className="flex items-center justify-center py-16 text-gray-400 gap-2.5 text-xs">
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
            </div>
        </section>
    );
}
