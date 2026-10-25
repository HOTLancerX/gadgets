"use client";

/**
 * plugin/gadgets/product/Compare.tsx
 *
 * Interactive Product Comparison Component matching user's design:
 *  - Top header: "Compare [Product] with Similar Products"
 *  - 4-card grid: Current Product + Comparison Products + "Add to comparison" slot
 *  - Removable products via close (✕) button with temporary alert notification
 *  - "Add to comparison" slot with live product search & instant "+ Compare" add button
 *  - "Specification" summary chip bar with product thumbnails
 *  - Section-by-section specification cards with 2-column table layout and "Not specified" fallbacks
 */

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import type { SpecBox } from "./Specification";

export interface CompareProductItem {
    id: string;
    title: string;
    slug: string;
    image: string;
    price: number;
    stock?: number;
    specifications: SpecBox[];
    url: string;
}

interface CompareProps {
    currentProduct: CompareProductItem;
    compareProducts: CompareProductItem[];
    allAvailableProducts?: CompareProductItem[];
    currencySymbol?: string;
    onAddToCart?: () => void;
}

function getBoxIcon(title: string, icon?: string): string {
    if (icon && icon.trim()) return icon;
    const t = title.toLowerCase();
    if (t.includes("general")) return "solar:widget-2-linear";
    if (t.includes("design")) return "solar:layers-minimalistic-linear";
    if (t.includes("display") || t.includes("screen")) return "solar:smartphone-2-linear";
    if (t.includes("camera")) return "solar:camera-linear";
    if (t.includes("battery") || t.includes("charging")) return "solar:battery-charge-linear";
    if (
        t.includes("hardware") ||
        t.includes("performance") ||
        t.includes("chipset") ||
        t.includes("platform") ||
        t.includes("cpu")
    ) {
        return "solar:cpu-bolt-linear";
    }
    if (t.includes("connectivity") || t.includes("network") || t.includes("wireless")) return "solar:wifi-router-linear";
    if (t.includes("audio") || t.includes("sound") || t.includes("speaker")) return "solar:volume-loud-linear";
    if (t.includes("memory") || t.includes("storage") || t.includes("ram")) return "solar:database-linear";
    if (t.includes("sensor")) return "solar:radar-2-linear";
    if (t.includes("software") || t.includes("os")) return "solar:code-circle-linear";
    return "solar:widget-2-linear";
}

export default function GadgetsCompare({
    currentProduct,
    compareProducts = [],
    allAvailableProducts = [],
    currencySymbol = "৳",
    onAddToCart,
}: CompareProps) {
    // Active comparison products (up to 3 products)
    const [activeComparedProducts, setActiveComparedProducts] = useState<CompareProductItem[]>(() => {
        return (compareProducts || []).slice(0, 3);
    });

    // Sync with incoming props if initial products change
    useEffect(() => {
        if (compareProducts && compareProducts.length > 0) {
            setActiveComparedProducts(compareProducts.slice(0, 3));
        }
    }, [compareProducts]);

    const [searchFilter, setSearchFilter] = useState("");
    const [notice, setNotice] = useState<string | null>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Pool of available candidate products to add into comparison slots
    const availablePool = useMemo(() => {
        const poolSource = allAvailableProducts.length > 0 ? allAvailableProducts : compareProducts;
        return poolSource.filter(
            (p) =>
                String(p.id) !== String(currentProduct.id) &&
                !activeComparedProducts.some((a) => String(a.id) === String(p.id)) &&
                Array.isArray(p.specifications) &&
                p.specifications.some((box) =>
                    box.fields?.some((f) => typeof f?.description === "string" && f.description.trim().length > 0)
                )
        );
    }, [allAvailableProducts, compareProducts, currentProduct.id, activeComparedProducts]);

    // Filter available pool by search input
    const filteredAvailableProducts = useMemo(() => {
        if (!searchFilter.trim()) return availablePool;
        const q = searchFilter.toLowerCase().trim();
        return availablePool.filter((p) => p.title.toLowerCase().includes(q));
    }, [availablePool, searchFilter]);

    // Handle removing a product from comparison
    const handleRemoveProduct = (id: string) => {
        setActiveComparedProducts((prev) => prev.filter((p) => String(p.id) !== String(id)));
        setNotice("Product removed from comparison.");
    };

    // Handle adding a product to comparison
    const handleAddProduct = (product: CompareProductItem) => {
        if (activeComparedProducts.length >= 3) return;
        setActiveComparedProducts((prev) => [...prev, product]);
        setSearchFilter("");
        setNotice(`${product.title} added to comparison.`);
    };

    // Auto-clear notice after 4 seconds
    useEffect(() => {
        if (!notice) return;
        const timer = setTimeout(() => setNotice(null), 4000);
        return () => clearTimeout(timer);
    }, [notice]);

    // ── Hide compare section entirely if the current product has no specifications ──
    const hasCurrentSpecs = useMemo(() => {
        if (!Array.isArray(currentProduct?.specifications) || currentProduct.specifications.length === 0) {
            return false;
        }
        return currentProduct.specifications.some((box) =>
            Array.isArray(box.fields) &&
            box.fields.some((f) => typeof f?.description === "string" && f.description.trim().length > 0)
        );
    }, [currentProduct?.specifications]);

    const [slotSearches, setSlotSearches] = useState<Record<number, string>>({});

    const getSlotFilteredProducts = (query: string) => {
        if (!query.trim()) return availablePool;
        const q = query.toLowerCase().trim();
        return availablePool.filter((p) => p.title.toLowerCase().includes(q));
    };

    // Hide section entirely if current product has no specs or no products to compare
    if (!hasCurrentSpecs || (activeComparedProducts.length === 0 && availablePool.length === 0)) {
        return null;
    }

    const availableSlots = 3 - activeComparedProducts.length;

    // All products in comparison: Current product first, followed by active compared products
    const allItems: (CompareProductItem & { isCurrent: boolean })[] = [
        { ...currentProduct, isCurrent: true },
        ...activeComparedProducts.map((p) => ({ ...p, isCurrent: false })),
    ];

    const totalCols = allItems.length + 1;
    const colWidthPercent = `${(100 / totalCols).toFixed(4)}%`;

    // Build unified comparison sections from currentProduct + activeComparedProducts
    const comparisonSections = useMemo(() => {
        const sectionMap = new Map<string, { title: string; icon?: string; fields: Set<string> }>();

        allItems.forEach((item) => {
            (item.specifications || []).forEach((box) => {
                const normTitle = box.title?.trim();
                if (!normTitle) return;

                (box.fields || []).forEach((f) => {
                    if (f.title?.trim() && typeof f.description === "string" && f.description.trim().length > 0) {
                        if (!sectionMap.has(normTitle)) {
                            sectionMap.set(normTitle, {
                                title: box.title,
                                icon: box.icon,
                                fields: new Set<string>(),
                            });
                        }
                        const entry = sectionMap.get(normTitle)!;
                        if (!entry.icon && box.icon) entry.icon = box.icon;
                        entry.fields.add(f.title.trim());
                    }
                });
            });
        });

        return Array.from(sectionMap.values())
            .filter((sec) => sec.fields.size > 0)
            .map((sec) => ({
                title: sec.title,
                icon: sec.icon,
                fields: Array.from(sec.fields),
            }));
    }, [allItems]);

    // Lookup field value for a product
    const getFieldValue = (item: CompareProductItem, sectionTitle: string, fieldTitle: string): string => {
        const normSec = sectionTitle.toLowerCase().trim();
        const normField = fieldTitle.toLowerCase().trim();

        const box = (item.specifications || []).find(
            (b) => b.title.toLowerCase().trim() === normSec
        );
        if (!box) {
            for (const b of item.specifications || []) {
                const f = b.fields?.find((field) => field.title.toLowerCase().trim() === normField);
                if (f && f.description) return f.description;
            }
            return "";
        }

        const field = (box.fields || []).find(
            (f) => f.title.toLowerCase().trim() === normField
        );
        return field?.description || "";
    };

    return (
        <section id="compare" className="space-y-6">
            {/* ── Header ── */}
            <div className="space-y-1">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
                    Compare {currentProduct.title} with Similar Products
                </h2>
                <p className="text-xs md:text-sm text-gray-500">
                    Compare {currentProduct.title} specs, features and price with similar smartphones and alternatives.
                </p>
            </div>

            {/* ── Status Toast / Notice ── */}
            {notice && (
                <div className="flex items-center gap-2 text-xs text-gray-700 bg-gray-100 border border-gray-200 px-3.5 py-2 rounded-xl transition-all shadow-2xs">
                    <Icon icon="solar:info-circle-bold" width={16} className="text-blue-600 shrink-0" />
                    <span>{notice}</span>
                </div>
            )}

            {/* ── Top Product Cards Grid (4 columns) ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                {/* 1. Current Product Card */}
                <div className="bg-white rounded-2xl border border-gray-200/90 p-5 flex flex-col justify-between shadow-2xs relative">
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[11px] font-medium border border-gray-200/80">
                                Selected Item
                            </span>
                        </div>
                        <div className="relative w-32 h-36 mx-auto flex items-center justify-center my-2">
                            {currentProduct.image ? (
                                <img
                                    src={currentProduct.image}
                                    alt={currentProduct.title}
                                    className="max-h-full max-w-full object-contain"
                                />
                            ) : (
                                <Icon icon="solar:devices-linear" width={48} className="text-gray-300" />
                            )}
                        </div>
                        <h4 className="text-sm font-bold text-gray-900 line-clamp-2 mt-3" title={currentProduct.title}>
                            {currentProduct.title}
                        </h4>
                        <p className="text-base font-extrabold text-red-600 mt-1">
                            {currencySymbol} {Number(currentProduct.price || 0).toLocaleString()}
                        </p>
                    </div>

                    <div className="mt-4">
                        {currentProduct.stock !== undefined && currentProduct.stock <= 0 ? (
                            <div className="w-full py-2.5 text-center text-xs font-semibold text-gray-400 bg-gray-50 rounded-xl border border-gray-200">
                                Out of stock
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => {
                                    if (onAddToCart) onAddToCart();
                                }}
                                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-2xs cursor-pointer"
                            >
                                Add to cart
                            </button>
                        )}
                    </div>
                </div>

                {/* 2. Active Compared Products */}
                {activeComparedProducts.map((p) => (
                    <div
                        key={p.id}
                        className="bg-white rounded-2xl border border-gray-200/90 p-5 flex flex-col justify-between shadow-2xs relative group"
                    >
                        <div>
                            <div className="flex items-center justify-end mb-1">
                                <button
                                    type="button"
                                    onClick={() => handleRemoveProduct(p.id)}
                                    className="w-7 h-7 rounded-full text-gray-400 hover:text-gray-800 hover:bg-gray-100 flex items-center justify-center transition cursor-pointer"
                                    title="Remove from comparison"
                                >
                                    <Icon icon="solar:close-circle-linear" width={18} />
                                </button>
                            </div>
                            <div className="relative w-32 h-36 mx-auto flex items-center justify-center my-2">
                                {p.image ? (
                                    <img
                                        src={p.image}
                                        alt={p.title}
                                        className="max-h-full max-w-full object-contain"
                                    />
                                ) : (
                                    <Icon icon="solar:devices-linear" width={48} className="text-gray-300" />
                                )}
                            </div>
                            <h4 className="text-sm font-bold text-gray-900 line-clamp-2 mt-3" title={p.title}>
                                {p.title}
                            </h4>
                            <p className="text-base font-extrabold text-red-600 mt-1">
                                {currencySymbol} {Number(p.price || 0).toLocaleString()}
                            </p>
                        </div>

                        <div className="mt-4">
                            <Link
                                href={p.url || "#"}
                                prefetch={true}
                                className="block w-full py-2.5 text-center bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-2xs"
                            >
                                Choose options
                            </Link>
                        </div>
                    </div>
                ))}

                {/* 3. Empty / Add Device Slots (Inline search box sits directly in the slot) */}
                {Array.from({ length: Math.max(0, 3 - activeComparedProducts.length) }).map((_, slotIdx) => {
                    const query = slotSearches[slotIdx] || "";
                    const slotFiltered = getSlotFilteredProducts(query);

                    return (
                        <div
                            key={`empty-slot-${slotIdx}`}
                            className="bg-white rounded-2xl border-2 border-dashed border-gray-200 hover:border-blue-300 p-4 flex flex-col justify-between shadow-2xs min-h-80 transition-all"
                        >
                            <div className="flex flex-col h-full">
                                {/* Slot Header */}
                                <div className="flex items-center gap-2 mb-2.5 pb-2 border-b border-gray-100">
                                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                        <Icon icon="solar:magnifer-linear" width={16} />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-xs font-bold text-gray-900 truncate">
                                            Add Device
                                        </h4>
                                        <p className="text-[11px] text-gray-400 truncate">
                                            Search model to compare
                                        </p>
                                    </div>
                                </div>

                                {/* Inline Search Input */}
                                <div className="relative mb-2.5">
                                    <Icon
                                        icon="solar:magnifer-linear"
                                        width={14}
                                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                                    />
                                    <input
                                        type="text"
                                        value={query}
                                        onChange={(e) =>
                                            setSlotSearches((prev) => ({ ...prev, [slotIdx]: e.target.value }))
                                        }
                                        placeholder="Search device name..."
                                        className="w-full text-xs pl-8 pr-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-blue-600 focus:border-blue-600 text-gray-900 transition"
                                    />
                                </div>

                                {/* Scrollable Device Candidate List */}
                                <div className="flex-1 overflow-y-auto max-h-52 divide-y divide-gray-100 pr-0.5 space-y-1">
                                    {slotFiltered.length === 0 ? (
                                        <div className="py-8 text-center text-xs text-gray-400">
                                            No additional devices found.
                                        </div>
                                    ) : (
                                        slotFiltered.map((p) => (
                                            <div
                                                key={p.id}
                                                onClick={() => {
                                                    handleAddProduct(p);
                                                    setSlotSearches((prev) => ({ ...prev, [slotIdx]: "" }));
                                                }}
                                                className="pt-1.5 pb-1 px-1 rounded-lg hover:bg-blue-50/50 flex items-center justify-between gap-2 cursor-pointer transition group"
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className="w-8 h-8 rounded-lg border border-gray-200 p-0.5 shrink-0 bg-white flex items-center justify-center overflow-hidden">
                                                        {p.image ? (
                                                            <img
                                                                src={p.image}
                                                                alt={p.title}
                                                                className="w-full h-full object-contain"
                                                            />
                                                        ) : (
                                                            <Icon
                                                                icon="solar:devices-linear"
                                                                width={14}
                                                                className="text-gray-300"
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold text-gray-800 truncate group-hover:text-blue-600">
                                                            {p.title}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-red-600">
                                                            {currencySymbol} {Number(p.price || 0).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="px-2 py-1 bg-blue-50 group-hover:bg-blue-600 text-blue-600 group-hover:text-white rounded-lg text-[10px] font-bold transition shrink-0 cursor-pointer"
                                                >
                                                    + Add
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Search / Add Device Modal ── */}
            {isSearchOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
                    onClick={() => setIsSearchOpen(false)}
                >
                    <div
                        className="bg-white rounded-3xl border border-gray-200 max-w-lg w-full p-5 md:p-6 shadow-2xl space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <Icon icon="solar:magnifer-bold" width={20} />
                                </div>
                                <div>
                                    <h3 className="text-sm md:text-base font-bold text-gray-900">
                                        Add Device to Compare
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        Select another product to compare specifications
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsSearchOpen(false)}
                                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                            >
                                <Icon icon="solar:close-circle-bold" width={20} />
                            </button>
                        </div>

                        {/* Search Input */}
                        <div className="relative">
                            <Icon
                                icon="solar:magnifer-linear"
                                width={18}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <input
                                type="text"
                                autoFocus
                                value={searchFilter}
                                onChange={(e) => setSearchFilter(e.target.value)}
                                placeholder="Search device name..."
                                className="w-full text-xs md:text-sm pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-blue-600 focus:border-blue-600 text-gray-900 transition"
                            />
                        </div>

                        {/* Results List */}
                        <div className="overflow-y-auto max-h-72 divide-y divide-gray-100 pr-1 space-y-2">
                            {filteredAvailableProducts.length === 0 ? (
                                <div className="py-10 text-center text-xs text-gray-400">
                                    No additional devices found with specifications.
                                </div>
                            ) : (
                                filteredAvailableProducts.map((p) => (
                                    <div key={p.id} className="pt-2 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="w-12 h-12 rounded-xl border border-gray-200 p-1 shrink-0 bg-white flex items-center justify-center overflow-hidden">
                                                {p.image ? (
                                                    <img src={p.image} alt={p.title} className="w-full h-full object-contain" />
                                                ) : (
                                                    <Icon icon="solar:devices-linear" width={20} className="text-gray-300" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs md:text-sm font-bold text-gray-900 truncate" title={p.title}>
                                                    {p.title}
                                                </p>
                                                <p className="text-xs font-extrabold text-red-600 mt-0.5">
                                                    {currencySymbol} {Number(p.price || 0).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                handleAddProduct(p);
                                                setIsSearchOpen(false);
                                            }}
                                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shrink-0 transition cursor-pointer shadow-xs"
                                        >
                                            + Compare
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Specification Summary Bar (Strictly equal columns) ── */}
            <div className="bg-[#f8fafc] border border-gray-200/90 rounded-2xl p-3 flex items-center shadow-2xs overflow-x-auto">
                {/* Column 0: Specification Label */}
                <div
                    style={{ width: colWidthPercent }}
                    className="text-xs md:text-sm font-extrabold text-gray-900 px-3 shrink-0 flex items-center gap-2"
                >
                    <Icon icon="solar:checklist-minimalistic-bold" width={18} className="text-blue-600 shrink-0" />
                    <span>Specification</span>
                </div>

                {/* Product Columns (Strictly Equal to each other and matching table columns) */}
                <div className="flex-1 flex items-center divide-x divide-gray-200/80 min-w-0">
                    {allItems.map((item, idx) => (
                        <div
                            key={idx}
                            style={{ width: `${(100 / allItems.length).toFixed(4)}%` }}
                            className="px-4 flex items-center gap-2 min-w-0"
                        >
                            <div className="w-6 h-6 rounded border border-gray-200 bg-white p-0.5 shrink-0 flex items-center justify-center overflow-hidden">
                                {item.image ? (
                                    <img src={item.image} alt={item.title} className="w-full h-full object-contain" />
                                ) : (
                                    <Icon icon="solar:devices-linear" width={14} className="text-gray-400" />
                                )}
                            </div>
                            <span className="text-xs font-bold text-gray-900 truncate" title={item.title}>
                                {item.title}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Comparison Specification Cards ── */}
            <div className="space-y-6">
                {comparisonSections.map((sec, sIdx) => {
                    const secIcon = getBoxIcon(sec.title, sec.icon);
                    return (
                        <div
                            key={sIdx}
                            className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden"
                        >
                            {/* Card Header */}
                            <div className="px-6 py-4 border-b border-gray-200/80 flex items-center gap-2.5">
                                <Icon icon={secIcon} width={18} className="text-gray-500 shrink-0" />
                                <h3 className="text-sm md:text-base font-bold text-gray-900 tracking-tight">
                                    {sec.title}
                                </h3>
                            </div>

                            {/* Comparison Table with strictly equal columns */}
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left table-fixed">
                                    <colgroup>
                                        <col style={{ width: colWidthPercent }} />
                                        {allItems.map((_, i) => (
                                            <col key={i} style={{ width: colWidthPercent }} />
                                        ))}
                                    </colgroup>

                                    <tbody className="divide-y divide-gray-100 text-xs md:text-sm">
                                        {sec.fields.map((fieldTitle, fIdx) => (
                                            <tr key={fIdx} className="hover:bg-gray-50/40 transition-colors">
                                                {/* Feature / Field Name */}
                                                <td className="bg-gray-50/70 px-5 py-3.5 text-gray-700 font-semibold border-r border-gray-100 align-top wrap-break-word">
                                                    {fieldTitle}
                                                </td>

                                                {/* Product Values (All equal width) */}
                                                {allItems.map((item, idx) => {
                                                    const val = getFieldValue(item, sec.title, fieldTitle);
                                                    return (
                                                        <td
                                                            key={idx}
                                                            className="px-5 py-3.5 text-gray-900 font-normal leading-relaxed whitespace-pre-line wrap-break-word border-r border-gray-100 last:border-r-0 bg-white align-top"
                                                        >
                                                            {val ? (
                                                                <span>{val}</span>
                                                            ) : (
                                                                <span className="text-gray-400 font-normal">Not specified</span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
