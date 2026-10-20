'use client';

/**
 * cms/plugin/gadgets/Header/SearchGadgets.tsx
 *
 * Exelic Gadgets Pill Search Bar with blue border, golden SEARCH button,
 * and live suggestion dropdown.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import Image from 'next/image';

interface ProductSuggestion {
  title: string;
  slug: string;
  image: string | null;
  sellingPrice: number | null;
  regularPrice: number | null;
  categoryInfo: { title: string; slug: string } | null;
  brandInfo: { title: string; slug: string } | null;
  url?: string;
}

interface SuggestionData {
  keywords: string[];
  products: ProductSuggestion[];
  categories: { title: string; slug: string; url?: string }[];
  brands: { title: string; slug: string; url?: string }[];
}

interface SearchGadgetsProps {
  type?: string;
  placeholder?: string;
  currencySymbol?: string;
  className?: string;
}

function highlight(text: string, query: string) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase().trim());
  if (idx === -1) return <span>{text}</span>;
  return (
    <>
      {text.slice(0, idx)}
      <span className="font-bold text-[#0066cc]">{text.slice(idx, idx + query.trim().length)}</span>
      {text.slice(idx + query.trim().length)}
    </>
  );
}

export default function SearchGadgets({
  type = 'product',
  placeholder = 'Search products or ask what you need',
  currencySymbol = '',
  className = '',
}: SearchGadgetsProps) {
  const [query, setQuery] = useState('');
  const [data, setData] = useState<SuggestionData | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchSuggestions = useCallback(
    async (q: string) => {
      if (q.trim().length < 2) {
        setData(null);
        setOpen(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(q)}&type=${type}`);
        if (res.ok) {
          const json: SuggestionData = await res.json();
          const hasResults =
            json.keywords.length || json.products.length || json.categories.length || json.brands.length;
          setData(json);
          setOpen(!!hasResults);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    },
    [type]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(v), 220);
  };

  const toSlug = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

  const go = (q: string) => {
    setOpen(false);
    setQuery(q);
    router.push(`/search/${toSlug(q)}?type=${type}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) go(query.trim());
  };

  const fmt = (price: number | null) => {
    if (price === null || price === undefined) return null;
    return `${currencySymbol}${Number(price).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`.trim();
  };

  const hasData =
    data && (data.keywords.length || data.products.length || data.categories.length || data.brands.length);

  return (
    <div ref={ref} className={`relative w-full ${className}`}>
      <form onSubmit={handleSubmit} className="w-full">
        <div className="flex items-center bg-white rounded-full border-2 border-[#0066cc] overflow-hidden focus-within:shadow-md transition-all h-10 md:h-10.5">
          {/* Search Icon */}
          <div className="pl-3.5 pr-1.5 flex items-center justify-center text-gray-500">
            <Icon icon="solar:magnifer-linear" width={18} height={18} />
          </div>

          {/* Text Input */}
          <input
            type="text"
            value={query}
            onChange={handleChange}
            onFocus={() => {
              if (hasData) setOpen(true);
            }}
            placeholder={placeholder}
            className="w-full outline-none text-xs md:text-sm text-gray-800 placeholder-gray-400 bg-transparent px-2"
            autoComplete="off"
          />

          {/* Loading Indicator */}
          {loading && (
            <Icon icon="svg-spinners:ring-resize" className="w-4 h-4 text-[#0066cc] mr-2 shrink-0" />
          )}

          {/* Clear Button */}
          {query && !loading && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setData(null);
                setOpen(false);
              }}
              className="p-1 mr-1 text-gray-400 hover:text-gray-600 transition cursor-pointer"
            >
              <Icon icon="solar:close-circle-bold" width={16} />
            </button>
          )}

          {/* Golden SEARCH Button */}
          <button
            type="submit"
            className="bg-[#ffb800] hover:bg-[#f0ad00] active:scale-[0.98] text-gray-950 font-bold text-xs uppercase px-5 md:px-7 h-full flex items-center justify-center tracking-wider shrink-0 transition-colors cursor-pointer select-none"
          >
            SEARCH
          </button>
        </div>
      </form>

      {/* ── Live Suggestions Popover ── */}
      {open && hasData && (
        <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] overflow-y-auto">
          {/* Keywords suggestions */}
          {data!.keywords.length > 0 && (
            <div className="px-4 pt-3 pb-2 border-b border-gray-100">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-2">
                Suggestions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {data!.keywords.map((kw, i) => (
                  <button
                    key={i}
                    onClick={() => go(kw)}
                    className="flex items-center gap-1 text-xs bg-gray-50 hover:bg-blue-50 hover:text-[#0066cc] text-gray-700 px-3 py-1.5 rounded-full transition cursor-pointer"
                  >
                    <Icon icon="solar:magnifer-linear" className="w-3 h-3 opacity-60" />
                    {highlight(kw, query)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Categories */}
          {data!.categories.length > 0 && (
            <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/50">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1.5">
                Categories
              </p>
              <div className="flex flex-wrap gap-2">
                {data!.categories.map((cat, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setOpen(false);
                      router.push(cat.url || `/category/${cat.slug}`);
                    }}
                    className="text-xs font-semibold text-[#0066cc] hover:underline"
                  >
                    {cat.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Products */}
          {data!.products.length > 0 && (
            <div className="p-3">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-2 px-1">
                Products
              </p>
              <div className="space-y-1">
                {data!.products.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setOpen(false);
                      router.push(p.url || `/product/${p.slug}`);
                    }}
                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-blue-50/50 transition text-left group cursor-pointer"
                  >
                    <div className="w-10 h-10 shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                      {p.image ? (
                        <Image
                          src={p.image}
                          alt={p.title}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Icon icon="solar:box-linear" width={18} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 group-hover:text-[#0066cc] truncate">
                        {p.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {p.sellingPrice ? (
                          <span className="text-xs font-bold text-gray-900">
                            {fmt(p.sellingPrice)}
                          </span>
                        ) : null}
                        {p.regularPrice && p.sellingPrice && p.regularPrice > p.sellingPrice ? (
                          <span className="text-[11px] text-gray-400 line-through">
                            {fmt(p.regularPrice)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
