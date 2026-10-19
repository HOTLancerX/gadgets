'use client';

/**
 * cms/plugin/gadgets/ui/HighlightsGrid.tsx
 *
 * "Shop our highlights" - Video & Story Reel Element:
 *  - Vertical portrait cards (9:16 aspect ratio or customizable height)
 *  - Translucent circular glass play button (▶) centered on each card
 *  - Hover scale & smooth micro-interactions
 *  - Clicking play opens an integrated responsive video modal (supports mp4 / youtube / vimeo / links)
 *  - Responsive grid layout computed from columnsMobile, columnsTablet, columnsDesktop and gaps
 *  - Styled title with prefix (dark blue/black) and gradient highlight (e.g. orange #f97316)
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';

export interface HighlightItem {
    id: string;
    image: string;
    title?: string;
    videoUrl?: string;
    link?: string;
}

export interface HighlightsGridProps {
    titlePrefix?: string;
    titleHighlight?: string;
    items?: HighlightItem[];
    columnsDesktop?: number;
    columnsTablet?: number;
    columnsMobile?: number;
    gapDesktop?: number;
    gapTablet?: number;
    gapMobile?: number;
    borderRadius?: number;
    aspectRatio?: string; // e.g. "9/16" or "3/4"
    cardHeightDesktop?: number;
    cardHeightMobile?: number;
    margin?: any;
    padding?: any;
}

export const DEFAULT_HIGHLIGHTS: HighlightItem[] = [
    {
        id: 'hl-1',
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
        title: 'Active Matrix Display',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        link: '',
    },
    {
        id: 'hl-2',
        image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop&q=80',
        title: 'Orange Flagship',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        link: '',
    },
    {
        id: 'hl-3',
        image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80',
        title: 'Super Slim Design',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        link: '',
    },
    {
        id: 'hl-4',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
        title: 'Pure Acoustic Sound',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        link: '',
    },
    {
        id: 'hl-5',
        image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&auto=format&fit=crop&q=80',
        title: 'Ultra Neon Edition',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        link: '',
    },
    {
        id: 'hl-6',
        image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80',
        title: 'Speed & Motion',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        link: '',
    },
];

export default function HighlightsGrid({
    titlePrefix = 'Shop our',
    titleHighlight = 'highlights',
    items = DEFAULT_HIGHLIGHTS,
    columnsDesktop = 6,
    columnsTablet = 3,
    columnsMobile = 2,
    gapDesktop = 3,
    gapTablet = 3,
    gapMobile = 2,
    borderRadius = 22,
    aspectRatio = '9/16',
    cardHeightDesktop,
    cardHeightMobile,
    margin,
    padding,
}: HighlightsGridProps) {
    const [activeVideo, setActiveVideo] = useState<{ url: string; title?: string } | null>(null);

    const safeItems = Array.isArray(items) && items.length > 0 ? items : DEFAULT_HIGHLIGHTS;

    // ── Responsive Grid Formula ──
    const mobColsClass = Number(columnsMobile) || 2;
    const tabColsClass = Number(columnsTablet) || 3;
    const deskColsClass = Number(columnsDesktop) || 6;

    const mobGapClass = `gap-${gapMobile != null ? Number(gapMobile) : 2}`;
    const tabGapClass = `md:gap-${gapTablet != null ? Number(gapTablet) : 3}`;
    const deskGapClass = `lg:gap-${gapDesktop != null ? Number(gapDesktop) : 3}`;

    const gridClass = `grid grid-cols-${mobColsClass} md:grid-cols-${tabColsClass} lg:grid-cols-${deskColsClass} ${mobGapClass} ${tabGapClass} ${deskGapClass} w-full`;

    const handleCardClick = (item: HighlightItem, e: React.MouseEvent) => {
        if (item.videoUrl) {
            e.preventDefault();
            setActiveVideo({ url: item.videoUrl, title: item.title });
        }
    };

    return (
        <section
            className="w-full select-none font-sans py-4 sm:py-6"
            style={{ margin, padding }}
        >
            <div className="w-full space-y-4 sm:space-y-6">
                {/* ── Section Title ── */}
                {(titlePrefix || titleHighlight) && (
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                            {titlePrefix && <span>{titlePrefix}</span>}
                            {titleHighlight && (
                                <span className="text-[#f97316]">
                                    {titleHighlight}
                                </span>
                            )}
                        </h2>
                    </div>
                )}

                {/* ── Highlights Grid ── */}
                <div className={gridClass}>
                    {safeItems.map((item, idx) => {
                        const content = (
                            <div
                                key={item.id || idx}
                                onClick={(e) => handleCardClick(item, e)}
                                className="group relative w-full overflow-hidden cursor-pointer shadow-xs hover:shadow-xl transition-all duration-300"
                                style={{
                                    borderRadius: `${borderRadius}px`,
                                    aspectRatio: cardHeightDesktop ? undefined : (aspectRatio || '9/16'),
                                    height: cardHeightDesktop ? `${cardHeightDesktop}px` : undefined,
                                }}
                            >
                                {/* Card Background Image */}
                                <img
                                    src={item.image}
                                    alt={item.title || `Highlight ${idx + 1}`}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                                    loading="lazy"
                                />

                                {/* Ambient Subtle Gradient Overlay */}
                                <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-black/10 opacity-70 group-hover:opacity-50 transition-opacity" />

                                {/* Optional Badge / Caption at top or bottom if title exists */}
                                {item.title && (
                                    <div className="absolute top-3 left-3 right-3 z-10">
                                        <span className="text-[11px] sm:text-xs font-semibold text-white/90 drop-shadow-md uppercase tracking-wider line-clamp-1">
                                            {item.title}
                                        </span>
                                    </div>
                                )}

                                {/* Centered Translucent Glass Play Button */}
                                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/35 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-115 group-hover:bg-white/45">
                                        <Icon
                                            icon="solar:play-bold"
                                            className="w-4 h-4 sm:w-5 sm:h-5 text-white ml-0.5 drop-shadow"
                                        />
                                    </div>
                                </div>
                            </div>
                        );

                        // If item has link and no video, wrap in Next.js Link
                        if (item.link && !item.videoUrl) {
                            return (
                                <Link key={item.id || idx} href={item.link} className="block w-full">
                                    {content}
                                </Link>
                            );
                        }

                        return content;
                    })}
                </div>
            </div>

            {/* ── Video Modal Popup ── */}
            {activeVideo && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn"
                    onClick={() => setActiveVideo(null)}
                >
                    <div
                        className="relative w-full max-w-lg md:max-w-2xl bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-3 bg-black/60 border-b border-white/10">
                            <span className="text-sm font-semibold text-white truncate pr-2">
                                {activeVideo.title || 'Highlight Story'}
                            </span>
                            <button
                                type="button"
                                onClick={() => setActiveVideo(null)}
                                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                            >
                                <Icon icon="solar:close-circle-bold" className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Video Player */}
                        <div className="relative aspect-9/16 sm:aspect-video w-full bg-black flex items-center justify-center">
                            {activeVideo.url.includes('youtube.com') || activeVideo.url.includes('youtu.be') ? (
                                <iframe
                                    src={activeVideo.url.replace('watch?v=', 'embed/')}
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            ) : (
                                <video
                                    src={activeVideo.url}
                                    controls
                                    autoPlay
                                    playsInline
                                    className="w-full h-full object-contain"
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
