"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import VisualDescription from "./VisualDescription";

interface LazyVisualDescriptionProps {
    data: string | null | undefined;
    productTitle?: string;
}

export default function LazyVisualDescription({
    data,
    productTitle,
}: LazyVisualDescriptionProps) {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Defer rendering visual description slightly so initial product hero & details mount instantly
        const timer = setTimeout(() => {
            setIsReady(true);
        }, 120);

        return () => clearTimeout(timer);
    }, []);

    if (!data || !data.trim()) return null;

    if (!isReady) {
        return (
            <section
                id="visual-description"
                aria-label="Visual Product Overview"
                className="container py-8"
            >
                <div className="w-full rounded-3xl bg-linear-to-r from-gray-50 via-gray-100 to-gray-50 border border-gray-200/80 p-8 md:p-12 flex flex-col items-center justify-center text-center animate-pulse min-h-75 shadow-2xs">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center shadow-xs mb-4 text-blue-600">
                        <Icon icon="solar:layers-minimalistic-bold" className="animate-spin" width={24} />
                    </div>
                    <h3 className="text-base md:text-lg font-bold text-gray-800">
                        Loading Visual Overview for {productTitle || "Product"}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 max-w-md">
                        Preparing interactive visual breakdown, feature scenes, and hardware architecture...
                    </p>
                    <div className="w-48 h-2 bg-gray-200 rounded-full mt-6 overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full w-2/3 animate-[pulse_1.5s_infinite]" />
                    </div>
                </div>
            </section>
        );
    }

    return <VisualDescription data={data} productTitle={productTitle} />;
}
