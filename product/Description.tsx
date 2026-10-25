"use client";

/**
 * plugin/gadgets/product/Description.tsx
 *
 * Client-interactive toggle wrapper for product description prose:
 * - Pre-renders formatted HTML on the server.
 * - Provides smooth expand/collapse toggle for lengthy content.
 */

import React, { useState } from "react";

interface DescriptionProps {
    html: string;
}

export default function GadgetsDescription({ html }: DescriptionProps) {
    const [expandedDesc, setExpandedDesc] = useState(false);

    if (!html || !html.trim()) return null;

    return (
        <div id="description" className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
                Description
            </h2>
            <div className="relative">
                <div
                    className={`prose max-w-none text-xs md:text-sm text-gray-700 leading-relaxed overflow-hidden transition-all duration-500 ${
                        expandedDesc ? "max-h-none" : "max-h-56"
                    }`}
                    dangerouslySetInnerHTML={{
                        __html: html,
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
    );
}
