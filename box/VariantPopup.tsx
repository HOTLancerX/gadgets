'use client';

/**
 * plugin/gadgets/box/VariantPopup.tsx
 *
 * Full-screen modal for selecting gadget product variants (e.g. Storage, RAM, Color).
 * Modern tech aesthetics with color swatches, dynamic pricing, and instant cart dispatch.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { Icon } from '@iconify/react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VariantData {
    id: string;
    handle?: string;
    options: Record<string, string>;
    color?: string;
    image?: string;
    price?: string;
    regularPrice?: string;
    quantity?: string;
    sku?: string;
    shippingInside?: string;
    shippingOutside?: string;
}

export interface VariantPopupProps {
    productId: string;
    productSlug: string;
    productTitle: string;
    productImage: string;
    variants: VariantData[];
    selectedAttributes: { label: string; values: string[]; displayStyle?: string }[];
    currencySymbol: string;
    onClose: () => void;
    onAddToCart: (variant: VariantData, qty: number) => void;
    shippingInside?: number;
    shippingOutside?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtPrice(n: number, sym: string): string {
    return `${sym} ${Number(n).toLocaleString('en-US', {
        minimumFractionDigits: n % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
    })}`;
}

function findVariant(variants: VariantData[], selection: Record<string, string>): VariantData | null {
    return variants.find((v) =>
        Object.entries(selection).every(([k, val]) => v.options?.[k] === val)
    ) ?? null;
}

export default function VariantPopup({
    productTitle,
    productImage,
    variants,
    selectedAttributes,
    currencySymbol = 'KSh',
    onClose,
    onAddToCart,
}: VariantPopupProps) {
    const [mounted, setMounted] = useState(false);

    // Initial selection
    const buildInitial = useCallback(() => {
        const sel: Record<string, string> = {};
        for (const attr of selectedAttributes) {
            if (attr.values?.length > 0) sel[attr.label] = attr.values[0];
        }
        return sel;
    }, [selectedAttributes]);

    const [selection, setSelection] = useState<Record<string, string>>(buildInitial);
    const [qty, setQty] = useState(1);
    const [previewImg, setPreviewImg] = useState(productImage);

    useEffect(() => {
        setMounted(true);
    }, []);

    const matched = findVariant(variants, selection);
    const inStock = matched ? parseInt(matched.quantity ?? '99', 10) > 0 : false;
    const price = matched ? parseFloat(matched.price ?? '0') || 0 : 0;
    const maxQty = matched ? parseInt(matched.quantity ?? '9999', 10) || 9999 : 9999;

    useEffect(() => {
        if (matched?.image) setPreviewImg(matched.image);
        else setPreviewImg(productImage);
    }, [matched, productImage]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handler);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handler);
            document.body.style.overflow = '';
        };
    }, [onClose]);

    const pick = (label: string, value: string) => {
        setSelection((prev) => ({ ...prev, [label]: value }));
        const candidate = variants.find(
            (v) => v.options?.[label] === value && v.image
        );
        if (candidate?.image) setPreviewImg(candidate.image);
    };

    const handleAdd = () => {
        if (!matched || !inStock) return;
        onAddToCart(matched, qty);
        onClose();
    };

    if (!mounted) return null;

    const modal = (
        <div
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 select-none"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Select gadget variant"
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

            {/* Modal Box */}
            <div className="relative z-10 bg-white w-full md:max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-4 md:p-5 flex items-start gap-4 border-b border-gray-100">
                    <div className="relative w-20 h-20 md:w-24 md:h-24 bg-gray-50 rounded-2xl overflow-hidden shrink-0 border border-gray-100 flex items-center justify-center p-1">
                        {previewImg ? (
                            <Image
                                src={previewImg}
                                alt={productTitle}
                                width={100}
                                height={100}
                                className="object-contain w-full h-full"
                                unoptimized
                            />
                        ) : (
                            <Icon icon="solar:devices-bold" width={36} className="text-gray-300" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0 pr-6">
                        <h3 className="text-sm md:text-base font-bold text-gray-900 leading-snug line-clamp-2">
                            {productTitle}
                        </h3>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-lg md:text-xl font-extrabold text-gray-950">
                                {price > 0 ? fmtPrice(price, currencySymbol) : 'Select options'}
                            </span>
                        </div>
                        <div className="mt-1">
                            {inStock ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    In Stock
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500">
                                    Out of Stock
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition cursor-pointer"
                        aria-label="Close"
                    >
                        <Icon icon="solar:close-circle-bold" width={20} />
                    </button>
                </div>

                {/* Attributes Picker */}
                <div className="p-4 md:p-5 space-y-4 overflow-y-auto flex-1">
                    {selectedAttributes.map((attr) => (
                        <div key={attr.label} className="space-y-2">
                            <label className="text-xs font-bold text-gray-700 tracking-wide uppercase">
                                {attr.label}: <span className="text-gray-900 font-semibold">{selection[attr.label] || 'None'}</span>
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {attr.values.map((val) => {
                                    const active = selection[attr.label] === val;
                                    return (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => pick(attr.label, val)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border cursor-pointer ${
                                                active
                                                    ? 'bg-gray-950 text-white border-gray-950 shadow-xs scale-102'
                                                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                                            }`}
                                        >
                                            {val}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {/* Quantity */}
                    <div className="pt-2 flex items-center justify-between border-t border-gray-100">
                        <span className="text-xs font-bold text-gray-700 uppercase">Quantity</span>
                        <div className="flex items-center gap-2 border border-gray-200 rounded-xl p-1 bg-gray-50">
                            <button
                                type="button"
                                onClick={() => setQty((q) => Math.max(1, q - 1))}
                                disabled={qty <= 1}
                                className="w-7 h-7 rounded-lg bg-white hover:bg-gray-100 flex items-center justify-center text-gray-700 font-bold disabled:opacity-40 cursor-pointer shadow-2xs"
                            >
                                <Icon icon="solar:minus-bold" width={14} />
                            </button>
                            <span className="w-8 text-center text-xs font-bold text-gray-900">{qty}</span>
                            <button
                                type="button"
                                onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                                disabled={qty >= maxQty}
                                className="w-7 h-7 rounded-lg bg-white hover:bg-gray-100 flex items-center justify-center text-gray-700 font-bold disabled:opacity-40 cursor-pointer shadow-2xs"
                            >
                                <Icon icon="solar:add-bold" width={14} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 md:p-5 border-t border-gray-100 bg-gray-50/50 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-white transition cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleAdd}
                        disabled={!matched || !inStock}
                        className="flex-2 py-3 px-4 rounded-xl bg-gray-950 hover:bg-gray-800 disabled:bg-gray-300 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:cursor-not-allowed"
                    >
                        <Icon icon="solar:cart-large-bold" width={16} />
                        <span>Add to Cart</span>
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modal, document.body);
}
