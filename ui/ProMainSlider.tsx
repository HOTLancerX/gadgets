'use client';

/**
 * cms/plugin/gadgets/ui/ProMainSlider.tsx
 *
 * Exelic Gadgets Pro Main Slider (Hero Peek Carousel):
 *  1. 100% Server-Side Rendered (SSR): Emits static CSS variables & translateX formulas
 *     directly in server HTML so active center slide & side peek slides render instantly
 *     without client layout shifts or blank flashes.
 *  2. Configurable Desktop Center Slide Width: Explicit width control (e.g. 1050px or %),
 *     with side slides peeking in proportionally on the left and right.
 *  3. Mobile Responsive: 100% full-width normal slider on mobile devices with touch swipe.
 *  4. Anchored Navigation Arrows: Semi-transparent frosted glass (< and >) buttons anchored
 *     to the center slide's vertical midpoint and positioned slightly outside at the seams.
 *  5. Play / Pause Button: Anchored at the bottom-right corner of the center slide.
 *  6. Visual Polish: Matches EA Sports FC 27 screenshot with rounded corners, side dimming,
 *     and glassmorphism buttons.
 */

import React, { useState, useEffect, useCallback, useRef, useMemo, useId } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';

export interface ProMainSlideItem {
  id: string;
  image: string;
  mobileImage?: string;
  link?: string;
  title?: string;
  badge?: string;
  target?: '_self' | '_blank';
}

export interface ProMainSliderProps {
  schema?: any;
  slides?: ProMainSlideItem[];
  centerWidthDesktop?: number; // e.g. 1050 (px)
  centerWidthUnit?: 'px' | '%';
  heightDesktop?: number;      // e.g. 460 (px)
  heightTablet?: number;       // e.g. 360 (px)
  heightMobile?: number;       // e.g. 230 (px)
  gap?: number;                // e.g. 20 (px)
  borderRadius?: number;       // e.g. 24 (px)
  sideOpacity?: number;        // e.g. 0.45
  autoplay?: boolean;
  autoplayInterval?: number;   // e.g. 4500 (ms)
  pauseOnHover?: boolean;
  showArrows?: boolean;
  showPlayPause?: boolean;
  showPagination?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT DEMO SLIDES (MATCHING USER SCREENSHOT: EA FC 27, MINECRAFT, CONTROL)
// ─────────────────────────────────────────────────────────────────────────────
export const DEFAULT_PRO_MAIN_SLIDES: ProMainSlideItem[] = [
  {
    id: 'slide-eafc27',
    image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1600&auto=format&fit=crop&q=85',
    link: '/category/gaming',
    title: 'EA SPORTS FC 27 - Official Release',
    badge: 'New Release',
  },
  {
    id: 'slide-minecraft',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600&auto=format&fit=crop&q=85',
    link: '/category/gaming',
    title: 'Minecraft Dungeons II - Legendary Adventures',
    badge: 'Popular',
  },
  {
    id: 'slide-control',
    image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1600&auto=format&fit=crop&q=85',
    link: '/category/gaming',
    title: 'Control Resonant - Ultimate Edition',
    badge: 'Exclusive',
  },
  {
    id: 'slide-cyberpunk',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1600&auto=format&fit=crop&q=85',
    link: '/category/gaming',
    title: 'Cyberpunk 2077 - Next-Gen Bundle',
    badge: 'Top Rated',
  },
];

function getDimensionsStyles(dim: any, type: 'margin' | 'padding') {
  if (!dim) return {};
  return {
    [`${type}Top`]: `${dim.top ?? 0}${dim.unit || 'px'}`,
    [`${type}Right`]: `${dim.right ?? 0}${dim.unit || 'px'}`,
    [`${type}Bottom`]: `${dim.bottom ?? 0}${dim.unit || 'px'}`,
    [`${type}Left`]: `${dim.left ?? 0}${dim.unit || 'px'}`,
  };
}

export default function ProMainSlider({
  schema,
  slides: propSlides,
  centerWidthDesktop: propCenterWidth,
  centerWidthUnit: propCenterUnit,
  heightDesktop: propHeightDesktop,
  heightTablet: propHeightTablet,
  heightMobile: propHeightMobile,
  gap: propGap,
  borderRadius: propRadius,
  sideOpacity: propSideOpacity,
  autoplay: propAutoplay,
  autoplayInterval: propInterval,
  pauseOnHover: propPauseOnHover,
  showArrows: propShowArrows,
  showPlayPause: propShowPlayPause,
  showPagination: propShowPagination,
}: ProMainSliderProps) {
  const rawId = useId();
  const scopeClass = `pro-slider-${rawId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

  const c = schema?.content || {};
  const s = schema?.style || {};
  const a = schema?.advanced || {};

  const rawSlides = propSlides || c.slides;
  const baseSlides: ProMainSlideItem[] =
    Array.isArray(rawSlides) && rawSlides.length > 0 ? rawSlides : DEFAULT_PRO_MAIN_SLIDES;

  // Settings
  const centerWidthDesktop = Number(propCenterWidth ?? s.centerWidthDesktop ?? 1050) || 1050;
  const centerWidthUnit = (propCenterUnit ?? s.centerWidthUnit ?? 'px') as 'px' | '%';

  const heightDesktop = Number(propHeightDesktop ?? s.heightDesktop ?? 460) || 460;
  const heightTablet = Number(propHeightTablet ?? s.heightTablet ?? 360) || 360;
  const heightMobile = Number(propHeightMobile ?? s.heightMobile ?? 230) || 230;

  const gap = Math.max(0, Number(propGap ?? s.gap ?? 20) || 20);
  const borderRadius = Math.max(0, Number(propRadius ?? s.borderRadius ?? 24) || 24);
  const sideOpacity = Number(propSideOpacity ?? s.sideOpacity ?? 0.45) || 0.45;

  const autoplayConfig = (propAutoplay ?? s.autoplay) !== false;
  const autoplayInterval = Number(propInterval ?? s.autoplayInterval ?? 4500) || 4500;
  const pauseOnHover = (propPauseOnHover ?? s.pauseOnHover) !== false;

  const showArrows = (propShowArrows ?? s.showArrows) !== false;
  const showPlayPause = (propShowPlayPause ?? s.showPlayPause) !== false;
  const showPagination = Boolean(propShowPagination ?? s.showPagination ?? false);

  // Extended slides array for smooth infinite wrap: [set0, set1, set2]
  const N = baseSlides.length;
  const extendedSlides = useMemo(() => {
    if (N <= 1) return baseSlides;
    return [...baseSlides, ...baseSlides, ...baseSlides];
  }, [baseSlides, N]);

  // Initial active index is in the middle set (N) so left and right peeks are instantly present in SSR
  const [currentIndex, setCurrentIndex] = useState(N > 1 ? N : 0);
  const [isPlaying, setIsPlaying] = useState(autoplayConfig);
  const [isHovered, setIsHovered] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(true);

  const touchStartXRef = useRef<number | null>(null);
  const autoplayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Active original slide index (0..N-1)
  const activeOriginalIndex = N > 0 ? currentIndex % N : 0;

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (N <= 1) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
  }, [N]);

  const handlePrev = useCallback(() => {
    if (N <= 1) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev - 1);
  }, [N]);

  // Loop boundary resets silently without animation jump
  const handleTransitionEnd = () => {
    if (N <= 1) return;
    if (currentIndex >= 2 * N) {
      setIsTransitioning(false);
      setCurrentIndex((prev) => prev - N);
    } else if (currentIndex < N) {
      setIsTransitioning(false);
      setCurrentIndex((prev) => prev + N);
    }
  };

  // Autoplay loop
  useEffect(() => {
    if (!isPlaying || N <= 1) return;
    if (pauseOnHover && isHovered) return;

    autoplayTimerRef.current = setInterval(() => {
      handleNext();
    }, autoplayInterval);

    return () => {
      if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
    };
  }, [isPlaying, N, pauseOnHover, isHovered, autoplayInterval, handleNext]);

  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying((prev) => !prev);
  };

  // Mobile swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const diff = touchStartXRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
    touchStartXRef.current = null;
  };

  const marginStyles = getDimensionsStyles(a.margin, 'margin');
  const paddingStyles = getDimensionsStyles(a.padding, 'padding');

  // Desktop width CSS representation
  const desktopWidthCss =
    centerWidthUnit === '%'
      ? `${centerWidthDesktop}%`
      : `min(${centerWidthDesktop}px, calc(100vw - 80px))`;

  const tabletWidthCss = 'min(86%, 760px)';
  const tabletGap = Math.round(gap * 0.75);

  return (
    <div
      className={`pro-main-slider-root ${scopeClass} relative w-full overflow-hidden select-none`}
      style={{
        ...marginStyles,
        ...paddingStyles,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── 100% Server-Side Rendered Scoped CSS Variables ── */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .${scopeClass} {
              --pms-h: ${heightMobile}px;
              --pms-w: 100%;
              --pms-gap: 0px;
            }
            @media (min-width: 768px) {
              .${scopeClass} {
                --pms-h: ${heightTablet}px;
                --pms-w: ${tabletWidthCss};
                --pms-gap: ${tabletGap}px;
              }
            }
            @media (min-width: 1024px) {
              .${scopeClass} {
                --pms-h: ${heightDesktop}px;
                --pms-w: ${desktopWidthCss};
                --pms-gap: ${gap}px;
              }
            }
            .${scopeClass} .pms-stage {
              height: var(--pms-h);
            }
            .${scopeClass} .pms-slide {
              width: var(--pms-w);
              margin-right: var(--pms-gap);
            }
          `,
        }}
      />

      {/* ── Slider Stage ── */}
      <div className="relative w-full overflow-hidden pms-stage">
        {/* Track with SSR-Friendly TranslateX Centering Formula */}
        <div
          className={`flex h-full items-center ${
            isTransitioning ? 'transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]' : ''
          }`}
          onTransitionEnd={handleTransitionEnd}
          style={{
            transform: `translateX(calc(50% - (var(--pms-w) / 2) - (${currentIndex} * (var(--pms-w) + var(--pms-gap)))))`,
          }}
        >
          {extendedSlides.map((slide, idx) => {
            const isActive = idx === currentIndex;
            const slideLink = slide.link && slide.link !== '#' ? slide.link : null;

            const slideCard = (
              <div
                className={`relative w-full h-full overflow-hidden transition-all duration-500 ease-out cursor-pointer ${
                  isActive
                    ? 'opacity-100 scale-100 shadow-2xl z-10'
                    : 'scale-[0.985] shadow-md z-0'
                }`}
                style={{
                  borderRadius: `${borderRadius}px`,
                  opacity: isActive ? 1 : sideOpacity,
                }}
                onClick={() => {
                  if (!isActive) {
                    setIsTransitioning(true);
                    setCurrentIndex(idx);
                  }
                }}
              >
                {/* Desktop Banner Image */}
                <img
                  src={slide.image}
                  alt={slide.title || `Slide ${idx + 1}`}
                  className={`w-full h-full object-cover select-none pointer-events-none ${
                    slide.mobileImage ? 'hidden md:block' : 'block'
                  }`}
                  loading={idx >= N - 1 && idx <= N + 1 ? 'eager' : 'lazy'}
                  decoding="async"
                />

                {/* Optional Mobile-Specific Banner Image */}
                {slide.mobileImage && (
                  <img
                    src={slide.mobileImage}
                    alt={slide.title || `Slide ${idx + 1}`}
                    className="w-full h-full object-cover select-none pointer-events-none md:hidden block"
                    loading={idx >= N - 1 && idx <= N + 1 ? 'eager' : 'lazy'}
                    decoding="async"
                  />
                )}

                {/* Dark dimming overlay on inactive side slides for maximum center focus */}
                {!isActive && (
                  <div className="absolute inset-0 bg-black/35 pointer-events-none transition-opacity duration-300" />
                )}

                {/* Subtle bottom shadow vignette */}
                <div className="absolute inset-0 bg-linear-to-t from-black/25 via-transparent to-transparent pointer-events-none" />

                {/* Optional Badge */}
                {slide.badge && (
                  <div className="absolute top-3.5 left-3.5 sm:top-5 sm:left-5 z-10">
                    <span className="px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-white bg-black/60 backdrop-blur-md rounded-lg shadow-xs border border-white/10">
                      {slide.badge}
                    </span>
                  </div>
                )}
              </div>
            );

            return (
              <div
                key={`${slide.id}-${idx}`}
                className="pms-slide shrink-0 h-full"
              >
                {slideLink && isActive ? (
                  <Link
                    href={slideLink}
                    target={slide.target || '_self'}
                    className="block w-full h-full"
                  >
                    {slideCard}
                  </Link>
                ) : (
                  slideCard
                )}
              </div>
            );
          })}
        </div>

        {/* ── Center Stage Overlay: Navigation Arrows & Play/Pause Anchored to Center Slide ── */}
        <div
          className="absolute inset-y-0 pointer-events-none z-30"
          style={{
            left: '50%',
            width: 'var(--pms-w)',
            maxWidth: '100%',
            transform: 'translateX(-50%)',
          }}
        >
          {/* Left Arrow (<): Vertically centered, sits at seam slightly outside on desktop, inside on mobile */}
          {showArrows && N > 1 && (
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous slide"
              className="absolute top-1/2 -translate-y-1/2 left-2 sm:left-3 md:-left-5 lg:-left-6 pointer-events-auto w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/20 hover:bg-white/40 active:scale-95 text-white backdrop-blur-md border border-white/25 shadow-xl flex items-center justify-center transition-all duration-200 cursor-pointer z-30"
            >
              <Icon icon="solar:alt-arrow-left-linear" width={22} className="text-white" />
            </button>
          )}

          {/* Right Arrow (>): Vertically centered, sits at seam slightly outside on desktop, inside on mobile */}
          {showArrows && N > 1 && (
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next slide"
              className="absolute top-1/2 -translate-y-1/2 right-2 sm:right-3 md:-right-5 lg:-right-6 pointer-events-auto w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/20 hover:bg-white/40 active:scale-95 text-white backdrop-blur-md border border-white/25 shadow-xl flex items-center justify-center transition-all duration-200 cursor-pointer z-30"
            >
              <Icon icon="solar:alt-arrow-right-linear" width={22} className="text-white" />
            </button>
          )}

          {/* Play / Pause Toggle Button: Anchored at the bottom-right inside the active center slide */}
          {showPlayPause && (
            <button
              type="button"
              onClick={togglePlayPause}
              aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
              title={isPlaying ? 'Pause' : 'Play'}
              className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 pointer-events-auto z-30 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer border border-white/20"
            >
              <Icon
                icon={isPlaying ? 'solar:pause-bold' : 'solar:play-bold'}
                width={14}
                className="text-white"
              />
            </button>
          )}
        </div>
      </div>

      {/* ── Optional Pagination Dots ── */}
      {showPagination && N > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-3 pb-1">
          {baseSlides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setIsTransitioning(true);
                setCurrentIndex(N + i);
              }}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeOriginalIndex
                  ? 'w-6 bg-gray-900 shadow-xs'
                  : 'w-1.5 bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
