'use client';

/**
 * cms/plugin/gadgets/ui/ProductTabsManager.tsx
 *
 * Builder Control Manager for Pro-Slider product tabs.
 * Allows adding products from catalog, reordering, duplicating, deleting,
 * and customizing promotional badges and hero highlight copy per product tab.
 */

import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import type { ProSliderTabConfig } from '../types';
import ProductPickerModal from './ProductPickerModal';

interface ProductTabsManagerProps {
  value?: ProSliderTabConfig[];
  onChange: (val: ProSliderTabConfig[]) => void;
}

export default function ProductTabsManager({
  value = [],
  onChange,
}: ProductTabsManagerProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const tabs = Array.isArray(value) ? value : [];

  const handleAddProduct = (product: any) => {
    const newTab: ProSliderTabConfig = {
      productId: product._id,
      title: product.title || 'Product',
      thumbnail: product.image || '',
      badge: 'New',
      highlightTitle:
        product.info?.highlight ||
        product.info?.shortDescription ||
        'Flagship Performance',
      subtitle:
        product.info?.subtitle ||
        'Discover cutting-edge technology',
    };

    onChange([...tabs, newTab]);
  };

  const handleUpdateField = (
    idx: number,
    field: keyof ProSliderTabConfig,
    val: string
  ) => {
    const updated = [...tabs];
    updated[idx] = { ...updated[idx], [field]: val };
    onChange(updated);
  };

  const handleRemove = (idx: number) => {
    const updated = [...tabs];
    updated.splice(idx, 1);
    onChange(updated);
  };

  const handleDuplicate = (idx: number) => {
    const updated = [...tabs];
    updated.splice(idx + 1, 0, { ...tabs[idx] });
    onChange(updated);
  };

  const handleMove = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= tabs.length) return;
    const updated = [...tabs];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    onChange(updated);
  };

  return (
    <div className="space-y-4 text-xs font-sans">
      {/* Top action row */}
      <div className="flex items-center justify-between">
        <span className="font-bold text-gray-700 uppercase tracking-wider text-[11px]">
          Configured Tabs ({tabs.length})
        </span>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0053e2] hover:bg-blue-700 text-white font-bold text-[11px] transition shadow-xs cursor-pointer"
        >
          <Icon icon="solar:add-circle-bold" width={14} />
          <span>Select Product</span>
        </button>
      </div>

      {/* Tabs list */}
      {tabs.length === 0 ? (
        <div className="p-5 border-2 border-dashed border-gray-200 rounded-xl text-center bg-gray-50/50">
          <Icon
            icon="solar:devices-bold-duotone"
            width={36}
            className="mx-auto text-gray-300 mb-2"
          />
          <p className="font-semibold text-gray-600">No products configured yet</p>
          <p className="text-[11px] text-gray-400 mt-1 max-w-xs mx-auto">
            Click "Select Product" to search and add products from your store catalog.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tabs.map((tab, idx) => (
            <div
              key={tab.productId ? `${tab.productId}_${idx}` : idx}
              className="p-3 bg-white border border-gray-200 rounded-xl shadow-2xs space-y-2.5 hover:border-blue-200 transition"
            >
              {/* Tab Header with controls */}
              <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-[#0053e2] font-bold text-[10px] flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  {tab.thumbnail && (
                    <div className="w-6 h-6 rounded bg-gray-50 overflow-hidden shrink-0 border border-gray-100">
                      <img src={tab.thumbnail} alt="" className="w-full h-full object-contain" />
                    </div>
                  )}
                  <span className="font-bold text-gray-900 truncate text-xs">
                    {tab.title || `Product ID: ${tab.productId}`}
                  </span>
                </div>

                {/* Actions: Move Up, Move Down, Duplicate, Delete */}
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, idx - 1)}
                    className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 disabled:opacity-30 cursor-pointer"
                    title="Move Up"
                  >
                    <Icon icon="solar:arrow-up-linear" width={13} />
                  </button>
                  <button
                    type="button"
                    disabled={idx === tabs.length - 1}
                    onClick={() => handleMove(idx, idx + 1)}
                    className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 disabled:opacity-30 cursor-pointer"
                    title="Move Down"
                  >
                    <Icon icon="solar:arrow-down-linear" width={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDuplicate(idx)}
                    className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer"
                    title="Duplicate Tab"
                  >
                    <Icon icon="solar:copy-linear" width={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 cursor-pointer"
                    title="Remove Tab"
                  >
                    <Icon icon="solar:trash-bin-trash-linear" width={13} />
                  </button>
                </div>
              </div>

              {/* Per-Tab Config Fields */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500 font-semibold block mb-1">
                    Tab Status Badge
                  </label>
                  <input
                    type="text"
                    value={tab.badge || ''}
                    onChange={(e) => handleUpdateField(idx, 'badge', e.target.value)}
                    placeholder="e.g. New, Coming Soon"
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#0053e2] focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-gray-500 font-semibold block mb-1">
                    Hero Feature Headline
                  </label>
                  <input
                    type="text"
                    value={tab.highlightTitle || ''}
                    onChange={(e) => handleUpdateField(idx, 'highlightTitle', e.target.value)}
                    placeholder="e.g. 10000mAh battery"
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#0053e2] focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-500 font-semibold block mb-1">
                  Subtitle / Tagline
                </label>
                <input
                  type="text"
                  value={tab.subtitle || ''}
                  onChange={(e) => handleUpdateField(idx, 'subtitle', e.target.value)}
                  placeholder="e.g. Titan power, go max"
                  className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#0053e2] focus:bg-white transition"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Catalog Search & Selection Modal */}
      <ProductPickerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={handleAddProduct}
        selectedIds={tabs.map((t) => t.productId).filter(Boolean)}
      />
    </div>
  );
}
