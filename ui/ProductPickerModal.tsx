'use client';

/**
 * cms/plugin/gadgets/ui/ProductPickerModal.tsx
 *
 * Standalone searchable catalog product picker modal.
 * Live-queries the store database via /api/admin-posts on demand.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';

interface ProductPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (product: {
    _id: string;
    title: string;
    slug: string;
    image: string;
    price?: number | string;
    info?: any;
  }) => void;
  selectedIds?: string[];
}

interface ProductItem {
  _id: string;
  title: string;
  slug: string;
  image: string;
  price?: number | string;
  info: Record<string, string>;
}

const QUICK_SEARCH_SUGGESTIONS = [
  'iPhone 18',
  'iPhone 17',
  'Redmi Note',
  'Vivo',
  'JBL',
  'UGREEN',
];

export default function ProductPickerModal({
  isOpen,
  onClose,
  onSelect,
  selectedIds = [],
}: ProductPickerModalProps) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Reset when opened/closed
  useEffect(() => {
    if (!isOpen) {
      setSearch('');
      setResults([]);
      setLoading(false);
    }
  }, [isOpen]);

  // Live search with debounce
  useEffect(() => {
    if (!isOpen) return;

    const trimmed = search.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/admin-posts?type=product&limit=40&search=${encodeURIComponent(trimmed)}`
        );
        const data = await res.json();
        const posts = data.posts || [];
        const infos = data.infos || [];

        const mapped: ProductItem[] = posts.map((p: any) => {
          const postInfos = infos.filter((i: any) => i.postId === p._id);
          const infoMap: Record<string, string> = {};
          for (const inf of postInfos) {
            infoMap[inf.name] = inf.value;
          }

          let img = infoMap.image || infoMap.thumbnail || '';
          if (!img && infoMap.images) {
            try {
              const arr = JSON.parse(infoMap.images);
              if (Array.isArray(arr) && arr[0]) img = arr[0];
            } catch {}
          }

          // If still no image, check _variate for variant image
          if (!img && infoMap._variate) {
            try {
              const v = JSON.parse(infoMap._variate);
              if (v.variants?.[0]?.image) img = v.variants[0].image;
              else if (Array.isArray(v.variants?.[0]?.images) && v.variants[0].images[0]) {
                img = v.variants[0].images[0];
              }
            } catch {}
          }

          return {
            _id: p._id,
            title: p.title || 'Product',
            slug: p.slug || 'product',
            image: img,
            price: infoMap.price || infoMap.regularPrice || '',
            info: infoMap,
          };
        });

        setResults(mapped);
      } catch (err) {
        console.error('Failed to search products:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-99999 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200 font-sans">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Search Store Products</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Type to find and add products to the Pro-Slider tabs
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 flex items-center justify-center transition cursor-pointer"
          >
            <Icon icon="solar:close-circle-linear" width={18} />
          </button>
        </div>

        {/* Search input + Suggestions */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/60 space-y-2.5">
          <div className="relative">
            <input
              type="text"
              autoFocus
              placeholder="Search by title, model (e.g. iPhone 18, Redmi, Vivo)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-white border border-gray-300 rounded-xl text-xs outline-none focus:border-[#0053e2] focus:ring-2 focus:ring-blue-100 transition"
            />
            <Icon
              icon="solar:magnifer-linear"
              width={16}
              className="absolute left-3 top-2.5 text-gray-400 pointer-events-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <Icon icon="solar:close-circle-bold" width={15} />
              </button>
            )}
          </div>

          {/* Quick Filter Suggestion Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-gray-400 font-semibold mr-0.5">Try:</span>
            {QUICK_SEARCH_SUGGESTIONS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSearch(tag)}
                className="text-[10.5px] px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-600 hover:text-[#0053e2] hover:border-blue-300 transition cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="py-14 flex flex-col items-center justify-center text-gray-400 gap-2">
              <Icon icon="svg-spinners:ring-resize" width={24} className="text-[#0053e2]" />
              <p className="text-xs">Searching store catalog...</p>
            </div>
          ) : !search.trim() ? (
            <div className="py-14 text-center text-gray-400">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0053e2] flex items-center justify-center mx-auto mb-3 shadow-2xs">
                <Icon icon="solar:magnifer-linear" width={22} />
              </div>
              <p className="text-xs font-bold text-gray-800">Type to search products</p>
              <p className="text-[11px] text-gray-400 mt-1 max-w-xs mx-auto">
                Enter a product title, model, or keyword above to find products.
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-14 text-center text-gray-400">
              <Icon icon="solar:box-minimalistic-linear" width={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-xs font-semibold text-gray-700">No products found</p>
              <p className="text-[11px] text-gray-400 mt-1">
                No products match &quot;{search}&quot;. Try another search keyword.
              </p>
            </div>
          ) : (
            results.map((p) => {
              const isAlreadyAdded = selectedIds.includes(p._id);

              return (
                <div
                  key={p._id}
                  onClick={() => {
                    onSelect({
                      _id: p._id,
                      title: p.title,
                      slug: p.slug,
                      image: p.image,
                      price: p.price,
                      info: p.info,
                    });
                    onClose();
                  }}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                    isAlreadyAdded
                      ? 'bg-blue-50/50 border-blue-200 hover:border-blue-400'
                      : 'bg-white border-gray-200 hover:border-[#0053e2] hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center p-0.5 border border-gray-100">
                      {p.image ? (
                        <img src={p.image} alt="" className="w-full h-full object-contain" />
                      ) : (
                        <Icon icon="solar:devices-bold" width={20} className="text-gray-300" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">
                        {p.title}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">
                        /{p.slug}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 ml-3 flex items-center gap-2">
                    {isAlreadyAdded && (
                      <span className="text-[10px] font-semibold text-blue-600 bg-blue-100/70 px-2 py-0.5 rounded-full">
                        Added
                      </span>
                    )}
                    <span className="text-xs font-bold text-[#0053e2] hover:underline">
                      + Select
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex justify-between items-center text-[11px] text-gray-400">
          <span>
            {search.trim()
              ? `${results.length} matching product${results.length === 1 ? '' : 's'} found`
              : 'Search catalog by keyword'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 text-gray-700 font-semibold cursor-pointer"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}
