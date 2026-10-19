/**
 * cms/plugin/gadgets/lib/builderData.tsx
 *
 * SERVER-ONLY. Registers server-side renderers for gadgets builder elements.
 * Auto-discovered by hook/builderDataHooks.ts via require.context.
 * Builder.tsx renders these server-side with zero client-side data fetching.
 */

import React from "react";
import { registerBuilderElement } from "@/hook/builderDataHooks";
import connectDB from "@/lib/mongodb";
import Post from "@/models/post";
import PostInfo from "@/models/post_info";
import Permalink from "@/models/permalink";
import { Types } from "mongoose";
import ProSliderServer from "../ui/ProSliderServer";
import GadgetsGridServer from "../ui/GadgetsGridServer";
import ProCategorySlider from "../ui/ProCategorySlider";
import ProCategoryGrid from "../ui/ProCategoryGrid";
import ExploreProductsSlider from "../ui/ExploreProductsSlider";
import type { CategoryTabConfig } from "../elements/CategorySelector";

registerBuilderElement("gadgets-pro-slider", async (schema) => {
  const c = schema?.content ?? {};
  const s = schema?.style ?? {};
  const a = schema?.advanced ?? {};

  return (
    <ProSliderServer
      productTabs={c.productTabs ?? []}
      ctaText={c.ctaText ?? "Explore product"}
      currencySymbol={c.currencySymbol}
      tabsPosition={c.tabsPosition ?? "top"}
      accentColor={s.accentColor ?? "#0053e2"}
      margin={a.margin ?? s.margin}
      padding={a.padding ?? s.padding}
    />
  );
});

registerBuilderElement("gadgets-grid", (schema) => {
  return <GadgetsGridServer schema={schema} />;
});

// Helper to safely extract string ID from string, ObjectId, or nested object
function extractCategoryId(raw: any): string {
  if (!raw) return '';
  if (typeof raw === 'string') return raw.trim();
  if (typeof raw === 'object') {
    if (raw.id) return extractCategoryId(raw.id);
    if (raw._id) return extractCategoryId(raw._id);
    if (raw.categoryId) return extractCategoryId(raw.categoryId);
  }
  return String(raw).trim();
}

// Normalizes any format into clean CategoryTabConfig[]
function normalizeTabs(rawTabs: any, rawCategoryId: any): CategoryTabConfig[] {
  let list: any[] = [];
  if (Array.isArray(rawTabs) && rawTabs.length > 0) {
    list = rawTabs;
  } else if (rawCategoryId) {
    list = [rawCategoryId];
  } else {
    list = [{ id: 'all', label: 'New in' }];
  }

  return list.map((item) => {
    if (typeof item === 'string') {
      const cleanId = extractCategoryId(item);
      return { id: cleanId, label: cleanId === 'all' ? 'New in' : '' };
    }
    if (item && typeof item === 'object') {
      const cleanId = extractCategoryId(item.id ?? item._id ?? item.categoryId ?? item);
      const label = typeof item.label === 'string'
        ? item.label
        : (typeof item.title === 'string' ? item.title : '');
      return { id: cleanId, label: label || (cleanId === 'all' ? 'New in' : '') };
    }
    return { id: 'all', label: 'New in' };
  });
}

// Helper for pre-fetching category products on server
async function fetchCategoryData(tabs: CategoryTabConfig[], limitCount: number) {
  const productsByCategory: Record<string, any[]> = {};
  const permalinkMap: Record<string, string> = {};

  try {
    await connectDB();

    const permalinkDocs = await Permalink.find().lean();
    for (const pl of permalinkDocs) {
      if (pl.contentType && pl.prefix !== undefined) {
        permalinkMap[pl.contentType] = pl.prefix;
      }
    }

    const limit = Math.min(Number(limitCount) || 10, 48);

    for (const tab of tabs) {
      const catId = extractCategoryId(tab.id);
      const query: Record<string, any> = {
        type: "product",
        status: "published",
      };

      if (catId && catId !== 'all') {
        if (Types.ObjectId.isValid(catId)) {
          query.category = new Types.ObjectId(catId);
        } else {
          // If catId is not a valid ObjectId, don't execute an invalid query
          productsByCategory[catId] = [];
          continue;
        }
      }

      const postDocs = await Post.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      if (postDocs.length > 0) {
        const postIds = postDocs.map((p) => p._id);
        const postInfos = await PostInfo.find({
          postId: { $in: postIds },
        }).lean();

        const infoMap: Record<string, Record<string, string>> = {};
        for (const info of postInfos) {
          const pid = String(info.postId);
          if (!infoMap[pid]) infoMap[pid] = {};
          infoMap[pid][info.name] = info.value;
        }

        const serialized = postDocs.map((doc) => ({
          _id: String(doc._id),
          title: doc.title,
          slug: doc.slug,
          status: doc.status,
          category: doc.category ? String(doc.category) : null,
          createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : undefined,
          info: infoMap[String(doc._id)] || {},
        }));

        productsByCategory[catId] = serialized;
        productsByCategory[tab.id] = serialized;
      } else {
        productsByCategory[catId] = [];
        productsByCategory[tab.id] = [];
      }
    }
  } catch (err) {
    console.error("[gadgets category SSR error]", err);
  }

  return { productsByCategory, permalinkMap };
}

// ─── Pro-Category Slider SSR ───
registerBuilderElement("gadgets-pro-category", async (schema) => {
  const c = schema?.content ?? {};
  const sl = schema?.slider ?? {};
  const s = schema?.style ?? {};
  const a = schema?.advanced ?? {};

  const tabs = normalizeTabs(c.categoryTabs, c.categoryId);
  const { productsByCategory, permalinkMap } = await fetchCategoryData(tabs, c.limit);

  const firstTabId = tabs[0]?.id || 'all';
  const initialProducts = productsByCategory[firstTabId] || [];

  return (
    <ProCategorySlider
      titlePrefix={c.titlePrefix}
      titleHighlight={c.titleHighlight}
      categoryTabs={tabs}
      limit={c.limit}
      boxStyle={c.boxStyle}
      currencySymbol={c.currencySymbol}
      viewAllLink={c.viewAllLink}
      slidesDesktop={sl.slidesDesktop ?? 5}
      slidesTablet={sl.slidesTablet ?? 3}
      slidesMobile={sl.slidesMobile ?? 1.5}
      gapDesktop={sl.gapDesktop ?? 4}
      gapTablet={sl.gapTablet ?? 3}
      gapMobile={sl.gapMobile ?? 2}
      imageHeightDesktop={sl.imageHeightDesktop ?? s.imageHeightDesktop ?? 210}
      imageHeightMobile={sl.imageHeightMobile ?? s.imageHeightMobile ?? 170}
      showArrows={sl.showArrows !== false}
      margin={a.margin ?? s.margin}
      padding={a.padding ?? s.padding}
      products={initialProducts}
      productsByCategory={productsByCategory}
      permalinkMap={permalinkMap}
    />
  );
});

// ─── Pro-Category Grid SSR ───
registerBuilderElement("gadgets-pro-category-grid", async (schema) => {
  const c = schema?.content ?? {};
  const g = schema?.grid ?? {};
  const s = schema?.style ?? {};
  const a = schema?.advanced ?? {};

  const tabs = normalizeTabs(c.categoryTabs, c.categoryId);
  const { productsByCategory, permalinkMap } = await fetchCategoryData(tabs, c.limit);

  const firstTabId = tabs[0]?.id || 'all';
  const initialProducts = productsByCategory[firstTabId] || [];

  return (
    <ProCategoryGrid
      titlePrefix={c.titlePrefix}
      titleHighlight={c.titleHighlight}
      categoryTabs={tabs}
      limit={c.limit}
      boxStyle={c.boxStyle}
      currencySymbol={c.currencySymbol}
      viewAllLink={c.viewAllLink}
      columnsDesktop={g.columnsDesktop ?? 5}
      columnsTablet={g.columnsTablet ?? 3}
      columnsMobile={g.columnsMobile ?? 2}
      gapDesktop={g.gapDesktop ?? 4}
      gapTablet={g.gapTablet ?? 3}
      gapMobile={g.gapMobile ?? 2}
      imageHeightDesktop={g.imageHeightDesktop ?? s.imageHeightDesktop ?? 210}
      imageHeightMobile={g.imageHeightMobile ?? s.imageHeightMobile ?? 170}
      margin={a.margin ?? s.margin}
      padding={a.padding ?? s.padding}
      products={initialProducts}
      productsByCategory={productsByCategory}
      permalinkMap={permalinkMap}
    />
  );
});

// ─── Explore Products Slider SSR ───
registerBuilderElement("gadgets-explore-products", async (schema) => {
  const c = schema?.content ?? {};
  const sl = schema?.slider ?? {};
  const s = schema?.style ?? {};
  const a = schema?.advanced ?? {};

  const tabs = normalizeTabs(c.categoryTabs, c.categoryId);
  const { productsByCategory, permalinkMap } = await fetchCategoryData(tabs, c.limit);

  const firstTabId = tabs[0]?.id || 'all';
  const initialProducts = productsByCategory[firstTabId] || [];

  return (
    <ExploreProductsSlider
      titlePrefix={c.titlePrefix ?? "Explore our"}
      titleHighlight={c.titleHighlight ?? "products"}
      categoryTabs={tabs}
      limit={c.limit}
      boxStyle={c.boxStyle ?? "Gadgets Box 2"}
      currencySymbol={c.currencySymbol}
      viewAllLink={c.viewAllLink}
      slidesDesktop={sl.slidesDesktop ?? 4}
      slidesTablet={sl.slidesTablet ?? 2.5}
      slidesMobile={sl.slidesMobile ?? 1.3}
      gapDesktop={sl.gapDesktop ?? 4}
      gapTablet={sl.gapTablet ?? 3}
      gapMobile={sl.gapMobile ?? 2}
      imageHeightDesktop={sl.imageHeightDesktop ?? s.imageHeightDesktop ?? 210}
      imageHeightMobile={sl.imageHeightMobile ?? s.imageHeightMobile ?? 170}
      showArrows={sl.showArrows !== false}
      margin={a.margin ?? s.margin}
      padding={a.padding ?? s.padding}
      products={initialProducts}
      productsByCategory={productsByCategory}
      permalinkMap={permalinkMap}
    />
  );
});

// Register Offer Accordion Banner Slider (interactive expandable hero cards)
import OfferAccordion from "../ui/OfferAccordion";
import HighlightsGrid from "../ui/HighlightsGrid";
import PosterProductGrid from "../ui/PosterProductGrid";

registerBuilderElement("gadgets-offer-accordion", (schema) => {
  return <OfferAccordion schema={schema} />;
});

// Register Highlights Grid ("Shop our highlights" reel/story element)
registerBuilderElement("gadgets-highlights", (schema) => {
  const c = schema?.content ?? {};
  const g = schema?.grid ?? {};
  const s = schema?.style ?? {};
  const a = schema?.advanced ?? {};

  return (
    <HighlightsGrid
      titlePrefix={c.titlePrefix}
      titleHighlight={c.titleHighlight}
      items={c.items}
      columnsDesktop={g.columnsDesktop ?? 6}
      columnsTablet={g.columnsTablet ?? 3}
      columnsMobile={g.columnsMobile ?? 2}
      gapDesktop={g.gapDesktop ?? 3}
      gapTablet={g.gapTablet ?? 3}
      gapMobile={g.gapMobile ?? 2}
      borderRadius={g.borderRadius ?? 22}
      aspectRatio={g.aspectRatio ?? '9/16'}
      margin={a.margin ?? s.margin}
      padding={a.padding ?? s.padding}
    />
  );
});

// Register Poster Grid ("Explore soundcore" product grid element)
registerBuilderElement("gadgets-poster-grid", async (schema) => {
  const c = schema?.content ?? {};
  const g = schema?.grid ?? {};
  const s = schema?.style ?? {};
  const a = schema?.advanced ?? {};

  let products: any[] = [];
  let permalinkMap: Record<string, string> = {};

  if ((c.itemsMode ?? 'catalog') === 'catalog') {
    const tabs = normalizeTabs(c.categoryTabs, c.categoryId);
    const catData = await fetchCategoryData(tabs, c.limit ?? 4);
    const firstTabId = tabs[0]?.id || 'all';
    products = catData.productsByCategory[firstTabId] || [];
    permalinkMap = catData.permalinkMap;
  }

  return (
    <PosterProductGrid
      titlePrefix={c.titlePrefix}
      titleHighlight={c.titleHighlight}
      categoryTabs={c.categoryTabs}
      itemsMode={c.itemsMode ?? 'catalog'}
      manualItems={c.manualItems}
      limit={c.limit ?? 4}
      buttonText={c.buttonText ?? 'Add to cart'}
      currencySymbol={c.currencySymbol ?? 'KSh'}
      columnsDesktop={g.columnsDesktop ?? 4}
      columnsTablet={g.columnsTablet ?? 2}
      columnsMobile={g.columnsMobile ?? 1}
      gapDesktop={g.gapDesktop ?? 4}
      gapTablet={g.gapTablet ?? 3}
      gapMobile={g.gapMobile ?? 3}
      borderRadius={g.borderRadius ?? 24}
      aspectRatio={g.aspectRatio ?? '3/4'}
      products={products}
      permalinkMap={permalinkMap}
      margin={a.margin ?? s.margin}
      padding={a.padding ?? s.padding}
    />
  );
});

