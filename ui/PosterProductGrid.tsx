'use client';

/**
 * cms/plugin/gadgets/ui/PosterProductGrid.tsx
 *
 * "Explore soundcore" - Poster Product Grid Element:
 *  - Big visual poster product cards (aspect ratio ~3:4 or customizable height)
 *  - High-impact product imagery with smooth rounded corners
 *  - Subtle bottom gradient overlay for maximum contrast
 *  - Bottom-left layout:
 *      * Bold white product title ("Liberty 5 Pro", "Rave 3S", "Boom 2", "Select 3")
 *      * Pill-shaped white "Add to cart" button with dark text & active cart dispatch
 *  - Connects to catalog categories OR manual custom poster items
 *  - Dynamic responsive grid computed from columnsMobile, columnsTablet, columnsDesktop and gaps
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { xFetch } from '@/lib/express';
import type { CategoryTabConfig } from '../elements/CategorySelector';
import VariantPopup, { type VariantData } from '../box/VariantPopup';

export interface PosterProductItem {
    id: string;
    title: string;
    image: string;
    price?: number;
    currencySymbol?: string;
    buttonText?: string;
    link?: string;
    productId?: string;
}

export interface PosterProductGridProps {
    titlePrefix?: string;
    titleHighlight?: string;
    categoryTabs?: CategoryTabConfig[];
    itemsMode?: 'catalog' | 'manual';
    manualItems?: PosterProductItem[];
    limit?: number;
    buttonText?: string;
    currencySymbol?: string;
    columnsDesktop?: number;
    columnsTablet?: number;
    columnsMobile?: number;
    gapDesktop?: number;
    gapTablet?: number;
    gapMobile?: number;
    borderRadius?: number;
    aspectRatio?: string; // e.g. "3/4" or "4/5"
    cardHeightDesktop?: number;
    products?: any[];
    permalinkMap?: Record<string, string>;
    margin?: any;
    padding?: any;
}

export const DEFAULT_POSTER_ITEMS: PosterProductItem[] = [
    {
        id: 'p-1',
        title: 'Liberty 5 Pro',
        image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80',
        price: 129,
        buttonText: 'Add to cart',
        link: '',
    },
    {
        id: 'p-2',
        title: 'Rave 3S',
        image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=80',
        price: 199,
        buttonText: 'Add to cart',
        link: '',
    },
    {
        id: 'p-3',
        title: 'Boom 2',
        image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80',
        price: 149,
        buttonText: 'Add to cart',
        link: '',
    },
    {
        id: 'p-4',
        title: 'Select 3',
        image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&auto=format&fit=crop&q=80',
        price: 79,
        buttonText: 'Add to cart',
        link: '',
    },
];

function addToCartDirect(item: Record<string, any>, delta: number = 1) {
    try {
        const raw = localStorage.getItem('shopping_cart');
        const cart: any[] = raw ? JSON.parse(raw) : [];
        const idx = cart.findIndex(
            (c: any) => String(c.productId) === String(item.productId) && (c.variantId || '') === (item.variantId || '')
        );
        const maxQty = (item.maxQuantity as number) || 9999;

        if (idx >= 0) {
            const newQty = (cart[idx].quantity || 0) + delta;
            if (newQty <= 0) {
                cart.splice(idx, 1);
            } else {
                cart[idx].quantity = Math.min(newQty, maxQty);
            }
        } else if (delta > 0) {
            cart.push({
                ...item,
                quantity: Math.min(item.quantity || delta, maxQty),
            });
        }
        localStorage.setItem('shopping_cart', JSON.stringify(cart));
        window.dispatchEvent(new Event('cartUpdated'));
    } catch {
        // localStorage unavailable
    }
}

export default function PosterProductGrid({
    titlePrefix = 'Explore',
    titleHighlight = 'soundcore',
    categoryTabs = [],
    itemsMode = 'catalog',
    manualItems = DEFAULT_POSTER_ITEMS,
    limit = 4,
    buttonText = 'Add to cart',
    currencySymbol = 'KSh',
    columnsDesktop = 4,
    columnsTablet = 2,
    columnsMobile = 1,
    gapDesktop = 4,
    gapTablet = 3,
    gapMobile = 3,
    borderRadius = 24,
    aspectRatio = '3/4',
    cardHeightDesktop,
    products = [],
    permalinkMap = {},
    margin,
    padding,
}: PosterProductGridProps) {
    const [fetchedProducts, setFetchedProducts] = useState<any[]>(products || []);
    const [loading, setLoading] = useState<boolean>(itemsMode === 'catalog' && (!products || products.length === 0));
    const [addedId, setAddedId] = useState<string | null>(null);
    const [activeVariantProduct, setActiveVariantProduct] = useState<any | null>(null);

    // Fetch catalog products if itemsMode === 'catalog' and no initial products
    useEffect(() => {
        if (itemsMode !== 'catalog') return;
        if (products && products.length > 0) {
            setFetchedProducts(products);
            setLoading(false);
            return;
        }

        const catId = categoryTabs?.[0]?.id === 'all' ? '' : categoryTabs?.[0]?.id || '';
        const safeLimit = Math.min(Number(limit) || 4, 24);

        const fetchLocal = async () => {
            try {
                const queryParams = new URLSearchParams({
                    type: 'product',
                    limit: String(safeLimit),
                });
                if (catId) queryParams.set('category', catId);

                const res = await fetch(`/api/admin-posts?${queryParams.toString()}`);
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data.posts) && data.posts.length > 0) {
                        setFetchedProducts(data.posts);
                        setLoading(false);
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
            if (catId) params.set('cats', catId);

            xFetch(`/builder-post?${params.toString()}`)
                .then((r) => r.json())
                .then((data) => {
                    const list = data.posts || data.products || [];
                    setFetchedProducts(list);
                    setLoading(false);
                })
                .catch(() => {
                    setFetchedProducts([]);
                    setLoading(false);
                });
        });
    }, [itemsMode, categoryTabs, limit, products]);

    // ── Responsive Grid Formula ──
    const mobColsClass = Number(columnsMobile) || 1;
    const tabColsClass = Number(columnsTablet) || 2;
    const deskColsClass = Number(columnsDesktop) || 4;

    const mobGapClass = `gap-${gapMobile != null ? Number(gapMobile) : 3}`;
    const tabGapClass = `md:gap-${gapTablet != null ? Number(gapTablet) : 3}`;
    const deskGapClass = `lg:gap-${gapDesktop != null ? Number(gapDesktop) : 4}`;

    const gridClass = `grid grid-cols-${mobColsClass} md:grid-cols-${tabColsClass} lg:grid-cols-${deskColsClass} ${mobGapClass} ${tabGapClass} ${deskGapClass} w-full`;

    // Normalizing display cards: either catalog products or manual items
    const displayCards = useMemo(() => {
        if (itemsMode === 'manual') {
            return (manualItems && manualItems.length > 0 ? manualItems : DEFAULT_POSTER_ITEMS).map((item) => ({
                id: item.id,
                title: item.title,
                image: item.image,
                price: item.price,
                buttonText: item.buttonText || buttonText,
                link: item.link || '',
                isCatalog: false,
                rawProduct: null,
            }));
        }

        if (fetchedProducts.length === 0) {
            // fallback to default poster items if catalog empty
            return DEFAULT_POSTER_ITEMS.map((item) => ({
                id: item.id,
                title: item.title,
                image: item.image,
                price: item.price,
                buttonText: item.buttonText || buttonText,
                link: item.link || '',
                isCatalog: false,
                rawProduct: null,
            }));
        }

        const productPrefix = (permalinkMap?.['product'] ?? 'product').trim().replace(/^\/+|\/+$/g, '') || 'product';

        return fetchedProducts.slice(0, Number(limit) || 4).map((p: any) => {
            let img = '';
            try {
                const images = p.info?.images ? JSON.parse(p.info.images) : [];
                if (images.length > 0) img = images[0];
            } catch {
                img = '';
            }
            if (!img) img = p.info?.image || p.info?.thumbnail || '';

            let variate: any = {};
            try {
                if (p.info?._variate) variate = JSON.parse(p.info._variate);
            } catch {}

            const sellingPrice = parseFloat(variate.sellingprice || p.info?.sellingprice || '0') || 0;
            const regularPrice = parseFloat(variate.regularprice || p.info?.regularprice || '0') || 0;
            const price = sellingPrice > 0 ? sellingPrice : regularPrice;

            return {
                id: String(p._id),
                title: p.title,
                image: img || DEFAULT_POSTER_ITEMS[0].image,
                price,
                buttonText,
                link: `/${productPrefix}/${p.slug || p._id}`,
                isCatalog: true,
                rawProduct: p,
            };
        });
    }, [itemsMode, manualItems, fetchedProducts, buttonText, limit, permalinkMap]);

    const handleAddToCart = (card: any, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (card.rawProduct) {
            let variate: any = {};
            try {
                if (card.rawProduct.info?._variate) {
                    variate = JSON.parse(card.rawProduct.info._variate);
                }
            } catch {}

            const variants = (variate.variants ?? []) as VariantData[];
            if (variate.priceType === 'variant' && variants.length > 0) {
                setActiveVariantProduct(card.rawProduct);
                return;
            }

            addToCartDirect({
                productId: String(card.rawProduct._id),
                productSlug: card.rawProduct.slug,
                productTitle: card.rawProduct.title,
                productImage: card.image,
                price: card.price || 0,
                quantity: 1,
            });
        } else {
            addToCartDirect({
                productId: card.id,
                productSlug: card.id,
                productTitle: card.title,
                productImage: card.image,
                price: card.price || 0,
                quantity: 1,
            });
        }

        setAddedId(card.id);
        setTimeout(() => setAddedId(null), 1800);
    };

    const handleVariantCart = (variant: VariantData, qty: number) => {
        if (!activeVariantProduct) return;
        const price = parseFloat(variant.price ?? '0') || 0;
        const addQty = Math.max(1, qty || 1);

        addToCartDirect(
            {
                productId: String(activeVariantProduct._id),
                productSlug: activeVariantProduct.slug,
                productTitle: activeVariantProduct.title,
                productImage: variant.image || activeVariantProduct.info?.image,
                variantId: variant.id,
                variantOptions: variant.options,
                sku: variant.sku,
                price,
                quantity: addQty,
            },
            addQty
        );
        setActiveVariantProduct(null);
    };

    return (
        <section
            className="w-full select-none font-sans py-4 sm:py-6"
            style={{ margin, padding }}
        >
            <div className="w-full space-y-4 sm:space-y-6">
                {/* ── Header: Title ── */}
                {(titlePrefix || titleHighlight) && (
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                            {titlePrefix && <span>{titlePrefix}</span>}
                            {titleHighlight && (
                                <span className="text-indigo-950 dark:text-indigo-400">
                                    {titleHighlight}
                                </span>
                            )}
                        </h2>
                    </div>
                )}

                {/* ── Poster Product Grid ── */}
                <div className={gridClass}>
                    {displayCards.map((card, idx) => (
                        <div
                            key={card.id || idx}
                            className="group relative w-full overflow-hidden bg-slate-900 shadow-sm hover:shadow-2xl transition-all duration-300"
                            style={{
                                borderRadius: `${borderRadius}px`,
                                aspectRatio: cardHeightDesktop ? undefined : (aspectRatio || '3/4'),
                                height: cardHeightDesktop ? `${cardHeightDesktop}px` : undefined,
                            }}
                        >
                            {/* Product Poster Image */}
                            <img
                                src={card.image}
                                alt={card.title}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                loading="lazy"
                            />

                            {/* Deep Bottom Gradient for contrast */}
                            <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/25 to-transparent opacity-85 group-hover:opacity-90 transition-opacity" />

                            {/* Direct Link Overlay over upper image area */}
                            {card.link && (
                                <Link
                                    href={card.link}
                                    className="absolute inset-0 z-10"
                                    aria-label={card.title}
                                />
                            )}

                            {/* Bottom Content Area: Product Title + Add to cart Button */}
                            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 z-20 flex flex-col items-start gap-3 pointer-events-none">
                                <h3 className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight drop-shadow-md line-clamp-1 pointer-events-auto">
                                    {card.link ? (
                                        <Link href={card.link} className="hover:underline">
                                            {card.title}
                                        </Link>
                                    ) : (
                                        card.title
                                    )}
                                </h3>

                                {/* White Pill Button */}
                                <button
                                    type="button"
                                    onClick={(e) => handleAddToCart(card, e)}
                                    className="pointer-events-auto inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-white text-slate-900 text-xs sm:text-sm font-bold shadow-md hover:bg-slate-100 active:scale-95 transition-all duration-200 cursor-pointer"
                                >
                                    {addedId === card.id ? (
                                        <span className="flex items-center gap-1.5 text-emerald-600 font-extrabold">
                                            <Icon icon="solar:check-circle-bold" className="w-4 h-4" />
                                            Added!
                                        </span>
                                    ) : (
                                        card.buttonText || 'Add to cart'
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Variant configuration popup if a variant product is clicked */}
            {activeVariantProduct && (
                <VariantPopup
                    productId={String(activeVariantProduct._id)}
                    productSlug={activeVariantProduct.slug}
                    productTitle={activeVariantProduct.title}
                    productImage={activeVariantProduct.info?.image || ''}
                    currencySymbol={currencySymbol}
                    variants={(() => {
                        try {
                            return JSON.parse(activeVariantProduct.info?._variate || '{}').variants || [];
                        } catch {
                            return [];
                        }
                    })()}
                    selectedAttributes={(() => {
                        try {
                            return JSON.parse(activeVariantProduct.info?._variate || '{}').selectedAttributes || [];
                        } catch {
                            return [];
                        }
                    })()}
                    onClose={() => setActiveVariantProduct(null)}
                    onAddToCart={handleVariantCart}
                />
            )}
        </section>
    );
}
