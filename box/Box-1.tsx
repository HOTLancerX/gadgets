'use client';

/**
 * plugin/gadgets/box/Box-1.tsx
 *
 * Gadgets Box 1 — Clean modern tech product card matching Apple Exclusive style:
 *  - Top-left stacked/inline rounded pill badges: [NEW] (emerald), [SALE] (red), [DEAL] (blue)
 *  - High-resolution centered device photo with smooth hover zoom
 *  - Bold product title with link to product details
 *  - Price layout: "From " (muted) + "{currency} {price}" (bold black)
 *  - Seamless VariantPopup integration for storage/color/specs configuration
 *  - Responsive & touch-friendly
 */

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import VariantPopup, { type VariantData } from './VariantPopup';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GadgetsBox1Props {
    data: {
        _id: string;
        title: string;
        slug: string;
        status?: string;
        category?: string | null;
        createdAt?: string;
        info?: Record<string, string>;
    };
    productUrl?: string;
    currencySymbol?: string;
    permalinkMap?: Record<string, string>;
    imageHeightDesktop?: number;
    imageHeightMobile?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseJson<T>(raw: string | undefined, fallback: T): T {
    if (!raw) return fallback;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

function fmtPrice(n: number): string {
    return Number(n).toLocaleString('en-US', {
        minimumFractionDigits: n % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
    });
}

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

export default function GadgetsBox1({
    data,
    productUrl,
    currencySymbol = 'KSh',
    permalinkMap = {},
    imageHeightDesktop = 250,
    imageHeightMobile = 170,
}: GadgetsBox1Props) {
    const slug = data?.slug || String(data?._id || '');
    const productPrefix = (permalinkMap?.['product'] ?? 'product').trim().replace(/^\/+|\/+$/g, '') || 'product';
    const href = productUrl || `/${productPrefix}/${slug}`;

    const variate = parseJson<Record<string, any>>(data?.info?._variate, {});
    const priceType = (variate.priceType ?? 'single') as 'single' | 'variant';
    const variants = (variate.variants ?? []) as VariantData[];

    // ── Single mode pricing ──
    const sellingPrice = parseFloat(variate.sellingprice || data?.info?.sellingprice || '0') || 0;
    const regularPrice = parseFloat(variate.regularprice || data?.info?.regularprice || '0') || 0;
    const singleStock = variate.stock !== undefined ? parseInt(variate.stock, 10) : (data?.info?.stock ? parseInt(data.info.stock, 10) : 999);
    const singleBasePrice = sellingPrice > 0 ? sellingPrice : regularPrice;
    const hasDiscount = regularPrice > singleBasePrice && singleBasePrice > 0;
    const discountPercent = hasDiscount && regularPrice > 0 ? Math.round(((regularPrice - singleBasePrice) / regularPrice) * 100) : 0;

    // ── Variant mode pricing ──
    const variantPrices = variants
        .map((v) => parseFloat(v.price ?? '0') || 0)
        .filter((p) => p > 0);
    const minPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : singleBasePrice;
    const maxPrice = variantPrices.length > 0 ? Math.max(...variantPrices) : singleBasePrice;
    const totalVariantStock = variants.reduce(
        (sum, v) => sum + (parseInt(v.quantity ?? '0', 10) || 0),
        0
    );

    const selectedAttributes: { label: string; values: string[]; displayStyle?: string }[] =
        variate.selectedAttributes ?? [];

    const isSoldOut = data?.status === 'out_of_stock' || (priceType === 'single' ? singleStock <= 0 : (variants.length > 0 && totalVariantStock <= 0));
    const inStock = !isSoldOut;

    // Image resolution
    let displayImg = '';
    const images = parseJson<string[]>(data?.info?.images, []);
    if (images && images.length > 0) {
        displayImg = images[0];
    } else if (data?.info?.image) {
        displayImg = data.info.image;
    } else if (data?.info?.thumbnail) {
        displayImg = data.info.thumbnail;
    }

    // Dynamic badges: NEW, SALE, DEAL
    const isNew = Boolean(
        data?.info?.badge?.toLowerCase().includes('new') ||
        data?.info?.is_new === 'true' ||
        (data?.createdAt && Date.now() - new Date(data.createdAt).getTime() < 30 * 24 * 60 * 60 * 1000)
    );
    const isSale = Boolean(hasDiscount || discountPercent > 0 || data?.info?.badge?.toLowerCase().includes('sale'));
    const isDeal = Boolean(
        data?.info?.deal === 'true' ||
        data?.info?.is_deal === 'true' ||
        data?.info?.badge?.toLowerCase().includes('deal') ||
        (hasDiscount && discountPercent >= 15)
    );

    // Modal state
    const [showPopup, setShowPopup] = useState(false);
    const [cartQty, setCartQty] = useState(0);

    const checkCartQty = useCallback(() => {
        if (typeof window === 'undefined') return;
        try {
            const raw = localStorage.getItem('shopping_cart');
            const cart: any[] = raw ? JSON.parse(raw) : [];
            const matchingItems = cart.filter((i: any) => String(i.productId) === String(data?._id));
            const total = matchingItems.reduce((sum: number, i: any) => sum + (i.quantity || 0), 0);
            setCartQty(total);
        } catch {
            setCartQty(0);
        }
    }, [data?._id]);

    useEffect(() => {
        checkCartQty();
        const onCartUpdate = () => checkCartQty();
        window.addEventListener('cartUpdated', onCartUpdate);
        return () => window.removeEventListener('cartUpdated', onCartUpdate);
    }, [checkCartQty]);

    // Handle variant cart add
    const handleVariantCart = (variant: VariantData, qty: number) => {
        const price = parseFloat(variant.price ?? '0') || singleBasePrice;
        const maxQty = parseInt(variant.quantity ?? '0', 10) || 9999;
        const addQty = Math.max(1, qty || 1);

        addToCartDirect(
            {
                productId: String(data._id),
                productSlug: data.slug,
                productTitle: data.title,
                productImage: variant.image || displayImg,
                variantId: variant.id,
                variantOptions: variant.options,
                sku: variant.sku,
                price,
                quantity: addQty,
                maxQuantity: maxQty,
                shippingInside: parseFloat(data.info?.shipping_inside ?? '') || undefined,
                shippingOutside: parseFloat(data.info?.shipping_outside ?? '') || undefined,
            },
            addQty
        );
        checkCartQty();
        setShowPopup(false);
    };

    // Card click or option button
    const handleActionClick = (e: React.MouseEvent) => {
        if (priceType === 'variant' && variants.length > 0) {
            e.preventDefault();
            e.stopPropagation();
            setShowPopup(true);
        }
    };

    const displayPrice = priceType === 'variant' ? minPrice : singleBasePrice;

    return (
        <>
            <div className="group relative flex flex-col justify-between w-full h-full bg-white rounded-2xl border border-gray-200 hover:border-gray-200/90 shadow-2xs hover:shadow-lg transition-all duration-300 p-3 md:p-4 select-none">
                {/* ── Top Area: Badges & Photo ── */}
                <div
                    className="relative w-full overflow-hidden shrink-0 flex items-center justify-center h-(--h-mob) md:h-(--h-desk) mb-3"
                    style={{
                        "--h-mob": `${imageHeightMobile}px`,
                        "--h-desk": `${imageHeightDesktop}px`,
                    } as React.CSSProperties}
                >
                    {/* Badges Stack (Top-Left) matching screenshot */}
                    <div className="absolute top-1 left-1 z-10 flex flex-col items-start gap-1">
                        {isNew && (
                            <span className="bg-[#059669] text-white text-[9px] md:text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-2xs tracking-wider">
                                NEW
                            </span>
                        )}
                        {isSale && (
                            <span className="bg-[#dc2626] text-white text-[9px] md:text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-2xs tracking-wider">
                                SALE
                            </span>
                        )}
                        {isDeal && (
                            <span className="bg-[#2563eb] text-white text-[9px] md:text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-2xs tracking-wider">
                                DEAL
                            </span>
                        )}
                    </div>

                    {/* Out of Stock Pill */}
                    {!inStock && (
                        <span className="absolute top-1 right-1 z-10 bg-gray-900/80 text-white text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded shadow-2xs">
                            Sold Out
                        </span>
                    )}

                    {/* Centered Device Photo with Zoom Hover */}
                    <Link
                        href={href}
                        prefetch={true}
                        className="w-full h-full flex items-center justify-center p-2 md:p-3"
                    >
                        {displayImg ? (
                            <Image
                                src={displayImg}
                                alt={data?.title || 'Product'}
                                width={260}
                                height={260}
                                className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-300 mix-blend-multiply brightness-105"
                                unoptimized
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <Icon icon="solar:devices-bold-duotone" width={64} />
                            </div>
                        )}
                    </Link>

                    {/* Quick Config / Bag Icon if variants available */}
                    {priceType === 'variant' && variants.length > 0 && (
                        <button
                            type="button"
                            onClick={handleActionClick}
                            className="absolute bottom-1 right-1 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-white border border-gray-200 text-gray-700 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer hover:scale-105"
                            title="Configure Options"
                        >
                            <Icon icon="solar:tuning-bold" width={16} />
                        </button>
                    )}
                </div>

                {/* ── Bottom Area: Title & Price ── */}
                <div className="space-y-1.5 pt-1">
                    {/* Product Title */}
                    <Link
                        href={href}
                        prefetch={true}
                        className="block text-sm md:text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate tracking-tight"
                        title={data?.title}
                    >
                        {data?.title}
                    </Link>

                    {/* Stock Status */}
                    <div className="pt-0.5">
                        {inStock ? (
                            <span className="text-[11px] md:text-xs font-medium text-emerald-600">
                                In stock
                            </span>
                        ) : (
                            <span className="text-[11px] md:text-xs font-medium text-rose-500">
                                Out of stock
                            </span>
                        )}
                    </div>

                    {/* Price Row */}
                    <div className="flex items-baseline gap-1.5 flex-wrap pt-0.5">
                        {priceType === 'variant' && minPrice !== maxPrice && (
                            <span className="text-xs md:text-sm text-gray-400 font-normal">
                                From
                            </span>
                        )}
                        <span className="text-sm md:text-base font-extrabold text-gray-950 tracking-tight">
                            {currencySymbol} {fmtPrice(displayPrice)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Variant Popup Modal */}
            {showPopup && priceType === 'variant' && (
                <VariantPopup
                    productId={String(data._id)}
                    productSlug={data.slug}
                    productTitle={data.title}
                    productImage={displayImg}
                    variants={variants}
                    selectedAttributes={selectedAttributes}
                    currencySymbol={currencySymbol}
                    onClose={() => setShowPopup(false)}
                    onAddToCart={handleVariantCart}
                    shippingInside={parseFloat(data.info?.shipping_inside ?? '') || undefined}
                    shippingOutside={parseFloat(data.info?.shipping_outside ?? '') || undefined}
                />
            )}
        </>
    );
}
