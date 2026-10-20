"use client";

/**
 * plugin/gadgets/product/FrequencyTogether.tsx
 *
 * "Complete Your Setup" (Frequently Bought Together) Component:
 *  - 4-column responsive horizontal card grid (2 rows of 4 cards = 8 items total)
 *  - Dynamic server-side accessories matched to the currently viewed device
 *  - Seamless VariantPopup integration matching Box-2.tsx:
 *      • For single products: instant "Add to cart" with live quantity indicator
 *      • For variant products: "Choose options" button opens interactive VariantPopup
 *      • Full color/spec swatch selection, dynamic price update, and instant cart sync
 *  - Dispatches both "cartUpdated" and "cart_updated" events for full app sync
 */

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { useToast } from "@/components/ui/Toast";
import VariantPopup, { type VariantData } from "../box/VariantPopup";

export interface SetupProductItem {
    id: string;
    title: string;
    slug: string;
    category: string;
    image: string;
    price: number;
    regularPrice?: number;
    hasDiscount?: boolean;
    priceType?: "single" | "variant";
    url: string;
    variants?: VariantData[];
    selectedAttributes?: { label: string; values: string[]; displayStyle?: string }[];
    stock?: number;
    shippingInside?: number;
    shippingOutside?: number;
    info?: Record<string, string>;
}

interface FrequencyTogetherProps {
    products?: SetupProductItem[];
    currencySymbol?: string;
    currentProductTitle?: string;
}

function addToCartDirect(item: Record<string, any>, delta: number = 1): void {
    try {
        const raw = localStorage.getItem("shopping_cart");
        const cart: any[] = raw ? JSON.parse(raw) : [];
        const idx = cart.findIndex(
            (c: any) =>
                String(c.productId) === String(item.productId) &&
                (c.variantId || "") === (item.variantId || "")
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
        localStorage.setItem("shopping_cart", JSON.stringify(cart));
        window.dispatchEvent(new Event("cartUpdated"));
        window.dispatchEvent(new Event("cart_updated"));
    } catch {
        /* storage unavailable */
    }
}

export default function GadgetsFrequencyTogether({
    products = [],
    currencySymbol = "৳",
    currentProductTitle = "device",
}: FrequencyTogetherProps) {
    const { showToast } = useToast();

    // ── Variant Modal State ──
    const [popupProduct, setPopupProduct] = useState<SetupProductItem | null>(null);

    // ── Cart quantities per product ID ──
    const [cartCounts, setCartCounts] = useState<Record<string, number>>({});

    const syncCartCounts = useCallback(() => {
        if (typeof window === "undefined") return;
        try {
            const raw = localStorage.getItem("shopping_cart");
            const cart: any[] = raw ? JSON.parse(raw) : [];
            const counts: Record<string, number> = {};
            for (const item of cart) {
                const pid = String(item.productId || "");
                counts[pid] = (counts[pid] || 0) + (item.quantity || 0);
            }
            setCartCounts(counts);
        } catch {
            setCartCounts({});
        }
    }, []);

    useEffect(() => {
        syncCartCounts();
        const onCartUpdate = () => syncCartCounts();
        window.addEventListener("cartUpdated", onCartUpdate);
        window.addEventListener("cart_updated", onCartUpdate);
        return () => {
            window.removeEventListener("cartUpdated", onCartUpdate);
            window.removeEventListener("cart_updated", onCartUpdate);
        };
    }, [syncCartCounts]);

    if (!products || products.length === 0) {
        return null;
    }

    // Single item quick add to cart
    const handleSingleAdd = (item: SetupProductItem) => {
        addToCartDirect(
            {
                productId: String(item.id),
                productSlug: item.slug,
                productTitle: item.title,
                productImage: item.image,
                price: item.price,
                quantity: 1,
                maxQuantity: item.stock || 9999,
                shippingInside: item.shippingInside,
                shippingOutside: item.shippingOutside,
            },
            1
        );
        syncCartCounts();
        showToast(`Added ${item.title} to your cart!`, "success");
    };

    // Variant modal add to cart
    const handleVariantCart = (variant: VariantData, qty: number) => {
        if (!popupProduct) return;
        const price = parseFloat(variant.price ?? "0") || popupProduct.price;
        const maxQty = parseInt(variant.quantity ?? "0", 10) || 9999;
        const addQty = Math.max(1, qty || 1);

        addToCartDirect(
            {
                productId: String(popupProduct.id),
                productSlug: popupProduct.slug,
                productTitle: popupProduct.title,
                productImage: variant.image || popupProduct.image,
                variantId: variant.id,
                variantOptions: variant.options,
                sku: variant.sku,
                price,
                quantity: addQty,
                maxQuantity: maxQty,
                shippingInside: popupProduct.shippingInside,
                shippingOutside: popupProduct.shippingOutside,
            },
            addQty
        );

        syncCartCounts();
        const variantDesc = variant.options
            ? Object.values(variant.options).filter(Boolean).join(", ")
            : "";
        showToast(
            `Added ${popupProduct.title}${variantDesc ? ` (${variantDesc})` : ""} to your cart!`,
            "success"
        );
        setPopupProduct(null);
    };

    return (
        <>
            <section id="complete-setup" className="space-y-5">
                {/* ── Section Header ── */}
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                            Complete Your Setup
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">
                            Recommended accessories & essentials compatible with {currentProductTitle}
                        </p>
                    </div>

                    <Link
                        href="/search?q=accessories"
                        className="px-4 py-1.5 rounded-full border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 text-xs font-semibold transition shrink-0 shadow-2xs hover:bg-gray-50"
                    >
                        View all
                    </Link>
                </div>

                {/* ── 4-Column Horizontal Cards Grid (2 rows of 4) ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {products.map((item) => {
                        const inCartQty = cartCounts[String(item.id)] || 0;
                        const isVariant =
                            item.priceType === "variant" &&
                            Array.isArray(item.variants) &&
                            item.variants.length > 0;

                        return (
                            <div
                                key={item.id}
                                className="bg-white rounded-2xl border border-gray-200/90 p-4 flex items-center gap-3.5 hover:border-gray-300 hover:shadow-xs transition-all shadow-2xs group"
                            >
                                {/* Left: Product Thumbnail */}
                                <Link
                                    href={item.url}
                                    className="w-20 h-20 sm:w-22 sm:h-22 rounded-xl bg-gray-50/50 p-1 shrink-0 flex items-center justify-center overflow-hidden border border-gray-100"
                                >
                                    {item.image ? (
                                        <img
                                            src={item.image}
                                            alt={item.title}
                                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <Icon
                                            icon="solar:devices-linear"
                                            width={32}
                                            className="text-gray-300"
                                        />
                                    )}
                                </Link>

                                {/* Right: Info & Actions */}
                                <div className="flex-1 min-w-0 flex flex-col justify-between">
                                    <div>
                                        {/* Category Pill Badge */}
                                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200/60 text-[10px] font-semibold tracking-wide">
                                            {item.category || "Accessories"}
                                        </span>

                                        {/* Product Title */}
                                        <Link
                                            href={item.url}
                                            className="text-xs sm:text-sm font-bold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2 mt-1 leading-snug"
                                            title={item.title}
                                        >
                                            {item.title}
                                        </Link>

                                        {/* Price */}
                                        <p className="text-xs sm:text-sm font-extrabold mt-1">
                                            {isVariant && (
                                                <span className="text-[11px] text-gray-400 font-normal mr-1">
                                                    From
                                                </span>
                                            )}
                                            <span
                                                className={
                                                    item.hasDiscount ? "text-red-600" : "text-gray-900"
                                                }
                                            >
                                                {currencySymbol}{" "}
                                                {Number(item.price).toLocaleString()}
                                            </span>
                                            {item.hasDiscount &&
                                                item.regularPrice &&
                                                item.regularPrice > item.price && (
                                                    <span className="text-[11px] text-gray-400 line-through font-normal ml-1.5">
                                                        {currencySymbol}{" "}
                                                        {Number(item.regularPrice).toLocaleString()}
                                                    </span>
                                                )}
                                        </p>
                                    </div>

                                    {/* Action Button: Choose Options (Modal) or Add to Cart */}
                                    <div className="mt-2.5">
                                        {isVariant ? (
                                            <button
                                                type="button"
                                                onClick={() => setPopupProduct(item)}
                                                className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl text-xs font-bold transition shadow-2xs text-center cursor-pointer flex items-center justify-center gap-1.5"
                                            >
                                                <Icon icon="solar:tuning-2-linear" width={14} />
                                                <span>Choose options</span>
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handleSingleAdd(item)}
                                                className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold transition shadow-2xs text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                                                    inCartQty > 0
                                                        ? "bg-slate-900 hover:bg-slate-800 text-white"
                                                        : "bg-blue-600 hover:bg-blue-700 text-white"
                                                }`}
                                            >
                                                <Icon
                                                    icon={
                                                        inCartQty > 0
                                                            ? "solar:check-circle-bold"
                                                            : "solar:cart-plus-bold"
                                                    }
                                                    width={14}
                                                />
                                                <span>
                                                    {inCartQty > 0
                                                        ? `In cart (${inCartQty})`
                                                        : "Add to cart"}
                                                </span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* ── Variant Popup Modal matching Box-2.tsx ── */}
            {popupProduct && (
                <VariantPopup
                    productId={String(popupProduct.id)}
                    productSlug={popupProduct.slug}
                    productTitle={popupProduct.title}
                    productImage={popupProduct.image}
                    variants={popupProduct.variants || []}
                    selectedAttributes={popupProduct.selectedAttributes || []}
                    currencySymbol={currencySymbol}
                    onClose={() => setPopupProduct(null)}
                    onAddToCart={handleVariantCart}
                    shippingInside={popupProduct.shippingInside}
                    shippingOutside={popupProduct.shippingOutside}
                />
            )}
        </>
    );
}
