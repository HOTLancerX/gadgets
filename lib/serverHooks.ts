/**
 * plugin/gadgets/lib/serverHooks.ts
 *
 * Gadgets server-only data enricher.
 * Automatically discovered by hook/serverDataHooks.ts via require.context.
 * Enriches product pages with smart dynamic recommendations ("Complete Your Setup").
 */

import { registerProductEnricher } from "@/hook/serverDataHooks";
import { getSmartFrequentlyTogether, getSmartCategoryCompareProducts } from "./recommendations";

registerProductEnricher(async (pageData, postData) => {
    try {
        const ancestors = pageData?.ancestors ?? [];
        const lastAncestor = ancestors.length > 0 ? ancestors[ancestors.length - 1] : null;
        const brand = pageData?.brand ?? null;

        const [frequentlyTogether, compareData] = await Promise.all([
            getSmartFrequentlyTogether({
                id: String(postData._id),
                title: String(postData.title ?? ""),
                brandTitle: brand?.title,
                categoryTitle: lastAncestor?.title,
            }),
            getSmartCategoryCompareProducts(String(postData._id), postData.category),
        ]);

        return {
            frequentlyTogether,
            compareProducts: compareData.compareProducts,
            allCompareCandidates: compareData.allCompareCandidates,
        };
    } catch {
        return {};
    }
});
