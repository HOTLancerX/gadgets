'use client';

/**
 * cms/plugin/gadgets/product-brand/Layout.tsx
 *
 * Exelic Gadgets Product Brand Layout:
 *  - 100% Server-Side Rendered (SSR) data foundation with dynamic client-side reactivity.
 *  - Mirrors the exact architecture of cms/plugin/gadgets/product-category/Layout.tsx:
 *      • Same URL query handling & transitions (attr_*, min_price, max_price, sort, page).
 *      • FilterPanel integration (Styles 1, 2, 3 accordion + Style 4 horizontal bar).
 *      • Responsive grid columns & gaps from settings / info.
 *      • Active product box resolution (ActiveBox template from DB / getHooks, with GadgetProductCard fallback).
 *      • VariantPopup modal for quick option configurations.
 *      • Pagination controls.
 *  - Top Popular Categories Carousel / Pill Bar:
 *      • Filtered server-side to ONLY include categories with products (count > 0).
 *      • Toggles category navigation: /brands/:brandSlug/:catSlug or /brands/:brandSlug.
 *      • Active category pill is clearly highlighted.
 */

import React, { useState, useEffect, useMemo, useCallback, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Icon } from '@iconify/react';
import { getHooks } from '@/hook';
import type { CategoryProduct, AttributeOption } from '@/plugin/product/lib/types';
import type { BrandPageData, BrandPopularCategory } from '@/plugin/product/lib/brand';
import FilterPanel from '@/plugin/product/product-category/FilterPanel';
import VariantPopup, { type VariantData } from '../box/VariantPopup';

interface BrandLayoutProps {
    data: {
        _id:               string;
        title:             string;
        slug:              string;
        description?:      string;
        shortDescription?: string;
        status?:           string;
        image?:            string;
        createdAt?:        string;
        updatedAt?:        string;
        info?:             Record<string, string>;
    };
    settings?:     Record<string, any>;
    permalinkMap?: Record<string, string>;
    pageData?:     BrandPageData;
    searchParams?: Record<string, string | string[] | undefined>;
    builderTop?:   React.ReactNode;
    builderBottom?: React.ReactNode;
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

function buildUrl(prefix: string, slug: string): string {
    const p = prefix.trim().replace(/^\/+|\/+$/g, '');
    return p ? `/${p}/${slug}` : `/${slug}`;
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

/** Extract category/brand pills (e.g. [ Xiaomi ] [ Phone ]) */
function getProductTags(product: CategoryProduct, currentBrandTitle: string): string[] {
    const tags: string[] = [];
    const variate = parseJson<Record<string, any>>(product.info?._variate, {});

    // Check single/selected attributes for a Brand attribute
    const attrs = [...(variate.singleAttributes ?? []), ...(variate.selectedAttributes ?? [])];
    const brandAttr = attrs.find((a: any) => /brand/i.test(a?.label || ''));
    if (brandAttr && brandAttr.values?.[0]) {
        tags.push(String(brandAttr.values[0]));
    } else if (currentBrandTitle) {
        tags.push(currentBrandTitle.trim().split(/\s+/)[0]);
    }

    // Determine category type pill
    const pTitle = (product.title || '').toLowerCase();
    if (pTitle.includes('phone') || pTitle.includes('smartphone') || pTitle.includes('note') || pTitle.includes('ultra')) {
        tags.push('Phone');
    } else if (pTitle.includes('laptop') || pTitle.includes('computer') || pTitle.includes('pad') || pTitle.includes('tablet')) {
        tags.push('Tablet');
    } else if (pTitle.includes('watch') || pTitle.includes('band')) {
        tags.push('Smartwatch');
    } else if (pTitle.includes('audio') || pTitle.includes('bud') || pTitle.includes('headphone') || pTitle.includes('earphone')) {
        tags.push('Audio');
    } else if (pTitle.includes('camera')) {
        tags.push('Camera');
    } else if (pTitle.includes('charger') || pTitle.includes('power bank') || pTitle.includes('adapter')) {
        tags.push('Charger');
    }

    return tags.slice(0, 2);
}

function getPaginationPages(currentPage: number, totalPages: number): (number | string)[] {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 3) {
        return [1, 2, 3, 4, '...', totalPages];
    }
    if (currentPage >= totalPages - 2) {
        return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
}

function getCategoryIcon(title: string): string {
    const t = (title || '').toLowerCase();
    if (t.includes('phone') || t.includes('mobile')) return 'solar:smartphone-bold';
    if (t.includes('camera')) return 'solar:videocamera-record-bold';
    if (t.includes('light')) return 'solar:lightbulb-bolt-bold';
    if (t.includes('power') || t.includes('bank') || t.includes('charger')) return 'solar:battery-charge-bold';
    if (t.includes('vacuum') || t.includes('cleaner') || t.includes('home')) return 'solar:home-smile-bold';
    if (t.includes('monitor') || t.includes('screen') || t.includes('display')) return 'solar:monitor-bold';
    if (t.includes('mesh') || t.includes('wifi') || t.includes('router')) return 'solar:wifi-router-bold';
    if (t.includes('audio') || t.includes('ear') || t.includes('headphone') || t.includes('sound')) return 'solar:headphones-round-bold';
    if (t.includes('watch') || t.includes('band') || t.includes('wearable')) return 'solar:watch-round-bold';
    if (t.includes('fryer') || t.includes('kitchen')) return 'solar:cup-hot-bold';
    if (t.includes('tablet') || t.includes('pad')) return 'solar:tablet-bold';
    if (t.includes('cable') || t.includes('adapter')) return 'solar:usb-bold';
    return 'solar:devices-bold';
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GadgetsBrandLayout({
    data,
    settings = {},
    permalinkMap = {},
    pageData,
    searchParams: initialSearchParams = {},
    builderTop,
    builderBottom,
}: BrandLayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const urlSearchParams = useSearchParams();

    const productPrefix = (permalinkMap['product'] ?? 'product').trim().replace(/^\/+|\/+$/g, '') || 'product';
    const brandPrefix = (permalinkMap['brands'] ?? 'brands').trim().replace(/^\/+|\/+$/g, '') || 'brands';
    const currencySymbol = (settings.product_currency_symbol as string) || 'KSh';

    const brandTitle = data.title || pageData?.brand?.title || 'Brand';
    const brandSlug = data.slug || pageData?.brand?.slug || 'brand';

    const allProducts = useMemo(() => pageData?.products ?? [], [pageData?.products]);
    const ancestors = useMemo(() => pageData?.ancestors ?? [], [pageData?.ancestors]);
    const popularCategories = useMemo(
        () => (pageData?.popularCategories ?? []).filter((c) => (c.count || 0) > 0),
        [pageData?.popularCategories]
    );

    // Active category slug from pageData (path e.g. /brands/xiaomi/phone) or URL param ?category=phone
    const activeCategorySlug = (pageData?.activeCategorySlug || urlSearchParams.get('category') || initialSearchParams.category || '') as string;

    // ── Deduplicate attribute options by unique ID to avoid React key collisions ──
    const uniqueAttrOptions = useMemo(() => {
        const raw = pageData?.attributeOptions ?? [];
        const map = new Map<string, AttributeOption>();
        for (const item of raw) {
            if (!item?.id) continue;
            if (!map.has(item.id)) {
                map.set(item.id, {
                    id: item.id,
                    label: item.label,
                    values: [...new Set(item.values || [])].sort(),
                });
            } else {
                const existing = map.get(item.id)!;
                const mergedValues = [...new Set([...existing.values, ...(item.values || [])])].sort();
                existing.values = mergedValues;
            }
        }
        return Array.from(map.values());
    }, [pageData?.attributeOptions]);

    // ── Filtering ON/OFF System from Settings & Brand Info ─────────────────
    const filterEnabled =
        data.info?.filter_enabled !== '0' &&
        data.info?.filter_disabled !== '1' &&
        settings.category_filter_enabled !== '0' &&
        settings.product_cat_filter_enabled !== '0';

    const priceFilter =
        data.info?.price_filter !== '0' &&
        settings.category_price_filter !== '0' &&
        settings.product_cat_price_filter !== '0';

    const sortEnabled =
        data.info?.sort_enabled !== '0' &&
        data.info?.sort_disabled !== '1' &&
        settings.category_sort_enabled !== '0' &&
        settings.product_cat_sort_enabled !== '0';

    const rawStyle = parseInt(
        String(
            data.info?.filter_style ??
            settings.category_filter_style ??
            settings.product_cat_filter_style ??
            '1'
        ),
        10
    );
    const filterStyle = ([1, 2, 3, 4].includes(rawStyle) ? rawStyle : 1) as 1 | 2 | 3 | 4;
    const hasFilters = filterEnabled && (uniqueAttrOptions.length > 0 || priceFilter);

    // Active filters state (synced with URL)
    const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
    const [minPriceInput, setMinPriceInput] = useState<string>('');
    const [maxPriceInput, setMaxPriceInput] = useState<string>('');
    const [currentSort, setCurrentSort] = useState<string>('newest');
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

    // Synchronize local filter state with URL
    useEffect(() => {
        const filters: Record<string, string[]> = {};
        urlSearchParams.forEach((val, key) => {
            if (key.startsWith('attr_') && val) {
                filters[key.slice(5)] = val.split(',').filter(Boolean);
            }
        });
        setSelectedFilters(filters);

        const urlMin = urlSearchParams.get('min_price') || '';
        const urlMax = urlSearchParams.get('max_price') || '';
        setMinPriceInput(urlMin);
        setMaxPriceInput(urlMax);

        const urlSort = urlSearchParams.get('sort') || 'newest';
        setCurrentSort(urlSort);
    }, [urlSearchParams]);

    const [isPending, startTransition] = useTransition();

    // Callback for FilterPanel: Toggle attribute filter
    const handleToggleFilter = useCallback((attrId: string, val: string) => {
        const currentList = selectedFilters[attrId] || [];
        const isSelected = currentList.includes(val);
        const nextList = isSelected
            ? currentList.filter((v) => v !== val)
            : [...currentList, val];

        const updated = { ...selectedFilters };
        if (nextList.length === 0) {
            delete updated[attrId];
        } else {
            updated[attrId] = nextList;
        }

        setSelectedFilters(updated);

        const params = new URLSearchParams(window.location.search);
        params.delete('page');
        if (nextList.length === 0) {
            params.delete(`attr_${attrId}`);
        } else {
            params.set(`attr_${attrId}`, nextList.join(','));
        }
        const qs = params.toString();
        startTransition(() => {
            router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
        });
    }, [selectedFilters, pathname, router]);

    // Callback for FilterPanel: Apply price range
    const handleApplyPrice = useCallback((minStr: string, maxStr: string) => {
        setMinPriceInput(minStr);
        setMaxPriceInput(maxStr);

        const params = new URLSearchParams(window.location.search);
        params.delete('page');
        if (minStr) {
            params.set('min_price', minStr);
        } else {
            params.delete('min_price');
        }
        if (maxStr) {
            params.set('max_price', maxStr);
        } else {
            params.delete('max_price');
        }

        const qs = params.toString();
        startTransition(() => {
            router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
        });
        setMobileFilterOpen(false);
    }, [pathname, router]);

    // Callback for FilterPanel: Clear all filters
    const handleClearFilters = useCallback(() => {
        setSelectedFilters({});
        setMinPriceInput('');
        setMaxPriceInput('');
        startTransition(() => {
            router.push(pathname, { scroll: false });
        });
        setMobileFilterOpen(false);
    }, [pathname, router]);

    // Sort selector handler
    const handleSortChange = (newSort: string) => {
        setCurrentSort(newSort);
        const params = new URLSearchParams(urlSearchParams.toString());
        params.delete('page');
        if (newSort === 'newest') {
            params.delete('sort');
        } else {
            params.set('sort', newSort);
        }
        const qs = params.toString();
        startTransition(() => {
            router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
        });
    };

    // Category Pill Click Handler: toggles route between /brands/:brandSlug and /brands/:brandSlug/:catSlug
    const handleCategoryPillClick = (catSlug: string) => {
        const params = new URLSearchParams(urlSearchParams.toString());
        params.delete('page');
        params.delete('category');
        const qs = params.toString();

        let targetPath: string;
        if (activeCategorySlug === catSlug) {
            // Toggling active category off: return to brand root
            targetPath = `/${brandPrefix}/${brandSlug}`;
        } else {
            // Activating sub-category route
            targetPath = `/${brandPrefix}/${brandSlug}/${catSlug}`;
        }

        const fullUrl = qs ? `${targetPath}?${qs}` : targetPath;
        startTransition(() => {
            router.push(fullUrl, { scroll: false });
        });
    };

    // Client-side filtering & sorting for instantaneous feedback
    const filteredProducts = useMemo(() => {
        let result = [...allProducts];

        // 1. Attribute filter
        const activeKeys = Object.keys(selectedFilters).filter((k) => (selectedFilters[k] || []).length > 0);
        if (activeKeys.length > 0) {
            result = result.filter((p) => {
                let variate: Record<string, any> = {};
                try { variate = JSON.parse(p.info?._variate ?? '{}'); } catch {}

                const productValues = new Map<string, Set<string>>();

                // Single attributes
                const singleAttrs: { label: string; values: string[] }[] = variate.singleAttributes ?? [];
                singleAttrs.forEach((attr) => {
                    if (!attr.label) return;
                    const id = attr.label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                    const set = productValues.get(id) ?? new Set<string>();
                    (attr.values ?? []).forEach((v) => set.add(String(v).toLowerCase()));
                    productValues.set(id, set);
                });

                // Variant attributes
                const selAttrs: { label: string; values: string[] }[] = variate.selectedAttributes ?? [];
                selAttrs.forEach((attr) => {
                    if (!attr.label) return;
                    const id = attr.label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                    const set = productValues.get(id) ?? new Set<string>();
                    (attr.values ?? []).forEach((v) => set.add(String(v).toLowerCase()));
                    productValues.set(id, set);
                });

                const variants: { options?: Record<string, string> }[] = variate.variants ?? [];
                variants.forEach((variant) => {
                    if (!variant.options) return;
                    Object.entries(variant.options).forEach(([label, val]) => {
                        const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                        const set = productValues.get(id) ?? new Set<string>();
                        set.add(String(val).toLowerCase());
                        productValues.set(id, set);
                    });
                });

                // Check match for all active keys
                for (const key of activeKeys) {
                    const requiredVals = selectedFilters[key] || [];
                    if (requiredVals.length === 0) continue;
                    const productSet = productValues.get(key);
                    if (!productSet) return false;
                    const hasMatch = requiredVals.some((fv) => productSet.has(fv.toLowerCase()));
                    if (!hasMatch) return false;
                }
                return true;
            });
        }

        // 2. Price filter
        const minP = minPriceInput ? parseFloat(minPriceInput) : undefined;
        const maxP = maxPriceInput ? parseFloat(maxPriceInput) : undefined;
        if (minP !== undefined || maxP !== undefined) {
            result = result.filter((p) => {
                let variate: Record<string, any> = {};
                try { variate = JSON.parse(p.info?._variate ?? '{}'); } catch {}
                const price = parseFloat(variate.sellingprice || variate.regularprice || p.info?.sellingprice || '0') || 0;
                if (minP !== undefined && price < minP) return false;
                if (maxP !== undefined && price > maxP) return false;
                return true;
            });
        }

        // 3. Sorting
        const getPrice = (p: CategoryProduct): number => {
            try {
                const blob = JSON.parse(p.info?._variate ?? '{}');
                return parseFloat(blob.sellingprice || blob.regularprice || p.info?.sellingprice || '0') || 0;
            } catch {
                return 0;
            }
        };

        switch (currentSort) {
            case 'price_asc':
                result.sort((a, b) => getPrice(a) - getPrice(b));
                break;
            case 'price_desc':
                result.sort((a, b) => getPrice(b) - getPrice(a));
                break;
            case 'title_asc':
                result.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'title_desc':
                result.sort((a, b) => b.title.localeCompare(a.title));
                break;
            case 'oldest':
                break;
            default:
                break;
        }

        return result;
    }, [allProducts, selectedFilters, minPriceInput, maxPriceInput, currentSort]);

    // Active filters count
    const totalActiveCount = useMemo(() => {
        let count = Object.values(selectedFilters).reduce((acc, list) => acc + list.length, 0);
        if (minPriceInput) count++;
        if (maxPriceInput) count++;
        return count;
    }, [selectedFilters, minPriceInput, maxPriceInput]);

    // ── Synchronously resolve active Product Box Component ──
    const activeBoxSetting = pageData?.activeBox;
    const ActiveBox = useMemo(() => {
        try {
            const boxes = getHooks('root.pages').filter(
                (p) => p.type === 'product-box' && p.slug === 'dynamic'
            );
            if (!boxes.length) return null;
            if (activeBoxSetting) {
                const found = boxes.find(
                    (b) => b.label === activeBoxSetting.label && (b.pluginNx === activeBoxSetting.pluginNx || !activeBoxSetting.pluginNx)
                )?.component;
                if (found) return found;
            }
            return boxes.find((b) => b.label === 'Gadgets Box 1')?.component ??
                boxes.find((b) => b.active === true)?.component ??
                boxes[0]?.component ??
                null;
        } catch {
            return null;
        }
    }, [activeBoxSetting]);

    // ── Variant Modal State ──
    const [activeVariantProduct, setActiveVariantProduct] = useState<CategoryProduct | null>(null);

    const openVariantModal = (product: CategoryProduct) => {
        setActiveVariantProduct(product);
    };

    const closeVariantModal = () => {
        setActiveVariantProduct(null);
    };

    const handleVariantAddToCart = (variant: VariantData, qty: number) => {
        if (!activeVariantProduct) return;
        const variate = parseJson<Record<string, any>>(activeVariantProduct.info?._variate, {});
        const sPrice = parseFloat(variate.sellingprice || variate.regularprice || '0') || 0;
        const price = parseFloat(variant.price ?? '0') || sPrice;
        const maxQty = parseInt(variant.quantity ?? '0', 10) || 9999;
        const addQty = Math.max(1, qty || 1);

        addToCartDirect({
            productId: String(activeVariantProduct._id),
            productSlug: activeVariantProduct.slug,
            productTitle: activeVariantProduct.title,
            productImage: variant.image || activeVariantProduct.info?.image || '',
            variantId: variant.id,
            variantOptions: variant.options,
            sku: variant.sku,
            price,
            quantity: addQty,
            maxQuantity: maxQty,
        }, addQty);

        closeVariantModal();
    };

    // Breadcrumb list
    const breadcrumbChain = ancestors.length > 0 ? ancestors : [{ title: brandTitle, slug: brandSlug, _id: data._id }];

    // Price numbers for FilterPanel
    const minPriceNum = minPriceInput ? parseFloat(minPriceInput) : undefined;
    const maxPriceNum = maxPriceInput ? parseFloat(maxPriceInput) : undefined;

    // ── Responsive Grid Layout & Gaps ─────────────────────────────────────────
    const columnsMobile = data.info?.category_grid_cols_mobile || settings.category_grid_cols_mobile;
    const columnsTablet = data.info?.category_grid_cols_tablet || settings.category_grid_cols_tablet;
    const defaultDeskCols = hasFilters && filterStyle !== 4 ? 4 : 5;
    const columnsDesktop = data.info?.category_grid_cols_desktop || settings.category_grid_cols_desktop || defaultDeskCols;

    const gapMobile = data.info?.category_grid_gap_mobile ?? settings.category_grid_gap_mobile;
    const gapTablet = data.info?.category_grid_gap_tablet ?? settings.category_grid_gap_tablet;
    const gapDesktop = data.info?.category_grid_gap_desktop ?? settings.category_grid_gap_desktop;

    const mobColsClass = Number(columnsMobile) || 2;
    const tabColsClass = Number(columnsTablet) || 3;
    const deskColsClass = Number(columnsDesktop) || defaultDeskCols;

    const mobGapClass = `gap-${gapMobile != null && gapMobile !== '' ? Number(gapMobile) : 4}`;
    const tabGapClass = `md:gap-${gapTablet != null && gapTablet !== '' ? Number(gapTablet) : 4}`;
    const deskGapClass = `lg:gap-${gapDesktop != null && gapDesktop !== '' ? Number(gapDesktop) : 5}`;

    const gridClass = `grid grid-cols-${mobColsClass} md:grid-cols-${tabColsClass} lg:grid-cols-${deskColsClass} ${mobGapClass} ${tabGapClass} ${deskGapClass} w-full`;

    // ── Configurable Image Heights (Desktop & Mobile) ─────────────────────────
    const leadImageHeightMobile = Number(data.info?.leadImageHeightMobile || data.info?.image_height_mobile || settings.category_image_height_mobile || settings.product_image_height_mobile) || 192;
    const leadImageHeightDesktop = Number(data.info?.leadImageHeightDesktop || data.info?.image_height_desktop || settings.category_image_height_desktop || settings.product_image_height_desktop) || 210;

    // ── Total Posts / Products Limit ─────────────────────────────────────────
    const rawTotalLimit =
        data.info?.category_products_total ||
        data.info?.category_total_posts ||
        data.info?.total_products ||
        data.info?.limit ||
        settings.category_products_total ||
        settings.category_total_posts ||
        settings.product_cat_total;

    const totalLimit = rawTotalLimit ? parseInt(String(rawTotalLimit), 10) : 0;
    const finalProducts = totalLimit > 0 ? filteredProducts.slice(0, totalLimit) : filteredProducts;

    // ── Pagination Settings & Slicing (20 products per page by default) ───────
    const pageSize = Number(data.info?.category_products_per_page || settings.category_products_per_page) || 20;
    const pageParam = urlSearchParams.get('page');
    const currentPage = Math.max(1, parseInt(pageParam || '1', 10) || 1);

    const totalProductsCount = finalProducts.length;
    const totalPages = Math.ceil(totalProductsCount / pageSize);
    const safeCurrentPage = Math.min(currentPage, Math.max(1, totalPages));

    const startIndex = (safeCurrentPage - 1) * pageSize;
    const paginatedProducts = finalProducts.slice(startIndex, startIndex + pageSize);

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages || newPage === safeCurrentPage) return;
        const params = new URLSearchParams(urlSearchParams.toString());
        params.set('page', String(newPage));
        const qs = params.toString();
        startTransition(() => {
            router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: true });
        });
    };

    const paginationPages = useMemo(
        () => getPaginationPages(safeCurrentPage, totalPages),
        [safeCurrentPage, totalPages]
    );

    return (
        <div className="min-h-screen bg-[#fafbfc] text-[#111827] antialiased">
            <div className="container py-6 md:py-8">

                {/* ── Top Header Row: Brand Title & Breadcrumb Chain ── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6 pb-2">
                    <div>
                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-[#111827] tracking-tight">
                            {brandTitle}
                            {pageData?.activeCategoryTitle && (
                                <span className="text-gray-400 font-medium text-xl md:text-2xl lg:text-3xl ml-2">
                                    / {pageData.activeCategoryTitle}
                                </span>
                            )}
                        </h1>
                    </div>

                    {/* Breadcrumbs */}
                    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs md:text-sm text-gray-500 flex-wrap">
                        <Link href="/" className="text-[#0066cc] hover:underline font-medium transition-colors">
                            Home
                        </Link>
                        {breadcrumbChain.map((item, idx) => {
                            const isLast = idx === breadcrumbChain.length - 1;
                            return (
                                <React.Fragment key={item._id || item.slug || idx}>
                                    <span className="text-gray-400">/</span>
                                    {isLast ? (
                                        <span className="text-gray-500 font-normal">
                                            {item.title}
                                        </span>
                                    ) : (
                                        <Link
                                            href={`/${item.slug}`}
                                            className="text-[#0066cc] hover:underline font-medium transition-colors"
                                        >
                                            {item.title}
                                        </Link>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </nav>
                </div>

                {/* builder top */}
                {builderTop}

                {/* ── Popular Categories Carousel / Pill Bar ── */}
                {popularCategories.length > 0 && (
                    <div className="mb-7">
                        <div className="flex items-center justify-between mb-2.5">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                Popular Categories
                            </span>
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none select-none">
                            {/* All Brand Products Pill */}
                            <button
                                type="button"
                                onClick={() => {
                                    if (activeCategorySlug) {
                                        const params = new URLSearchParams(urlSearchParams.toString());
                                        params.delete('page');
                                        params.delete('category');
                                        const qs = params.toString();
                                        const target = `/${brandPrefix}/${brandSlug}`;
                                        startTransition(() => {
                                            router.push(qs ? `${target}?${qs}` : target, { scroll: false });
                                        });
                                    }
                                }}
                                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                                    !activeCategorySlug
                                        ? 'bg-[#0053e2] text-white shadow-xs ring-2 ring-[#0053e2]/20'
                                        : 'bg-white border border-gray-200/90 text-gray-700 hover:border-gray-300 hover:bg-gray-50 shadow-2xs'
                                }`}
                            >
                                <Icon icon="solar:widget-2-bold" width={16} />
                                <span>All {brandTitle}</span>
                            </button>

                            {/* Dynamic Category Pills (Count > 0 Only) */}
                            {popularCategories.map((cat) => {
                                const isActive = activeCategorySlug === cat.slug;
                                const iconName = getCategoryIcon(cat.title);

                                return (
                                    <button
                                        key={cat._id}
                                        type="button"
                                        onClick={() => handleCategoryPillClick(cat.slug)}
                                        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                                            isActive
                                                ? 'bg-[#0053e2] text-white shadow-xs ring-2 ring-[#0053e2]/20'
                                                : 'bg-white border border-gray-200/90 text-gray-700 hover:border-gray-300 hover:bg-gray-50 shadow-2xs'
                                        }`}
                                    >
                                        {cat.image ? (
                                            <div className="w-4 h-4 relative shrink-0">
                                                <Image
                                                    src={cat.image}
                                                    alt={cat.title}
                                                    width={16}
                                                    height={16}
                                                    className="object-contain w-full h-full"
                                                    unoptimized
                                                />
                                            </div>
                                        ) : (
                                            <Icon
                                                icon={iconName}
                                                width={16}
                                                className={isActive ? 'text-white' : 'text-gray-500'}
                                            />
                                        )}
                                        <span>{cat.title}</span>
                                        <span
                                            className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                                                isActive
                                                    ? 'bg-white/20 text-white'
                                                    : 'bg-gray-100 text-gray-500'
                                            }`}
                                        >
                                            {cat.count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── Subheader Controls Row: Showing X results & Sort by Dropdown ── */}
                <div className="flex items-center justify-between gap-4 mb-6 pt-1 flex-wrap">
                    <div className="flex items-center gap-3">
                        {/* Mobile Filter Toggle Button */}
                        {hasFilters && filterStyle !== 4 && (
                            <button
                                type="button"
                                onClick={() => setMobileFilterOpen(true)}
                                className="lg:hidden inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-gray-200 rounded-xl text-xs md:text-sm font-semibold text-gray-800 shadow-2xs hover:bg-gray-50 cursor-pointer"
                            >
                                <Icon icon="solar:filter-linear" width={16} />
                                <span>Filters</span>
                                {totalActiveCount > 0 && (
                                    <span className="w-4 h-4 rounded-full bg-[#0053e2] text-white text-[10px] font-bold flex items-center justify-center">
                                        {totalActiveCount}
                                    </span>
                                )}
                            </button>
                        )}

                        <p className="text-xs md:text-sm text-gray-500 font-normal">
                            {totalProductsCount === 0 ? (
                                'No results'
                            ) : totalPages > 1 ? (
                                <>
                                    Showing <span className="font-semibold text-gray-800">{startIndex + 1}</span>–
                                    <span className="font-semibold text-gray-800">
                                        {Math.min(startIndex + pageSize, totalProductsCount)}
                                    </span>{' '}
                                    of <span className="font-semibold text-gray-800">{totalProductsCount}</span> results
                                </>
                            ) : (
                                `Showing all ${totalProductsCount} results`
                            )}
                        </p>
                    </div>

                    {/* Sort selector */}
                    {sortEnabled && (
                        <div className="flex items-center gap-2">
                            <label htmlFor="brand-sort-select" className="text-xs md:text-sm font-medium text-gray-500 hidden md:inline-block">
                                Sort by:
                            </label>
                            <div className="relative">
                                <select
                                    id="brand-sort-select"
                                    value={currentSort}
                                    onChange={(e) => handleSortChange(e.target.value)}
                                    className="appearance-none bg-white border border-gray-200 hover:border-gray-300 text-xs md:text-sm font-semibold text-gray-800 py-2 pl-3.5 pr-8 rounded-xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 focus:border-[#0066cc] cursor-pointer transition-colors"
                                >
                                    <option value="newest">New Arrivals</option>
                                    <option value="price_asc">Price: Low to High</option>
                                    <option value="price_desc">Price: High to Low</option>
                                    <option value="title_asc">Name: A to Z</option>
                                    <option value="title_desc">Name: Z to A</option>
                                    <option value="oldest">Oldest</option>
                                </select>
                                <Icon
                                    icon="solar:alt-arrow-down-linear"
                                    width={14}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Style 4: Horizontal Filter Bar (renders directly above grid) ── */}
                {hasFilters && filterStyle === 4 && (
                    <div className="mb-6 p-4 bg-white rounded-2xl border border-gray-100 shadow-2xs">
                        <FilterPanel
                            style={4}
                            attributeOptions={uniqueAttrOptions}
                            activeFilters={selectedFilters}
                            minPrice={minPriceNum}
                            maxPrice={maxPriceNum}
                            currentSort={currentSort}
                            showPriceFilter={priceFilter}
                            onToggleFilter={handleToggleFilter}
                            onApplyPrice={handleApplyPrice}
                            onClearAll={handleClearFilters}
                        />
                    </div>
                )}

                {/* ── Main Two-Column Layout (Sidebar + Product Grid) ── */}
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">

                    {/* ── Desktop Filter Sidebar (Styles 1, 2, 3) ── */}
                    {hasFilters && filterStyle !== 4 && (
                        <aside className="hidden lg:block w-64 xl:w-72 shrink-0">
                            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-2xs space-y-3">
                                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                    <span className="text-sm font-bold text-gray-900">Filter by</span>
                                    {totalActiveCount > 0 && (
                                        <button
                                            type="button"
                                            onClick={handleClearFilters}
                                            className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                                        >
                                            Clear all ({totalActiveCount})
                                        </button>
                                    )}
                                </div>
                                <FilterPanel
                                    style={filterStyle}
                                    attributeOptions={uniqueAttrOptions}
                                    activeFilters={selectedFilters}
                                    minPrice={minPriceNum}
                                    maxPrice={maxPriceNum}
                                    currentSort={currentSort}
                                    showPriceFilter={priceFilter}
                                    onToggleFilter={handleToggleFilter}
                                    onApplyPrice={handleApplyPrice}
                                    onClearAll={handleClearFilters}
                                />
                            </div>
                        </aside>
                    )}

                    {/* ── Mobile Filter Drawer (Styles 1, 2, 3) ── */}
                    {hasFilters && filterStyle !== 4 && mobileFilterOpen && (
                        <div className="fixed inset-0 z-50 lg:hidden">
                            <div
                                className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
                                onClick={() => setMobileFilterOpen(false)}
                            />
                            <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-2xl p-5 overflow-y-auto flex flex-col justify-between">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                        <h2 className="text-base font-bold text-gray-900">Filter by</h2>
                                        <button
                                            type="button"
                                            onClick={() => setMobileFilterOpen(false)}
                                            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:text-black cursor-pointer"
                                        >
                                            <Icon icon="solar:close-circle-bold" width={20} />
                                        </button>
                                    </div>
                                    <FilterPanel
                                        style={filterStyle}
                                        attributeOptions={uniqueAttrOptions}
                                        activeFilters={selectedFilters}
                                        minPrice={minPriceNum}
                                        maxPrice={maxPriceNum}
                                        currentSort={currentSort}
                                        showPriceFilter={priceFilter}
                                        onToggleFilter={handleToggleFilter}
                                        onApplyPrice={handleApplyPrice}
                                        onClearAll={handleClearFilters}
                                        onClose={() => setMobileFilterOpen(false)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Product Grid Area ── */}
                    <div className="flex-1 w-full min-w-0">
                        {finalProducts.length === 0 ? (
                            <div className="text-center py-20 px-4 bg-white rounded-2xl border border-gray-100 shadow-2xs">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-50 text-[#0066cc] flex items-center justify-center">
                                    <Icon icon="solar:box-minimalistic-linear" width={32} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-1">
                                    No products found
                                </h3>
                                <p className="text-sm text-gray-500 max-w-md mx-auto mb-5">
                                    No products match the selected filters or category. Try resetting filters.
                                </p>
                                <button
                                    type="button"
                                    onClick={handleClearFilters}
                                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#0053e2] hover:bg-[#0047c4] text-white text-xs font-bold rounded-xl uppercase tracking-wider transition cursor-pointer"
                                >
                                    <Icon icon="solar:restart-bold" width={16} />
                                    <span>Reset Filters</span>
                                </button>
                            </div>
                        ) : (
                            <div className={gridClass}>
                                {paginatedProducts.map((product) => {
                                    if (ActiveBox) {
                                        return (
                                            <ActiveBox
                                                key={product._id}
                                                data={product}
                                                productUrl={buildUrl(productPrefix, product.slug)}
                                                currencySymbol={currencySymbol}
                                                permalinkMap={permalinkMap}
                                                imageHeightDesktop={leadImageHeightDesktop}
                                                imageHeightMobile={leadImageHeightMobile}
                                            />
                                        );
                                    }

                                    return (
                                        <GadgetProductCard
                                            key={product._id}
                                            product={product}
                                            currentBrandTitle={brandTitle}
                                            productUrl={buildUrl(productPrefix, product.slug)}
                                            currencySymbol={currencySymbol}
                                            leadImageHeightMobile={leadImageHeightMobile}
                                            leadImageHeightDesktop={leadImageHeightDesktop}
                                            onSelectOptions={() => openVariantModal(product)}
                                        />
                                    );
                                })}
                            </div>
                        )}

                        {/* ── Pagination Controls ── */}
                        {totalPages > 1 && (
                            <div className="mt-10 flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-100">
                                <p className="text-xs md:text-sm text-gray-500 font-medium">
                                    Showing <span className="font-semibold text-gray-800">{startIndex + 1}</span> to{' '}
                                    <span className="font-semibold text-gray-800">
                                        {Math.min(startIndex + pageSize, totalProductsCount)}
                                    </span>{' '}
                                    of <span className="font-semibold text-gray-800">{totalProductsCount}</span> products
                                </p>

                                <nav aria-label="Pagination" className="inline-flex items-center gap-1.5 flex-wrap">
                                    <button
                                        type="button"
                                        onClick={() => handlePageChange(safeCurrentPage - 1)}
                                        disabled={safeCurrentPage <= 1}
                                        aria-label="Previous page"
                                        className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs md:text-sm font-semibold border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-2xs"
                                    >
                                        <Icon icon="solar:alt-arrow-left-linear" width={16} />
                                        <span className="hidden md:inline">Prev</span>
                                    </button>

                                    {paginationPages.map((p, idx) => {
                                        if (p === '...') {
                                            return (
                                                <span
                                                    key={`dots-${idx}`}
                                                    className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center text-gray-400 text-xs md:text-sm select-none"
                                                >
                                                    …
                                                </span>
                                            );
                                        }
                                        const pageNum = p as number;
                                        const isActive = pageNum === safeCurrentPage;
                                        return (
                                            <button
                                                key={pageNum}
                                                type="button"
                                                onClick={() => handlePageChange(pageNum)}
                                                aria-current={isActive ? 'page' : undefined}
                                                className={`w-9 h-9 md:w-10 md:h-10 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center transition-all cursor-pointer ${
                                                    isActive
                                                        ? 'bg-[#0053e2] text-white shadow-sm ring-2 ring-[#0053e2]/20'
                                                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-2xs'
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}

                                    <button
                                        type="button"
                                        onClick={() => handlePageChange(safeCurrentPage + 1)}
                                        disabled={safeCurrentPage >= totalPages}
                                        aria-label="Next page"
                                        className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs md:text-sm font-semibold border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-2xs"
                                    >
                                        <span className="hidden md:inline">Next</span>
                                        <Icon icon="solar:alt-arrow-right-linear" width={16} />
                                    </button>
                                </nav>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Bottom Section: Brand Description ── */}
                {data.description && (
                    <div className="mt-12 p-6 md:p-8 bg-white rounded-2xl border border-gray-100 shadow-2xs">
                        <div
                            className="prose prose-gray max-w-none text-gray-700 leading-relaxed text-sm md:text-base"
                            dangerouslySetInnerHTML={{ __html: data.description }}
                        />
                    </div>
                )}
            </div>

            {/* builder bottom */}
            {builderBottom}

            {/* ── Variant Popup Modal for Quick Options Select ── */}
            {activeVariantProduct && (
                (() => {
                    const variate = parseJson<Record<string, any>>(activeVariantProduct.info?._variate, {});
                    const variants: VariantData[] = variate.variants ?? [];
                    const selectedAttributes = variate.selectedAttributes ?? [];
                    const displayImg =
                        parseJson<string[]>(activeVariantProduct.info?.images, [])[0] ||
                        activeVariantProduct.info?.image ||
                        activeVariantProduct.info?.thumbnail ||
                        '';

                    return (
                        <VariantPopup
                            productId={String(activeVariantProduct._id)}
                            productSlug={activeVariantProduct.slug}
                            productTitle={activeVariantProduct.title}
                            productImage={displayImg}
                            variants={variants}
                            selectedAttributes={selectedAttributes}
                            currencySymbol={currencySymbol}
                            onClose={closeVariantModal}
                            onAddToCart={handleVariantAddToCart}
                        />
                    );
                })()
            )}
        </div>
    );
}

// ─── Gadget Product Card Component (Fallback when no box component active) ─────

interface GadgetProductCardProps {
    product: CategoryProduct;
    currentBrandTitle: string;
    productUrl: string;
    currencySymbol: string;
    leadImageHeightMobile?: number;
    leadImageHeightDesktop?: number;
    onSelectOptions: () => void;
}

function GadgetProductCard({
    product,
    currentBrandTitle,
    productUrl,
    currencySymbol,
    leadImageHeightMobile,
    leadImageHeightDesktop,
    onSelectOptions,
}: GadgetProductCardProps) {
    const variate = parseJson<Record<string, any>>(product.info?._variate, {});
    const priceType = (variate.priceType ?? 'single') as 'single' | 'variant';
    const variants: VariantData[] = variate.variants ?? [];

    const sellingPrice = parseFloat(variate.sellingprice || product.info?.sellingprice || '0') || 0;
    const regularPrice = parseFloat(variate.regularprice || product.info?.regularprice || '0') || 0;
    const singleBasePrice = sellingPrice > 0 ? sellingPrice : regularPrice;
    const hasDiscount = regularPrice > singleBasePrice && singleBasePrice > 0;

    const variantPrices = variants.map((v) => parseFloat(v.price || '0') || 0).filter((p) => p > 0);
    const minVariantPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : singleBasePrice;
    const maxVariantPrice = variantPrices.length > 0 ? Math.max(...variantPrices) : singleBasePrice;

    const isSale = Boolean(hasDiscount || product.info?.badge?.toLowerCase().includes('sale'));
    const isDeal = Boolean(
        product.info?.deal === 'true' ||
        product.info?.is_deal === 'true' ||
        product.info?.badge?.toLowerCase().includes('deal') ||
        (hasDiscount && regularPrice - singleBasePrice > 2000)
    );

    const images = parseJson<string[]>(product.info?.images, []);
    const displayImg = images[0] || product.info?.image || product.info?.thumbnail || '';

    const tags = getProductTags(product, currentBrandTitle);

    const handleSingleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        addToCartDirect({
            productId: String(product._id),
            productSlug: product.slug,
            productTitle: product.title,
            productImage: displayImg,
            price: singleBasePrice,
            quantity: 1,
            maxQuantity: parseInt(variate.stock || product.info?.stock || '999', 10),
        }, 1);
    };

    return (
        <div className="group relative flex flex-col justify-between w-full h-full bg-white rounded-2xl border border-gray-100/90 hover:border-gray-200/90 shadow-2xs hover:shadow-md transition-all duration-300 p-4 select-none">
            {/* Top Badge */}
            <div className="absolute top-3 left-3 z-10 flex flex-col items-start gap-1">
                {isSale && (
                    <span className="bg-[#e11d48] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-2xs tracking-wider">
                        SALE
                    </span>
                )}
                {!isSale && isDeal && (
                    <span className="bg-[#0053e2] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-2xs tracking-wider">
                        DEAL
                    </span>
                )}
            </div>

            {/* Device Image */}
            <div
                className="w-full overflow-hidden shrink-0 flex items-center justify-center p-2 mb-2 h-(--h-mob) md:h-(--h-desk)"
                style={{
                    "--h-mob": `${leadImageHeightMobile ?? 192}px`,
                    "--h-desk": `${leadImageHeightDesktop ?? 210}px`,
                } as React.CSSProperties}
            >
                <Link href={productUrl} className="w-full h-full flex items-center justify-center">
                    {displayImg ? (
                        <Image
                            src={displayImg}
                            alt={product.title}
                            width={260}
                            height={260}
                            className="object-contain w-full h-full max-h-full group-hover:scale-105 transition-transform duration-300 mix-blend-multiply brightness-105"
                            unoptimized
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <Icon icon="solar:devices-bold-duotone" width={56} />
                        </div>
                    )}
                </Link>
            </div>

            {/* Product Info */}
            <div className="flex flex-col justify-between flex-1">
                <div>
                    {/* Tags */}
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                        {tags.map((tag, i) => (
                            <span
                                key={i}
                                className="inline-block bg-gray-100 text-gray-600 text-[11px] font-medium px-2 py-0.5 rounded-md"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>

                    {/* Product Title */}
                    <Link
                        href={productUrl}
                        className="block text-sm md:text-base font-bold text-gray-900 line-clamp-1 group-hover:text-[#0053e2] transition-colors mb-1.5"
                        title={product.title}
                    >
                        {product.title}
                    </Link>

                    {/* Price Row */}
                    <div className="flex items-baseline gap-2 flex-wrap mb-3">
                        {priceType === 'variant' && variants.length > 0 ? (
                            <span className="text-sm md:text-base font-bold text-gray-900 tracking-tight">
                                {minVariantPrice === maxVariantPrice ? (
                                    `${currencySymbol} ${fmtPrice(minVariantPrice)}`
                                ) : (
                                    `${currencySymbol} ${fmtPrice(minVariantPrice)} – ${fmtPrice(maxVariantPrice)}`
                                )}
                            </span>
                        ) : hasDiscount ? (
                            <>
                                <span className="text-xs md:text-sm text-gray-400 line-through font-normal">
                                    {currencySymbol} {fmtPrice(regularPrice)}
                                </span>
                                <span className="text-sm md:text-base font-bold text-[#e11d48] tracking-tight">
                                    {currencySymbol} {fmtPrice(singleBasePrice)}
                                </span>
                            </>
                        ) : (
                            <span className="text-sm md:text-base font-bold text-gray-900 tracking-tight">
                                {currencySymbol} {fmtPrice(singleBasePrice)}
                            </span>
                        )}
                    </div>
                </div>

                {/* Action Button */}
                <div>
                    {priceType === 'variant' && variants.length > 0 ? (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onSelectOptions();
                            }}
                            className="w-full py-2.5 px-4 bg-[#0053e2] hover:bg-[#0047c4] active:scale-[0.98] text-white font-semibold text-xs md:text-sm rounded-xl transition-all shadow-xs flex items-center justify-center cursor-pointer select-none"
                        >
                            Select options
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleSingleAddToCart}
                            className="w-full py-2.5 px-4 bg-[#0053e2] hover:bg-[#0047c4] active:scale-[0.98] text-white font-semibold text-xs md:text-sm rounded-xl transition-all shadow-xs flex items-center justify-center cursor-pointer select-none"
                        >
                            Add to cart
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
