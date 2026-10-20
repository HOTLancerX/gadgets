'use client';

/**
 * plugin/gadgets/box/Box-2.tsx
 *
 * Gadgets Box 2 — Explore Products Card:
 *  - Soft off-white / light gray card container (bg-[#f3f4f6] rounded-3xl)
 *  - Red "SALE" or "NEW" badge top-left
 *  - Responsive product image with instant color-swatch image switching
 *  - Center rounded black pill button: "Choose options" (if variants) or "Add to cart"
 *  - Product title & "From KSh {price}" layout
 *  - Color swatches below price: clicking any color circle swaps the product image above!
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import VariantPopup, { type VariantData } from './VariantPopup';

export interface GadgetsBox2Props {
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

// Fallback color map for common color names to CSS hex
const COLOR_NAME_MAP: Record<string, string> = {
    black: '#111827',
    midnight: '#0f172a',
    obsidian: '#1e293b',
    onyx: '#18181b',
    dark: '#1f2937',
    white: '#f9fafb',
    starlight: '#f1f5f9',
    porcelain: '#f8fafc',
    pearl: '#f3f4f6',
    silver: '#e2e8f0',
    titanium: '#94a3b8',
    graphite: '#475569',
    gray: '#64748b',
    grey: '#64748b',
    lavender: '#c084fc',
    purple: '#a855f7',
    violet: '#8b5cf6',
    plum: '#701a75',
    blue: '#3b82f6',
    navy: '#1e3a8a',
    teal: '#14b8a6',
    cyan: '#06b6d4',
    green: '#4d6b5e',
    emerald: '#10b981',
    mint: '#86efac',
    olive: '#65a30d',
    sage: '#84a98c',
    gold: '#eab308',
    yellow: '#facc15',
    amber: '#f59e0b',
    orange: '#f97316',
    coral: '#fb7185',
    peach: '#fdba74',
    red: '#ef4444',
    crimson: '#dc2626',
    rose: '#f43f5e',
    pink: '#ec4899',
    brown: '#78350f',
    bronze: '#92400e',
};

function resolveColorHex(val?: string): string {
    if (!val) return '#94a3b8';
    const trimmed = val.trim().toLowerCase();
    if (trimmed.startsWith('#') || trimmed.startsWith('rgb') || trimmed.startsWith('hsl')) return val;
    if (COLOR_NAME_MAP[trimmed]) return COLOR_NAME_MAP[trimmed];

    // Match known color name contained in string (e.g. "Space Gray", "Midnight Blue")
    const sortedKeys = Object.keys(COLOR_NAME_MAP).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
        if (trimmed.includes(key)) {
            return COLOR_NAME_MAP[key];
        }
    }
    return '#94a3b8';
}

function getVariantColor(v: VariantData): { name: string; hex: string } | null {
    let colorName = '';
    let colorHexSource = '';

    // Check options object for any key matching "color" or "colour"
    if (v.options && typeof v.options === 'object') {
        for (const [key, val] of Object.entries(v.options)) {
            if (/colou?r/i.test(key) && typeof val === 'string' && val.trim()) {
                colorName = val.trim();
                break;
            }
        }
    }

    // Check direct color property
    if (v.color && v.color.trim()) {
        colorHexSource = v.color.trim();
        if (!colorName) {
            colorName = colorHexSource;
        }
    } else if (colorName) {
        colorHexSource = colorName;
    }

    // If no color was found, this variant has NO color
    if (!colorName && !colorHexSource) {
        return null;
    }

    return {
        name: colorName,
        hex: resolveColorHex(colorHexSource || colorName),
    };
}

export default function GadgetsBox2({
    data,
    productUrl,
    currencySymbol = 'KSh',
    permalinkMap = {},
    imageHeightDesktop = 210,
    imageHeightMobile = 170,
}: GadgetsBox2Props) {
    const slug = data?.slug || String(data?._id || '');
    const productPrefix = (permalinkMap?.['product'] ?? 'product').trim().replace(/^\/+|\/+$/g, '') || 'product';
    const href = productUrl || `/${productPrefix}/${slug}`;

    const variate = parseJson<Record<string, any>>(data?.info?._variate, {});
    const priceType = (variate.priceType ?? 'single') as 'single' | 'variant';
    const variants = (variate.variants ?? []) as VariantData[];

    // Pricing
    const sellingPrice = parseFloat(variate.sellingprice || data?.info?.sellingprice || '0') || 0;
    const regularPrice = parseFloat(variate.regularprice || data?.info?.regularprice || '0') || 0;
    const singleStock = variate.stock !== undefined ? parseInt(variate.stock, 10) : (data?.info?.stock ? parseInt(data.info.stock, 10) : 999);
    const singleBasePrice = sellingPrice > 0 ? sellingPrice : regularPrice;
    const hasDiscount = regularPrice > singleBasePrice && singleBasePrice > 0;

    const variantPrices = variants
        .map((v) => parseFloat(v.price ?? '0') || 0)
        .filter((p) => p > 0);
    const minPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : singleBasePrice;
    const maxPrice = variantPrices.length > 0 ? Math.max(...variantPrices) : singleBasePrice;
    const totalVariantStock = variants.reduce(
        (sum, v) => sum + (parseInt(v.quantity ?? '0', 10) || 0),
        0
    );

    const isSoldOut = data?.status === 'out_of_stock' || (priceType === 'variant' ? totalVariantStock <= 0 : singleStock <= 0);
    const inStock = !isSoldOut;

    // Default main image
    const defaultImg = useMemo(() => {
        const images = parseJson<string[]>(data?.info?.images, []);
        if (images && images.length > 0) return images[0];
        return data?.info?.image || data?.info?.thumbnail || '';
    }, [data?.info]);

    // Active displayed image (can be changed by clicking color swatches)
    const [activeImg, setActiveImg] = useState<string>(defaultImg);
    const [selectedColor, setSelectedColor] = useState<string>('');

    // Extract unique color variants for color swatches
    // ONLY displayed if the product is type 'variant' AND variants have an actual color defined
    const colorSwatches = useMemo(() => {
        if (priceType !== 'variant' || !variants || variants.length === 0) return [];
        const seen = new Set<string>();
        const swatches: { name: string; hex: string; image?: string; variant: VariantData }[] = [];

        for (const v of variants) {
            const colorInfo = getVariantColor(v);
            if (!colorInfo) continue; // Skip non-color variants!

            const key = colorInfo.name.toLowerCase();
            if (seen.has(key)) continue;
            seen.add(key);

            swatches.push({
                name: colorInfo.name,
                hex: colorInfo.hex,
                image: v.image,
                variant: v,
            });
        }
        return swatches;
    }, [priceType, variants]);

    // Keep activeImg synced if data changes & select initial swatch
    useEffect(() => {
        setActiveImg(defaultImg);
        if (priceType === 'variant' && colorSwatches.length > 0) {
            const matchingSwatch = colorSwatches.find((s) => s.image && s.image === defaultImg);
            setSelectedColor(matchingSwatch ? matchingSwatch.name : colorSwatches[0].name);
        } else {
            setSelectedColor('');
        }
    }, [defaultImg, priceType, colorSwatches]);

    // Handle color swatch click: swaps the main product image!
    const handleColorClick = (swatch: { name: string; hex: string; image?: string }) => {
        setSelectedColor(swatch.name);
        if (swatch.image) {
            setActiveImg(swatch.image);
        }
    };

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

    // Button action: Choose Options or Add to Cart
    const handleButtonClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!inStock) return;

        if (priceType === 'variant' && variants.length > 0) {
            setShowPopup(true);
            return;
        }

        addToCartDirect({
            productId: String(data._id),
            productSlug: data.slug,
            productTitle: data.title,
            productImage: activeImg || defaultImg,
            price: singleBasePrice,
            maxQuantity: singleStock || 9999,
        });
        checkCartQty();
    };

    const handleVariantCart = (variant: VariantData, qty: number) => {
        const price = parseFloat(variant.price ?? '0') || singleBasePrice;
        const maxQty = parseInt(variant.quantity ?? '0', 10) || 9999;
        const addQty = Math.max(1, qty || 1);

        addToCartDirect({
            productId: String(data._id),
            productSlug: data.slug,
            productTitle: data.title,
            productImage: variant.image || activeImg || defaultImg,
            variantId: variant.id,
            variantOptions: variant.options,
            sku: variant.sku,
            price,
            quantity: addQty,
            maxQuantity: maxQty,
        }, addQty);
        checkCartQty();
        setShowPopup(false);
    };

    const displayPrice = priceType === 'variant' ? minPrice : singleBasePrice;
    const isSale = Boolean(hasDiscount || data?.info?.badge?.toLowerCase().includes('sale'));

    return (
        <>
            <div className="group relative flex flex-col justify-between w-full h-full bg-[#f3f4f6] rounded-2xl md:rounded-3xl p-4 md:p-5 select-none transition-all duration-300 hover:shadow-md">
                {/* ── Top Area: SALE Badge & Device Image ── */}
                <div>
                    <div className="relative w-full flex items-center justify-between mb-2 min-h-5">
                        {isSale ? (
                            <span className="text-[11px] font-bold text-rose-500 uppercase tracking-widest">
                                SALE
                            </span>
                        ) : <span />}

                        {!inStock && (
                            <span className="bg-gray-900/80 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-2xs">
                                Sold Out
                            </span>
                        )}
                    </div>

                    {/* Centered Device Image with dynamic CSS height */}
                    <div
                        className="relative w-full overflow-hidden shrink-0 flex items-center justify-center h-(--h-mob) md:h-(--h-desk) mb-3"
                        style={{
                            "--h-mob": `${imageHeightMobile}px`,
                            "--h-desk": `${imageHeightDesktop}px`,
                        } as React.CSSProperties}
                    >
                        <Link href={href} className="w-full h-full flex items-center justify-center p-2">
                            {activeImg ? (
                                <Image
                                    src={activeImg}
                                    alt={data?.title || 'Product'}
                                    width={260}
                                    height={260}
                                    className="object-contain w-full h-full group-hover:scale-104 transition-all duration-300 mix-blend-multiply"
                                    unoptimized
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    <Icon icon="solar:devices-bold-duotone" width={64} />
                                </div>
                            )}
                        </Link>
                    </div>

                    {/* Black Pill Button: "Choose options" or "Add to cart" */}
                    <div className="flex justify-center mb-4">
                        <button
                            type="button"
                            onClick={handleButtonClick}
                            disabled={!inStock}
                            className="bg-[#0f172a] hover:bg-[#1e293b] active:scale-95 text-white text-xs md:text-[13px] font-bold py-2.5 px-6 rounded-full shadow-xs transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {priceType === 'variant' && variants.length > 0
                                ? 'Choose options'
                                : (cartQty > 0 ? `In cart (${cartQty})` : 'Add to cart')
                            }
                        </button>
                    </div>
                </div>

                {/* ── Bottom Area: Title, Price & Color Swatches ── */}
                <div className="space-y-1.5 pt-1">
                    {/* Title */}
                    <Link
                        href={href}
                        className="block text-sm md:text-base font-bold text-gray-950 hover:text-blue-600 transition-colors truncate tracking-tight"
                        title={data?.title}
                    >
                        {data?.title}
                    </Link>

                    {/* Price Row */}
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                        {priceType === 'variant' && (
                            <span className="text-xs md:text-sm text-gray-400 font-normal">
                                From
                            </span>
                        )}
                        <span className="text-sm md:text-base font-extrabold text-gray-950 tracking-tight">
                            {currencySymbol} {fmtPrice(displayPrice)}
                        </span>
                    </div>

                    {/* Interactive Color Swatches: ONLY displayed if priceType is 'variant' and has colors */}
                    {priceType === 'variant' && colorSwatches.length > 0 && (
                        <div className="flex items-center justify-center gap-1.5 pt-2 flex-wrap">
                            {colorSwatches.map((swatch, idx) => {
                                const isCurrent = (selectedColor ? selectedColor === swatch.name : idx === 0);
                                return (
                                    <button
                                        key={`${swatch.name}-${idx}`}
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleColorClick(swatch);
                                        }}
                                        className={`w-4 h-4 md:w-5 md:h-5 rounded-full transition-all duration-200 cursor-pointer border ${
                                            isCurrent
                                                ? 'ring-2 ring-gray-950 ring-offset-2 scale-110 border-transparent'
                                                : 'border-black/10 hover:scale-110'
                                        }`}
                                        style={{ backgroundColor: swatch.hex }}
                                        title={swatch.name}
                                        aria-label={`Select color ${swatch.name}`}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Variant Popup Modal */}
            {showPopup && priceType === 'variant' && (
                <VariantPopup
                    productId={String(data._id)}
                    productSlug={data.slug}
                    productTitle={data.title}
                    productImage={activeImg || defaultImg}
                    variants={variants}
                    selectedAttributes={variate.selectedAttributes ?? []}
                    currencySymbol={currencySymbol}
                    onClose={() => setShowPopup(false)}
                    onAddToCart={handleVariantCart}
                />
            )}
        </>
    );
}
