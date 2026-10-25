/**
 * plugin/gadgets/product/Related.tsx
 *
 * Related Category Products Component — Server Component (SSR).
 *  - Responsive grid layout computed dynamically from desktop, tablet, and mobile inputs.
 *  - Follows "Related Products Layout Settings" in CategoryPageSettings.tsx:
 *      • related_products_cols (Desktop columns per line: 2, 3, 4, 5, 6)
 *      • related_products_total (Total related products limit)
 *      • category_grid_cols_mobile, category_grid_cols_tablet
 *      • category_grid_gap_mobile, category_grid_gap_tablet, category_grid_gap_desktop
 *  - Renders each product using GadgetsBox1 tech card.
 */

import React from "react";
import { Icon } from "@iconify/react";
import GadgetsBox1 from "../box/Box-1";

interface RelatedProps {
    categoryProducts?: any[] | null;
    settings?: Record<string, any>;
    permalinkMap?: Record<string, string>;
    currencySymbol?: string;
    productTitle?: string;
}

function buildUrl(prefix: string, slug: string): string {
    const p = prefix.trim().replace(/^\/+|\/+$/g, "");
    return p ? `/${p}/${slug}` : `/${slug}`;
}

export default function GadgetsRelated({
    categoryProducts = [],
    settings = {},
    permalinkMap = {},
    currencySymbol = "৳",
}: RelatedProps) {
    // ── Layout & Column Settings from CategoryPageSettings.tsx ────────────────
    const relatedTotal = parseInt((settings.related_products_total as string) ?? "12", 10) || 12;
    const relatedColsDesktop = parseInt((settings.related_products_cols as string) ?? "5", 10) || 5;

    const columnsMobile = Number(settings.category_grid_cols_mobile) || 2;
    const columnsTablet = Number(settings.category_grid_cols_tablet) || 3;
    const columnsDesktop = Number(settings.category_grid_cols_desktop) || relatedColsDesktop;

    const gapMobile = settings.category_grid_gap_mobile != null && settings.category_grid_gap_mobile !== ""
        ? Number(settings.category_grid_gap_mobile)
        : 4;
    const gapTablet = settings.category_grid_gap_tablet != null && settings.category_grid_gap_tablet !== ""
        ? Number(settings.category_grid_gap_tablet)
        : 4;
    const gapDesktop = settings.category_grid_gap_desktop != null && settings.category_grid_gap_desktop !== ""
        ? Number(settings.category_grid_gap_desktop)
        : 5;

    // Limit products to the configured total
    const displayedProducts = (categoryProducts || []).slice(0, relatedTotal);

    const productPrefix = (permalinkMap["product"] ?? "product").trim().replace(/^\/+|\/+$/g, "");

    if (!displayedProducts || displayedProducts.length === 0) {
        return null;
    }

    // Dynamic grid classes computed for responsive devices
    const mobColsClass = `grid-cols-${columnsMobile}`;
    const tabColsClass = `md:grid-cols-${columnsTablet}`;
    const deskColsClass = `lg:grid-cols-6`;

    const mobGapClass = `gap-${gapMobile}`;
    const tabGapClass = `md:gap-${gapTablet}`;
    const deskGapClass = `lg:gap-${gapDesktop}`;

    const gridClass = `grid ${mobColsClass} ${tabColsClass} ${deskColsClass} ${mobGapClass} ${tabGapClass} ${deskGapClass} w-full`;

    return (
        <section id="related-products" className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 shadow-2xs">
                        <Icon icon="solar:bag-heart-bold-duotone" width={22} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                            Related Gadgets & Accessories
                        </h2>
                        <p className="text-xs text-gray-500">
                            Discover more popular models and gadgets from this category
                        </p>
                    </div>
                </div>

                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                    {displayedProducts.length} Items
                </span>
            </div>

            {/* Responsive Dynamic Grid */}
            <div className={gridClass}>
                {displayedProducts.map((item: any) => (
                    <GadgetsBox1
                        key={item._id}
                        data={item}
                        productUrl={buildUrl(productPrefix, item.slug)}
                        currencySymbol={currencySymbol}
                        permalinkMap={permalinkMap}
                    />
                ))}
            </div>
        </section>
    );
}
