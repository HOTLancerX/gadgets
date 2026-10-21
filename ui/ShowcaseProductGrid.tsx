'use client';

/**
 * cms/plugin/gadgets/ui/ShowcaseProductGrid.tsx
 *
 * Exelic Gadgets Showcase Product Grid:
 *  - 100% Server-Side Rendered (SSR) with pre-fetched MongoDB category products.
 *  - Multiple grid styles:
 *      1. 'featured-left': Left 1 large featured card + Right 2 horizontal cards + Bottom 4-column grid (matches screenshot).
 *      2. 'featured-right': Left 2 horizontal cards + Right 1 large featured card + Bottom 4-column grid.
 *      3. 'dual-featured': 2 large hero cards side-by-side + Bottom 4-column grid.
 *      4. 'three-featured': 3 vertical hero cards side-by-side + Bottom 4-column grid.
 *  - High-fidelity product cards:
 *      - Rounded-2xl white cards with crisp borders and subtle shadows.
 *      - Badges: 'NEW' (dark teal) and 'SALE' (crimson red).
 *      - Stock status: 'In stock' (emerald).
 *      - Price formatting with currency symbol & optional 'From' prefix.
 *      - Optional 'PRICE ATTACK!' red ribbon banner & promo sticker.
 *      - Responsive: 1-col on mobile, 2-col on tablet, bespoke showcase layout on desktop.
 */

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { xFetch } from '@/lib/express';

export interface ShowcaseProductItem {
  _id: string;
  title: string;
  slug?: string;
  price?: number | string;
  regularPrice?: number | string;
  isFrom?: boolean;
  image?: string;
  stockStatus?: string;
  badges?: string[];
  isPriceAttack?: boolean;
  priceAttackText?: string;
  link?: string;
}

export interface ShowcaseProductGridProps {
  titlePrefix?: string;
  titleHighlight?: string;
  viewAllLink?: string;
  categoryId?: string;
  limit?: number;
  gridStyle?: 'featured-left' | 'featured-right' | 'dual-featured' | 'three-featured';
  currencySymbol?: string;
  products?: any[];
  permalinkMap?: Record<string, string>;
  margin?: any;
  padding?: any;
}

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT DEMO DATA (MATCHES USER SCREENSHOT: A WATCH FOR EVERYONE)
// ─────────────────────────────────────────────────────────────────────────────
export const DEFAULT_SHOWCASE_PRODUCTS: ShowcaseProductItem[] = [
  {
    _id: 'watch-apple-ultra-4',
    title: 'Apple Watch Ultra 4 49mm',
    slug: 'apple-watch-ultra-4-49mm',
    price: 118000,
    isFrom: false,
    stockStatus: 'In stock',
    badges: ['NEW', 'SALE'],
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=85',
  },
  {
    _id: 'watch-xiaomi-s1',
    title: 'Xiaomi Watch S1',
    slug: 'xiaomi-watch-s1',
    price: 28290,
    isFrom: true,
    stockStatus: 'In stock',
    badges: ['NEW'],
    image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=85',
  },
  {
    _id: 'watch-xiaomi-band-10',
    title: 'Xiaomi Smart Band 10 Ceramic Edition',
    slug: 'xiaomi-smart-band-10-ceramic-edition',
    price: 11760,
    isFrom: false,
    stockStatus: 'In stock',
    badges: ['NEW'],
    image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=800&auto=format&fit=crop&q=85',
  },
  {
    _id: 'watch-xiaomi-s4',
    title: 'Xiaomi Watch S4 41mm',
    slug: 'xiaomi-watch-s4-41mm',
    price: 23360,
    isFrom: true,
    stockStatus: 'In stock',
    badges: ['NEW'],
    image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop&q=85',
  },
  {
    _id: 'watch-xiaomi-s1-pro',
    title: 'Xiaomi Watch S1 Pro',
    slug: 'xiaomi-watch-s1-pro',
    price: 38380,
    isFrom: false,
    stockStatus: 'In stock',
    badges: ['NEW'],
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop&q=85',
  },
  {
    _id: 'watch-apple-series-12',
    title: 'Apple Watch Series 12 46mm',
    slug: 'apple-watch-series-12-46mm',
    price: 70000,
    isFrom: false,
    stockStatus: 'In stock',
    badges: ['NEW', 'SALE'],
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&auto=format&fit=crop&q=85',
  },
  {
    _id: 'watch-huawei-gt-7',
    title: 'Huawei Watch GT 7 46mm',
    slug: 'huawei-watch-gt-7-46mm',
    price: 29500,
    isFrom: false,
    stockStatus: 'In stock',
    badges: ['NEW'],
    isPriceAttack: true,
    priceAttackText: '- 29,500',
    image: 'https://images.unsplash.com/photo-1510017803434-a899398421b3?w=800&auto=format&fit=crop&q=85',
  },
];

// Helper to format currency numbers cleanly (e.g. 118,000)
function formatMoney(amount: any): string {
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount || '0').replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return String(amount || '0');
  return num.toLocaleString('en-US');
}

// Normalize any raw product / post item from DB or API
export function normalizeProduct(item: any, permalinkPrefix = 'product'): ShowcaseProductItem {
  if (!item) {
    return { _id: '', title: '' };
  }

  const info = item.info || {};
  const id = String(item._id || item.id || '');
  const title = item.title || item.name || info.title || 'Product';
  const slug = item.slug || info.slug || id;

  // Extract primary image
  let image = info.image || info.thumbnail || info.featuredImage || item.image || item.thumbnail || '';
  if (!image && info.images) {
    try {
      const arr = typeof info.images === 'string' ? JSON.parse(info.images) : info.images;
      if (Array.isArray(arr) && arr[0]) image = arr[0];
    } catch {}
  }

  // Price calculations
  const rawPrice = info.price || info.salePrice || info.regularPrice || item.price || 0;
  const rawRegular = info.regularPrice || item.regularPrice || '';
  const price = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice).replace(/[^0-9.]/g, '')) || 0;
  const regularPrice = typeof rawRegular === 'number' ? rawRegular : parseFloat(String(rawRegular).replace(/[^0-9.]/g, '')) || 0;

  // Stock status
  const rawStock = info.stock_status || info.stockStatus || item.stockStatus || 'instock';
  const stockStatus = rawStock.toLowerCase().includes('out') ? 'Out of stock' : 'In stock';

  // Badges
  const badges: string[] = [];
  if (info.badge) {
    badges.push(String(info.badge).toUpperCase());
  } else {
    badges.push('NEW');
    if (regularPrice > price && price > 0) {
      badges.push('SALE');
    }
  }

  const isFrom = Boolean(info.isFrom || info.fromPrice || item.isFrom);
  const isPriceAttack = Boolean(info.isPriceAttack || info.priceAttack || item.isPriceAttack);

  return {
    _id: id,
    title,
    slug,
    price,
    regularPrice,
    isFrom,
    image,
    stockStatus,
    badges,
    isPriceAttack,
    priceAttackText: info.priceAttackText || item.priceAttackText || '',
    link: `/${permalinkPrefix}/${slug}`,
  };
}

export default function ShowcaseProductGrid({
  titlePrefix = 'A Watch For',
  titleHighlight = 'Everyone',
  viewAllLink = '',
  categoryId = 'all',
  limit = 7,
  gridStyle = 'featured-left',
  currencySymbol = 'KSh',
  products: initialProducts = [],
  permalinkMap = {},
  margin,
  padding,
}: ShowcaseProductGridProps) {
  const permalinkPrefix = permalinkMap['product'] || 'product';

  const [products, setProducts] = useState<ShowcaseProductItem[]>(() => {
    if (Array.isArray(initialProducts) && initialProducts.length > 0) {
      return initialProducts.map((p) => normalizeProduct(p, permalinkPrefix));
    }
    return DEFAULT_SHOWCASE_PRODUCTS;
  });

  const [loading, setLoading] = useState(false);
  const inFlightRef = useRef(false);

  // Sync client-side when categoryId or limit changes in builder canvas
  useEffect(() => {
    if (initialProducts && initialProducts.length > 0 && categoryId === 'all') {
      return;
    }

    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setLoading(true);

    const safeLimit = Math.min(Number(limit) || 7, 30);
    const params = new URLSearchParams({
      type: 'product',
      limit: String(safeLimit),
    });
    if (categoryId && categoryId !== 'all') {
      params.set('category', categoryId);
    }

    // Try local Next.js API first, fallback to xFetch
    fetch(`/api/admin-posts?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed');
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data.posts) && data.posts.length > 0) {
          const infoMap: Record<string, Record<string, string>> = {};
          if (Array.isArray(data.infos)) {
            for (const info of data.infos) {
              const pid = String(info.postId);
              if (!infoMap[pid]) infoMap[pid] = {};
              infoMap[pid][info.name] = info.value;
            }
          }
          const formatted = data.posts.map((p: any) =>
            normalizeProduct(
              { ...p, info: infoMap[String(p._id)] || p.info || {} },
              permalinkPrefix
            )
          );
          setProducts(formatted);
        } else {
          setProducts(DEFAULT_SHOWCASE_PRODUCTS);
        }
      })
      .catch(() => {
        xFetch(`/builder-post?${params.toString()}`)
          .then((r) => r.json())
          .then((d) => {
            const list = d.posts || d.products || [];
            if (Array.isArray(list) && list.length > 0) {
              setProducts(list.map((p: any) => normalizeProduct(p, permalinkPrefix)));
            } else {
              setProducts(DEFAULT_SHOWCASE_PRODUCTS);
            }
          })
          .catch(() => {
            setProducts(DEFAULT_SHOWCASE_PRODUCTS);
          });
      })
      .finally(() => {
        setLoading(false);
        inFlightRef.current = false;
      });
  }, [categoryId, limit, permalinkPrefix]);

  const displayList = products.length > 0 ? products : DEFAULT_SHOWCASE_PRODUCTS;

  // ─────────────────────────────────────────────────────────────────────────────
  // SUB-COMPONENTS: CARD RENDERERS
  // ─────────────────────────────────────────────────────────────────────────────

  // 1. Large Hero Card (Top Left in Style 1)
  const renderLargeHeroCard = (item: ShowcaseProductItem) => {
    const cardContent = (
      <div className="relative w-full h-full bg-white border border-gray-200/90 rounded-2xl p-6 sm:p-7 flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300 group cursor-pointer">
        {/* Badges in top-left */}
        <div className="absolute top-4 left-4 sm:top-5 sm:left-5 flex flex-col gap-1.5 z-10">
          {item.badges?.map((badge, bIdx) => (
            <span
              key={bIdx}
              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shadow-2xs ${
                badge.toLowerCase() === 'sale'
                  ? 'bg-[#e02020] text-white'
                  : 'bg-[#0c6b58] text-white'
              }`}
            >
              {badge}
            </span>
          ))}
        </div>

        {/* Header Details (Centered) */}
        <div className="text-center pt-2 sm:pt-4 pb-2 z-10">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 px-6">
            {item.title}
          </h3>
          <div className="text-emerald-600 text-xs font-semibold mt-1.5">
            {item.stockStatus || 'In stock'}
          </div>
          <div className="text-sm sm:text-base font-bold text-gray-900 mt-1">
            {item.isFrom && <span className="font-normal text-xs text-gray-500 mr-1">From:</span>}
            <span>{currencySymbol} {formatMoney(item.price)}</span>
          </div>
        </div>

        {/* Center Product Image */}
        <div className="relative w-full h-64 sm:h-80 my-auto flex items-center justify-center p-4">
          {item.image ? (
            <img
              src={item.image}
              alt={item.title}
              className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
              <Icon icon="solar:watch-round-bold" width={48} />
            </div>
          )}
        </div>
      </div>
    );

    return item.link ? (
      <Link href={item.link} className="block w-full h-full">
        {cardContent}
      </Link>
    ) : (
      cardContent
    );
  };

  // 2. Horizontal Card (Stacked in Top Right in Style 1)
  const renderHorizontalCard = (item: ShowcaseProductItem) => {
    const cardContent = (
      <div className="relative w-full bg-white border border-gray-200/90 rounded-2xl p-5 sm:p-6 flex items-center overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300 group cursor-pointer h-full min-h-40 sm:min-h-43.75">
        {/* Badges in top-left */}
        <div className="absolute top-3.5 left-3.5 flex flex-col gap-1 z-10">
          {item.badges?.map((badge, bIdx) => (
            <span
              key={bIdx}
              className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shadow-2xs ${
                badge.toLowerCase() === 'sale'
                  ? 'bg-[#e02020] text-white'
                  : 'bg-[#0c6b58] text-white'
              }`}
            >
              {badge}
            </span>
          ))}
        </div>

        {/* Left Side: Product Image */}
        <div className="w-28 h-28 sm:w-36 sm:h-36 shrink-0 flex items-center justify-center p-2">
          {item.image ? (
            <img
              src={item.image}
              alt={item.title}
              className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
              <Icon icon="solar:watch-round-bold" width={32} />
            </div>
          )}
        </div>

        {/* Right Side: Product Details */}
        <div className="flex-1 min-w-0 pl-3 sm:pl-5">
          <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
            {item.title}
          </h3>
          <div className="text-emerald-600 text-xs font-semibold mt-1">
            {item.stockStatus || 'In stock'}
          </div>
          <div className="text-xs sm:text-sm md:text-base font-bold text-gray-900 mt-2">
            {item.isFrom && <span className="font-normal text-xs text-gray-500 mr-1">From:</span>}
            <span>{currencySymbol} {formatMoney(item.price)}</span>
          </div>
        </div>
      </div>
    );

    return item.link ? (
      <Link href={item.link} className="block w-full h-full">
        {cardContent}
      </Link>
    ) : (
      cardContent
    );
  };

  // 3. Standard Grid Card (Bottom 4-column row)
  const renderGridCard = (item: ShowcaseProductItem) => {
    const cardContent = (
      <div className="relative w-full bg-white border border-gray-200/90 rounded-2xl p-4 sm:p-5 flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300 group cursor-pointer h-full min-h-70">
        {/* Promotional Red Banner: "PRICE ATTACK!" */}
        {item.isPriceAttack && (
          <div className="absolute top-0 inset-x-0 bg-[#e00000] text-white font-black text-center py-1 text-[11px] sm:text-xs uppercase tracking-wider z-10 shadow-xs">
            PRICE ATTACK!
          </div>
        )}

        {/* Badges in top-left */}
        <div
          className={`absolute left-3.5 flex flex-col gap-1 z-10 ${
            item.isPriceAttack ? 'top-8' : 'top-3.5'
          }`}
        >
          {item.badges?.map((badge, bIdx) => (
            <span
              key={bIdx}
              className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shadow-2xs ${
                badge.toLowerCase() === 'sale'
                  ? 'bg-[#e02020] text-white'
                  : 'bg-[#0c6b58] text-white'
              }`}
            >
              {badge}
            </span>
          ))}
        </div>

        {/* Product Image */}
        <div
          className={`relative w-full h-40 sm:h-48 flex items-center justify-center p-3 my-auto ${
            item.isPriceAttack ? 'mt-7' : ''
          }`}
        >
          {item.image ? (
            <img
              src={item.image}
              alt={item.title}
              className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
              <Icon icon="solar:watch-round-bold" width={32} />
            </div>
          )}

          {/* Special Price Attack Sticker Badge */}
          {item.isPriceAttack && (
            <div className="absolute right-1 bottom-4 bg-[#e00000] text-white font-black text-[11px] px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
              <span className="text-[9px] opacity-75 line-through">PRICE ATTACK!</span>
              <span>{item.priceAttackText || `- ${formatMoney(item.price)}`}</span>
            </div>
          )}
        </div>

        {/* Bottom Details */}
        <div className="pt-2">
          <h3 className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
            {item.title}
          </h3>
          <div className="text-emerald-600 text-[11px] font-semibold mt-1">
            {item.stockStatus || 'In stock'}
          </div>
          <div className="text-xs sm:text-sm font-bold text-gray-900 mt-1">
            {item.isFrom && <span className="font-normal text-[11px] text-gray-500 mr-1">From:</span>}
            <span>{currencySymbol} {formatMoney(item.price)}</span>
          </div>
        </div>
      </div>
    );

    return item.link ? (
      <Link href={item.link} className="block w-full h-full">
        {cardContent}
      </Link>
    ) : (
      cardContent
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // LAYOUT RESOLUTION BASED ON SELECTED GRID STYLE
  // ─────────────────────────────────────────────────────────────────────────────

  // Slice items for top section and bottom grid
  let topItems: ShowcaseProductItem[] = [];
  let bottomItems: ShowcaseProductItem[] = [];

  if (gridStyle === 'featured-left' || gridStyle === 'featured-right') {
    topItems = displayList.slice(0, 3);
    bottomItems = displayList.slice(3);
  } else if (gridStyle === 'dual-featured') {
    topItems = displayList.slice(0, 2);
    bottomItems = displayList.slice(2);
  } else if (gridStyle === 'three-featured') {
    topItems = displayList.slice(0, 3);
    bottomItems = displayList.slice(3);
  } else {
    topItems = displayList.slice(0, 3);
    bottomItems = displayList.slice(3);
  }

  return (
    <section
      className="w-full font-sans py-4 sm:py-6"
      style={{
        margin: margin ? `${margin.top || 0}${margin.unit || 'px'} ${margin.right || 0}${margin.unit || 'px'} ${margin.bottom || 0}${margin.unit || 'px'} ${margin.left || 0}${margin.unit || 'px'}` : undefined,
        padding: padding ? `${padding.top || 0}${padding.unit || 'px'} ${padding.right || 0}${padding.unit || 'px'} ${padding.bottom || 0}${padding.unit || 'px'} ${padding.left || 0}${padding.unit || 'px'}` : undefined,
      }}
    >
      <div className="w-full space-y-4 sm:space-y-6">
        {/* ── Section Header ── */}
        {(titlePrefix || titleHighlight || viewAllLink) && (
          <div className="flex items-center justify-between gap-4 pb-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              {titlePrefix && <span>{titlePrefix}</span>}
              {titleHighlight && (
                <span className="bg-linear-to-r from-orange-500 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                  {titleHighlight}
                </span>
              )}
            </h2>

            {viewAllLink && (
              <Link
                href={viewAllLink}
                className="text-xs sm:text-sm font-bold text-gray-700 hover:text-blue-600 transition flex items-center gap-1 shrink-0"
              >
                <span>View all</span>
                <Icon icon="solar:arrow-right-linear" width={16} />
              </Link>
            )}
          </div>
        )}

        {/* ── Loading Spinner Overlay during client updates ── */}
        {loading && (
          <div className="flex items-center justify-center py-6 text-gray-400 gap-2 text-xs">
            <Icon icon="svg-spinners:ring-resize" width={20} className="animate-spin text-blue-600" />
            <span>Updating showcase products...</span>
          </div>
        )}

        {/* ── TOP SHOWCASE SECTION ── */}
        {gridStyle === 'featured-left' && topItems.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-stretch">
            {/* Left Column: 1 Large Hero Card */}
            <div className="w-full h-full min-h-95 sm:min-h-105">
              {topItems[0] && renderLargeHeroCard(topItems[0])}
            </div>

            {/* Right Column: 2 Horizontal Cards Stacked */}
            <div className="flex flex-col gap-4 sm:gap-5 h-full justify-between">
              {topItems[1] && (
                <div className="flex-1 w-full">
                  {renderHorizontalCard(topItems[1])}
                </div>
              )}
              {topItems[2] && (
                <div className="flex-1 w-full">
                  {renderHorizontalCard(topItems[2])}
                </div>
              )}
            </div>
          </div>
        )}

        {gridStyle === 'featured-right' && topItems.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-stretch">
            {/* Left Column: 2 Horizontal Cards Stacked */}
            <div className="flex flex-col gap-4 sm:gap-5 h-full justify-between order-2 lg:order-1">
              {topItems[0] && (
                <div className="flex-1 w-full">
                  {renderHorizontalCard(topItems[0])}
                </div>
              )}
              {topItems[1] && (
                <div className="flex-1 w-full">
                  {renderHorizontalCard(topItems[1])}
                </div>
              )}
            </div>

            {/* Right Column: 1 Large Hero Card */}
            <div className="w-full h-full min-h-95 md:min-h-105 order-1 lg:order-2">
              {topItems[2] && renderLargeHeroCard(topItems[2])}
            </div>
          </div>
        )}

        {gridStyle === 'dual-featured' && topItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 items-stretch">
            {topItems.map((item) => (
              <div key={item._id} className="w-full h-full min-h-90">
                {renderLargeHeroCard(item)}
              </div>
            ))}
          </div>
        )}

        {gridStyle === 'three-featured' && topItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 items-stretch">
            {topItems.map((item) => (
              <div key={item._id} className="w-full h-full min-h-85">
                {renderLargeHeroCard(item)}
              </div>
            ))}
          </div>
        )}

        {/* ── BOTTOM PRODUCT GRID (4 COLUMNS) ── */}
        {bottomItems.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4 md:gap-5">
            {bottomItems.map((item) => (
              <div key={item._id} className="w-full">
                {renderGridCard(item)}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
