/**
 * plugin/gadgets/lib/recommendations.ts
 *
 * Gadgets Smart Product Recommendation Engine for "Complete Your Setup" (Frequently Bought Together)
 *
 * Analyzes the viewed product (title, brand, device type) and dynamically queries,
 * scores, and ranks 8 perfectly compatible, non-conflicting accessories across 4 slots:
 *   - 2 Chargers / Adapters
 *   - 2 Cables (Type-C / Lightning matching device)
 *   - 2 Earbuds / Audio
 *   - 2 Power Banks / Essentials
 *
 * Enriches each recommendation with full variant data and selected attributes so
 * interactive variant modals (VariantPopup) can be opened directly from the cards.
 */

import Post from "@/models/post";
import PostInfo from "@/models/post_info";
import Cat from "@/models/cat";
import Permalink from "@/models/permalink";
import mongoose from "mongoose";
import type { SetupProductItem } from "@/plugin/gadgets/product/FrequencyTogether";
import type { VariantData } from "@/plugin/gadgets/box/VariantPopup";

const STOPWORDS = new Set([
    "a", "an", "the", "and", "or", "for", "with", "in", "on", "at", "to",
    "of", "by", "from", "is", "it", "its", "this", "that", "be", "are",
    "was", "were", "has", "have", "had", "do", "does", "did", "will",
    "would", "could", "should", "may", "might", "can", "new", "gen",
    "edition", "version", "model", "official", "original", "genuine",
    "inch", "display", "retina", "regular", "band", "sport", "aluminium",
    "aluminum", "midnight", "starlight", "silver", "gold", "black", "white",
    "blue", "red", "pink", "green", "yellow", "purple", "titanium",
]);

const DEVICE_TYPE_NOUNS = new Set([
    "iphone", "apple", "samsung", "galaxy", "pixel", "oneplus", "xiaomi", "redmi", "poco",
    "vivo", "oppo", "realme", "tecno", "infinix", "itel", "huawei", "honor", "motorola",
    "macbook", "laptop", "notebook", "chromebook", "thinkpad", "surface", "dell", "hp", "lenovo", "asus",
    "ipad", "tablet", "imac", "desktop", "mac", "airpods", "applewatch", "camera", "dslr", "mirrorless",
]);

export function tokenize(text: string): string[] {
    if (!text) return [];
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((t) => t.length >= 2 && !STOPWORDS.has(t) && !/^\d+$/.test(t));
}

function extractDeviceNouns(tokens: string[]): Set<string> {
    const result = new Set<string>();
    for (const t of tokens) {
        if (DEVICE_TYPE_NOUNS.has(t)) result.add(t);
    }
    return result;
}

interface SourceProductContext {
    id: string;
    title: string;
    brandTitle?: string;
    categoryTitle?: string;
}

interface SlotDefinition {
    label: string;
    regex: RegExp;
}

export async function getSmartFrequentlyTogether(
    source: SourceProductContext
): Promise<SetupProductItem[]> {
    const sourceTitle = source.title || "";
    const sourceTokens = tokenize(sourceTitle);
    const sourceDeviceNouns = extractDeviceNouns(sourceTokens);

    if (source.brandTitle) {
        const brandTokens = tokenize(source.brandTitle);
        brandTokens.forEach((t) => {
            if (DEVICE_TYPE_NOUNS.has(t)) sourceDeviceNouns.add(t);
        });
    }

    const isAppleSource =
        sourceDeviceNouns.has("iphone") ||
        sourceDeviceNouns.has("apple") ||
        sourceDeviceNouns.has("macbook") ||
        sourceDeviceNouns.has("ipad") ||
        sourceDeviceNouns.has("airpods") ||
        sourceDeviceNouns.has("applewatch");

    const isLaptop =
        sourceTokens.includes("macbook") ||
        sourceTokens.includes("laptop") ||
        sourceTokens.includes("notebook") ||
        sourceTokens.includes("thinkpad") ||
        (source.categoryTitle || "").toLowerCase().includes("laptop");

    // Define 4 complementary slots tailored to the device type
    const slots: SlotDefinition[] = isLaptop
        ? [
              { label: "Chargers & Adapters", regex: /charger|adapter|gan|hub|dock/i },
              { label: "Cables", regex: /cable|type-c|thunderbolt/i },
              { label: "Accessories", regex: /mouse|keyboard|stand|sleeve|bag/i },
              { label: "Audio", regex: /headphone|earphones|airpods|buds/i },
          ]
        : [
              { label: "Chargers", regex: /charger|adapter|gan|fast charger|wall charger/i },
              { label: "Cables", regex: /cable|type-c|usb-c/i },
              { label: "Earbuds", regex: /earbuds|buds|airpods|headphone|earphones|tws/i },
              { label: "Power banks", regex: /power bank|powerbank|battery pack/i },
          ];

    // Query candidate products per slot
    const targetPostIds: any[] = [];
    const groupMapping: Record<string, string> = {};
    const usedIds = new Set<string>([source.id]);

    for (const slot of slots) {
        const candidates = (await Post.find({
            type: "product",
            status: "published",
            _id: { $ne: source.id, $nin: targetPostIds },
            title: { $regex: slot.regex },
        })
            .limit(60)
            .select("_id title slug type")
            .lean()) as any[];

        const scored: { cand: any; score: number }[] = [];

        for (const cand of candidates) {
            const candId = String(cand._id);
            if (usedIds.has(candId)) continue;

            const candTitle = String(cand.title || "");
            const candLower = candTitle.toLowerCase();
            const candTokens = tokenize(candTitle);
            const candDeviceNouns = extractDeviceNouns(candTokens);

            // Filter out primary phones, laptops, and 5G base phones that are not accessories
            if (
                candLower.includes("phone") &&
                !candLower.includes("case") &&
                !candLower.includes("cover") &&
                !candLower.includes("charger") &&
                !candLower.includes("cable") &&
                !candLower.includes("holder") &&
                !candLower.includes("mount")
            ) {
                continue;
            }
            if (
                candLower.includes("5g") &&
                !candLower.includes("case") &&
                !candLower.includes("cover") &&
                !candLower.includes("charger") &&
                !candLower.includes("cable") &&
                !candLower.includes("power bank")
            ) {
                continue;
            }

            // Incompatibility checks
            if (candLower.includes("lightning") && !isAppleSource) {
                continue; // Non-Apple devices must never get Lightning cables
            }
            if (
                (candLower.includes("magsafe") || candLower.includes("apple watch")) &&
                !isAppleSource
            ) {
                continue; // Non-Apple devices must never get MagSafe/Apple Watch accessories
            }
            if (candLower.includes("ipad") && !sourceTokens.includes("ipad")) {
                continue; // Filter iPad accessories if not viewing iPad
            }

            // Brand compatibility checks
            const isAppleCand =
                candDeviceNouns.has("iphone") ||
                candDeviceNouns.has("apple") ||
                candDeviceNouns.has("airpods") ||
                candDeviceNouns.has("macbook") ||
                candDeviceNouns.has("applewatch");

            if (!isAppleSource && isAppleCand) {
                continue;
            }

            if (isAppleSource && !isAppleCand) {
                if (
                    candDeviceNouns.has("samsung") ||
                    candDeviceNouns.has("vivo") ||
                    candDeviceNouns.has("xiaomi") ||
                    candDeviceNouns.has("oppo") ||
                    candDeviceNouns.has("realme")
                ) {
                    continue; // Apple users should not get Samsung/Vivo accessories
                }
            } else if (!isAppleSource) {
                // If viewing a non-Apple phone (e.g. Vivo), filter out specific rival exclusive accessories
                let hasRivalBrand = false;
                for (const candNoun of candDeviceNouns) {
                    if (
                        !sourceDeviceNouns.has(candNoun) &&
                        (candNoun === "samsung" ||
                            candNoun === "pixel" ||
                            candNoun === "xiaomi" ||
                            candNoun === "vivo" ||
                            candNoun === "oppo")
                    ) {
                        hasRivalBrand = true;
                        break;
                    }
                }
                if (hasRivalBrand) continue;
            }

            // Scoring calculation
            let score = 10;

            // Brand synergy boost
            for (const noun of sourceDeviceNouns) {
                if (candTokens.includes(noun)) {
                    score += 100;
                }
            }

            // Model / Title token overlap boost
            for (const st of sourceTokens) {
                if (candTokens.includes(st)) {
                    score += 30;
                }
            }

            // Modern Type-C and fast-charging boost
            if (
                candLower.includes("type-c") ||
                candLower.includes("usb-c") ||
                candLower.includes("fast") ||
                candLower.includes("gan")
            ) {
                score += 15;
            }

            // Universal high-quality accessory brands boost
            if (/anker|ugreen|baseus|oraimo|remax|joyroom|hoco|cmf/i.test(candTitle)) {
                score += 20;
            }

            scored.push({ cand, score });
        }

        // Sort descending by score and pick top 2 for this slot
        scored.sort((a, b) => b.score - a.score);
        const selected = scored.slice(0, 2);

        for (const item of selected) {
            const cid = String(item.cand._id);
            usedIds.add(cid);
            targetPostIds.push(item.cand._id);
            groupMapping[cid] = slot.label;
        }
    }

    // Fallback: If less than 8 items found, fill up to 8 with non-conflicting published accessories
    if (targetPostIds.length < 8) {
        const extraCandidates = (await Post.find({
            type: "product",
            status: "published",
            _id: { $ne: source.id, $nin: targetPostIds },
            title: { $regex: /charger|cable|earbud|power bank|buds|headphone/i },
        })
            .limit(30)
            .select("_id title slug type")
            .lean()) as any[];

        for (const cand of extraCandidates) {
            if (targetPostIds.length >= 8) break;
            const cid = String(cand._id);
            if (usedIds.has(cid)) continue;

            const candLower = String(cand.title || "").toLowerCase();
            if (candLower.includes("lightning") && !isAppleSource) continue;
            if (candLower.includes("magsafe") && !isAppleSource) continue;
            if (candLower.includes("apple") && !isAppleSource) continue;

            usedIds.add(cid);
            targetPostIds.push(cand._id);
            groupMapping[cid] = "Essentials";
        }
    }

    if (targetPostIds.length === 0) {
        return [];
    }

    // Batch-fetch PostInfo for prices, images, variants, and shipping
    const infoDocs = (await PostInfo.find({
        postId: { $in: targetPostIds },
    }).lean()) as any[];

    const infoByPost: Record<string, Record<string, string>> = {};
    infoDocs.forEach((d) => {
        const pid = String(d.postId);
        if (!infoByPost[pid]) infoByPost[pid] = {};
        infoByPost[pid][d.name] = String(d.value ?? "");
    });

    const permalinkDoc = (await Permalink.findOne({ contentType: "product" }).lean()) as any;
    const pPrefix =
        ((permalinkDoc?.prefix as string) ?? "product").trim().replace(/^\/+|\/+$/g, "") ||
        "product";

    const postDocs = (await Post.find({
        _id: { $in: targetPostIds },
    }).lean()) as any[];

    // Order items preserving the slots order
    const postMap = new Map(postDocs.map((p) => [String(p._id), p]));

    const results: SetupProductItem[] = [];

    for (const pid of targetPostIds) {
        const p = postMap.get(String(pid));
        if (!p) continue;

        const pInfo = infoByPost[String(p._id)] || {};
        let pImage = "";
        try {
            const imgs = JSON.parse(pInfo.images || "[]");
            if (Array.isArray(imgs) && imgs[0]) pImage = imgs[0];
        } catch {
            /* ignore */
        }

        let sellingPrice = 0;
        let regularPrice = 0;
        let singleStock = 999;
        let priceType: "single" | "variant" = "single";
        let variants: VariantData[] = [];
        let selectedAttributes: { label: string; values: string[]; displayStyle?: string }[] = [];

        try {
            const variate = JSON.parse(pInfo._variate || "{}");
            priceType = variate.priceType ?? "single";
            variants = (variate.variants ?? []) as VariantData[];
            selectedAttributes = (variate.selectedAttributes ?? []) as {
                label: string;
                values: string[];
                displayStyle?: string;
            }[];

            sellingPrice = parseFloat(variate.sellingprice || pInfo.sellingprice || "0") || 0;
            regularPrice = parseFloat(variate.regularprice || pInfo.regularprice || "0") || 0;
            singleStock = variate.stock !== undefined ? parseInt(variate.stock, 10) : 999;

            // If variant product and image not set, try first variant image
            if (!pImage && variants.length > 0) {
                const firstVarImg = variants.find((v) => v.image)?.image;
                if (firstVarImg) pImage = firstVarImg;
            }
        } catch {
            /* ignore */
        }

        // For variant products, get minimum price
        let effectivePrice = sellingPrice > 0 ? sellingPrice : regularPrice;
        if (priceType === "variant" && variants.length > 0) {
            const variantPrices = variants
                .map((v) => parseFloat(v.price ?? "0"))
                .filter((pr) => !isNaN(pr) && pr > 0);
            if (variantPrices.length > 0) {
                effectivePrice = Math.min(...variantPrices);
            }
        }

        const hasDiscount = regularPrice > effectivePrice && effectivePrice > 0;
        const shippingInside = parseFloat(pInfo.shipping_inside ?? "") || undefined;
        const shippingOutside = parseFloat(pInfo.shipping_outside ?? "") || undefined;

        results.push({
            id: String(p._id),
            title: String(p.title || ""),
            slug: String(p.slug || ""),
            category: groupMapping[String(p._id)] || "Accessories",
            image: pImage,
            price: effectivePrice,
            regularPrice,
            hasDiscount,
            priceType,
            url: `/${pPrefix}/${p.slug}`,
            variants,
            selectedAttributes,
            stock: singleStock,
            shippingInside,
            shippingOutside,
            info: pInfo,
        });
    }

    return results;
}

/**
 * Resolves up to 3 smart comparison products and all available candidates from the same
 * category family (e.g. Phone brand categories under Phones) that have non-empty specifications.
 */
export async function getSmartCategoryCompareProducts(
    productId: string,
    categoryId?: string | null
): Promise<{ compareProducts: any[]; allCompareCandidates: any[] }> {
    try {
        const catDoc =
            categoryId && mongoose.Types.ObjectId.isValid(categoryId)
                ? ((await Cat.findById(categoryId).lean()) as any)
                : null;

        const relatedCatIds = new Set<string>();

        if (catDoc) {
            relatedCatIds.add(String(catDoc._id));
            const parentId = catDoc.parentId || catDoc._id;
            relatedCatIds.add(String(parentId));

            const siblings = (await Cat.find({
                type: catDoc.type,
                $or: [{ parentId }, { _id: parentId }],
            })
                .select("_id")
                .lean()) as any[];
            siblings.forEach((s) => relatedCatIds.add(String(s._id)));
        }

        // Find posts with non-empty specifications
        const specInfos = (await PostInfo.find({
            name: "_specifications",
        }).lean()) as any[];

        const validSpecPostIds: any[] = [];
        const specMap: Record<string, any[]> = {};

        for (const s of specInfos) {
            try {
                const parsed = JSON.parse(s.value || "[]");
                if (
                    Array.isArray(parsed) &&
                    parsed.some(
                        (b: any) =>
                            Array.isArray(b.fields) &&
                            b.fields.some(
                                (f: any) =>
                                    typeof f?.description === "string" && f.description.trim().length > 0
                            )
                    )
                ) {
                    validSpecPostIds.push(s.postId);
                    specMap[String(s.postId)] = parsed;
                }
            } catch {
                /* ignore */
            }
        }

        const validSpecIdsFiltered = validSpecPostIds.filter(
            (id) => String(id) !== String(productId)
        );

        if (validSpecIdsFiltered.length === 0) {
            return { compareProducts: [], allCompareCandidates: [] };
        }

        const query: any = {
            _id: { $in: validSpecIdsFiltered },
            type: "product",
            status: "published",
        };

        if (relatedCatIds.size > 0) {
            query.category = {
                $in: Array.from(relatedCatIds).map((id) => new mongoose.Types.ObjectId(id)),
            };
        }

        let candidatePosts = (await Post.find(query).lean()) as any[];

        // Fallback: If no candidate found in exact related categories, search across all published products with specs
        if (candidatePosts.length === 0) {
            candidatePosts = (await Post.find({
                _id: { $in: validSpecIdsFiltered },
                type: "product",
                status: "published",
            }).lean()) as any[];
        }

        if (candidatePosts.length === 0) {
            return { compareProducts: [], allCompareCandidates: [] };
        }

        const candidateIds = candidatePosts.map((p) => p._id);

        // Batch fetch postinfos for images and variates
        const infoDocs = (await PostInfo.find({
            postId: { $in: candidateIds },
        }).lean()) as any[];

        const infoByPost: Record<string, Record<string, string>> = {};
        for (const info of infoDocs) {
            const pid = String(info.postId);
            if (!infoByPost[pid]) infoByPost[pid] = {};
            infoByPost[pid][info.name] = String(info.value ?? "");
        }

        const permalinkDoc = (await Permalink.findOne({ contentType: "product" }).lean()) as any;
        const pPrefix =
            ((permalinkDoc?.prefix as string) ?? "product").trim().replace(/^\/+|\/+$/g, "") ||
            "product";

        const formatted = candidatePosts.map((p) => {
            const pid = String(p._id);
            const pInfo = infoByPost[pid] || {};
            let pImage = "";
            try {
                const imgs = JSON.parse(pInfo.images || "[]");
                if (Array.isArray(imgs) && imgs[0]) pImage = imgs[0];
            } catch {
                /* ignore */
            }

            let pPrice = 0;
            let pStock = 99;
            try {
                const variate = JSON.parse(pInfo._variate || "{}");
                pPrice =
                    parseFloat(
                        variate.sellingprice || variate.regularprice || pInfo.sellingprice || "0"
                    ) || 0;
                pStock = parseInt(variate.stock || "99", 10);
            } catch {
                /* ignore */
            }

            return {
                _id: pid,
                id: pid,
                title: String(p.title || ""),
                slug: String(p.slug || ""),
                image: pImage,
                price: pPrice,
                stock: pStock,
                specifications: specMap[pid] || [],
                info: {
                    ...pInfo,
                    _specifications: JSON.stringify(specMap[pid] || []),
                },
                url: `/${pPrefix}/${p.slug}`,
            };
        });

        return {
            compareProducts: formatted.slice(0, 3),
            allCompareCandidates: formatted,
        };
    } catch (e) {
        console.error("Error in getSmartCategoryCompareProducts:", e);
        return { compareProducts: [], allCompareCandidates: [] };
    }
}

