/**
 * cms/plugin/gadgets/ui/GadgetsGridServer.tsx
 *
 * SERVER COMPONENT — renders Gadgets Category Grid completely on the server.
 * Pre-rendered in Builder.tsx when "gadgets-grid" element is present on a page.
 * Delivers zero client-side JavaScript overhead and instant HTML paint.
 */

import React from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import type { GadgetCategoryItem } from '../elements/Grid';
import { DEFAULT_GADGET_CATEGORIES } from '../elements/Grid';

export default function GadgetsGridServer({ schema }: { schema: any }) {
  const content = schema?.content || {};
  const style = schema?.style || {};
  const advanced = schema?.advanced || {};

  const items: GadgetCategoryItem[] =
    Array.isArray(content.items) && content.items.length > 0
      ? content.items
      : DEFAULT_GADGET_CATEGORIES;

  const showTitle = content.show_title !== false;
  const titlePrefix = content.title_prefix ?? 'Top';
  const titleHighlight = content.title_highlight ?? 'Categories';

  // ─── Responsive Grid Columns ───
  const mobColsClass = Number(content.columnsMobile ?? content.mobile_cols) || 3;
  const tabColsClass = Number(content.columnsTablet ?? content.tablet_cols) || 4;
  const deskColsClass = Number(content.columnsDesktop ?? content.desktop_cols) || 8;

  // ─── Dynamic Responsive Gaps ───
  const mobGapClass = `gap-${style.gapMobile != null ? Number(style.gapMobile) : 2}`;
  const tabGapClass = `md:gap-${style.gapTablet != null ? Number(style.gapTablet) : 3}`;
  const deskGapClass = `lg:gap-${style.gapDesktop != null ? Number(style.gapDesktop) : 4}`;

  const gridClass = `grid grid-cols-${mobColsClass} md:grid-cols-${tabColsClass} lg:grid-cols-${deskColsClass} ${mobGapClass} ${tabGapClass} ${deskGapClass} w-full`;

  // ─── Configurable Image Heights ───
  const imageHeightDesktop = Number(style.imageHeightDesktop) || 80;
  const imageHeightMobile = Number(style.imageHeightMobile) || 60;

  // Dynamic styling tokens
  const titlePrefixColor = style.title_prefix_color || '#0f172a';
  const titleGradientFrom = style.title_gradient_from || '#f97316';
  const titleGradientVia = style.title_gradient_via || '#ec4899';
  const titleGradientTo = style.title_gradient_to || '#8b5cf6';

  const textColor = style.text_color || '#1e293b';
  const hoverTextColor = style.hover_text_color || '#0f172a';
  const cardHoverBg = style.card_hover_bg || '#f8fafc';
  const cardRadius = style.card_radius ?? 16;

  const cardPadding = style.card_padding || { top: 14, right: 10, bottom: 14, left: 10, unit: 'px' };
  const cardPaddingStyle = `${cardPadding.top ?? 14}${cardPadding.unit || 'px'} ${cardPadding.right ?? 10}${cardPadding.unit || 'px'} ${cardPadding.bottom ?? 14}${cardPadding.unit || 'px'} ${cardPadding.left ?? 10}${cardPadding.unit || 'px'}`;

  return (
    <div
      className="w-full font-sans select-none"
      style={{
        margin: advanced.margin,
        padding: advanced.padding,
      }}
    >
      <div className="w-full">
        {/* ─── Header: "Top Categories" with Vibrant Gradient ─── */}
        {showTitle && (
          <div className="mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-2">
              <span style={{ color: titlePrefixColor }}>{titlePrefix}</span>
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(to right, ${titleGradientFrom}, ${titleGradientVia}, ${titleGradientTo})`,
                }}
              >
                {titleHighlight}
              </span>
            </h2>
          </div>
        )}

        {/* ─── Responsive Grid with Tailwind Column & Gap Classes ─── */}
        <div className={gridClass}>
          {items.map((item) => (
            <div key={item.id}>
              <Link
                href={item.link?.url || '#'}
                target={item.link?.target || '_self'}
                rel={item.link?.nofollow ? 'nofollow' : undefined}
                className="group flex flex-col items-center justify-between text-center transition-all duration-300 cursor-pointer select-none h-full hover:bg-(--card-hover-bg)"
                style={{
                  '--card-hover-bg': cardHoverBg,
                  borderRadius: `${cardRadius}px`,
                  padding: cardPaddingStyle,
                } as React.CSSProperties}
              >
                {/* Category Image Box with Configurable Heights via CSS Variables */}
                <div
                  className="w-full overflow-hidden shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 mb-2 h-(--h-mob) md:h-(--h-desk)"
                  style={{
                    '--h-mob': `${imageHeightMobile}px`,
                    '--h-desk': `${imageHeightDesktop}px`,
                  } as React.CSSProperties}
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-full w-full object-contain drop-shadow-xs mix-blend-multiply brightness-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                      <Icon icon="solar:devices-bold" width={28} />
                    </div>
                  )}
                </div>

                {/* Category Title */}
                <div className="w-full">
                  <span
                    className="text-xs sm:text-[13px] font-semibold leading-tight line-clamp-2 block transition-colors duration-200 text-(--text-color) group-hover:text-(--hover-text-color)"
                    style={{
                      '--text-color': textColor,
                      '--hover-text-color': hoverTextColor,
                    } as React.CSSProperties}
                  >
                    {item.title}
                  </span>
                </div>
              </Link>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
