"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import GadgetsFrequencyTogether, { type SetupProductItem } from "./FrequencyTogether";

interface LazyFrequencyTogetherProps {
    productId: string;
    productTitle: string;
    categoryId?: string | null;
    categoryTitle?: string;
    brandTitle?: string;
    currencySymbol?: string;
    initialProducts?: SetupProductItem[];
}

export default function LazyFrequencyTogether({
    productId,
    productTitle,
    categoryId,
    categoryTitle,
    brandTitle,
    currencySymbol = "৳",
    initialProducts = [],
}: LazyFrequencyTogetherProps) {
    const [products, setProducts] = useState<SetupProductItem[]>(initialProducts);
    const [loading, setLoading] = useState<boolean>(initialProducts.length === 0);

    useEffect(() => {
        if (initialProducts.length > 0) return;

        let cancelled = false;

        async function fetchAccessories() {
            try {
                const params = new URLSearchParams({
                    id: productId,
                    title: productTitle,
                });
                if (categoryId) params.set("categoryId", categoryId);
                if (categoryTitle) params.set("categoryTitle", categoryTitle);
                if (brandTitle) params.set("brand", brandTitle);

                const res = await fetch(`/api/gadgets/product-extra?${params.toString()}`);
                if (!res.ok) throw new Error("Failed to load accessories");
                const json = await res.json();

                if (!cancelled) {
                    setProducts(json.frequentlyTogether || []);
                }
            } catch {
                /* non-critical */
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        fetchAccessories();

        return () => {
            cancelled = true;
        };
    }, [productId, productTitle, categoryId, categoryTitle, brandTitle, initialProducts.length]);

    if (loading) {
        return (
            <section id="complete-setup" className="space-y-5 pt-2">
                {/* ── Section Header ── */}
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold">
                                <Icon icon="solar:round-transfer-vertical-bold" className="animate-spin" width={14} />
                                <span>Matching Compatible Accessories</span>
                            </span>
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
                            Complete Your Setup
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Finding recommended chargers, audio, cables & essentials for {productTitle}...
                        </p>
                    </div>
                </div>

                {/* ── 4-Column Horizontal Shimmer Cards Grid ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((idx) => (
                        <div
                            key={idx}
                            className="bg-white rounded-2xl border border-gray-200/80 p-3 md:p-4 flex items-center gap-3.5 shadow-2xs animate-pulse"
                        >
                            <div className="w-20 h-20 md:w-22 md:h-22 rounded-xl bg-gray-100 shrink-0 flex items-center justify-center">
                                <Icon icon="solar:devices-linear" width={28} className="text-gray-300" />
                            </div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-16 bg-gray-200 rounded-full" />
                                <div className="h-3.5 bg-gray-200 rounded-md w-4/5" />
                                <div className="h-4 bg-gray-200 rounded-md w-1/3" />
                                <div className="h-7 bg-gray-100 rounded-lg w-full" />
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    if (!products || products.length === 0) {
        return null;
    }

    return (
        <GadgetsFrequencyTogether
            products={products}
            currencySymbol={currencySymbol}
            currentProductTitle={productTitle}
        />
    );
}
