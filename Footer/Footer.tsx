'use client';

/**
 * cms/plugin/gadgets/Footer/Footer.tsx
 *
 * Exelic Gadgets E-Commerce Footer.
 * 100% Dynamic:
 *  1. Middle Info Bar:
 *     - Col 1: Brand Logo, title, description, and contact info (phone, email, address, admin/editor)
 *     - Dynamic Footer Sections (Sections 1 to 5) configured in Admin Settings > Footer
 *  2. Dynamic Mega Category Footer:
 *     - Connects to menu slot from settings (settings.header_footer_menu or 'footer-1')
 *     - Renders dynamic menu categories and links matching CMS data
 *     - Background brand watermark using dynamic site name
 *  3. Bottom Bar:
 *     - Dynamic Copyright, Developed by / Credits, Mobile Download link
 *     - Dynamic Social Media links (custom icons, colors, display modes from Settings > Social Media)
 *     - Facebook Page embed widget (if configured in settings)
 *  4. Dynamic styling with customizable colors and background image from settings
 */

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import useSettings from '@/lib/useSettings';
import { xFetch } from '@/lib/express';
import type { MenuItem } from '@/models/Menu';

export interface GadgetsFooterProps {
  settings?: Record<string, any>;
  menuItems?: MenuItem[];
}

export interface FooterSectionItem {
  id: string;
  icon: string;
  name: string;
  link: string;
}

export interface FooterSection {
  id: string;
  title: string;
  items: FooterSectionItem[];
}

export interface SocialItem {
  id: string;
  name: string;
  icon: string;
  link: string;
  bg_color: string;
  text_color: string;
  show_mode: 'both' | 'text' | 'icon';
}

function parseFooterSections(values: Record<string, any>): FooterSection[] {
  const defaultTitles = [
    'Quick Links',
    'Customer Care',
    'Follow Us',
    'Categories',
    'Legal & Policy',
  ];
  const result: FooterSection[] = [];

  for (let s = 1; s <= 5; s++) {
    const secTitle = values[`footer_section_${s}_title`] ?? defaultTitles[s - 1];
    let secItems: FooterSectionItem[] = [];

    if (typeof values[`footer_section_${s}_items`] === 'string') {
      try {
        const parsed = JSON.parse(values[`footer_section_${s}_items`]);
        if (Array.isArray(parsed)) secItems = parsed;
      } catch {}
    } else if (Array.isArray(values[`footer_section_${s}_items`])) {
      secItems = values[`footer_section_${s}_items`];
    } else {
      const flatIcon = values[`footer_item_${s}_icon`];
      const flatName = values[`footer_item_${s}_name`];
      const flatLink = values[`footer_item_${s}_link`];
      if (flatIcon || flatName || flatLink) {
        secItems = [
          {
            id: `item-${s}-1`,
            icon: flatIcon || '',
            name: flatName || '',
            link: flatLink || '',
          },
        ];
      }
    }

    // Only include sections that have items configured or a custom non-empty title with items
    if (secItems.length > 0) {
      result.push({
        id: `sec-${s}`,
        title: secTitle,
        items: secItems,
      });
    }
  }
  return result;
}

function parseSocialMediaSettings(values: Record<string, any>): SocialItem[] {
  if (typeof values.social_media_items === 'string') {
    try {
      const parsed = JSON.parse(values.social_media_items);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
  }
  if (typeof values.social_media === 'string') {
    try {
      const parsed = JSON.parse(values.social_media);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item: any, idx: number) => ({
          id: item.id || `soc-${idx + 1}`,
          name: item.name || item.title || 'Social',
          icon: item.icon || 'fa6-brands:facebook-f',
          link: item.link || item.url || '#',
          bg_color: item.bg_color || item.bg || '#3b5998',
          text_color: item.text_color || '#ffffff',
          show_mode: item.show_mode || 'icon',
        }));
      }
    } catch {}
  } else if (Array.isArray(values.social_media)) {
    return values.social_media;
  }
  return [];
}

export default function FooterGadgets({
  settings: propSettings,
  menuItems: propMenuItems,
}: GadgetsFooterProps) {
  const { settings: hookSettings } = useSettings();
  const settings = propSettings && Object.keys(propSettings).length > 0 ? propSettings : hookSettings;

  const currentYear = new Date().getFullYear();
  const siteName = settings.siteName || settings.site_title || '';
  const logo = settings.footer_logo || settings.logo || '';
  const logoHeight = settings.footer_logo_height || settings.footerLogoHeight || '';

  const aboutTitle = settings.footer_about_title || '';
  const aboutDescription =
    settings.footer_about_description ||
    settings.footer_description ||
    settings.site_description ||
    settings.bio ||
    '';

  const phone = settings.footer_phone || settings.footer_number || settings.phone || settings.number || '';
  const email = settings.footer_email || settings.email || '';
  const address = settings.footer_address || settings.address || settings.store_address || '';
  const admin = settings.admin || '';
  const editor = settings.editor || '';
  const mobileDownload = settings.mobile_download || settings.mobileDownload || '';

  const copyright =
    settings.copyright ||
    settings.footer_copyright ||
    `© ${currentYear} ${siteName}. All Rights Reserved.`;
  const developed = settings.developed || '';
  const googleStoreLink = settings.google_store_url || settings.google_maps_link || '';

  // Dynamic colors & background image
  const bgColor1 = settings.footer_bg_color || settings.footer_bg_1 || '#ffffff';
  const bgColor2 = settings.footer_bg_color_2 || settings.footer_bg_2 || '#f8fafc';
  const textColor1 = settings.footer_text_color || settings.footer_text_1 || '#1e293b';
  const textColor2 = settings.footer_text_color_2 || settings.footer_text_2 || '#64748b';
  const bgImage = settings.background_image || settings.backgroundImage || settings.bg_image || '';
  const footerNumber = settings.footer_number || '';

  // ── 1. Dynamic Footer Sections (from Settings > Footer) ──
  const dynamicSections = useMemo(() => {
    return parseFooterSections(settings);
  }, [settings]);

  // ── 2. Dynamic Social Media Links (from Settings > Social Media) ──
  const dynamicSocialItems = useMemo(() => {
    return parseSocialMediaSettings(settings);
  }, [settings]);

  const fbPageEmbed = settings.fb_page_embed || settings.facebook_embed || '';

  // ── 3. Dynamic Footer Menu (Header / Footer Menu Slot) ──
  const [dynamicMenu, setDynamicMenu] = useState<MenuItem[]>(propMenuItems || []);

  useEffect(() => {
    if (propMenuItems && propMenuItems.length > 0) {
      setDynamicMenu(propMenuItems);
      return;
    }

    let isMounted = true;
    const menuSlot = settings.header_footer_menu || settings.footer_menu || 'footer-1';

    const fetchMenu = async () => {
      // 1. Try Express xFetch
      try {
        const query = menuSlot.match(/^[0-9a-fA-F]{24}$/)
          ? `/menu?id=${menuSlot}`
          : `/menu?location=${encodeURIComponent(menuSlot)}`;
        const res = await xFetch(query);
        if (res.ok) {
          const data = await res.json();
          const items = data.menu?.items || data.items || (Array.isArray(data) ? data : []);
          if (isMounted && Array.isArray(items) && items.length > 0) {
            setDynamicMenu(items);
            return;
          }
        }
      } catch (e) {
        // Continue to fallback
      }

      // 2. Fallback to Next.js API route
      try {
        const res = await fetch(`/api/menu/${encodeURIComponent(menuSlot)}`);
        if (res.ok) {
          const data = await res.json();
          const items = data.menu?.items || data.items || (Array.isArray(data) ? data : []);
          if (isMounted && Array.isArray(items) && items.length > 0) {
            setDynamicMenu(items);
          }
        }
      } catch (e) {}
    };

    fetchMenu();

    return () => {
      isMounted = false;
    };
  }, [propMenuItems, settings.header_footer_menu, settings.footer_menu]);

  // Transform dynamic menu items into balanced columns
  const megaMenuColumns = useMemo(() => {
    if (!dynamicMenu || dynamicMenu.length === 0) return [];

    const hasChildren = dynamicMenu.some(item => item.children && item.children.length > 0);

    if (hasChildren) {
      return dynamicMenu
        .filter(item => (item.children && item.children.length > 0) || item.label)
        .map((parent, idx) => {
          const pRaw = parent as any;
          const children = parent.children || pRaw.children || [];
          return {
            id: parent.id || pRaw._id || `col-${idx}`,
            title: (parent.label || pRaw.name || `Category ${idx + 1}`).toUpperCase(),
            url: parent.url || pRaw.link || '#',
            items: children.map((c: any, cIdx: number) => ({
              id: c.id || c._id || `item-${idx}-${cIdx}`,
              label: c.label || c.name || '',
              url: c.url || c.link || '#',
            })),
          };
        });
    }

    // Flat items: distribute into up to 6 balanced columns
    const numCols = Math.min(6, Math.max(1, Math.ceil(dynamicMenu.length / 5)));
    const cols: { id: string; title: string; url: string; items: { id: string; label: string; url: string }[] }[] = Array.from(
      { length: numCols },
      (_, i) => ({ id: `col-${i}`, title: '', url: '#', items: [] })
    );

    dynamicMenu.forEach((item, idx) => {
      const colIdx = idx % numCols;
      cols[colIdx].items.push({
        id: item.id || `flat-${idx}`,
        label: item.label || (item as any).name || '',
        url: item.url || (item as any).link || '#',
      });
    });

    return cols.filter(c => c.items.length > 0);
  }, [dynamicMenu]);

  return (
    <footer
      className="w-full font-sans border-t border-gray-200 select-none relative"
      style={{
        backgroundColor: bgColor1,
        color: textColor1,
        backgroundImage: bgImage ? `url(${bgImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* ════════════════════ 1. MIDDLE INFORMATION BAR (DYNAMIC) ════════════════════ */}
      <div className="container py-10 md:py-12">
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-2 md:gap-4">
          
          {/* ── Brand & About Column ── */}
          <div className="col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2 select-none">
              {logo ? (
                <img
                  src={logo}
                  alt={siteName}
                  className="w-auto object-contain"
                  style={{ height: logoHeight ? `${logoHeight}px` : '36px' }}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-linear-to-br from-amber-400 to-amber-500 flex items-center justify-center p-1.5 shadow-xs shrink-0">
                    <svg viewBox="0 0 40 40" fill="none" className="w-full h-full text-white">
                      <circle cx="16" cy="20" r="9" stroke="white" strokeWidth="3.5" fill="none" />
                      <circle cx="24" cy="20" r="9" stroke="white" strokeWidth="3.5" fill="none" />
                    </svg>
                  </div>
                  <span className="font-black tracking-tight text-xl font-sans" style={{ color: textColor1 }}>
                    {siteName}
                  </span>
                </div>
              )}
            </Link>

            {aboutTitle && (
              <h4 className="text-xs md:text-sm font-bold uppercase tracking-wider" style={{ color: textColor1 }}>
                {aboutTitle}
              </h4>
            )}

            {aboutDescription && (
              <p className="text-xs md:text-[13px] leading-relaxed max-w-sm" style={{ color: textColor2 }}>
                {aboutDescription}
              </p>
            )}

            {/* Contact details */}
            <div className="space-y-2 pt-1 text-xs md:text-[13px]">
              {phone && (
                <div className="flex items-center gap-2">
                  <Icon icon="solar:phone-calling-linear" className="w-4 h-4 text-[#ffb800] shrink-0" />
                  <a
                    href={`tel:${phone.replace(/\s+/g, '')}`}
                    className="font-semibold transition-colors hover:underline"
                    style={{ color: textColor1 }}
                  >
                    {phone}
                  </a>
                </div>
              )}

              {email && (
                <div className="flex items-center gap-2">
                  <Icon icon="solar:letter-linear" className="w-4 h-4 text-[#ffb800] shrink-0" />
                  <a
                    href={`mailto:${email}`}
                    className="transition-colors hover:underline"
                    style={{ color: textColor1 }}
                  >
                    {email}
                  </a>
                </div>
              )}

              
            </div>
          </div>

          <div className="md:flex flex-col space-y-2 hidden ">
            <h4 className="text-xs md:text-[13px] font-black tracking-wider uppercase" style={{ color: textColor1 }}>Store Locations</h4>
            {admin && <strong className='text-sm' style={{ color: textColor1 }}>{admin}</strong>}
            {address && (
              <span style={{ color: textColor2 }} className="text-xs">
                {address}
              </span>
            )}
            {footerNumber && <span className='text-xs' style={{ color: textColor1 }}>{footerNumber}</span>}
            {editor && <span className='text-xs' style={{ color: textColor1 }}>{editor}</span>}
          </div>

          {/* ── Dynamic Footer Sections (Sections 1 to 5) ── */}
          {dynamicSections.map((sec) => (
            <div
              key={sec.id}
              className="space-y-3 md:block hidden"
            >
              <h4 className="text-xs md:text-[13px] font-black tracking-wider uppercase" style={{ color: textColor1 }}>
                {sec.title}
              </h4>
              <ul className="space-y-2 text-xs">
                {sec.items.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.link || '#'}
                      className="inline-flex items-center gap-1.5 transition-colors hover:underline"
                      style={{ color: textColor2 }}
                    >
                      {item.icon && <Icon icon={item.icon} className="w-3.5 h-3.5 shrink-0" />}
                      <span>{item.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ════════════════════ 2. DYNAMIC MEGA CATEGORY MENU ════════════════════ */}
      {megaMenuColumns.length > 0 && (
        <div
          className="border-t border-gray-200/80 relative overflow-hidden py-10 md:py-12"
          style={{ backgroundColor: bgColor2 }}
        >
          {/* Faint Background Watermark Logo Text */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 hidden md:flex items-center justify-center pointer-events-none select-none opacity-[0.03] overflow-hidden">
              <span className="text-6xl md:text-[150px] font-black tracking-tight font-sans whitespace-nowrap text-current">
                {siteName}
              </span>
          </div>

          <div className="container relative z-10">
            <div
              className="grid grid-cols-2 md:grid-cols-6 gap-4 md:gap-8"
            >
              {megaMenuColumns.map((col) => (
                <div key={col.id} className="space-y-3">
                  {col.title && (
                    <h4 className="text-xs md:text-[13px] font-black tracking-wider uppercase" style={{ color: textColor1 }}>
                      {col.url && col.url !== '#' ? (
                        <Link href={col.url} className="hover:underline">
                          {col.title}
                        </Link>
                      ) : (
                        col.title
                      )}
                    </h4>
                  )}
                  <ul className="space-y-1.5 text-sm list-disc ml-5">
                    {col.items.map((item) => (
                      <li key={item.id}>
                        <Link
                          href={item.url || '#'}
                          className="transition-colors font-semibold block py-0.5 truncate hover:underline"
                          style={{ color: textColor2 }}
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════ 3. BOTTOM COPYRIGHT & SOCIAL MEDIA BAR ════════════════════ */}
      <div className="border-t border-gray-200 py-5" style={{ backgroundColor: bgColor1 }}>
        <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Left: Copyright & Credits */}
          <div className="text-xs flex flex-wrap items-center justify-center md:justify-start gap-x-2 gap-y-1" style={{ color: textColor2 }}>
            <span>{copyright}</span>
            {developed && (
              <>
                <span className="hidden md:inline text-gray-300">·</span>
                <span>{developed}</span>
              </>
            )}
            {googleStoreLink && (
              <>
                <span className="hidden md:inline text-gray-300">·</span>
                <a
                  href={googleStoreLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold transition-colors hover:underline"
                  style={{ color: textColor1 }}
                >
                  View on Google Maps
                </a>
              </>
            )}
          </div>

          {/* Right: Dynamic Social Media Icons / Channels */}
          {dynamicSocialItems.length > 0 && (
            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-center">
              {dynamicSocialItems.map((social) => (
                <a
                  key={social.id}
                  href={social.link || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  title={social.name}
                  className="rounded-full flex items-center justify-center transition-all hover:scale-105 shadow-2xs text-xs font-semibold"
                  style={{
                    backgroundColor: social.bg_color || '#3b5998',
                    color: social.text_color || '#ffffff',
                    padding: social.show_mode === 'text' ? '4px 10px' : social.show_mode === 'both' ? '4px 10px' : '7px',
                  }}
                >
                  {social.show_mode !== 'text' && (
                    <Icon icon={social.icon || 'fa6-brands:facebook-f'} className="w-3.5 h-3.5 shrink-0" />
                  )}
                  {social.show_mode !== 'icon' && (
                    <span className={social.show_mode === 'both' ? 'ml-1.5' : ''}>{social.name}</span>
                  )}
                </a>
              ))}
            </div>
          )}

        </div>
      </div>

    </footer>
  );
}
