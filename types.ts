/**
 * cms/plugin/gadgets/types.ts
 *
 * Shared TypeScript types for Gadgets Pro-Slider and related components.
 */

export interface ProSliderVariant {
  name: string;
  color?: string;
  image?: string;
  price?: number;
  sku?: string;
}

export interface ProSliderProductData {
  productId: string;
  title: string;
  slug: string;
  postUrl: string;
  thumbnail: string;
  mainImage: string;
  badge?: string; // e.g. "New", "Coming Soon"
  highlightTitle?: string; // e.g. "10000mAh battery"
  subtitle?: string; // e.g. "Titan power, go max"
  price?: number | string;
  regularPrice?: number | string;
  stockStatus?: string; // e.g. "In stock", "Pre-order"
  variants: ProSliderVariant[];
}

export interface ProSliderTabConfig {
  productId: string;
  title?: string;
  thumbnail?: string;
  badge?: string;
  highlightTitle?: string;
  subtitle?: string;
}
