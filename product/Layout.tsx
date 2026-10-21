/**
 * plugin/gadgets/product/Layout.tsx
 *
 * Gadgets Product Details Layout — Server Component (SSR).
 * Pre-processes product data, images, variates, seller information,
 * category breadcrumbs, specification data, and automatically resolves
 * 3 related category products for instant side-by-side comparison.
 */

import React from "react";
import GadgetsProductDetails from "./Details";

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
        reviewsData?: any | null;
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

    // Parse structured specifications
    const specifications: any[] = parseJson<any[]>(data.info?._specifications, []);

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
    const videos: { title: string; videoid: string }[] = parseJson<any[]>(rawVideos, [])
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

    // Breadcrumb category links
    const catPrefix = (permalinkMap["product-category"] ?? "product/category")
        .trim()
        .replace(/^\/+|\/+$/g, "");

    const categoryLinks = ancestors.map((cat) => ({
        title: cat.title,
        url: buildUrl(catPrefix, cat.slug),
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

    // ── Automatic Comparison Selection: Up to 3 related category products with specifications ──
    const compareProducts = (pageData?.compareProducts && pageData.compareProducts.length > 0)
        ? pageData.compareProducts
        : categoryProducts
            .filter((p: any) => {
                if (String(p._id) === String(data._id)) return false;
                if (!p.info?._specifications) return false;
                try {
                    const parsed = JSON.parse(p.info._specifications);
                    if (!Array.isArray(parsed) || parsed.length === 0) return false;
                    return parsed.some((box: any) =>
                        Array.isArray(box.fields) &&
                        box.fields.some((f: any) => typeof f?.description === "string" && f.description.trim().length > 0)
                    );
                } catch {
                    return false;
                }
            })
            .slice(0, 3);

    const allCompareCandidates = (pageData?.allCompareCandidates && pageData.allCompareCandidates.length > 0)
        ? pageData.allCompareCandidates
        : categoryProducts;

    return (
        <GadgetsProductDetails
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
            specifications={specifications}
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
            categoryProducts={categoryProducts}
            compareProducts={compareProducts}
            allCompareCandidates={allCompareCandidates}
            frequentlyTogether={frequentlyTogether}
            flashSaleCampaign={flashSaleCampaign}
            brand={brand}
            permalinkMap={permalinkMap}
            builder={builder}
            reviewsData={pageData?.reviewsData ?? null}
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
    );
}
