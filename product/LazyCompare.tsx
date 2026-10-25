"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import GadgetsCompare, { type CompareProductItem } from "./Compare";

interface LazyCompareProps {
    productId: string;
    productTitle: string;
    categoryId?: string | null;
    categoryTitle?: string;
    brandTitle?: string;
    currentProduct: CompareProductItem;
    currencySymbol?: string;
    initialCompareProducts?: CompareProductItem[];
    initialAllCandidates?: CompareProductItem[];
    productPrefix?: string;
}

export default function LazyCompare({
    productId,
    productTitle,
    categoryId,
    categoryTitle,
    brandTitle,
    currentProduct,
    currencySymbol = "৳",
    initialCompareProducts = [],
    initialAllCandidates = [],
    productPrefix = "product",
}: LazyCompareProps) {
    const [compareProducts, setCompareProducts] = useState<CompareProductItem[]>(initialCompareProducts);
    const [allAvailable, setAllAvailable] = useState<CompareProductItem[]>(initialAllCandidates);
    const [loading, setLoading] = useState<boolean>(initialCompareProducts.length === 0);

    useEffect(() => {
        if (initialCompareProducts.length > 0) return;

        let cancelled = false;

        async function fetchCompareData() {
            try {
                const params = new URLSearchParams({
                    id: productId,
                    title: productTitle,
                });
                if (categoryId) params.set("categoryId", categoryId);
                if (categoryTitle) params.set("categoryTitle", categoryTitle);
                if (brandTitle) params.set("brand", brandTitle);

                const res = await fetch(`/api/gadgets/product-extra?${params.toString()}`);
                if (!res.ok) throw new Error("Failed to load compare data");
                const json = await res.json();

                if (!cancelled) {
                    const rawList: any[] = json.compareProducts || [];
                    const allPool: any[] = json.allCompareCandidates || [];

                    const mappedCompare: CompareProductItem[] = rawList
                        .filter((p: any) => String(p.id || p._id) !== String(productId))
                        .map((p: any) => {
                            let pSpecs = Array.isArray(p.specifications) ? p.specifications : [];
                            if (pSpecs.length === 0 && p.info?._specifications) {
                                try {
                                    pSpecs = JSON.parse(p.info._specifications);
                                } catch {}
                            }
                            if (!Array.isArray(pSpecs) || pSpecs.length === 0) {
                                pSpecs = [
                                    {
                                        title: "Overview",
                                        fields: [
                                            { title: "Product", description: p.title || "Alternative Product" },
                                            { title: "Status", description: "Available" },
                                        ],
                                    },
                                ];
                            }
                            return {
                                id: String(p.id || p._id),
                                title: String(p.title || ""),
                                slug: String(p.slug || ""),
                                image: p.image || p.info?.thumbnail || "",
                                price: Number(p.price || p.info?.sellingprice || 0),
                                stock: p.stock !== undefined ? p.stock : 99,
                                specifications: pSpecs,
                                url: p.url || `/${productPrefix}/${p.slug}`,
                            };
                        })
                        .slice(0, 3);

                    const mappedCandidates: CompareProductItem[] = (allPool.length > 0 ? allPool : rawList)
                        .filter((p: any) => String(p.id || p._id) !== String(productId))
                        .map((p: any) => {
                            let pSpecs = Array.isArray(p.specifications) ? p.specifications : [];
                            if (pSpecs.length === 0 && p.info?._specifications) {
                                try {
                                    pSpecs = JSON.parse(p.info._specifications);
                                } catch {}
                            }
                            if (!Array.isArray(pSpecs) || pSpecs.length === 0) {
                                pSpecs = [
                                    {
                                        title: "Overview",
                                        fields: [
                                            { title: "Product", description: p.title || "Alternative Product" },
                                            { title: "Status", description: "Available" },
                                        ],
                                    },
                                ];
                            }
                            return {
                                id: String(p.id || p._id),
                                title: String(p.title || ""),
                                slug: String(p.slug || ""),
                                image: p.image || p.info?.thumbnail || "",
                                price: Number(p.price || p.info?.sellingprice || 0),
                                stock: p.stock !== undefined ? p.stock : 99,
                                specifications: pSpecs,
                                url: p.url || `/${productPrefix}/${p.slug}`,
                            };
                        })
                        .slice(0, 5);

                    setCompareProducts(mappedCompare);
                    setAllAvailable(mappedCandidates);
                }
            } catch {
                /* non-critical */
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        fetchCompareData();

        return () => {
            cancelled = true;
        };
    }, [productId, productTitle, categoryId, categoryTitle, brandTitle, initialCompareProducts.length, productPrefix]);

    if (loading) {
        return (
            <section id="compare" className="space-y-6 pt-4">
                {/* ── Header ── */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
                            <Icon icon="solar:round-transfer-vertical-bold" className="animate-spin" width={14} />
                            <span>Comparing Similar Gadgets</span>
                        </span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
                        Compare {productTitle} with Similar Products
                    </h2>
                    <p className="text-xs text-gray-500">
                        Loading detailed specifications and comparing alternatives in this category...
                    </p>
                </div>

                {/* ── 4-Card Shimmer Grid ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                    {/* Selected Product Card */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col justify-between shadow-2xs">
                        <div>
                            <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[11px] font-medium border border-gray-200">
                                Selected Item
                            </span>
                            <div className="w-28 h-32 mx-auto my-3 flex items-center justify-center">
                                {currentProduct.image ? (
                                    <img
                                        src={currentProduct.image}
                                        alt={currentProduct.title}
                                        className="max-h-full max-w-full object-contain"
                                    />
                                ) : (
                                    <Icon icon="solar:devices-linear" width={40} className="text-gray-300" />
                                )}
                            </div>
                            <h4 className="text-sm font-bold text-gray-900 line-clamp-2 mt-2">
                                {currentProduct.title}
                            </h4>
                            <p className="text-base font-extrabold text-red-600 mt-1">
                                {currencySymbol} {Number(currentProduct.price || 0).toLocaleString()}
                            </p>
                        </div>
                    </div>

                    {/* Placeholder Shimmer Cards 2, 3, 4 */}
                    {[1, 2, 3].map((slot) => (
                        <div
                            key={slot}
                            className="bg-white rounded-2xl border border-gray-200/80 p-5 flex flex-col justify-between shadow-2xs animate-pulse"
                        >
                            <div>
                                <div className="h-5 w-20 bg-gray-200 rounded-full mb-3" />
                                <div className="w-28 h-32 mx-auto my-3 bg-gray-100 rounded-xl flex items-center justify-center">
                                    <Icon icon="solar:smartphone-2-linear" width={32} className="text-gray-300" />
                                </div>
                                <div className="h-4 bg-gray-200 rounded-md w-3/4 mb-2" />
                                <div className="h-3 bg-gray-200 rounded-md w-1/2 mb-3" />
                                <div className="h-5 bg-gray-200 rounded-md w-1/3" />
                            </div>
                            <div className="h-9 bg-gray-100 rounded-xl mt-4" />
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    if (compareProducts.length === 0) {
        return null;
    }

    return (
        <GadgetsCompare
            currentProduct={currentProduct}
            compareProducts={compareProducts}
            allAvailableProducts={allAvailable}
            currencySymbol={currencySymbol}
        />
    );
}
