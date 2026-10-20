'use client';

/**
 * cms/plugin/gadgets/Header/Header.tsx
 *
 * Exelic Gadgets E-Commerce Header.
 * Recreates the screenshot layout in exact proportions:
 * - Brand logo & styled fallback (Golden loop + Royal Blue text)
 * - Centered Pill Search bar with blue border and golden SEARCH button
 * - Styled Account & Cart actions (vertical layout with icon + label + badge)
 * - Horizontal Category Navigation with blue indicator
 * - Support / Need Help? phone action on top right
 * - Proportional multi-column Mega Menu with group titles, "New" badges, and "View all →"
 * - Fully dynamic with CMS menu data & fallback demo items
 * - Mobile responsive drawer & search popup
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { usePathname, useSearchParams } from 'next/navigation';
import { Icon } from '@iconify/react';
import MobileDrawer from '@/components/page/header/MobileDrawer';
import SearchPopUp from '@/components/SearchPopUp';
import SearchGadgets from './SearchGadgets';
import AccountGadgets from './AccountGadgets';
import useSettings from '@/lib/useSettings';
import type { MenuItem } from '@/models/Menu';

// Dynamically import Cart to prevent hydration mismatch for client-only local storage state
const Cart = dynamic(() => import('@/plugin/product/cart/Cart'), { ssr: false });

interface HeaderGadgetsProps {
  settings?: Record<string, any>;
  topItems?: MenuItem[];
  mainItems?: MenuItem[];
  rightItems?: MenuItem[];
  mobileItems?: MenuItem[];
  builderContent?: Record<string, any[]>;
}

function checkIsActive(itemUrl: string, pathname: string, searchParams: URLSearchParams): boolean {
  if (!itemUrl || itemUrl === '#') return false;
  try {
    const parsed = new URL(itemUrl, 'http://localhost');
    const itemPath = (parsed.pathname.replace(/\/$/, '') || '/').toLowerCase();
    const currentPath = (pathname.replace(/\/$/, '') || '/').toLowerCase();
    if (itemPath !== currentPath) return false;

    const itemKeys = Array.from(parsed.searchParams.keys());
    if (itemKeys.length === 0) {
      return !searchParams.get('category') && !searchParams.get('q');
    }
    for (const key of itemKeys) {
      if ((parsed.searchParams.get(key) || '').toLowerCase() !== (searchParams.get(key) || '').toLowerCase()) {
        return false;
      }
    }
    return true;
  } catch {
    return itemUrl === pathname;
  }
}

export default function HeaderGadgets({
  settings: propSettings,
  mainItems = [],
  mobileItems = [],
}: HeaderGadgetsProps) {
  const { settings: hookSettings } = useSettings();
  const settings = propSettings && Object.keys(propSettings).length > 0 ? propSettings : hookSettings;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [scrolled, setScrolled] = useState(false);
  const [hoveredMenuId, setHoveredMenuId] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 15);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isSticky = settings.header_sticky !== 'false';
  const currencySymbol = (settings.product_currency_symbol || settings.currency_symbol || 'KSh') as string;
  const brandColor = settings.header_color || settings.primary_color || '#0053e2';
  const supportPhone = settings.help_phone || settings.header_phone || settings.phone || '+254 112891117';
  const helpLabel = settings.help_label || 'Need help?';

  // Normalize dynamic menu items directly from CMS mainItems (same as poorvika/header/nav.tsx)
  const items = useMemo(() => {
    return (mainItems || []).map((m, idx) => {
      const mRaw = m as any;
      return {
        id: m.id || mRaw._id || `gadget-nav-${idx}`,
        label: m.label || mRaw.name || '',
        url: m.url || mRaw.link || '#',
        icon: m.icon || mRaw.icon,
        image: m.image || mRaw.image,
        children: m.children || mRaw.children || [],
        order: m.order ?? idx,
      };
    });
  }, [mainItems]);

  const activeMegaItem = useMemo(() => {
    return items.find((item) => item.id === hoveredMenuId && item.children && item.children.length > 0) || null;
  }, [items, hoveredMenuId]);

  const handleMouseEnter = (id: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoveredMenuId(id);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredMenuId(null);
    }, 180);
  };

  return (
    <header
      className={`z-50 w-full transition-all duration-200 bg-white ${
        isSticky ? 'sticky top-0' : 'relative'
      } ${scrolled ? 'shadow-md' : 'shadow-xs'}`}
      onMouseLeave={handleMouseLeave}
    >
      {/* ── 1. MAIN TOP HEADER ROW ── */}
      <div className="border-b border-gray-100 bg-white">
        <div className="container mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 lg:gap-8">
          
          {/* Logo on Left */}
          <Link href="/" className="shrink-0 flex items-center gap-2 no-underline select-none">
            {settings.logo ? (
              <img
                src={settings.logo}
                alt={settings.siteName || 'Exelic Gadgets'}
                className={
                  settings.header_logo_height || settings.headerLogoHeight
                    ? 'w-auto object-contain'
                    : 'h-9 sm:h-10 w-auto object-contain'
                }
                style={{
                  height: settings.header_logo_height
                    ? `${settings.header_logo_height}px`
                    : settings.headerLogoHeight
                    ? `${settings.headerLogoHeight}px`
                    : undefined,
                }}
              />
            ) : (
              <div className="flex items-center gap-2">
                {/* Custom Golden Loop Logo matching Exelic Gadgets */}
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-linear-to-br from-amber-400 to-amber-500 flex items-center justify-center p-1.5 shadow-xs shrink-0">
                  <svg viewBox="0 0 40 40" fill="none" className="w-full h-full text-white">
                    <circle cx="16" cy="20" r="9" stroke="white" strokeWidth="3.5" fill="none" />
                    <circle cx="24" cy="20" r="9" stroke="white" strokeWidth="3.5" fill="none" />
                  </svg>
                </div>
                <div className="flex items-baseline font-black tracking-tight text-xl sm:text-2xl font-sans">
                  <span className="text-[#f5a623] mr-1">Exelic</span>
                  <span className="text-[#0053e2]">Gadgets</span>
                </div>
              </div>
            )}
          </Link>

          {/* Centered Pill Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-auto">
            <SearchGadgets
              type="product"
              currencySymbol={currencySymbol}
              placeholder={settings.search_placeholder || 'Search products or ask what you need'}
            />
          </div>

          {/* Right Action Icons: Account & Cart (Desktop + Mobile) */}
          <div className="flex items-center gap-4 sm:gap-6 shrink-0">
            {/* Account Component */}
            <AccountGadgets color={brandColor} />

            {/* Shopping Cart Button with Golden Badge */}
            <Cart
              trigger={(open, count) => (
                <button
                  onClick={open}
                  className="flex flex-col items-center justify-center group cursor-pointer focus:outline-hidden"
                  title="Shopping Cart"
                  aria-label="Shopping Cart"
                >
                  <div className="relative w-6 h-6 flex items-center justify-center">
                    <Icon
                      icon="solar:cart-large-minimalistic-linear"
                      className="w-6 h-6 group-hover:scale-105 transition-transform"
                      style={{ color: brandColor }}
                    />
                    <span className="absolute -top-1.5 right-0 bg-[#ffb800] text-gray-950 text-[10px] font-black rounded-full min-w-4 h-4 px-1 flex items-center justify-center leading-none shadow-xs">
                      {count > 99 ? '99+' : count}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-gray-800 group-hover:text-[#0053e2] transition-colors leading-tight mt-0.5">
                    Cart
                  </span>
                </button>
              )}
            />

            {/* Mobile Search PopUp & Mobile Drawer Trigger */}
            <div className="flex items-center gap-1.5 md:hidden">
              <SearchPopUp
                type="product"
                fontSize={22}
                iconColor={brandColor}
                currencySymbol={currencySymbol}
              />
              <MobileDrawer
                items={mobileItems.length > 0 ? mobileItems : (items as any)}
                settings={settings}
                iconColor={brandColor}
              />
            </div>
          </div>

        </div>
      </div>

      {/* ── 2. HORIZONTAL CATEGORY NAVIGATION & PHONE SUPPORT ROW ── */}
      <nav className="hidden md:block bg-white border-b border-gray-200 relative select-none">
        <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between">
          
          {/* Left Category Links */}
          <div className="flex items-center space-x-1 lg:space-x-3 overflow-x-auto no-scrollbar py-0.5">
            {items.map((item) => {
              const hasChildren = item.children && item.children.length > 0;
              const isHovered = hoveredMenuId === item.id;
              const isRouteActive = checkIsActive(item.url, pathname, searchParams);
              const isSelected = isHovered || isRouteActive;

              return (
                <div
                  key={item.id}
                  onMouseEnter={() => handleMouseEnter(item.id)}
                  className="relative group shrink-0"
                >
                  <Link
                    href={item.url}
                    className={`inline-flex items-center gap-1 py-2.5 px-2 text-xs lg:text-[13px] font-semibold transition-all border-b-2 whitespace-nowrap ${
                      isSelected
                        ? 'border-[#0053e2] text-[#0053e2] font-bold'
                        : 'text-gray-800 border-transparent hover:text-[#0053e2]'
                    }`}
                    style={
                      isSelected
                        ? { color: brandColor, borderColor: brandColor }
                        : undefined
                    }
                  >
                    <span>{item.label}</span>
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Right Side: Need help? + Phone Number */}
          {supportPhone && (
            <div className="shrink-0 pl-4 py-2 text-right">
              <span className="block text-[11px] text-gray-500 font-normal leading-tight">
                {helpLabel}
              </span>
              <a
                href={`tel:${supportPhone.replace(/\s+/g, '')}`}
                className="block text-xs lg:text-sm font-bold text-gray-900 hover:text-[#0053e2] transition-colors leading-tight"
              >
                {supportPhone}
              </a>
            </div>
          )}

        </div>

        {/* ── 3. DYNAMIC PROPORTIONAL MEGA MENU PANEL ── */}
        {activeMegaItem && (
          <div
            className="absolute top-full left-0 w-full bg-white border-b border-t border-gray-200 shadow-2xl z-40 animate-in fade-in slide-in-from-top-1 duration-150"
            onMouseEnter={() => handleMouseEnter(activeMegaItem.id)}
            onMouseLeave={handleMouseLeave}
          >
            <div className="container mx-auto px-4 sm:px-6 py-4">
              
              {/* Mega Menu Top Header: Category Title + View all */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
                  {activeMegaItem.label}
                </h3>
                <Link
                  href={activeMegaItem.url || '#'}
                  className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold hover:underline"
                  style={{ color: brandColor }}
                >
                  <span>View all</span>
                  <Icon icon="solar:alt-arrow-right-linear" width={14} />
                </Link>
              </div>

              {/* Dynamic Proportional Columns matching screenshot */}
              <MegaMenuColumns
                childrenData={activeMegaItem.children || []}
                brandColor={brandColor}
              />

            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROPORTIONAL MULTI-COLUMN MEGA MENU RENDERER
// Automatically arranges groups into 4 balanced columns (or 1-4 columns)
// ─────────────────────────────────────────────────────────────────────────────
function MegaMenuColumns({
  childrenData = [],
  brandColor = '#0053e2',
}: {
  childrenData: any[];
  brandColor: string;
}) {
  if (childrenData.length === 0) return null;

  // Distribute groups into up to 4 columns matching screenshot
  const numColumns = Math.min(4, Math.max(1, childrenData.length));
  const columns: any[][] = Array.from({ length: numColumns }, () => []);

  childrenData.forEach((group, idx) => {
    const colIdx = idx % numColumns;
    columns[colIdx].push(group);
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 pb-3">
      {columns.map((colGroups, cIdx) => (
        <div key={cIdx} className="space-y-6">
          {colGroups.map((group: any, gIdx: number) => {
            const subLinks = group.children || [];

            return (
              <div key={group.id || group._id || gIdx} className="space-y-2">
                {/* Group Heading */}
                <Link
                  href={group.url || group.link || '#'}
                  className="block font-bold text-xs sm:text-sm text-gray-900 hover:text-[#0053e2] transition-colors"
                >
                  {group.label || group.name}
                </Link>

                {/* Sub-item Links */}
                {subLinks.length > 0 && (
                  <ul className="space-y-1.5 text-xs text-gray-600">
                    {subLinks.map((item: any, iIdx: number) => {
                      const label = item.label || item.name || '';
                      const hasNewBadge =
                        item.isNew ||
                        item.badge === 'New' ||
                        item.tag === 'New' ||
                        (typeof label === 'string' && label.toLowerCase().endsWith(' new'));

                      const cleanLabel =
                        typeof label === 'string' && label.toLowerCase().endsWith(' new')
                          ? label.slice(0, -4).trim()
                          : label;

                      const isViewAll =
                        typeof label === 'string' && label.toLowerCase().startsWith('view all');

                      return (
                        <li key={item.id || item._id || iIdx}>
                          <Link
                            href={item.url || item.link || '#'}
                            className={`inline-flex items-center gap-1.5 py-0.5 transition-colors ${
                              isViewAll
                                ? 'text-gray-500 font-medium hover:text-[#0053e2] mt-1'
                                : 'text-gray-600 hover:text-[#0053e2]'
                            }`}
                          >
                            <span>{cleanLabel}</span>
                            {hasNewBadge && (
                              <span className="text-[10px] text-red-500 font-bold italic select-none">
                                New
                              </span>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
