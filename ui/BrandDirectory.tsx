'use client';

/**
 * cms/plugin/gadgets/ui/BrandDirectory.tsx
 *
 * Exelic Gadgets Brand Directory:
 *  - Matches the "Shop Technology Brands in Kenya" design:
 *      • Top Badge: "• BRAND DIRECTORY"
 *      • Heading & Subtitle
 *      • Search input + Sort selector (A-Z, Z-A, Most Products)
 *      • A-Z Letter Filter Bar (Letters with 0 items are disabled/faded)
 *      • Brand Counter row ("96 brands" • "All catalogue brands, including new arrivals")
 *      • Responsive 5-column grid of brand cards with logos, product counts, and arrow badges
 *      • 100% dynamic URL routing using permalinks
 */

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';

import { xFetch } from '@/lib/express';

export interface BrandItem {
    _id: string;
    title: string;
    slug: string;
    image?: string;
    productCount?: number;
}

export interface BrandDirectoryProps {
    badgeText?: string;
    title?: string;
    description?: string;
    searchPlaceholder?: string;
    catalogNote?: string;
    columnsDesktop?: number;
    columnsTablet?: number;
    columnsMobile?: number;
    gap?: number;
    accentColor?: string;
    hideEmptyBrands?: boolean;
    initialBrands?: BrandItem[];
    permalinkPrefix?: string;
    margin?: any;
    padding?: any;
}

const ALPHABET = [
    'ALL',
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
];

// Curated high-res brand icon mappings from simple-icons
const BRAND_ICONS: Record<string, { icon: string; color?: string; className?: string }> = {
    'apple': { icon: 'simple-icons:apple', color: '#000000' },
    'amazon': { icon: 'simple-icons:amazon', color: '#FF9900' },
    'anker': { icon: 'simple-icons:anker', color: '#00A0E9' },
    'amazfit': { icon: 'simple-icons:amazfit', color: '#000000' },
    'samsung': { icon: 'simple-icons:samsung', color: '#1428A0' },
    'xiaomi': { icon: 'simple-icons:xiaomi', color: '#FF6900' },
    'sony': { icon: 'simple-icons:sony', color: '#000000' },
    'google': { icon: 'simple-icons:google', color: '#4285F4' },
    'asus': { icon: 'simple-icons:asus', color: '#000000' },
    'dell': { icon: 'simple-icons:dell', color: '#007DB8' },
    'hp': { icon: 'simple-icons:hp', color: '#0096D6' },
    'lenovo': { icon: 'simple-icons:lenovo', color: '#E2231A' },
    'jbl': { icon: 'simple-icons:jbl', color: '#FF5A00' },
    'logitech': { icon: 'simple-icons:logitech', color: '#000000' },
    'razer': { icon: 'simple-icons:razer', color: '#00FF00' },
    'huawei': { icon: 'simple-icons:huawei', color: '#CF0A2C' },
    'oppo': { icon: 'simple-icons:oppo', color: '#008000' },
    'vivo': { icon: 'simple-icons:vivo', color: '#415FFF' },
    'realme': { icon: 'simple-icons:realme', color: '#FFC915' },
    'oneplus': { icon: 'simple-icons:oneplus', color: '#F50514' },
    'motorola': { icon: 'simple-icons:motorola', color: '#001435' },
    'canon': { icon: 'simple-icons:canon', color: '#BC002D' },
    'nikon': { icon: 'simple-icons:nikon', color: '#FFE100' },
    'dji': { icon: 'simple-icons:dji', color: '#000000' },
    'bose': { icon: 'simple-icons:bose', color: '#000000' },
    'playstation': { icon: 'simple-icons:playstation', color: '#003791' },
    'xbox': { icon: 'simple-icons:xbox', color: '#107C10' },
    'nintendo': { icon: 'simple-icons:nintendo', color: '#E60012' },
    'lg': { icon: 'simple-icons:lg', color: '#A50034' },
    'microsoft': { icon: 'simple-icons:microsoft', color: '#00A4EF' },
    'panasonic': { icon: 'simple-icons:panasonic', color: '#0041C0' },
    'philips': { icon: 'simple-icons:philips', color: '#0B5ED7' },
    'seagate': { icon: 'simple-icons:seagate', color: '#000000' },
    'western digital': { icon: 'simple-icons:westerndigital', color: '#000000' },
    'sandisk': { icon: 'simple-icons:sandisk', color: '#ED1C24' },
    'kingston': { icon: 'simple-icons:kingstontechnology', color: '#000000' },
    'tp-link': { icon: 'simple-icons:tplink', color: '#4ACBD6' },
};

function BrandLogo({ brand }: { brand: BrandItem }) {
    if (brand.image && brand.image.trim()) {
        return (
            <div className="w-full h-24 flex items-center justify-center pb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={brand.image}
                    alt={brand.title}
                    className="max-h-16 max-w-[85%] object-contain transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                />
            </div>
        );
    }

    const lower = brand.title.trim().toLowerCase();
    const known = BRAND_ICONS[lower];

    if (known) {
        return (
            <div className="w-full h-24 flex items-center justify-center pb-2">
                <Icon
                    icon={known.icon}
                    className="w-16 h-14 sm:w-20 sm:h-16 transition-transform duration-300 group-hover:scale-110"
                    style={{ color: known.color || '#111827' }}
                />
            </div>
        );
    }

    // Modern clean stylized typography brand logo fallback
    return (
        <div className="w-full h-24 flex items-center justify-center pb-2 select-none">
            <span className="font-bold tracking-tight text-2xl sm:text-3xl text-gray-900 group-hover:text-[#0053e2] transition-colors font-sans">
                {brand.title}
            </span>
        </div>
    );
}

export default function BrandDirectory({
    badgeText = 'BRAND DIRECTORY',
    title = 'Shop Technology Brands in Kenya',
    description = "Browse every technology brand available at Exelic Gadgets, including smartphones, laptops, gaming, audio, wearables and accessories. Search or browse A-Z to shop each brand's complete catalogue in Kenya.",
    searchPlaceholder = 'Search brands, e.g. Apple or Samsung',
    catalogNote = 'All catalogue brands, including new arrivals',
    columnsDesktop = 5,
    columnsTablet = 3,
    columnsMobile = 2,
    gap = 4,
    accentColor = '#0053e2',
    hideEmptyBrands = false,
    initialBrands = [],
    permalinkPrefix = 'brands',
    margin,
    padding,
}: BrandDirectoryProps) {
    const [brands, setBrands] = useState<BrandItem[]>(initialBrands);
    const [currentPrefix, setCurrentPrefix] = useState<string>(permalinkPrefix);
    const [loading, setLoading] = useState<boolean>(initialBrands.length === 0);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedLetter, setSelectedLetter] = useState<string>('ALL');
    const [sortBy, setSortBy] = useState<'a-z' | 'z-a' | 'most-products' | 'least-products'>('a-z');

    // Fetch brands client-side using standard category endpoint (type=brands) if not supplied via SSR
    useEffect(() => {
        if (initialBrands.length > 0) return;

        let isMounted = true;
        xFetch('/cat?type=brands')
            .then((res) => res.json())
            .then((data) => {
                const list = data.cats || data.data || [];
                if (isMounted && Array.isArray(list)) {
                    setBrands(
                        list.map((c: any) => ({
                            _id: String(c._id),
                            title: c.title || 'Brand',
                            slug: c.slug || '',
                            image: c.image || '',
                            productCount: Number(c.productCount) || 0,
                        }))
                    );
                }
            })
            .catch(() => {})
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [initialBrands.length]);

    // Active letters map — which letters actually have brands
    const lettersWithBrands = useMemo(() => {
        const set = new Set<string>();
        for (const b of brands) {
            const first = (b.title || '').trim().charAt(0).toUpperCase();
            if (first >= 'A' && first <= 'Z') {
                set.add(first);
            }
        }
        return set;
    }, [brands]);

    // Filter and Sort Brands
    const filteredBrands = useMemo(() => {
        let list = [...brands];

        if (hideEmptyBrands) {
            list = list.filter((b) => (b.productCount || 0) > 0);
        }

        // Letter filter
        if (selectedLetter !== 'ALL') {
            list = list.filter((b) => (b.title || '').trim().toUpperCase().startsWith(selectedLetter));
        }

        // Search query filter
        const q = searchQuery.trim().toLowerCase();
        if (q) {
            list = list.filter(
                (b) =>
                    (b.title || '').toLowerCase().includes(q) ||
                    (b.slug || '').toLowerCase().includes(q)
            );
        }

        // Sorting
        list.sort((a, b) => {
            if (sortBy === 'a-z') {
                return (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' });
            }
            if (sortBy === 'z-a') {
                return (b.title || '').localeCompare(a.title || '', undefined, { sensitivity: 'base' });
            }
            if (sortBy === 'most-products') {
                return (b.productCount || 0) - (a.productCount || 0);
            }
            if (sortBy === 'least-products') {
                return (a.productCount || 0) - (b.productCount || 0);
            }
            return 0;
        });

        return list;
    }, [brands, hideEmptyBrands, selectedLetter, searchQuery, sortBy]);

    // Build responsive grid CSS class
    const gridColsClass = useMemo(() => {
        const d = Math.max(1, Math.min(6, columnsDesktop));
        const t = Math.max(1, Math.min(4, columnsTablet));
        const m = Math.max(1, Math.min(3, columnsMobile));

        const dMap: Record<number, string> = {
            1: 'lg:grid-cols-1',
            2: 'lg:grid-cols-2',
            3: 'lg:grid-cols-3',
            4: 'lg:grid-cols-4',
            5: 'lg:grid-cols-5',
            6: 'lg:grid-cols-6',
        };
        const tMap: Record<number, string> = {
            1: 'sm:grid-cols-1',
            2: 'sm:grid-cols-2',
            3: 'sm:grid-cols-3',
            4: 'sm:grid-cols-4',
        };
        const mMap: Record<number, string> = {
            1: 'grid-cols-1',
            2: 'grid-cols-2',
            3: 'grid-cols-3',
        };

        return `${mMap[m] || 'grid-cols-2'} ${tMap[t] || 'sm:grid-cols-3'} ${dMap[d] || 'lg:grid-cols-5'}`;
    }, [columnsDesktop, columnsTablet, columnsMobile]);

    // Dynamic brand URL generator respecting permalink prefix
    const getBrandUrl = (slug: string) => {
        const clean = (currentPrefix || 'brands').trim().replace(/^\/+|\/+$/g, '');
        return clean ? `/${clean}/${slug}` : `/${slug}`;
    };

    return (
        <section
            className="w-full py-8 md:py-14"
            style={{
                marginTop: margin?.top ? `${margin.top}px` : undefined,
                marginBottom: margin?.bottom ? `${margin.bottom}px` : undefined,
                paddingTop: padding?.top ? `${padding.top}px` : undefined,
                paddingBottom: padding?.bottom ? `${padding.bottom}px` : undefined,
            }}
        >
            <div className="space-y-7">
                {/* ── Top Header Section ── */}
                <div className="text-center max-w-3xl mx-auto space-y-2.5">
                    {badgeText && (
                        <div className="inline-flex items-center justify-center gap-2 text-xs sm:text-[13px] font-bold tracking-widest text-[#0053e2] uppercase select-none mb-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-4 ring-amber-400/20" />
                            <span>{badgeText}</span>
                        </div>
                    )}

                    <h1 className="text-2xl sm:text-3xl md:text-[42px] font-bold text-gray-900 tracking-tight leading-tight">
                        {title}
                    </h1>

                    {description && (
                        <p className="text-xs sm:text-sm md:text-[15px] text-gray-500 leading-relaxed font-normal max-w-2xl mx-auto">
                            {description}
                        </p>
                    )}
                </div>

                {/* ── Search Bar & Sort Row ── */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {/* Search Field */}
                    <div className="relative flex-1 bg-white rounded-2xl border border-gray-200/90 shadow-2xs transition hover:border-gray-300">
                        <Icon
                            icon="solar:magnifer-linear"
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none"
                        />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="w-full pl-11 pr-10 py-3.5 text-xs sm:text-sm text-gray-900 placeholder-gray-400 bg-transparent rounded-2xl focus:outline-hidden"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full transition cursor-pointer"
                                aria-label="Clear search"
                            >
                                <Icon icon="solar:close-circle-bold" width={18} />
                            </button>
                        )}
                    </div>

                    {/* Sort Selector Box */}
                    <div className="relative shrink-0">
                        <div className="relative inline-flex items-center w-full sm:w-auto">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="appearance-none font-bold text-xs uppercase tracking-wider text-gray-900 bg-white hover:bg-gray-50 border border-gray-200/90 rounded-2xl pl-5 pr-10 py-3.5 shadow-2xs cursor-pointer transition focus:outline-hidden"
                            >
                                <option value="a-z">SORT A–Z ↕</option>
                                <option value="z-a">SORT Z–A ↕</option>
                                <option value="most-products">MOST PRODUCTS</option>
                                <option value="least-products">LEAST PRODUCTS</option>
                            </select>
                            <Icon
                                icon="solar:sort-vertical-linear"
                                width={16}
                                className="absolute right-3.5 pointer-events-none text-gray-700"
                            />
                        </div>
                    </div>
                </div>

                {/* ── Alphabet A-Z Filter Bar ── */}
                <div className="w-full overflow-x-auto pb-1 scrollbar-none">
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-max justify-start sm:justify-center px-1">
                        {ALPHABET.map((item) => {
                            const isAll = item === 'ALL';
                            const isSelected = selectedLetter === item;
                            const hasBrands = isAll || lettersWithBrands.has(item);

                            return (
                                <button
                                    key={item}
                                    type="button"
                                    onClick={() => setSelectedLetter(item)}
                                    disabled={!hasBrands}
                                    style={isSelected ? { backgroundColor: accentColor } : undefined}
                                    className={`px-3 sm:px-3.5 py-2 text-xs font-semibold rounded-xl transition cursor-pointer select-none border ${
                                        isSelected
                                            ? 'text-white border-transparent shadow-xs font-bold'
                                            : hasBrands
                                            ? 'bg-white text-gray-700 border-gray-200/90 hover:bg-gray-50 hover:border-gray-300'
                                            : 'bg-transparent text-gray-300 border-gray-100 cursor-not-allowed select-none'
                                    }`}
                                >
                                    {item}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Results Bar ── */}
                <div className="flex items-center justify-between pb-1 text-xs">
                    <div className="flex items-center gap-2">
                        <span className="font-extrabold text-gray-900 text-sm sm:text-base">
                            {filteredBrands.length} brands
                        </span>
                        {selectedLetter !== 'ALL' && (
                            <span className="text-gray-400">
                                starting with &ldquo;<strong className="text-gray-700">{selectedLetter}</strong>&rdquo;
                            </span>
                        )}
                        {searchQuery && (
                            <span className="text-gray-400">
                                matching &ldquo;<strong className="text-gray-700">{searchQuery}</strong>&rdquo;
                            </span>
                        )}
                    </div>
                    {catalogNote && (
                        <span className="text-gray-500 text-xs sm:text-sm hidden sm:inline-block">
                            {catalogNote}
                        </span>
                    )}
                </div>

                {/* ── Brand Cards Grid ── */}
                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-400">
                        <Icon icon="svg-spinners:ring-resize" width={32} className="text-blue-600" />
                        <span className="text-xs font-semibold">Loading brands directory...</span>
                    </div>
                ) : filteredBrands.length === 0 ? (
                    <div className="py-20 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 space-y-3">
                        <Icon icon="solar:tag-bold-duotone" width={40} className="mx-auto text-gray-300" />
                        <p className="text-sm font-semibold text-gray-700">No brands found</p>
                        <p className="text-xs text-gray-400 max-w-sm mx-auto">
                            No brands match your current letter filter or search criteria. Try choosing &ldquo;ALL&rdquo; or clearing the search.
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedLetter('ALL');
                                setSearchQuery('');
                            }}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition cursor-pointer shadow-xs"
                        >
                            Reset Filters
                        </button>
                    </div>
                ) : (
                    <div className={`grid ${gridColsClass}`} style={{ gap: `${gap * 0.25}rem` }}>
                        {filteredBrands.map((brand) => {
                            const url = getBrandUrl(brand.slug);
                            const count = brand.productCount || 0;

                            return (
                                <Link
                                    key={brand._id}
                                    href={url}
                                    className="group relative overflow-hidden bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-3"
                                >
                                    {/* Upper Area: Centered Brand Logo */}
                                    <div className="flex-1 w-full flex items-center justify-center">
                                        <BrandLogo brand={brand} />
                                    </div>

                                    {/* Bottom Info: Title above, and Count on bottom left */}
                                    <div className="relative z-10 mt-auto">
                                        <h3 className="font-semibold text-slate-700 text-base tracking-tight group-hover:text-[#0053e2] transition-colors">
                                            {brand.title}
                                        </h3>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-slate-400 font-medium tracking-normal">
                                                {count} {count === 1 ? 'product' : 'products'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Bottom-Right Corner Soft Circular Arrow Badge (Exact match with reference) */}
                                    <div className="absolute -right-7.75 -bottom-10.75 w-25 h-25 group-hover:w-28 group-hover:h-28 group-hover:-translate-y-1 group-hover:transition-all group-hover:duration-300 rounded-full bg-[linear-gradient(135deg,rgba(13,99,214,0.12),rgba(248,186,24,0.17))] flex items-center justify-center transition-transform duration-200 ease-out group-hover:scale-105 pointer-events-none">
                                        <svg
                                            className="w-4 h-4 text-main -translate-x-3.5 -translate-y-4 transition-transform duration-200"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                        </svg>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
}
