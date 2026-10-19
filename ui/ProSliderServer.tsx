/**
 * cms/plugin/gadgets/ui/ProSliderServer.tsx
 *
 * SERVER COMPONENT — queries MongoDB directly for products and post info,
 * parses multivariate data (_variate), and renders ProSliderClient with zero client waterfall.
 */

import connectDB from "@/lib/mongodb";
import Post from "@/models/post";
import PostInfo from "@/models/post_info";
import Permalink from "@/models/permalink";
import { Types } from "mongoose";
import type { ProSliderTabConfig, ProSliderProductData, ProSliderVariant } from "../types";
import ProSliderClient from "./ProSliderClient";

interface ProSliderServerProps {
  productTabs?: ProSliderTabConfig[];
  ctaText?: string;
  accentColor?: string;
  currencySymbol?: string;
  tabsPosition?: 'top' | 'bottom';
  margin?: any;
  padding?: any;
}

function resolveImage(info: Record<string, string>): string {
  if (info.images) {
    try {
      const arr = JSON.parse(info.images);
      if (Array.isArray(arr) && arr[0]) return arr[0] as string;
    } catch {}
  }
  return info.image || info.thumbnail || "";
}

function parseVariants(variateJson?: string, defaultImg: string = ""): ProSliderVariant[] {
  if (!variateJson) return [];
  try {
    const parsed = JSON.parse(variateJson);
    if (Array.isArray(parsed.variants) && parsed.variants.length > 0) {
      const result: ProSliderVariant[] = [];
      const seen = new Set<string>();

      for (const v of parsed.variants) {
        const colorVal = v.options?.Color || v.options?.color || v.color;
        const name =
          v.title ||
          v.name ||
          colorVal ||
          (v.options ? Object.values(v.options).join(' / ') : '') ||
          'Variant';

        const dedupeKey = `${name}_${v.color || ''}_${v.image || ''}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);

        result.push({
          name,
          color: v.color || (typeof colorVal === 'string' && colorVal.startsWith('#') ? colorVal : undefined),
          image: v.image || (Array.isArray(v.images) ? v.images[0] : undefined) || defaultImg,
          price: parseFloat(v.price) || (parsed.price ? parseFloat(parsed.price) : undefined),
          sku: v.sku || '',
        });
      }
      return result;
    }
  } catch {}
  return [];
}

export default async function ProSliderServer({
  productTabs = [],
  ctaText,
  accentColor,
  currencySymbol,
  tabsPosition,
  margin,
  padding,
}: ProSliderServerProps) {
  let products: ProSliderProductData[] = [];

  const validTabs = (productTabs || []).filter((t) => t.productId && Types.ObjectId.isValid(t.productId));

  if (validTabs.length > 0) {
    await connectDB();

    const ids = validTabs.map((t) => new Types.ObjectId(t.productId));

    // Parallel fetch: Permalink prefix, Posts, and PostInfos
    const [productPL, postDocs, postInfos] = await Promise.all([
      Permalink.findOne({ contentType: "product" }).lean() as Promise<any>,
      Post.find({ _id: { $in: ids }, status: "published" }).select("_id title slug").lean(),
      PostInfo.find({
        postId: { $in: ids },
        name: { $in: ["images", "image", "thumbnail", "_variate", "price", "regularPrice", "stock_status", "stock", "highlight", "shortDescription", "subtitle"] },
      }).select("postId name value").lean(),
    ]);

    const productPrefix = (productPL?.prefix ?? "product").trim().replace(/^\/+|\/+$/g, "") || "product";

    // Map PostInfos by postId
    const infoMap: Record<string, Record<string, string>> = {};
    for (const info of postInfos) {
      const key = (info.postId as Types.ObjectId).toString();
      if (!infoMap[key]) infoMap[key] = {};
      infoMap[key][info.name] = info.value;
    }

    // Map Posts by _id
    const postMap = new Map<string, any>(postDocs.map((p: any) => [p._id.toString(), p]));

    // Construct products in exact configured tab order
    for (const tab of validTabs) {
      const post = postMap.get(tab.productId);
      if (!post) continue;

      const pId = post._id.toString();
      const info = infoMap[pId] || {};
      const mainImg = resolveImage(info);
      const variants = parseVariants(info._variate, mainImg);

      // Price extraction
      let price: number | string = 0;
      if (info.price) price = parseFloat(info.price) || info.price;
      else if (info.regularPrice) price = parseFloat(info.regularPrice) || info.regularPrice;
      else if (variants.length > 0 && variants[0]?.price) price = variants[0].price;

      // Hero highlight headline
      const highlightTitle =
        tab.highlightTitle?.trim() ||
        info.highlight ||
        info.shortDescription ||
        "";

      // Subtitle
      const subtitle = tab.subtitle?.trim() || info.subtitle || "";

      // Badge
      const badge = tab.badge?.trim() || "New";

      products.push({
        productId: pId,
        title: post.title || "Product",
        slug: post.slug || "product",
        postUrl: `/${productPrefix}/${post.slug || ""}`,
        thumbnail: mainImg,
        mainImage: mainImg,
        badge,
        highlightTitle,
        subtitle,
        price,
        stockStatus: info.stock_status || "In stock",
        variants,
      });
    }
  }

  return (
    <ProSliderClient
      products={products}
      ctaText={ctaText}
      accentColor={accentColor}
      currencySymbol={currencySymbol}
      tabsPosition={tabsPosition}
      margin={margin}
      padding={padding}
    />
  );
}
