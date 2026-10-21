"use client";

/**
 * cms/plugin/gadgets/product/VisualDescription.tsx
 *
 * Gadgets Product Details — Visual Description Component (SSR-ready).
 * Renders structured visual blocks, high-fidelity source styles, sliders, and responsive layouts.
 */

import React from "react";
import VisualDescriptionRenderer from "@/plugin/visual-description/ui/VisualDescriptionRenderer";

export interface VisualDescriptionProps {
    data: string | null | undefined;
    productTitle?: string;
}

export default function VisualDescription({ data, productTitle }: VisualDescriptionProps) {
    if (!data || !data.trim()) return null;

    return (
        <section
            id="visual-description"
            aria-label="Visual Product Overview"
        >
            <VisualDescriptionRenderer data={data} />
        </section>
    );
}
