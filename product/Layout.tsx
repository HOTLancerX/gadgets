/**
 * plugin/gadgets/product/Layout.tsx
 *
 * Gadgets Product Details Layout — 100% Server Component (SSR).
 *
 * Pre-renders all static layout sections on the server for instant page load:
 *  - Breadcrumb navigation
 *  - Top Hero & Purchasing (interactive gallery, swatches, quantity & cart actions via GadgetsProductDetails heroOnly)
 *  - CMS Builder (if configured)
 *  - Sticky Anchor Navigation bar (#visual-description, #description, #specifications, #compare, #reviews, #product-videos, #related-products)
 *  - Full Main Product Description (SSR HTML with smooth expand/collapse)
 *  - Side-by-Side Automatic Comparison
 *  - High-Fidelity Visual Description
 *  - Complete Your Setup (Frequently Bought Together)
 *  - Technical Hardware Specifications
 *  - Verified Customer Reviews & Ratings
 *  - YouTube Product Video Showcase
 *  - Related Category Products Grid
 */

import React from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import GadgetsProductDetails from "./Details";
import GadgetsDescription from "./Description";
import GadgetsSpecification, { type SpecBox } from "./Specification";
import { isValidSpecValue } from "./specUtils";
import { type CompareProductItem } from "./Compare";
import GadgetsReviews, { type ReviewsData } from "./Reviews";
import GadgetsVideos, { type VideoItem } from "./Videos";
import GadgetsRelated from "./Related";
import LazyCompare from "./LazyCompare";
import LazyFrequencyTogether from "./LazyFrequencyTogether";
import LazyVisualDescription from "./LazyVisualDescription";

interface ProductPageProps {
    data: {
        _id: string;
        title: string;
        slug: string;
        status: string;
        category?: string;
        createdAt: string;
        updatedAt: string;
        info: Record<string, string>;
    };
    settings?: Record<string, any>;
    permalinkMap?: Record<string, string>;
    pageData?: {
        ancestors?: { _id: string; title: string; slug: string }[];
        tags?: { _id: string; title: string; slug: string }[];
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
        } | null;
        compareProducts?: any[] | null;
        allCompareCandidates?: any[] | null;
        categoryProducts?: any[] | null;
        frequentlyTogether?: any[] | null;
        flashSaleCampaign?: any | null;
        brand?: { _id: string; title: string; slug: string } | null;
        reviewsData?: ReviewsData | null;
    };
    builder?: React.ReactNode;
}

function parseJson<T>(raw: string | undefined, fallback: T): T {
    if (!raw) return fallback;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

function buildUrl(prefix: string, slug: string): string {
    const p = prefix.trim().replace(/^\/+|\/+$/g, "");
    return p ? `/${p}/${slug}` : `/${slug}`;
}

function mapToCompareItem(p: any, productPrefix: string): CompareProductItem | null {
    if (!p) return null;
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
    if (!pImage && p.info?.thumbnail) {
        pImage = p.info.thumbnail;
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
                (f: any) => typeof f?.title === "string" && f.title.trim().length > 0 && isValidSpecValue(f?.description)
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
}

export default function GadgetsProductLayout({
    data,
    settings = {},
    permalinkMap = {},
    pageData,
    builder,
}: ProductPageProps) {
    const variate = parseJson<Record<string, any>>(data.info?._variate, {});

    const priceType: "single" | "variant" = variate.priceType ?? "single";
    const regularPrice = parseFloat(variate.regularprice ?? "0") || 0;
    const sellingPrice = parseFloat(variate.sellingprice ?? "0") || 0;
    const singleStock = parseInt(variate.stock ?? "0", 10) || 0;
    const variants: any[] = variate.variants ?? [];
    const selectedAttributes: any[] = variate.selectedAttributes ?? [];
    const variantDisplayStyle: string = variate.variantDisplayStyle ?? "text";

    // Extract all images
    const variantImages: string[] = [];
    for (const v of variants) {
        if (v.image) variantImages.push(v.image);
        if (v.gallery?.length) variantImages.push(...v.gallery);
    }
    const defaultImages: string[] = parseJson<string[]>(data.info?.images, []);
    const allImages = [...new Set([...defaultImages, ...variantImages])].filter(Boolean);

    // Clean specifications for Technical Specifications and Compare
    const rawSpecs: SpecBox[] = parseJson<SpecBox[]>(data.info?._specifications, []);
    const validSpecifications: SpecBox[] = rawSpecs
        .map((box) => ({
            ...box,
            fields: (box.fields || []).filter(
                (f) => typeof f?.title === "string" && f.title.trim().length > 0 && isValidSpecValue(f?.description)
            ),
        }))
        .filter((box) => box.fields && box.fields.length > 0);

    // Global settings & currency
    const currencySymbol =
        (settings.product_currency_symbol as string) ||
        (settings.currency_symbol as string) ||
        "৳";
    const whatsappNumber = (settings.product_whatsapp_number as string) || "";
    const telegramUsername = (settings.product_telegram_username as string) || "";
    const facebookPageId = (settings.product_facebook_page_id as string) || "";

    const shortDescription = data.info?.shortDescription ?? "";
    const description = data.info?.description ?? "";
    const htmlDescription = data.info?.htmlDescription ?? "";
    const orderNote = data.info?.orderNote ?? "";
    const warranty = data.info?.warranty ?? "";
    const shippingInside = parseFloat(data.info?.shipping_inside ?? "") || undefined;
    const shippingOutside = parseFloat(data.info?.shipping_outside ?? "") || undefined;

    // Parse product videos from pro_videos or videos
    const rawVideos = data.info?.pro_videos || data.info?.videos || data.info?._videos || "[]";
    const videos: VideoItem[] = parseJson<any[]>(rawVideos, [])
        .filter((v: any) => v && (v.videoid || v.videoId))
        .map((v: any) => ({
            title: String(v.title || "").trim(),
            videoid: String(v.videoid || v.videoId || "").trim(),
        }));

    const hasDiscount =
        priceType === "single" && sellingPrice > 0 && regularPrice > sellingPrice;
    const discountPercent = hasDiscount
        ? Math.round(((regularPrice - sellingPrice) / regularPrice) * 100)
        : 0;

    const displayPrice =
        priceType === "single"
            ? sellingPrice > 0
                ? sellingPrice
                : regularPrice
            : 0;

    const ancestors = pageData?.ancestors ?? [];
    const seller = pageData?.seller ?? null;
    const categoryProducts = pageData?.categoryProducts ?? [];
    const frequentlyTogether = pageData?.frequentlyTogether ?? [];
    const flashSaleCampaign = pageData?.flashSaleCampaign ?? null;
    const reviewsData = pageData?.reviewsData ?? null;

    // Breadcrumb category links
    const catPrefix = (permalinkMap["product-category"] ?? "product/category")
        .trim()
        .replace(/^\/+|\/+$/g, "");

    const categoryLinks = ancestors.map((cat) => ({
        title: cat.title,
        url: buildUrl(catPrefix, cat.slug),
    }));

    // Breadcrumb tag links
    const tagPrefix = (permalinkMap["product-tag"] ?? "product/tag")
        .trim()
        .replace(/^\/+|\/+$/g, "");

    const tagList = pageData?.tags ?? [];
    const tagLinks = tagList.map((tag: any) => ({
        title: tag.title || tag.slug,
        url: buildUrl(tagPrefix, tag.slug),
    }));

    const sellerPrefix =
        (permalinkMap["seller"] ?? "seller").trim().replace(/^\/+|\/+$/g, "") || "seller";

    const brandData = pageData?.brand ?? null;
    const brandPrefix = (permalinkMap["brands"] ?? "brands")
        .trim()
        .replace(/^\/+|\/+$/g, "") || "brands";

    const brand = brandData
        ? {
              ...brandData,
              url: buildUrl(brandPrefix, brandData.slug),
          }
        : null;

    const productPrefix = (permalinkMap["product"] ?? "product").trim().replace(/^\/+|\/+$/g, "");

    // ── Comparison Selection ──
    const compareSource = (pageData?.compareProducts && pageData.compareProducts.length > 0)
        ? pageData.compareProducts
        : categoryProducts;

    const parsedCompareCandidates: CompareProductItem[] = (compareSource || [])
        .filter((p: any) => String(p.id || p._id) !== String(data._id))
        .map((p: any) => mapToCompareItem(p, productPrefix))
        .filter((p): p is CompareProductItem => p !== null)
        .slice(0, 3);

    const allComparePool = (pageData?.allCompareCandidates && pageData.allCompareCandidates.length > 0)
        ? pageData.allCompareCandidates
        : categoryProducts;

    const allCategoryCompareCandidates: CompareProductItem[] = (allComparePool || [])
        .filter((p: any) => String(p.id || p._id) !== String(data._id))
        .map((p: any) => mapToCompareItem(p, productPrefix))
        .filter((p): p is CompareProductItem => p !== null)
        .slice(0, 5);

    const compareSpecifications: SpecBox[] = validSpecifications.length > 0
        ? validSpecifications
        : [
              {
                  title: "Key Specifications",
                  fields: [
                      { title: "Brand", description: brand?.title || "Standard" },
                      { title: "Price", description: `${currencySymbol} ${Number(displayPrice).toLocaleString()}` },
                      { title: "Stock Status", description: singleStock > 0 ? "In Stock" : "Available to Order" },
                      { title: "Edition / Model", description: data.title },
                  ],
              },
          ];

    const currentCompareItem: CompareProductItem = {
        id: String(data._id),
        title: data.title,
        slug: data.slug,
        image: allImages[0] || "",
        price: displayPrice,
        stock: singleStock,
        specifications: compareSpecifications,
        url: "#",
    };

    const hasOverview = Boolean((htmlDescription || description)?.trim());
    const visualDescription =
        (typeof data.info?._visual_description === "string" ? data.info._visual_description : "") ||
        (typeof data.info?.visual_description === "string" ? data.info.visual_description : "");
    const hasVisualDescription = Boolean(visualDescription?.trim());

    return (
        <div className="min-h-screen">
            {/* ─── 1. TOP BREADCRUMB BAR (SSR) ─── */}
            <div className="bg-white border-b border-gray-200/80">
                <div className="container py-3">
                    <nav className="flex items-center gap-2 text-xs text-gray-500 overflow-x-auto whitespace-nowrap scrollbar-none">
                        <Link href="/" className="hover:text-blue-600 transition flex items-center gap-1">
                            <Icon icon="solar:home-2-linear" width={14} height={14} className="text-gray-400" />
                            <span>Home</span>
                        </Link>
                        {categoryLinks.map((cat, idx) => (
                            <React.Fragment key={idx}>
                                <Icon icon="solar:alt-arrow-right-linear" width={12} height={12} className="text-gray-400" />
                                <Link href={cat.url} className="hover:text-blue-600 transition font-medium">
                                    {cat.title}
                                </Link>
                            </React.Fragment>
                        ))}
                        {/* tag */}
                        {tagLinks.map((tag, idx) => (
                            <React.Fragment key={`tag-${idx}`}>
                                <Icon icon="solar:alt-arrow-right-linear" width={12} height={12} className="text-gray-400" />
                                <Link href={tag.url} className="hover:text-blue-600 transition font-medium">
                                    {tag.title}
                                </Link>
                            </React.Fragment>
                        ))}
                        <Icon icon="solar:alt-arrow-right-linear" width={12} height={12} className="text-gray-400" />
                        <span className="text-gray-900 font-semibold truncate max-w-xs">{data.title}</span>
                    </nav>
                </div>
            </div>

            {/* ─── 2. TOP HERO SECTION: GALLERY + PURCHASING + TRUST BADGES ─── */}
            <div className="container py-6 space-y-8">
                <GadgetsProductDetails
                    heroOnly={true}
                    data={{ id: String(data._id), title: data.title, slug: data.slug }}
                    info={data.info || {}}
                    productId={String(data._id)}
                    categoryId={data.category ?? null}
                    priceType={priceType}
                    regularPrice={regularPrice}
                    sellingPrice={sellingPrice}
                    displayPrice={displayPrice}
                    hasDiscount={hasDiscount}
                    discountPercent={discountPercent}
                    singleStock={singleStock}
                    variants={variants}
                    selectedAttributes={selectedAttributes}
                    variantDisplayStyle={variantDisplayStyle}
                    allImages={allImages}
                    specifications={validSpecifications}
                    videos={videos}
                    currencySymbol={currencySymbol}
                    whatsappNumber={whatsappNumber}
                    telegramUsername={telegramUsername}
                    facebookPageId={facebookPageId}
                    shortDescription={shortDescription}
                    description={description}
                    htmlDescription={htmlDescription}
                    orderNote={orderNote}
                    warranty={warranty}
                    shippingInside={shippingInside}
                    shippingOutside={shippingOutside}
                    categoryLinks={categoryLinks}
                    flashSaleCampaign={flashSaleCampaign}
                    brand={brand}
                    permalinkMap={permalinkMap}
                    builder={builder}
                    settings={settings}
                    seller={
                        seller
                            ? {
                                  ...seller,
                                  profileUrl: buildUrl(sellerPrefix, seller.slug),
                              }
                            : null
                    }
                />

                {/* ─── CMS BUILDER (IF PRESENT) ─── */}
                {builder}

                {/* ─── 3. STICKY ANCHOR BAR (SSR) ─── */}
                <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 p-1.5 shadow-xs flex items-center gap-1 overflow-x-auto scrollbar-none">
                    {hasVisualDescription && (
                        <a
                            href="#visual-description"
                            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 hover:text-blue-600 hover:bg-blue-50/70 transition whitespace-nowrap flex items-center gap-1.5"
                        >
                            <Icon icon="solar:layers-minimalistic-bold" width={14} className="text-blue-600" />
                            <span>Visual Overview</span>
                        </a>
                    )}
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
                    <a
                        href="#compare"
                        className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 hover:text-indigo-600 hover:bg-indigo-50/70 transition whitespace-nowrap flex items-center gap-1.5"
                    >
                        <Icon icon="solar:round-transfer-vertical-bold" width={14} className="text-indigo-600" />
                        <span>Compare</span>
                    </a>
                    <a
                        href="#complete-setup"
                        className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 hover:text-blue-600 hover:bg-blue-50/70 transition whitespace-nowrap flex items-center gap-1.5"
                    >
                        <Icon icon="solar:widget-add-bold" width={14} className="text-blue-600" />
                        <span>Complete Setup</span>
                    </a>
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

                {/* ─── 4. MAIN PRODUCT DESCRIPTION (SSR WITH TOGGLE) ─── */}
                {hasOverview && (
                    <GadgetsDescription html={htmlDescription || description} />
                )}

                {/* ─── 7. COMPLETE YOUR SETUP (PROGRESSIVE LOAD WITH SKELETON) ─── */}
                <LazyFrequencyTogether
                    productId={String(data._id)}
                    productTitle={data.title}
                    categoryId={data.category ?? null}
                    categoryTitle={ancestors.length > 0 ? ancestors[ancestors.length - 1]?.title : undefined}
                    brandTitle={brand?.title}
                    currencySymbol={currencySymbol}
                    initialProducts={frequentlyTogether}
                />
            </div>

            {/* ─── 6. VISUAL DESCRIPTION (PROGRESSIVE LOAD WITH SKELETON) ─── */}
            {hasVisualDescription && (
                <LazyVisualDescription data={visualDescription} productTitle={data.title} />
            )}

            <div className="container py-6 space-y-8">
                {/* ─── 5. AUTOMATIC COMPARE COMPONENT (PROGRESSIVE LOAD WITH SKELETON) ─── */}
                <LazyCompare
                    productId={String(data._id)}
                    productTitle={data.title}
                    categoryId={data.category ?? null}
                    categoryTitle={ancestors.length > 0 ? ancestors[ancestors.length - 1]?.title : undefined}
                    brandTitle={brand?.title}
                    currentProduct={currentCompareItem}
                    currencySymbol={currencySymbol}
                    initialCompareProducts={parsedCompareCandidates}
                    initialAllCandidates={allCategoryCompareCandidates}
                    productPrefix={productPrefix}
                />

                {/* ─── 8. SPECIFICATIONS COMPONENT (SSR) ─── */}
                {validSpecifications.length > 0 && (
                    <GadgetsSpecification specifications={validSpecifications} productTitle={data.title} />
                )}

                {/* ─── 9. REVIEWS COMPONENT (SSR) ─── */}
                <GadgetsReviews reviewsData={reviewsData} productTitle={data.title} productId={String(data._id)} />

                {/* ─── 10. PRODUCT VIDEOS COMPONENT (SSR) ─── */}
                {videos && videos.length > 0 && (
                    <GadgetsVideos videos={videos} productTitle={data.title} />
                )}

                {/* ─── 11. RELATED CATEGORY PRODUCTS COMPONENT (SSR) ─── */}
                <GadgetsRelated
                    categoryProducts={categoryProducts}
                    settings={settings}
                    permalinkMap={permalinkMap}
                    currencySymbol={currencySymbol}
                    productTitle={data.title}
                />
            </div>
        </div>
    );
}
