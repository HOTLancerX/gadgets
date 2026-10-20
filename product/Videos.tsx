"use client";

/**
 * plugin/gadgets/product/Videos.tsx
 *
 * Gadgets Product Videos Showcase Component:
 *  - Grid-4 on desktop/tablet, Grid-2 on mobile.
 *  - High-res YouTube thumbnail with play overlay.
 *  - Title rendered underneath each card.
 *  - Interactive video popup modal with responsive iframe player.
 */

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";

export interface VideoItem {
    title: string;
    videoid: string;
}

interface GadgetsVideosProps {
    videos?: VideoItem[];
    productTitle?: string;
}

export default function GadgetsVideos({ videos = [], productTitle }: GadgetsVideosProps) {
    const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);

    // Close modal on Escape key press
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setActiveVideo(null);
            }
        };
        if (activeVideo) {
            window.addEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "hidden";
        }
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
    }, [activeVideo]);

    if (!videos || videos.length === 0) {
        return null;
    }

    return (
        <section
            id="product-videos"
            className="bg-white rounded-3xl border border-gray-200/80 p-5 md:p-8 shadow-xs space-y-6"
        >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shadow-2xs">
                        <Icon icon="logos:youtube-icon" width={22} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">
                                Product Videos & Reviews
                            </h2>
                            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[11px] font-bold">
                                {videos.length} {videos.length === 1 ? "Video" : "Videos"}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                            Watch in-depth unboxings, hands-on tests, and reviews for {productTitle || "this product"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Video Grid: 4 columns on desktop/tablet, 2 columns on mobile */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 md:gap-4">
                {videos.map((vid, idx) => {
                    const thumbUrl = `https://img.youtube.com/vi/${vid.videoid}/hqdefault.jpg`;

                    return (
                        <div
                            key={vid.videoid || idx}
                            onClick={() => setActiveVideo(vid)}
                            className="group flex flex-col cursor-pointer transition-all duration-200"
                        >
                            {/* Thumbnail Container */}
                            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-gray-900 border border-gray-200/80 group-hover:border-red-400 group-hover:shadow-md transition-all shadow-2xs">
                                <img
                                    src={thumbUrl}
                                    alt={vid.title}
                                    loading="lazy"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    onError={(e) => {
                                        // Fallback to medium quality if high quality is unavailable
                                        const target = e.target as HTMLImageElement;
                                        if (target.src !== `https://img.youtube.com/vi/${vid.videoid}/mqdefault.jpg`) {
                                            target.src = `https://img.youtube.com/vi/${vid.videoid}/mqdefault.jpg`;
                                        }
                                    }}
                                />

                                {/* Dark Gradient Overlay */}
                                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                                {/* Centered Play Button */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-red-600/90 hover:bg-red-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                        <Icon icon="solar:play-bold" width={18} className="ml-0.5" />
                                    </div>
                                </div>

                                {/* Video Index Pill */}
                                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-[10px] font-bold text-white flex items-center gap-1">
                                    <Icon icon="solar:videocamera-record-bold" width={10} className="text-red-400" />
                                    <span>Video {idx + 1}</span>
                                </div>
                            </div>

                            {/* Title Underneath Thumbnail */}
                            <div className="pt-2 px-0.5">
                                <p
                                    className="text-xs md:text-sm font-bold text-gray-800 line-clamp-2 leading-snug group-hover:text-red-600 transition-colors"
                                    title={vid.title}
                                >
                                    {vid.title || `Product Video ${idx + 1}`}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Interactive Video Popup Modal */}
            {activeVideo && (
                <div
                    className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 animate-fade-in"
                    onClick={() => setActiveVideo(null)}
                >
                    <div
                        className="relative w-full max-w-3xl bg-neutral-950 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl border border-neutral-800 flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-3.5 md:p-4 bg-neutral-900 border-b border-neutral-800 gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-7 h-7 rounded-xl bg-red-600/20 text-red-500 flex items-center justify-center shrink-0">
                                    <Icon icon="logos:youtube-icon" width={16} />
                                </div>
                                <h3 className="text-xs md:text-sm font-bold text-neutral-100 truncate">
                                    {activeVideo.title}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setActiveVideo(null)}
                                className="p-1.5 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition cursor-pointer shrink-0"
                                title="Close Video (Esc)"
                            >
                                <Icon icon="solar:close-circle-bold" width={20} />
                            </button>
                        </div>

                        {/* Video Player */}
                        <div className="aspect-video w-full bg-black">
                            <iframe
                                src={`https://www.youtube.com/embed/${activeVideo.videoid}?autoplay=1&rel=0`}
                                title={activeVideo.title}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="w-full h-full border-0"
                            />
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
