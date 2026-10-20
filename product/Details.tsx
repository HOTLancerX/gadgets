"use client";

/**
 * plugin/gadgets/product/Details.tsx
 *
 * Exelic Gadgets Product Details Page (Client Component):
 *  - Interactive image gallery with smooth thumbnails.
 *  - High-tech gadget typography, pill badges, and warranty tags.
 *  - Live price calculation with single and variant options.
 *  - Storage & color swatches with instant image/price sync.
 *  - Integrated sub-components:
 *      • Specification.tsx (hardware & tech specs)
 *      • Compare.tsx (automatic 3-product category comparison)
 *      • Reviews.tsx (verified reviews & rating bars)
 *      • Related.tsx (category grid computed from CategoryPageSettings)
 *  - Fixed bottom bar on mobile screens.
 */

import React, { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { useToast } from "@/components/ui/Toast";
import Variant from "@/plugin/product/product/Variant";
import GadgetsSpecification, { type SpecBox } from "./Specification";
import GadgetsCompare, { type CompareProductItem } from "./Compare";
import GadgetsFrequencyTogether, { type SetupProductItem } from "./FrequencyTogether";
import GadgetsReviews, { type ReviewsData } from "./Reviews";
import GadgetsVideos, { type VideoItem } from "./Videos";
import GadgetsRelated from "./Related";

export interface GadgetsProductDetailsProps {
    data: { id: string; title: string; slug: string };
    info?: Record<string, any>;
    productId?: string;
    categoryId?: string | null;
    priceType: "single" | "variant";
    regularPrice: number;
    sellingPrice: number;
    displayPrice: number;
    hasDiscount: boolean;
    discountPercent: number;
    singleStock: number;
    variants: any[];
    selectedAttributes: any[];
    variantDisplayStyle: string;
    allImages: string[];
    specifications: SpecBox[];
    videos?: VideoItem[];
    currencySymbol: string;
    whatsappNumber: string;
    telegramUsername: string;
    facebookPageId: string;
    shortDescription: string;
    description: string;
    htmlDescription: string;
    orderNote: string;
    warranty?: string;
    shippingInside?: number;
    shippingOutside?: number;
    shippingInsideLabel?: string;
    shippingOutsideLabel?: string;
    shippingInsideRate?: number;
    shippingOutsideRate?: number;
    categoryLinks?: { title: string; url: string }[];
    brand?: {
        _id: string;
        title: string;
        slug: string;
        url: string;
    } | null;
    seller?: {
        _id: string;
        name: string;
        image: string;
        slug: string;
        city: string;
        state: string;
        bio: string;
        website: string;
        twitter: string;
        profileUrl: string;
    } | null;
    categoryProducts?: any[] | null;
    compareProducts?: any[] | null;
    allCompareCandidates?: any[] | null;
    frequentlyTogether?: SetupProductItem[] | null;
    flashSaleCampaign?: any | null;
    permalinkMap?: Record<string, string>;
    builder?: React.ReactNode;
    reviewsData?: ReviewsData | null;
    settings?: Record<string, any>;
}

interface CartItem {
    productId: string;
    productSlug: string;
    productTitle: string;
    productImage: string;
    variantId?: string;
    variantOptions?: Record<string, string>;
    sku?: string;
    price: number;
    quantity: number;
    maxQuantity: number;
    shippingInside?: number;
    shippingOutside?: number;
    orderNote?: string;
}

function addToCart(item: CartItem) {
    try {
        const raw = localStorage.getItem("shopping_cart");
        const cart: CartItem[] = raw ? JSON.parse(raw) : [];
        const idx = cart.findIndex(
            (c) => c.productId === item.productId && c.variantId === item.variantId
        );
        if (idx >= 0) {
            cart[idx].quantity = Math.min(cart[idx].quantity + item.quantity, item.maxQuantity);
        } else {
            cart.push(item);
        }
        localStorage.setItem("shopping_cart", JSON.stringify(cart));
        window.dispatchEvent(new Event("cart_updated"));
        window.dispatchEvent(new Event("cartUpdated"));
    } catch {
        /* storage unavailable */
    }
}

function buildAttributes(variants: any[], selectedAttributes: any[]) {
    if (!variants?.length) return [];

    const attrMap: Record<string, Set<string>> = {};
    variants.forEach((v: any) => {
        if (!v.options) return;
        Object.entries(v.options).forEach(([key, value]) => {
            if (!attrMap[key]) attrMap[key] = new Set();
            attrMap[key].add(value as string);
        });
    });

    if (selectedAttributes?.length > 0) {
        return [...selectedAttributes]
            .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
            .filter((sa: any) => attrMap[sa.label || sa.name])
            .map((sa: any) => {
                const label = sa.label || sa.name;
                const saved = (sa.values || []).filter((v: string) => attrMap[label]?.has(v));
                const extra = Array.from(attrMap[label] || []).filter((v) => !saved.includes(v));
                return { label, values: [...saved, ...extra], displayStyle: sa.displayStyle, position: sa.position };
            });
    }

    return Object.entries(attrMap).map(([label, values]) => ({
        label,
        values: Array.from(values),
    }));
}

export default function GadgetsProductDetails(props: GadgetsProductDetailsProps) {
    const {
        data,
        info = {},
        priceType,
        regularPrice,
        sellingPrice,
        hasDiscount,
        discountPercent,
        singleStock,
        variants = [],
        selectedAttributes = [],
        variantDisplayStyle = "text",
        allImages = [],
        specifications = [],
        videos = [],
        currencySymbol = "৳",
        whatsappNumber,
        shortDescription,
        description,
        htmlDescription,
        orderNote,
        warranty,
        categoryLinks = [],
        brand,
        seller,
        categoryProducts = [],
        compareProducts = [],
        allCompareCandidates = [],
        frequentlyTogether = [],
        reviewsData,
        settings = {},
        permalinkMap = {},
        builder,
    } = props;

    const router = useRouter();
    const { showToast, success, error } = useToast();

    // ── Variant Selection State ──────────────────────────────────────────────
    const [selectedVariant, setSelectedVariant] = useState<any>(
        () => variants[0] ?? null
    );
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(
        () => variants[0]?.options ? { ...variants[0].options } : {}
    );

    const attributes = useMemo(
        () => buildAttributes(variants, selectedAttributes),
        [variants, selectedAttributes]
    );

    const findVariantByOptions = useCallback(
        (opts: Record<string, string>) =>
            variants.find((v: any) => {
                if (!v.options) return false;
                return Object.entries(opts).every(([k, val]) => v.options[k] === val);
            }) ?? null,
        [variants]
    );

    // ── Image Gallery State & Dynamic Switching ─────────────────────────────
    const currentGallery = useMemo(() => {
        const imgs: string[] = [];
        if (selectedVariant?.gallery?.length) imgs.push(...selectedVariant.gallery);
        if (selectedVariant?.image)           imgs.push(selectedVariant.image);
        if (imgs.length === 0)                imgs.push(...allImages);
        return [...new Set(imgs)].filter(Boolean);
    }, [selectedVariant, allImages]);

    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const activeImage = currentGallery[selectedImageIndex] || currentGallery[0] || allImages[0] || "";

    const [quantity, setQuantity] = useState(1);
    const [noteValue, setNoteValue] = useState("");
    const [expandedDesc, setExpandedDesc] = useState(false);
    const [activeTab, setActiveTab] = useState<"overview" | "specs" | "compare" | "reviews">("overview");

    // Handle variant option selection
    const handleOptionSelect = (label: string, value: string) => {
        const next = { ...selectedOptions, [label]: value };
        setSelectedOptions(next);
        const variant = findVariantByOptions(next);
        if (variant) {
            setSelectedVariant(variant);
            setSelectedImageIndex(0);
        }
    };

    // Live pricing and stock with tier pricing support
    const currentPrice = useMemo(() => {
        if (priceType === "single") return sellingPrice > 0 ? sellingPrice : regularPrice;
        if (!selectedVariant) return 0;
        if (selectedVariant.priceTiers?.length > 0) {
            const tier = selectedVariant.priceTiers.find((t: any) => {
                const start = parseInt(t.rangeStart) || 0;
                const end = t.rangeEnd === "" ? Infinity : (parseInt(t.rangeEnd) || Infinity);
                return quantity >= start && quantity <= end;
            });
            if (tier) return parseFloat(tier.price) || 0;
        }
        return parseFloat(selectedVariant.price ?? selectedVariant.sellingprice ?? "0") || sellingPrice || regularPrice;
    }, [priceType, selectedVariant, sellingPrice, regularPrice, quantity]);

    const currentRegularPrice = useMemo(() => {
        if (priceType === "variant" && selectedVariant) {
            return parseFloat(selectedVariant.regularprice ?? "0") || regularPrice;
        }
        return regularPrice;
    }, [priceType, selectedVariant, regularPrice]);

    const currentStock = useMemo(() => {
        if (priceType === "variant" && selectedVariant) {
            return parseInt(selectedVariant.quantity ?? selectedVariant.stock ?? "0", 10) || 0;
        }
        return singleStock;
    }, [priceType, selectedVariant, singleStock]);

    const isDiscounted = currentRegularPrice > currentPrice;
    const currentDiscountPercent = isDiscounted
        ? Math.round(((currentRegularPrice - currentPrice) / currentRegularPrice) * 100)
        : discountPercent;

    // ── Cart Handlers ────────────────────────────────────────────────────────
    const buildCartPayload = (): CartItem => ({
        productId: data.id,
        productSlug: data.slug,
        productTitle: data.title,
        productImage: currentGallery[0] || activeImage || "",
        variantId: selectedVariant?.id,
        variantOptions: selectedVariant?.options || selectedOptions,
        sku: selectedVariant?.sku,
        price: currentPrice,
        quantity,
        maxQuantity: currentStock || 9999,
        shippingInside: props.shippingInside,
        shippingOutside: props.shippingOutside,
        orderNote: noteValue || props.orderNote,
    });

    const handleAddToCart = () => {
        if (priceType === "variant" && !selectedVariant) {
            error("Please select product options");
            return;
        }
        if (currentStock <= 0) {
            error("Sorry, this gadget is currently out of stock.");
            return;
        }
        addToCart(buildCartPayload());
        success(`Added ${quantity} × ${data.title} to cart`);
        setQuantity(1);
    };

    const handleBuyNow = () => {
        if (priceType === "variant" && !selectedVariant) {
            error("Please select product options");
            return;
        }
        if (currentStock <= 0) {
            error("Sorry, this gadget is currently out of stock.");
            return;
        }
        addToCart(buildCartPayload());
        router.push("/checkout");
    };

    // Valid specifications filtering (omit boxes with no info)
    const validSpecifications: SpecBox[] = useMemo(() => {
        if (!Array.isArray(specifications)) return [];
        return specifications
            .map((box) => ({
                ...box,
                fields: (box.fields || []).filter(
                    (f) => typeof f?.description === "string" && f.description.trim().length > 0
                ),
            }))
            .filter((box) => box.fields.length > 0);
    }, [specifications]);

    // Format current product for the Compare component
    const currentCompareItem: CompareProductItem = useMemo(() => ({
        id: data.id,
        title: data.title,
        slug: data.slug,
        image: activeImage,
        price: currentPrice,
        stock: currentStock,
        specifications: validSpecifications,
        url: `#`,
    }), [data, activeImage, currentPrice, currentStock, validSpecifications]);

    // Helper to format any product into a CompareProductItem
    const mapToCompareItem = useCallback((p: any, productPrefix: string): CompareProductItem | null => {
        let pSpecs: SpecBox[] = [];
        if (Array.isArray(p.specifications) && p.specifications.length > 0) {
            pSpecs = p.specifications;
        } else if (p.info?._specifications) {
            try {
                pSpecs = JSON.parse(p.info._specifications);
            } catch {}
        }
        let pImage = p.image || "";
        if (!pImage && p.info?.images) {
            try {
                const imgs = JSON.parse(p.info.images || "[]");
                if (Array.isArray(imgs) && imgs[0]) pImage = imgs[0];
            } catch {}
        }
        let pPrice = p.price || 0;
        let pStock = p.stock !== undefined ? p.stock : 99;
        if (!pPrice && p.info?._variate) {
            try {
                const variate = JSON.parse(p.info._variate || "{}");
                pPrice = parseFloat(variate.sellingprice || variate.regularprice || p.info?.sellingprice || "0") || 0;
                pStock = parseInt(variate.stock || "99", 10);
            } catch {}
        }

        const cleanSpecs = (pSpecs || [])
            .map((box) => ({
                ...box,
                fields: (box.fields || []).filter(
                    (f: any) => typeof f?.description === "string" && f.description.trim().length > 0
                ),
            }))
            .filter((box) => box.fields.length > 0);

        if (cleanSpecs.length === 0) return null;

        const pid = String(p.id || p._id || "");
        return {
            id: pid,
            title: String(p.title || ""),
            slug: String(p.slug || ""),
            image: pImage,
            price: pPrice,
            stock: pStock,
            specifications: cleanSpecs,
            url: p.url || `/${productPrefix}/${p.slug}`,
        };
    }, []);

    // Comparison candidates from category - strictly only products that have specifications
    const parsedCompareCandidates: CompareProductItem[] = useMemo(() => {
        const productPrefix = (permalinkMap["product"] ?? "product").trim().replace(/^\/+|\/+$/g, "");
        return (compareProducts || [])
            .filter((p: any) => String(p.id || p._id) !== String(data.id))
            .map((p: any) => mapToCompareItem(p, productPrefix))
            .filter((p): p is CompareProductItem => p !== null);
    }, [compareProducts, permalinkMap, data.id, mapToCompareItem]);

    // All category comparison candidates (for search & add-to-slot picker)
    const allCategoryCompareCandidates: CompareProductItem[] = useMemo(() => {
        const productPrefix = (permalinkMap["product"] ?? "product").trim().replace(/^\/+|\/+$/g, "");
        const sourcePool = (allCompareCandidates && allCompareCandidates.length > 0)
            ? allCompareCandidates
            : categoryProducts;

        return (sourcePool || [])
            .filter((p: any) => String(p.id || p._id) !== String(data.id))
            .map((p: any) => mapToCompareItem(p, productPrefix))
            .filter((p): p is CompareProductItem => p !== null);
    }, [allCompareCandidates, categoryProducts, permalinkMap, data.id, mapToCompareItem]);

    const hasOverview = Boolean((htmlDescription || description)?.trim());

    return (
        <div className="bg-[#f8fafc] min-h-screen pb-24 text-gray-800">
            {/* Top Breadcrumb Bar */}
            <div className="bg-white border-b border-gray-200/80">
                <div className="container py-3">
                    <nav className="flex items-center gap-2 text-xs text-gray-500 overflow-x-auto whitespace-nowrap scrollbar-none">
                        <Link href="/" className="hover:text-blue-600 transition flex items-center gap-1">
                            <Icon icon="solar:home-2-linear" width={14} />
                            <span>Home</span>
                        </Link>
                        {categoryLinks.map((cat, idx) => (
                            <React.Fragment key={idx}>
                                <Icon icon="solar:alt-arrow-right-linear" width={12} className="text-gray-400" />
                                <Link href={cat.url} className="hover:text-blue-600 transition font-medium">
                                    {cat.title}
                                </Link>
                            </React.Fragment>
                        ))}
                        <Icon icon="solar:alt-arrow-right-linear" width={12} className="text-gray-400" />
                        <span className="text-gray-900 font-semibold truncate max-w-xs">{data.title}</span>
                    </nav>
                </div>
            </div>

            {/* Main Hero Container */}
            <div className="container py-6 space-y-8">
                {/* ─── 1. TOP HERO: GALLERY + DETAILS ─── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-8 shadow-xs">
                    {/* Left Column: Image Showcase (5 Cols) */}
                    <div className="space-y-4">
                        {/* Main Image Frame */}
                        <div className="relative aspect-square w-full rounded-2xl bg-gray-50/70 border border-gray-200/80 p-6 overflow-hidden flex items-center justify-center group shadow-2xs">
                            {/* Badges Overlay */}
                            <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 items-start">
                                {isDiscounted && currentDiscountPercent > 0 && (
                                    <span className="px-2.5 py-1 rounded-full bg-red-600 text-white font-extrabold text-[11px] shadow-xs tracking-wider uppercase">
                                        SALE -{currentDiscountPercent}%
                                    </span>
                                )}
                                {warranty && (
                                    <span className="px-2.5 py-1 rounded-full bg-blue-600 text-white font-bold text-[10px] shadow-xs flex items-center gap-1">
                                        <Icon icon="solar:shield-check-bold" width={12} />
                                        {warranty}
                                    </span>
                                )}
                            </div>

                            {/* Main Active Image with Zoom */}
                            {activeImage ? (
                                <img
                                    src={activeImage}
                                    alt={data.title}
                                    className="w-full h-full object-contain group-hover:scale-108 transition-transform duration-500"
                                />
                            ) : (
                                <Icon icon="solar:devices-linear" width={64} className="text-gray-300" />
                            )}
                        </div>

                        {/* Thumbnail Strip */}
                        {currentGallery.length > 1 && (
                            <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                                {currentGallery.map((img, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => setSelectedImageIndex(i)}
                                        className={`w-16 h-16 rounded-xl border-2 p-1 bg-white shrink-0 transition-all cursor-pointer overflow-hidden ${
                                            selectedImageIndex === i
                                                ? "border-blue-600 ring-2 ring-blue-100 shadow-2xs scale-102"
                                                : "border-gray-200 hover:border-gray-300 opacity-70 hover:opacity-100"
                                        }`}
                                    >
                                        <img src={img} alt={`Angle ${i + 1}`} className="w-full h-full object-contain" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Key Details & Purchasing (7 Cols) */}
                    <div className="flex flex-col justify-between space-y-6">
                        <div className="space-y-4">
                            {/* Brand Tag & Stock Status */}
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                {brand ? (
                                    <Link
                                        href={brand.url}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-xs hover:bg-blue-100 transition shadow-2xs"
                                    >
                                        <Icon icon="solar:tag-bold" width={13} />
                                        <span>{brand.title}</span>
                                    </Link>
                                ) : null}

                                <div className="flex items-center gap-2">
                                    <span
                                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-2xs ${
                                            currentStock > 0
                                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                : "bg-red-50 text-red-700 border border-red-200"
                                        }`}
                                    >
                                        <span
                                            className={`w-2 h-2 rounded-full ${
                                                currentStock > 0 ? "bg-emerald-500 animate-pulse" : "bg-red-500"
                                            }`}
                                        />
                                        {currentStock > 0 ? "In Stock" : "Out of Stock"}
                                    </span>
                                </div>
                            </div>

                            {/* Product Title */}
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
                                {data.title}
                            </h1>

                            {/* Rating and Reviews Counter */}
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Icon
                                            key={s}
                                            icon="solar:star-bold"
                                            width={15}
                                            className={
                                                s <= Math.round(reviewsData?.averageRating || 5)
                                                    ? "text-amber-400"
                                                    : "text-gray-200"
                                            }
                                        />
                                    ))}
                                    <span className="font-bold text-gray-900 ml-1">
                                        {reviewsData?.averageRating ? reviewsData.averageRating.toFixed(1) : "5.0"}
                                    </span>
                                </div>
                                <span className="text-gray-300">•</span>
                                <a href="#reviews" className="hover:text-blue-600 font-semibold underline">
                                    {reviewsData?.totalReviews || 0} Ratings & Reviews
                                </a>
                            </div>

                            {/* Price Card */}
                            <div className="flex items-baseline gap-3 flex-wrap">
                                <span className="text-3xl md:text-4xl font-bold text-main tracking-tight">
                                    {currencySymbol} {Number(currentPrice).toLocaleString()}
                                </span>
                                {isDiscounted && (
                                    <>
                                        <span className="text-base text-gray-400 line-through font-semibold">
                                            {currencySymbol} {Number(currentRegularPrice).toLocaleString()}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-lg bg-red-100 text-red-700 text-xs font-bold">
                                            Save {currentDiscountPercent}%
                                        </span>
                                    </>
                                )}
                            </div>

                            {/* Short Description */}
                            {shortDescription && (
                                <div
                                    className="description pb-6"
                                    dangerouslySetInnerHTML={{ __html: shortDescription }}
                                />
                            )}

                            {/* Variant Selector (Colors, Storage, Swatches, Dropdowns, Tiered Pricing) */}
                            {priceType === "variant" && variants.length > 0 && (
                                <div className="pt-2">
                                    <Variant
                                        info={{ variants, selectedAttributes, variantDisplayStyle, ...(info || {}) }}
                                        attributes={attributes}
                                        selectedOptions={selectedOptions}
                                        selectedVariant={selectedVariant}
                                        displayStyle={variantDisplayStyle}
                                        onOptionSelect={handleOptionSelect}
                                        currencySymbol={currencySymbol}
                                    />
                                </div>
                            )}

                            {/* Order Note */}
                            {orderNote && (
                                <div className="pt-2">
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">{orderNote}</label>
                                    <textarea
                                        rows={2}
                                        value={noteValue}
                                        onChange={(e) => setNoteValue(e.target.value)}
                                        placeholder="Add any instructions or notes..."
                                        className="w-full text-xs rounded-xl border border-gray-200 p-2.5 focus:border-blue-500 focus:outline-none transition shadow-2xs"
                                    />
                                </div>
                            )}

                            {/* Quantity Selector & Quick Actions */}
                            <div className="pt-2 flex items-center gap-4 flex-wrap">
                                <div className="flex items-center border border-gray-300 rounded-xl bg-white shadow-2xs overflow-hidden">
                                    <button
                                        type="button"
                                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                        className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 text-sm font-bold cursor-pointer"
                                    >
                                        -
                                    </button>
                                    <span className="w-10 text-center text-xs font-bold text-gray-900">
                                        {quantity}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setQuantity((q) => Math.min(currentStock || 99, q + 1))}
                                        className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 text-sm font-bold cursor-pointer"
                                    >
                                        +
                                    </button>
                                </div>

                                {/* Add to Cart & Buy Now Buttons */}
                                <div className="flex-1 flex items-center gap-2.5 min-w-60">
                                    <button
                                        type="button"
                                        onClick={handleAddToCart}
                                        disabled={currentStock <= 0}
                                        className="flex-1 py-3 px-4 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <Icon icon="solar:cart-large-bold" width={16} />
                                        <span>Add to Cart</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleBuyNow}
                                        disabled={currentStock <= 0}
                                        className="flex-1 py-3 px-4 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <Icon icon="solar:bolt-bold" width={16} className="text-amber-400" />
                                        <span>Buy Now</span>
                                    </button>
                                </div>

                                {/* WhatsApp Button */}
                                {whatsappNumber && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const opts = selectedVariant?.options
                                                ? Object.entries(selectedVariant.options)
                                                      .map(([k, v]) => `${k}: ${v}`)
                                                      .join(", ")
                                                : "";
                                            const msg = encodeURIComponent(
                                                `Hello, I would like to order: ${data.title}${opts ? ` (${opts})` : ""} (${currencySymbol} ${currentPrice}). Link: ${window.location.href}`
                                            );
                                            window.open(`https://wa.me/${whatsappNumber}?text=${msg}`, "_blank");
                                        }}
                                        className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-xl transition cursor-pointer shadow-2xs"
                                        title="Order via WhatsApp"
                                    >
                                        <Icon icon="logos:whatsapp-icon" width={20} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Trust / Guarantee Badges (Screenshot design) */}
                        <div className="pt-6 border-t border-gray-100">
                            <div className="rounded-2xl border border-gray-200/80 bg-white p-3 md:p-4 shadow-2xs">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3">
                                    {/* 1. Dynamic Warranty / Genuine */}
                                    <div className="rounded-xl border border-gray-200/80 bg-gray-50 p-3.5 md:p-4 flex flex-col items-center justify-center text-center transition-all hover:border-gray-300">
                                        <Icon icon="solar:shield-check-linear" width={26} className="text-emerald-600 mb-2 shrink-0" />
                                        <span className="text-xs font-black tracking-wider text-slate-900 uppercase">
                                            {warranty ? "WARRANTY" : "GENUINE"}
                                        </span>
                                        <span
                                            className="text-[11px] md:text-xs text-slate-500 font-medium mt-0.5 truncate max-w-full"
                                            title={warranty || "100% Original"}
                                        >
                                            {warranty || "100% Original"}
                                        </span>
                                    </div>

                                    {/* 2. M-PESA Secure Pay */}
                                    <div className="rounded-xl border border-gray-200/80 bg-gray-50 p-3.5 sm:p-4 flex flex-col items-center justify-center text-center transition-all hover:border-gray-300">
                                        <Icon icon="solar:smartphone-linear" width={26} className="text-emerald-600 mb-2 shrink-0" />
                                        <span className="text-xs font-black tracking-wider text-slate-900 uppercase">
                                            M-PESA
                                        </span>
                                        <span className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">
                                            Secure Pay
                                        </span>
                                    </div>

                                    {/* 3. Fast Delivery */}
                                    <div className="rounded-xl border border-gray-200/80 bg-gray-50 p-3.5 sm:p-4 flex flex-col items-center justify-center text-center transition-all hover:border-gray-300">
                                        <Icon icon="solar:delivery-linear" width={26} className="text-emerald-600 mb-2 shrink-0" />
                                        <span className="text-xs font-black tracking-wider text-slate-900 uppercase">
                                            DELIVERY
                                        </span>
                                        <span className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">
                                            Fast Dispatch
                                        </span>
                                    </div>

                                    {/* 4. Expert Support */}
                                    <div className="rounded-xl border border-gray-200/80 bg-gray-50 p-3.5 sm:p-4 flex flex-col items-center justify-center text-center transition-all hover:border-gray-300">
                                        <Icon icon="solar:headphones-round-linear" width={26} className="text-emerald-600 mb-2 shrink-0" />
                                        <span className="text-xs font-black tracking-wider text-slate-900 uppercase">
                                            SUPPORT
                                        </span>
                                        <span className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">
                                            Expert Help
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {builder}

                {/* ─── 2. STICKY ANCHOR BAR ─── */}
                <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 p-1.5 shadow-xs flex items-center gap-1 overflow-x-auto scrollbar-none">
                    {hasOverview && (
                        <a
                            href="#description"
                            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 hover:text-blue-600 hover:bg-blue-50/70 transition whitespace-nowrap"
                        >
                            Description
                        </a>
                    )}
                    {validSpecifications.length > 0 && (
                        <a
                            href="#specifications"
                            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 hover:text-blue-600 hover:bg-blue-50/70 transition whitespace-nowrap flex items-center gap-1.5"
                        >
                            <span>Specifications</span>
                            <span className="px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 text-[10px]">
                                {validSpecifications.length}
                            </span>
                        </a>
                    )}
                    {parsedCompareCandidates.length > 0 && (
                        <a
                            href="#compare"
                            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 hover:text-indigo-600 hover:bg-indigo-50/70 transition whitespace-nowrap flex items-center gap-1.5"
                        >
                            <span>Compare</span>
                            <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700 text-[10px]">
                                {parsedCompareCandidates.length}
                            </span>
                        </a>
                    )}
                    {frequentlyTogether && frequentlyTogether.length > 0 && (
                        <a
                            href="#complete-setup"
                            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 hover:text-blue-600 hover:bg-blue-50/70 transition whitespace-nowrap"
                        >
                            Complete Setup
                        </a>
                    )}
                    <a
                        href="#reviews"
                        className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 hover:text-amber-600 hover:bg-amber-50/70 transition whitespace-nowrap flex items-center gap-1.5"
                    >
                        <span>Reviews</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-700 text-[10px]">
                            {reviewsData?.totalReviews || 0}
                        </span>
                    </a>
                    {videos && videos.length > 0 && (
                        <a
                            href="#product-videos"
                            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 hover:text-red-600 hover:bg-red-50/70 transition whitespace-nowrap flex items-center gap-1.5"
                        >
                            <Icon icon="logos:youtube-icon" width={14} />
                            <span>Videos</span>
                            <span className="px-1.5 py-0.2 rounded-full bg-red-100 text-red-700 text-[10px]">
                                {videos.length}
                            </span>
                        </a>
                    )}
                    {categoryProducts && categoryProducts.length > 0 && (
                        <a
                            href="#related-products"
                            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 hover:text-blue-600 hover:bg-blue-50/70 transition whitespace-nowrap"
                        >
                            Related Gadgets
                        </a>
                    )}
                </div>

                {/* ─── 3. MAIN PRODUCT DESCRIPTION ─── */}
                {hasOverview && (
                    <div id="description" className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-4">
                        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
                            Description
                        </h2>
                        <div className="relative">
                            <div
                                className={`prose max-w-none text-xs sm:text-sm text-gray-700 leading-relaxed overflow-hidden transition-all duration-500 ${
                                    expandedDesc ? "max-h-none" : "max-h-56"
                                }`}
                                dangerouslySetInnerHTML={{
                                    __html: htmlDescription || description,
                                }}
                            />
                            {!expandedDesc && (
                                <div className="absolute bottom-0 left-0 right-0 h-20 bg-linear-to-t from-white to-transparent pointer-events-none" />
                            )}
                        </div>
                        <div className="text-center pt-2">
                            <button
                                type="button"
                                onClick={() => setExpandedDesc(!expandedDesc)}
                                className="px-5 py-2 border border-blue-500 text-blue-600 hover:bg-blue-50 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                            >
                                {expandedDesc ? "Show Less" : "Read Full Description"}
                            </button>
                        </div>
                    </div>
                )}

                {/* ─── 4. COMPLETE YOUR SETUP (FREQUENTLY BOUGHT TOGETHER) ─── */}
                {frequentlyTogether && frequentlyTogether.length > 0 && (
                    <GadgetsFrequencyTogether
                        products={frequentlyTogether}
                        currencySymbol={currencySymbol}
                        currentProductTitle={data.title}
                    />
                )}

                {/* ─── 5. AUTOMATIC COMPARE COMPONENT ─── */}
                {validSpecifications.length > 0 && parsedCompareCandidates.length > 0 && (
                    <GadgetsCompare
                        currentProduct={currentCompareItem}
                        compareProducts={parsedCompareCandidates}
                        allAvailableProducts={allCategoryCompareCandidates}
                        currencySymbol={currencySymbol}
                        onAddToCart={handleAddToCart}
                    />
                )}

                {/* ─── 5. SPECIFICATIONS COMPONENT ─── */}
                {validSpecifications.length > 0 && (
                    <GadgetsSpecification specifications={validSpecifications} productTitle={data.title} />
                )}
                {/* ─── 6. REVIEWS COMPONENT ─── */}
                <GadgetsReviews reviewsData={reviewsData} productTitle={data.title} productId={data.id} />

                {/* ─── 7. PRODUCT VIDEOS COMPONENT ─── */}
                {videos && videos.length > 0 && (
                    <GadgetsVideos videos={videos} productTitle={data.title} />
                )}

                {/* ─── 8. RELATED CATEGORY PRODUCTS COMPONENT ─── */}
                <GadgetsRelated
                    categoryProducts={categoryProducts}
                    settings={settings}
                    permalinkMap={permalinkMap}
                    currencySymbol={currencySymbol}
                    productTitle={data.title}
                />
            </div>

            {/* ─── MOBILE FIXED BOTTOM ACTION BAR ─── */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-lg md:hidden flex items-center justify-between px-4 py-2.5 gap-3">
                <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 font-semibold uppercase truncate">Total Price</p>
                    <p className="text-base font-black text-gray-900 leading-tight">
                        {currencySymbol} {Number(currentPrice).toLocaleString()}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleAddToCart}
                        disabled={currentStock <= 0}
                        className="py-2.5 px-4 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-40"
                    >
                        Add to Cart
                    </button>
                    <button
                        type="button"
                        onClick={handleBuyNow}
                        disabled={currentStock <= 0}
                        className="py-2.5 px-4 bg-gray-900 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-40"
                    >
                        Buy Now
                    </button>
                </div>
            </div>
        </div>
    );
}
