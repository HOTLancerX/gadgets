/**
 * plugin/gadgets/lib/serverHooks.ts
 *
 * Gadgets server-only data enricher.
 * Automatically discovered by hook/serverDataHooks.ts via require.context.
 * Enriches product pages with smart dynamic recommendations ("Complete Your Setup").
 */

import { registerProductEnricher } from "@/hook/serverDataHooks";
import { getSmartFrequentlyTogether, getSmartCategoryCompareProducts } from "./recommendations";

registerProductEnricher(async () => {
    // Non-blocking for instant initial SSR.
    // Heavy sections (Compare & Frequently Bought Together) load progressively
    // on the client with elegant skeleton loaders via /api/gadgets/product-extra.
    return {
        frequentlyTogether: [],
        compareProducts: [],
        allCompareCandidates: [],
    };
});

