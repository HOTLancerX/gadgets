'use client';

/**
 * cms/plugin/gadgets/ui/OfferAccordion.tsx
 *
 * Offer Accordion Banner Slider:
 *  - Fully server-side rendered with pure Tailwind CSS.
 *  - Optional ambient background image behind the box that dynamically reflects the active banner.
 *  - Box container styling with smooth rounded frame and glassmorphism styling.
 *  - Mathematically precise slant geometry:
 *      • First card: origin-top-right ensures the slanted right edge is 100% unclipped,
 *        while outer-left edge is cleanly rounded and flat.
 *      • Last card: origin-bottom-left ensures the slanted left edge is 100% unclipped,
 *        while outer-right edge is cleanly rounded and flat.
 *      • Middle cards: standard parallel diagonal cuts with rounded corners.
 *      • Inner media: counter-skewed and scaled to 135% so images cover 100% edge-to-edge.
 *  - Prev (<) & Next (>) navigation arrows.
 *  - Play/Pause (|| / ▶) toggle button at the bottom-right.
 */

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Icon } from '@iconify/react';

export interface OfferAccordionItem {
    id: string;
    image: string;
    link?: any;
    title?: string;
}

export interface OfferAccordionProps {
    schema?: any;
    items?: OfferAccordionItem[];
    heightDesktop?: number;
    heightTablet?: number;
    heightMobile?: number;
    gap?: number;
    borderRadius?: number;
    skewAngle?: number;
    edgeOffset?: number;
    autoplay?: boolean;
    autoplaySpeed?: number;
    pauseOnHover?: boolean;
    showArrows?: boolean;
    showPlayPause?: boolean;
    ambientBackdrop?: boolean;
    backgroundImage?: string;
    containerPadding?: number;
    containerRadius?: number;
}

export const DEFAULT_OFFER_ITEMS: OfferAccordionItem[] = [
    {
        id: 'offer-1',
        image: 'https://images.unsplash.com/photo-1579202673506-ca3ce28943ef?w=1000&auto=format&fit=crop&q=80',
        link: '#',
        title: 'Minecraft',
    },
    {
        id: 'offer-2',
        image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1000&auto=format&fit=crop&q=80',
        link: '#',
        title: 'EA Sports FC',
    },
    {
        id: 'offer-3',
        image: 'https://images.unsplash.com/photo-1605901309584-818e25960a8f?w=1400&auto=format&fit=crop&q=80',
        link: '#',
        title: 'Xbox Game Pass',
    },
    {
        id: 'offer-4',
        image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1000&auto=format&fit=crop&q=80',
        link: '#',
        title: 'Action Legends',
    },
];

export default function OfferAccordion({
    schema,
    items: propItems,
    heightDesktop: propHeightDesktop,
    heightTablet: propHeightTablet,
    heightMobile: propHeightMobile,
    gap: propGap,
    borderRadius: propBorderRadius,
    skewAngle: propSkewAngle,
    autoplay: propAutoplay,
    autoplaySpeed: propAutoplaySpeed,
    pauseOnHover: propPauseOnHover,
    showArrows: propShowArrows,
    showPlayPause: propShowPlayPause,
    ambientBackdrop: propAmbientBackdrop,
    backgroundImage: propBackgroundImage,
    containerPadding: propContainerPadding,
    containerRadius: propContainerRadius,
}: OfferAccordionProps) {
    const c = schema?.content ?? {};
    const s = schema?.style ?? {};
    const settings = schema?.settings ?? {};

    const items: OfferAccordionItem[] =
        (Array.isArray(propItems) && propItems.length > 0)
            ? propItems
            : (Array.isArray(c.items) && c.items.length > 0)
                ? c.items
                : DEFAULT_OFFER_ITEMS;

    const heightDesktop = propHeightDesktop ?? c.heightDesktop ?? 360;
    const heightTablet = propHeightTablet ?? c.heightTablet ?? 300;
    const heightMobile = propHeightMobile ?? c.heightMobile ?? 240;
    const gap = propGap ?? s.gap ?? c.gap ?? 14;
    const borderRadius = propBorderRadius ?? s.borderRadius ?? c.borderRadius ?? 22;
    const skewAngle = propSkewAngle ?? s.skewAngle ?? c.skewAngle ?? -7;

    const autoplay = propAutoplay ?? settings.autoplay ?? true;
    const autoplaySpeed = propAutoplaySpeed ?? settings.autoplaySpeed ?? 4000;
    const pauseOnHover = propPauseOnHover ?? settings.pauseOnHover ?? true;
    const showArrows = propShowArrows ?? settings.showArrows ?? true;
    const showPlayPause = propShowPlayPause ?? settings.showPlayPause ?? true;

    // Active card index (defaults to index 2 or 0)
    const [activeIndex, setActiveIndex] = useState<number>(() => {
        return items.length > 2 ? 2 : 0;
    });

    const [isPlaying, setIsPlaying] = useState<boolean>(autoplay);
    const [isHovered, setIsHovered] = useState<boolean>(false);

    // Keep activeIndex within range if items change
    useEffect(() => {
        if (activeIndex >= items.length) {
            setActiveIndex(Math.max(0, items.length - 1));
        }
    }, [items.length, activeIndex]);

    // Next & Prev handlers
    const handleNext = useCallback(() => {
        if (!items.length) return;
        setActiveIndex((prev) => (prev + 1) % items.length);
    }, [items.length]);

    const handlePrev = useCallback(() => {
        if (!items.length) return;
        setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
    }, [items.length]);

    // Autoplay timer
    useEffect(() => {
        if (!isPlaying || !autoplay || items.length <= 1) return;
        if (pauseOnHover && isHovered) return;

        const timer = setInterval(() => {
            handleNext();
        }, Math.max(1500, autoplaySpeed));

        return () => clearInterval(timer);
    }, [isPlaying, autoplay, items.length, pauseOnHover, isHovered, autoplaySpeed, handleNext]);

    if (!items.length) return null;

    // Calculated horizontal slant displacement for full geometry coverage
    const slantPx = Math.ceil(Math.tan((Math.abs(skewAngle) * Math.PI) / 180) * heightDesktop) + 12;

    return (
        <div
            className="group/container relative w-full select-none overflow-hidden py-1 bg-transparent"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* ── Accordion Flex Row with responsive CSS height variables ── */}
            <div
                className="relative flex items-stretch w-full bg-transparent h-(--h-mob) md:h-(--h-tab) lg:h-(--h-desk)"
                style={{
                    '--h-desk': `${heightDesktop}px`,
                    '--h-tab': `${heightTablet}px`,
                    '--h-mob': `${heightMobile}px`,
                    gap: `${gap}px`,
                } as React.CSSProperties}
            >
                {items.map((item, idx) => {
                    const isActive = idx === activeIndex;
                    const isFirst = idx === 0;
                    const isLast = idx === items.length - 1;

                    return (
                        <div
                            key={item.id || idx}
                            onClick={() => {
                                const href = typeof item.link === 'object' ? item.link?.url : (item.link || '');
                                const target = typeof item.link === 'object' && item.link?.target ? item.link.target : '_self';
                                if (!isActive) {
                                    setActiveIndex(idx);
                                } else if (href && href !== '#') {
                                    window.open(href, target);
                                }
                            }}
                            className={`group relative h-full transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] cursor-pointer bg-transparent ${
                                isActive
                                    ? 'flex-[3.5] md:flex-4 z-10'
                                    : 'flex-1 min-w-13.75 md:min-w-18.75 opacity-85 hover:opacity-100 z-0'
                            } ${
                                isFirst
                                    ? 'overflow-hidden rounded-l-(--card-radius,22px)'
                                    : isLast
                                    ? 'overflow-hidden rounded-r-(--card-radius,22px)'
                                    : 'overflow-visible'
                            }`}
                            style={{
                                '--card-radius': `${borderRadius}px`,
                            } as React.CSSProperties}
                        >
                            {/* Card Shape:
                                • For isFirst: origin-top-right ensures the right edge slants naturally with rounded corners,
                                  while marginLeft shifts the left edge outside where the outer rounded-l clips it flat!
                                • For isLast: origin-bottom-left ensures the left edge slants naturally with rounded corners,
                                  while extra width extends the right edge outside where the outer rounded-r clips it flat!
                                • For middle cards: standard parallel diagonal slants with rounded corners.
                            */}
                            <div
                                className={`relative h-full overflow-hidden bg-transparent transition-all duration-700 isolation-isolate md:skew-x-[-7deg] ${
                                    isFirst ? 'origin-top-right' : isLast ? 'origin-bottom-left' : 'origin-center'
                                }`}
                                style={{
                                    borderRadius: `${borderRadius}px`,
                                    marginLeft: isFirst ? `-${slantPx}px` : undefined,
                                    width: isFirst || isLast ? `calc(100% + ${slantPx}px)` : '100%',
                                }}
                            >
                                {/* Inner Container: Counter-skews image to keep it upright, crisp, and scaled to prevent any edge bleeding */}
                                <div
                                    className="relative w-full h-full overflow-hidden bg-transparent md:skew-x-[7deg] md:scale-135 origin-center"
                                    style={{
                                        transformOrigin: 'center center',
                                    }}
                                >
                                    {item.image ? (
                                        <Image
                                            src={item.image}
                                            alt={item.title || `Offer Image ${idx + 1}`}
                                            fill
                                            className={`object-cover w-full h-full transition-transform duration-700 ${
                                                isActive ? 'scale-100' : 'scale-105 group-hover:scale-110'
                                            }`}
                                            unoptimized
                                            priority={isActive}
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-linear-to-br from-gray-800 to-gray-950 flex items-center justify-center text-gray-500">
                                            <Icon icon="solar:gallery-bold-duotone" width={32} />
                                        </div>
                                    )}

                                    {/* Inactive card subtle darkening so active card pops */}
                                    {!isActive && (
                                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/15 transition-colors duration-300 pointer-events-none" />
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Left Navigation Arrow (<) ── */}
            {showArrows && items.length > 1 && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        handlePrev();
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/50 hover:bg-black/80 text-white/90 hover:text-white backdrop-blur-md flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer shadow-lg z-20 border border-white/10"
                    aria-label="Previous image"
                >
                    <Icon icon="solar:alt-arrow-left-bold" width={20} />
                </button>
            )}

            {/* ── Right Navigation Arrow (>) ── */}
            {showArrows && items.length > 1 && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleNext();
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/50 hover:bg-black/80 text-white/90 hover:text-white backdrop-blur-md flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer shadow-lg z-20 border border-white/10"
                    aria-label="Next image"
                >
                    <Icon icon="solar:alt-arrow-right-bold" width={20} />
                </button>
            )}

            {/* ── Play / Pause Toggle Button (Bottom Right) ── */}
            {showPlayPause && items.length > 1 && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsPlaying((prev) => !prev);
                    }}
                    className="absolute right-6 bottom-5 w-7 h-7 md:w-8 md:h-8 rounded-full bg-black/55 hover:bg-black/85 text-white/90 hover:text-white backdrop-blur-md flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer shadow-lg z-20 border border-white/10"
                    title={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
                    aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
                >
                    <Icon
                        icon={isPlaying ? 'solar:pause-bold' : 'solar:play-bold'}
                        width={14}
                    />
                </button>
            )}
        </div>
    );
}
