"use client";

/**
 * plugin/gadgets/product/Reviews.tsx
 *
 * Customer Ratings & Reviews component matching the Exelic Gadgets design system:
 *  - Overall rating summary & verified rating score.
 *  - Rating distribution progress bars (5★ to 1★).
 *  - Interactive filter tabs (All, 5★, 4★, 3★, 2★, 1★, With Photos).
 *  - Customer review cards with verified buyer tags, reviewer photos, and seller reply bubbles.
 *  - Image lightbox preview modal.
 */

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";

export interface ReviewItem {
    _id: string;
    userName: string;
    userImage?: string;
    rating: number;
    title?: string;
    content: string;
    images?: string[];
    orderNumber?: string;
    verifiedPurchase?: boolean;
    reply?: {
        content: string;
        authorName?: string;
        authorRole?: string;
        createdAt?: string;
    } | null;
    createdAt: string;
}

export interface ReviewsData {
    reviews: ReviewItem[];
    averageRating: number;
    totalReviews: number;
    distribution: Record<number, number>;
}

interface ReviewsProps {
    reviewsData?: ReviewsData | null;
    productTitle: string;
    productId?: string;
}

function formatDate(iso: string) {
    if (!iso) return "";
    try {
        const d = new Date(iso);
        return d.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    } catch {
        return iso;
    }
}

export default function GadgetsReviews({ reviewsData, productTitle }: ReviewsProps) {
    const reviews = reviewsData?.reviews ?? [];
    const averageRating = reviewsData?.averageRating ?? 0;
    const totalReviews = reviewsData?.totalReviews ?? reviews.length;
    const distribution = reviewsData?.distribution ?? { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    const [activeFilter, setActiveFilter] = useState<string>("all");
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Filter reviews
    const filteredReviews = useMemo(() => {
        if (activeFilter === "all") return reviews;
        if (activeFilter === "images") return reviews.filter((r) => r.images && r.images.length > 0);
        const star = parseInt(activeFilter, 10);
        return reviews.filter((r) => r.rating === star);
    }, [reviews, activeFilter]);

    const countWithImages = useMemo(() => {
        return reviews.filter((r) => r.images && r.images.length > 0).length;
    }, [reviews]);

    return (
        <section id="reviews" className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 border border-amber-100 flex items-center justify-center shrink-0 shadow-2xs">
                    <Icon icon="solar:star-bold" width={22} />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                        Customer Ratings & Reviews
                    </h2>
                    <p className="text-xs text-gray-500">
                        Verified feedback from customers who purchased {productTitle}
                    </p>
                </div>
            </div>

            {/* Ratings Overview Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-2xs">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    {/* Left: Overall Score */}
                    <div className="md:col-span-4 text-center md:text-left md:border-r md:border-gray-100 md:pr-6 space-y-2">
                        <div className="flex items-baseline justify-center md:justify-start gap-2">
                            <span className="text-5xl font-black text-gray-900 tracking-tight">
                                {averageRating > 0 ? averageRating.toFixed(1) : "5.0"}
                            </span>
                            <span className="text-base font-bold text-gray-400">/ 5</span>
                        </div>
                        <div className="flex items-center justify-center md:justify-start gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <Icon
                                    key={s}
                                    icon="solar:star-bold"
                                    width={20}
                                    className={
                                        s <= Math.round(averageRating || 5)
                                            ? "text-amber-400"
                                            : "text-gray-200"
                                    }
                                />
                            ))}
                        </div>
                        <p className="text-xs text-gray-500">
                            Based on {totalReviews} verified {totalReviews === 1 ? "review" : "reviews"}
                        </p>
                    </div>

                    {/* Middle: Rating Distribution Bars */}
                    <div className="md:col-span-8 space-y-2">
                        {[5, 4, 3, 2, 1].map((star) => {
                            const count = distribution[star as 1 | 2 | 3 | 4 | 5] || 0;
                            const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
                            return (
                                <div key={star} className="flex items-center gap-3 text-xs">
                                    <div className="flex items-center gap-1 w-12 text-gray-700 font-semibold shrink-0">
                                        <span>{star}</span>
                                        <Icon icon="solar:star-bold" width={13} className="text-amber-400" />
                                    </div>
                                    <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                                        <div
                                            className="h-full bg-amber-400 rounded-full transition-all duration-500"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <span className="w-10 text-right text-gray-400 font-medium shrink-0">
                                        {count}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                <button
                    type="button"
                    onClick={() => setActiveFilter("all")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                        activeFilter === "all"
                            ? "bg-blue-600 text-white shadow-2xs"
                            : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                >
                    All ({totalReviews})
                </button>
                {[5, 4, 3, 2, 1].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => setActiveFilter(String(star))}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                            activeFilter === String(star)
                                ? "bg-blue-600 text-white shadow-2xs"
                                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                        <span>{star}</span>
                        <Icon icon="solar:star-bold" width={13} className={activeFilter === String(star) ? "text-white" : "text-amber-400"} />
                        <span>({distribution[star as 1 | 2 | 3 | 4 | 5] || 0})</span>
                    </button>
                ))}
                {countWithImages > 0 && (
                    <button
                        type="button"
                        onClick={() => setActiveFilter("images")}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                            activeFilter === "images"
                                ? "bg-blue-600 text-white shadow-2xs"
                                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                        <Icon icon="solar:camera-bold" width={14} />
                        <span>With Photos ({countWithImages})</span>
                    </button>
                )}
            </div>

            {/* Reviews List */}
            {filteredReviews.length === 0 ? (
                <div className="py-12 text-center bg-white rounded-2xl border border-gray-200 p-8 space-y-2">
                    <Icon icon="solar:chat-square-like-linear" width={40} className="mx-auto text-gray-300" />
                    <p className="text-sm font-semibold text-gray-700">No reviews found for this filter</p>
                    <p className="text-xs text-gray-400">Be the first to share your experience with this gadget!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredReviews.map((rev) => (
                        <div
                            key={rev._id}
                            className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-2xs space-y-3"
                        >
                            {/* Author Row */}
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-linear-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-2xs">
                                        {rev.userName ? rev.userName.charAt(0) : "C"}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-bold text-gray-900">{rev.userName}</span>
                                            {rev.verifiedPurchase && (
                                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                                                    <Icon icon="solar:check-circle-bold" width={11} />
                                                    Verified Buyer
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <div className="flex items-center">
                                                {[1, 2, 3, 4, 5].map((s) => (
                                                    <Icon
                                                        key={s}
                                                        icon="solar:star-bold"
                                                        width={12}
                                                        className={s <= rev.rating ? "text-amber-400" : "text-gray-200"}
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-[11px] text-gray-400">{formatDate(rev.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Title & Content */}
                            {rev.title && (
                                <h4 className="text-xs font-bold text-gray-900">{rev.title}</h4>
                            )}
                            <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">
                                {rev.content}
                            </p>

                            {/* Attached Images */}
                            {rev.images && rev.images.length > 0 && (
                                <div className="flex items-center gap-2 flex-wrap pt-1">
                                    {rev.images.map((img, iIdx) => (
                                        <button
                                            key={iIdx}
                                            type="button"
                                            onClick={() => setPreviewImage(img)}
                                            className="w-16 h-16 rounded-xl border border-gray-200 overflow-hidden hover:scale-105 transition shadow-2xs cursor-pointer"
                                        >
                                            <img src={img} alt="Review attachment" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Seller / Store Reply */}
                            {rev.reply && (
                                <div className="mt-3 p-3 bg-gray-50 border border-gray-200/80 rounded-xl space-y-1 text-xs">
                                    <div className="flex items-center gap-1.5 font-bold text-gray-800 text-[11px]">
                                        <Icon icon="solar:shop-bold" width={14} className="text-blue-600" />
                                        <span>Response from {rev.reply.authorName || "Seller"}</span>
                                        {rev.reply.createdAt && (
                                            <span className="text-[10px] text-gray-400 font-normal">
                                                • {formatDate(rev.reply.createdAt)}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-gray-600 text-xs leading-normal">{rev.reply.content}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Lightbox Modal */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="relative max-w-2xl max-h-[85vh] bg-transparent" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            onClick={() => setPreviewImage(null)}
                            className="absolute -top-10 right-0 text-white hover:text-gray-300 cursor-pointer"
                        >
                            <Icon icon="solar:close-circle-bold" width={28} />
                        </button>
                        <img
                            src={previewImage}
                            alt="Preview"
                            className="w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
                        />
                    </div>
                </div>
            )}
        </section>
    );
}
