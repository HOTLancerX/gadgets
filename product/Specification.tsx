"use client";

/**
 * plugin/gadgets/product/Specification.tsx
 *
 * Exelic Gadgets Product Technical Specifications component:
 *  - Displays all structured specification boxes with icons and fields.
 *  - Interactive quick search/filter to instantly jump to or filter specs.
 *  - Responsive grid layout: 1 col on mobile, 2 cols on lg.
 *  - Modern high-tech gadget aesthetic with category icons and clean badges.
 */

import React, { useState, useMemo } from "react";
import { Icon } from "@iconify/react";

export interface SpecField {
    title: string;
    description: string;
    image?: string;
}

export interface SpecBox {
    title: string;
    icon?: string;
    fields: SpecField[];
}

interface SpecificationProps {
    specifications: SpecBox[];
    productTitle: string;
}

function getBoxIcon(title: string, icon?: string): string {
    if (icon && icon.trim()) return icon;
    const t = title.toLowerCase();
    if (t.includes("general")) return "solar:widget-2-linear";
    if (t.includes("design")) return "solar:layers-minimalistic-linear";
    if (t.includes("display") || t.includes("screen")) return "solar:smartphone-2-linear";
    if (t.includes("camera")) return "solar:camera-linear";
    if (t.includes("battery") || t.includes("charging")) return "solar:battery-charge-linear";
    if (t.includes("hardware") || t.includes("performance") || t.includes("chipset") || t.includes("platform") || t.includes("cpu")) {
        return "solar:cpu-bolt-linear";
    }
    if (t.includes("connectivity") || t.includes("network") || t.includes("wireless")) return "solar:wifi-router-linear";
    if (t.includes("audio") || t.includes("sound") || t.includes("speaker")) return "solar:volume-loud-linear";
    if (t.includes("memory") || t.includes("storage") || t.includes("ram")) return "solar:database-linear";
    if (t.includes("sensor")) return "solar:radar-2-linear";
    if (t.includes("software") || t.includes("os")) return "solar:code-circle-linear";
    return "solar:widget-2-linear";
}

export default function GadgetsSpecification({ specifications = [], productTitle }: SpecificationProps) {
    const [searchQuery, setSearchQuery] = useState("");

    // 1. Clean specs: strictly keep only fields with non-empty info, and boxes with at least 1 field
    const cleanedSpecifications = useMemo(() => {
        if (!Array.isArray(specifications)) return [];
        return specifications
            .map((box) => {
                const validFields = (box.fields || []).filter(
                    (f) => typeof f?.description === "string" && f.description.trim().length > 0
                );
                if (validFields.length === 0) return null;
                return {
                    ...box,
                    fields: validFields,
                };
            })
            .filter(Boolean) as SpecBox[];
    }, [specifications]);

    // 2. Filter boxes and fields based on search query
    const filteredBoxes = useMemo(() => {
        if (!searchQuery.trim()) return cleanedSpecifications;
        const q = searchQuery.toLowerCase().trim();

        return cleanedSpecifications
            .map((box) => {
                const boxMatches = box.title.toLowerCase().includes(q);
                const matchingFields = box.fields.filter(
                    (f) => f.title.toLowerCase().includes(q) || f.description.toLowerCase().includes(q)
                );
                if (boxMatches || matchingFields.length > 0) {
                    return {
                        ...box,
                        fields: boxMatches ? box.fields : matchingFields,
                    };
                }
                return null;
            })
            .filter(Boolean) as SpecBox[];
    }, [cleanedSpecifications, searchQuery]);

    const totalFields = useMemo(() => {
        return cleanedSpecifications.reduce((sum, b) => sum + (b.fields?.length || 0), 0);
    }, [cleanedSpecifications]);

    // If the entire section has no specifications/information, hide it completely
    if (cleanedSpecifications.length === 0) {
        return null;
    }

    return (
        <section id="specifications" className="space-y-6">
            {/* Header & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 shadow-2xs">
                        <Icon icon="solar:devices-bold-duotone" width={22} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                            Technical Specifications
                        </h2>
                        <p className="text-xs text-gray-500">
                            Detailed hardware & software specifications for {productTitle} ({totalFields} attributes)
                        </p>
                    </div>
                </div>

                {/* Instant Spec Search */}
                <div className="relative w-full sm:w-64">
                    <Icon
                        icon="solar:magnifer-linear"
                        width={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search specs (e.g. AMOLED, 5000 mAh)..."
                        className="w-full text-xs pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-blue-500 focus:border-blue-500 transition-all text-gray-800 placeholder-gray-400"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                            <Icon icon="solar:close-circle-bold" width={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Empty filter result */}
            {filteredBoxes.length === 0 && (
                <div className="py-12 text-center bg-gray-50 rounded-2xl border border-gray-200">
                    <Icon icon="solar:database-fail-bold" width={36} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm font-semibold text-gray-700">No specifications found matching &quot;{searchQuery}&quot;</p>
                    <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="mt-2 text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                    >
                        Clear search filter
                    </button>
                </div>
            )}

            {/* Specification Boxes Stacked List (Full-Width Table Style) */}
            <div className="space-y-6">
                {filteredBoxes.map((box, bIdx) => {
                    const boxIcon = getBoxIcon(box.title, box.icon);
                    return (
                        <div
                            key={bIdx}
                            className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden"
                        >
                            {/* Card Header */}
                            <div className="px-6 py-4 border-b border-gray-200/80 flex items-center gap-2.5">
                                <Icon icon={boxIcon} width={18} className="text-gray-500 shrink-0" />
                                <h3 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight">
                                    {box.title}
                                </h3>
                            </div>

                            {/* Two-Column Specification Table */}
                            <div className="divide-y divide-gray-100">
                                {box.fields.map((field, fIdx) => (
                                    <div
                                        key={fIdx}
                                        className="flex flex-col sm:flex-row text-xs sm:text-sm hover:bg-gray-50/40 transition-colors"
                                    >
                                        {/* Field Label / Key */}
                                        <div className="w-full md:w-100 sm:shrink-0 bg-gray-100/60 px-6 py-3.5 text-gray-600 font-medium sm:border-r border-gray-100 flex items-center">
                                            {field.title}
                                        </div>

                                        {/* Field Value */}
                                        <div className="flex-1 px-6 py-3.5 text-gray-900 font-normal leading-relaxed whitespace-pre-line wrap-break-word bg-white">
                                            <span>{field.description}</span>
                                            {field.image && (
                                                <div className="mt-2">
                                                    <img
                                                        src={field.image}
                                                        alt={field.title}
                                                        className="w-16 h-16 object-cover rounded-lg border border-gray-200 shadow-2xs hover:scale-105 transition-transform cursor-pointer"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
