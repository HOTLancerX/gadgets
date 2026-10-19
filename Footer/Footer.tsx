'use client';

/**
 * cms/plugin/gadgets/Footer/Footer.tsx
 *
 * Exelic Gadgets E-Commerce Footer.
 * Exact match to the provided screenshot:
 *  1. Top Trust Bar: 4 feature columns (Express Delivery, Quality Assured, Support >, Deals >)
 *  2. Middle Info Bar (4 Columns):
 *     - Col 1: Brand Logo, bio tagline, phone, and email
 *     - Col 2: STORE LOCATIONS (Nairobi CBD Store with yellow accent bar, timings, Google Maps link)
 *     - Col 3: ABOUT EXELIC GADGETS & DEALS & OFFERS links
 *     - Col 4: CUSTOMER CARE links
 *  3. Dynamic Mega Category Footer with Faint Brand Watermark:
 *     - Connects to menu slot "footer-1"
 *     - 6 balanced columns (Mobile Phones, Audio & Wearables, Computing, Gaming & Cameras, Accessories, Top Brands)
 *     - Graceful fallback categories matching screenshot
 *  4. Bottom Bar:
 *     - Copyright, Built by NdovuSEOLabs, View our store on Google link
 *     - 6 circular outline social icons (Facebook, TikTok, Instagram, X, YouTube, WhatsApp)
 */

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import useSettings from '@/lib/useSettings';
import type { MenuItem } from '@/models/Menu';

export interface GadgetsFooterProps {
  settings?: Record<string, any>;
  menuItems?: MenuItem[];
}

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT 6 CATEGORY COLUMNS (MATCHING SCREENSHOT FOR MENU "footer-1")
// Used as initial/fallback state if menu "footer-1" is not yet populated
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_FOOTER_1_COLUMNS = [
  {
    title: 'MOBILE PHONES',
    items: [
      { label: 'Smartphones', url: '/category/smartphones' },
      { label: 'Android Smartphones', url: '/category/android-smartphones' },
      { label: 'iPhone', url: '/category/iphone' },
      { label: 'Samsung Phones', url: '/category/samsung-phones' },
      { label: 'Pixel Phones', url: '/category/pixel-phones' },
      { label: 'Xiaomi Phones', url: '/category/xiaomi-phones' },
      { label: 'OnePlus Phones', url: '/category/oneplus-phones' },
      { label: 'Oppo Phones', url: '/category/oppo-phones' },
      { label: 'Motorola Phones', url: '/category/motorola-phones' },
      { label: 'Infinix Phones', url: '/category/infinix-phones' },
    ],
  },
  {
    title: 'AUDIO & WEARABLES',
    items: [
      { label: 'Audio', url: '/category/audio' },
      { label: 'Headphones', url: '/category/headphones' },
      { label: 'Bluetooth Speakers', url: '/category/bluetooth-speakers' },
      { label: 'Microphones', url: '/category/microphones' },
      { label: 'True Wireless Earbuds', url: '/category/earbuds' },
      { label: 'Apple AirPods', url: '/category/airpods' },
      { label: 'Galaxy Buds', url: '/category/galaxy-buds' },
      { label: 'Smartwatches', url: '/category/smartwatches' },
      { label: 'Amazfit Smartwatches', url: '/category/amazfit' },
      { label: 'Apple Watch', url: '/category/apple-watch' },
    ],
  },
  {
    title: 'COMPUTING',
    items: [
      { label: 'Laptops', url: '/category/laptops' },
      { label: 'Gaming Laptops', url: '/category/gaming-laptops' },
      { label: 'HP Laptops', url: '/category/hp-laptops' },
      { label: 'Lenovo Laptops', url: '/category/lenovo-laptops' },
      { label: 'MacBook Air', url: '/category/macbook-air' },
      { label: 'MacBook Pro', url: '/category/macbook-pro' },
      { label: 'Microsoft Surface', url: '/category/surface' },
      { label: 'Computer Accessories', url: '/category/computer-accessories' },
      { label: 'Computer Keyboards', url: '/category/keyboards' },
      { label: 'Mouse', url: '/category/mouse' },
    ],
  },
  {
    title: 'GAMING & CAMERAS',
    items: [
      { label: 'Gaming', url: '/category/gaming' },
      { label: 'Video Games', url: '/category/video-games' },
      { label: 'PlayStation Consoles', url: '/category/playstation' },
      { label: 'Nintendo Consoles', url: '/category/nintendo' },
      { label: 'Xbox Consoles', url: '/category/xbox' },
      { label: 'Gaming Controllers', url: '/category/gaming-controllers' },
      { label: 'PS5 Games', url: '/category/ps5-games' },
      { label: 'Cameras', url: '/category/cameras' },
      { label: 'Action Cameras', url: '/category/action-cameras' },
      { label: 'Gimbal', url: '/category/gimbal' },
    ],
  },
  {
    title: 'ACCESSORIES',
    items: [
      { label: 'Accessories', url: '/category/accessories' },
      { label: 'Mobile Accessories', url: '/category/mobile-accessories' },
      { label: 'Apple Accessories', url: '/category/apple-accessories' },
      { label: 'Phone Chargers', url: '/category/phone-chargers' },
      { label: 'Power Banks', url: '/category/power-banks' },
      { label: 'Wireless Chargers', url: '/category/wireless-chargers' },
      { label: 'Gaming Accessories', url: '/category/gaming-accessories' },
      { label: 'Laptop Chargers', url: '/category/laptop-chargers' },
      { label: 'HDMI Cables', url: '/category/hdmi-cables' },
      { label: 'Car Accessories', url: '/category/car-accessories' },
    ],
  },
  {
    title: 'TOP BRANDS',
    items: [
      { label: 'PlayStation', url: '/brand/playstation' },
      { label: 'Apple', url: '/brand/apple' },
      { label: 'UGREEN', url: '/brand/ugreen' },
      { label: 'Samsung', url: '/brand/samsung' },
      { label: 'JBL', url: '/brand/jbl' },
      { label: 'Logitech', url: '/brand/logitech' },
      { label: 'Xiaomi', url: '/brand/xiaomi' },
      { label: 'Anker', url: '/brand/anker' },
      { label: 'Soundcore', url: '/brand/soundcore' },
      { label: 'Nintendo', url: '/brand/nintendo' },
    ],
  },
];

export default function FooterGadgets({
  settings: propSettings,
  menuItems: propMenuItems,
}: GadgetsFooterProps) {
  const { settings: hookSettings } = useSettings();
  const settings = propSettings && Object.keys(propSettings).length > 0 ? propSettings : hookSettings;

  const currentYear = new Date().getFullYear();
  const siteName = settings.siteName || settings.site_title || 'Exelic Gadgets';
  const logo = settings.footer_logo || settings.logo || '';
  const bio =
    settings.footer_description ||
    settings.site_description ||
    settings.bio ||
    'Genuine technology, trusted service and fast delivery across Kenya.';

  const phone = settings.footer_phone || settings.phone || settings.help_phone || '+254 112 891 117';
  const email = settings.footer_email || settings.email || 'exelicgadgets@gmail.com';
  const storeAddress =
    settings.store_address ||
    settings.footer_address ||
    settings.address ||
    'Mithoo Biashara Centre, Shop F01, Opposite the Bazaar Plaza, Nairobi CBD';
  const storeHours = settings.store_hours || settings.business_hours || 'Mon – Sat: 9:00 AM – 6:00 PM · Sun: Closed';
  const mapsLink = settings.google_maps_link || 'https://maps.google.com';
  const copyright =
    settings.footer_copyright ||
    settings.copyright ||
    `© ${currentYear} ${siteName}. All Rights Reserved.`;
  const builtBy = settings.developed || 'Built by NdovuSEOLabs';
  const googleStoreLink = settings.google_store_url || 'https://www.google.com/maps';

  // ── Dynamic "footer-1" Menu Fetching ──
  const [dynamicMenu, setDynamicMenu] = useState<MenuItem[]>(propMenuItems || []);

  useEffect(() => {
    if (propMenuItems && propMenuItems.length > 0) return;

    let isMounted = true;
    const menuSlot = settings.header_footer_menu || 'footer-1';

    fetch(`/api/menu/${encodeURIComponent(menuSlot)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setDynamicMenu(data);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [propMenuItems, settings.header_footer_menu]);

  // Transform dynamic menu items or use screenshot default columns
  const footerColumns = useMemo(() => {
    if (dynamicMenu && dynamicMenu.length > 0) {
      return dynamicMenu.map((parent, idx) => {
        const pRaw = parent as any;
        const children = parent.children || pRaw.children || [];
        return {
          title: (parent.label || pRaw.name || `CATEGORY ${idx + 1}`).toUpperCase(),
          items: children.map((c: any) => ({
            label: c.label || c.name || '',
            url: c.url || c.link || '#',
          })),
        };
      });
    }
    return DEFAULT_FOOTER_1_COLUMNS;
  }, [dynamicMenu]);

  // Social Media Links (from settings)
  const socialLinks = useMemo(() => {
    const rawSocial = settings.social_media || settings.socialMedia;
    let parsed: Record<string, string> = {};
    if (typeof rawSocial === 'string') {
      try {
        parsed = JSON.parse(rawSocial);
      } catch {}
    } else if (typeof rawSocial === 'object' && rawSocial !== null) {
      parsed = rawSocial;
    }

    return [
      {
        icon: 'ri:facebook-fill',
        label: 'Facebook',
        url: parsed.facebook || settings.facebook || 'https://facebook.com',
      },
      {
        icon: 'ri:tiktok-fill',
        label: 'TikTok',
        url: parsed.tiktok || settings.tiktok || 'https://tiktok.com',
      },
      {
        icon: 'mdi:instagram',
        label: 'Instagram',
        url: parsed.instagram || settings.instagram || 'https://instagram.com',
      },
      {
        icon: 'line-md:twitter-x',
        label: 'X',
        url: parsed.twitter || parsed.x || settings.twitter || 'https://x.com',
      },
      {
        icon: 'mdi:youtube',
        label: 'YouTube',
        url: parsed.youtube || settings.youtube || 'https://youtube.com',
      },
      {
        icon: 'mdi:whatsapp',
        label: 'WhatsApp',
        url: parsed.whatsapp || settings.whatsapp || `https://wa.me/${phone.replace(/[^0-9]/g, '')}`,
      },
    ];
  }, [settings, phone]);

  return (
    <footer className="w-full bg-white text-gray-700 font-sans border-t border-gray-200 select-none">
      
      {/* ════════════════════ 1. TOP TRUST BADGES BAR ════════════════════ */}
      <div className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-200 py-3.5">
            
            {/* 1. Express Delivery */}
            <div className="flex items-center gap-3 px-3 py-2 sm:px-4">
              <Icon icon="solar:delivery-bold" className="w-6 h-6 text-gray-800 shrink-0" />
              <div>
                <h4 className="text-xs sm:text-[13px] font-bold text-gray-900 tracking-tight leading-tight uppercase">
                  EXPRESS DELIVERY
                </h4>
                <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
                  Countrywide delivery
                </p>
              </div>
            </div>

            {/* 2. Quality Assured */}
            <div className="flex items-center gap-3 px-3 py-2 sm:px-4">
              <Icon icon="solar:shield-check-linear" className="w-6 h-6 text-gray-800 shrink-0" />
              <div>
                <h4 className="text-xs sm:text-[13px] font-bold text-gray-900 tracking-tight leading-tight uppercase">
                  QUALITY ASSURED
                </h4>
                <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
                  Guaranteed product quality
                </p>
              </div>
            </div>

            {/* 3. Support > */}
            <div className="flex items-center gap-3 px-3 py-2 sm:px-4">
              <Icon icon="solar:headphones-round-linear" className="w-6 h-6 text-gray-800 shrink-0" />
              <div>
                <h4 className="text-xs sm:text-[13px] font-bold text-gray-900 tracking-tight leading-tight uppercase flex items-center gap-1">
                  SUPPORT <span className="text-[#ffb800] font-black">&gt;</span>
                </h4>
                <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
                  Helpful customer support
                </p>
              </div>
            </div>

            {/* 4. Deals > */}
            <div className="flex items-center gap-3 px-3 py-2 sm:px-4">
              <Icon icon="solar:tag-linear" className="w-6 h-6 text-gray-800 shrink-0" />
              <div>
                <h4 className="text-xs sm:text-[13px] font-bold text-gray-900 tracking-tight leading-tight uppercase flex items-center gap-1">
                  DEALS <span className="text-[#ffb800] font-black">&gt;</span>
                </h4>
                <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
                  Excellent value
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ════════════════════ 2. MIDDLE INFORMATION BAR (4 COLUMNS) ════════════════════ */}
      <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* ── Col 1: Brand Info (3.5 cols) ── */}
          <div className="lg:col-span-4 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2 select-none">
              {logo ? (
                <img
                  src={logo}
                  alt={siteName}
                  className="h-9 w-auto object-contain"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-linear-to-br from-amber-400 to-amber-500 flex items-center justify-center p-1.5 shadow-xs shrink-0">
                    <svg viewBox="0 0 40 40" fill="none" className="w-full h-full text-white">
                      <circle cx="16" cy="20" r="9" stroke="white" strokeWidth="3.5" fill="none" />
                      <circle cx="24" cy="20" r="9" stroke="white" strokeWidth="3.5" fill="none" />
                    </svg>
                  </div>
                  <div className="flex items-baseline font-black tracking-tight text-xl font-sans">
                    <span className="text-[#f5a623] mr-1">Exelic</span>
                    <span className="text-[#0053e2]">Gadgets</span>
                  </div>
                </div>
              )}
            </Link>

            <p className="text-xs sm:text-[13px] text-gray-500 leading-relaxed max-w-sm">
              {bio}
            </p>

            <div className="space-y-2 pt-1 text-xs sm:text-[13px]">
              <div className="flex items-center gap-2">
                <Icon icon="solar:phone-calling-linear" className="w-4 h-4 text-[#ffb800] shrink-0" />
                <a
                  href={`tel:${phone.replace(/\s+/g, '')}`}
                  className="text-gray-800 hover:text-[#0053e2] font-semibold transition-colors"
                >
                  {phone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Icon icon="solar:letter-linear" className="w-4 h-4 text-[#ffb800] shrink-0" />
                <a
                  href={`mailto:${email}`}
                  className="text-gray-800 hover:text-[#0053e2] transition-colors"
                >
                  {email}
                </a>
              </div>
            </div>
          </div>

          {/* ── Col 2: Store Locations (3.5 cols) ── */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs sm:text-[13px] font-black text-gray-900 tracking-wider uppercase">
              STORE LOCATIONS
            </h4>
            <div className="border-l-2 border-[#ffb800] pl-3.5 space-y-1.5 text-xs text-gray-600">
              <p className="font-bold text-gray-900 text-xs sm:text-[13px]">
                Nairobi CBD Store
              </p>
              <p className="leading-relaxed">
                {storeAddress}
              </p>
              <p className="font-semibold text-gray-800">
                {phone}
              </p>
              <p className="text-[11px] text-gray-500">
                {storeHours}
              </p>
              <div className="pt-1">
                <a
                  href={mapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-[#0053e2] hover:underline font-semibold text-xs"
                >
                  Open in Google Maps
                </a>
              </div>
            </div>
          </div>

          {/* ── Col 3: About Exelic Gadgets & Deals & Offers (2.5 cols) ── */}
          <div className="lg:col-span-3 space-y-6">
            <div>
              <h4 className="text-xs sm:text-[13px] font-black text-gray-900 tracking-wider uppercase mb-2.5">
                ABOUT EXELIC GADGETS
              </h4>
              <ul className="space-y-1.5 text-xs text-gray-600">
                <li>
                  <Link href="/about" className="hover:text-[#0053e2] transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-[#0053e2] transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="hover:text-[#0053e2] transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/brands" className="hover:text-[#0053e2] transition-colors">
                    Our Brands
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs sm:text-[13px] font-black text-gray-900 tracking-wider uppercase mb-2.5">
                DEALS &amp; OFFERS
              </h4>
              <ul className="space-y-1.5 text-xs text-gray-600">
                <li>
                  <Link href="/deals" className="hover:text-[#0053e2] transition-colors">
                    Deals
                  </Link>
                </li>
                <li>
                  <Link href="/flash-sale" className="hover:text-[#0053e2] transition-colors">
                    Flash Sale
                  </Link>
                </li>
                <li>
                  <Link href="/clearance-sale" className="hover:text-[#0053e2] transition-colors">
                    Clearance Sale
                  </Link>
                </li>
                <li>
                  <Link href="/new" className="hover:text-[#0053e2] transition-colors">
                    New at Exelic
                  </Link>
                </li>
                <li>
                  <Link href="/gift-ideas" className="hover:text-[#0053e2] transition-colors">
                    Gift Ideas
                  </Link>
                </li>
                <li>
                  <Link href="/gaming-deals" className="hover:text-[#0053e2] transition-colors">
                    Gaming Deals
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* ── Col 4: Customer Care (2 cols) ── */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs sm:text-[13px] font-black text-gray-900 tracking-wider uppercase mb-2.5">
              CUSTOMER CARE
            </h4>
            <ul className="space-y-1.5 text-xs text-gray-600">
              <li>
                <Link href="/privacy-policy" className="hover:text-[#0053e2] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-conditions" className="hover:text-[#0053e2] transition-colors">
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-[#0053e2] transition-colors">
                  Refund &amp; Returns Policy
                </Link>
              </li>
              <li>
                <Link href="/warranty-policy" className="hover:text-[#0053e2] transition-colors">
                  Warranty &amp; Repair Policy
                </Link>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* ════════════════════ 3. DYNAMIC MEGA CATEGORY COLUMNS (MENU "footer-1") ════════════════════ */}
      <div className="border-t border-gray-200/80 bg-white relative overflow-hidden py-10 sm:py-12">
        {/* Faint Background Watermark Logo Text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.035] overflow-hidden">
          <div className="flex items-center gap-6 transform -rotate-3 scale-110 sm:scale-125">
            <svg viewBox="0 0 40 40" fill="none" className="w-48 h-48 sm:w-64 sm:h-64 text-gray-900">
              <circle cx="16" cy="20" r="9" stroke="currentColor" strokeWidth="3" fill="none" />
              <circle cx="24" cy="20" r="9" stroke="currentColor" strokeWidth="3" fill="none" />
            </svg>
            <span className="text-7xl sm:text-9xl font-black tracking-tight text-gray-900 font-sans whitespace-nowrap">
              Exelic Gadgets
            </span>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 sm:gap-8">
            {footerColumns.map((col, cIdx) => (
              <div key={cIdx} className="space-y-3">
                <h4 className="text-xs sm:text-[13px] font-black text-gray-900 tracking-wider uppercase">
                  {col.title}
                </h4>
                <ul className="space-y-1.5 text-xs text-gray-600">
                  {col.items.map((item: any, iIdx: number) => (
                    <li key={iIdx}>
                      <Link
                        href={item.url || '#'}
                        className="hover:text-[#0053e2] transition-colors block py-0.5 truncate"
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

      {/* ════════════════════ 4. BOTTOM COPYRIGHT & SOCIAL MEDIA BAR ════════════════════ */}
      <div className="border-t border-gray-200 bg-white py-5">
        <div className="container mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Left: Copyright & Links */}
          <div className="text-xs text-gray-600 flex flex-wrap items-center justify-center md:justify-start gap-x-2 gap-y-1">
            <span>{copyright}</span>
            <span className="hidden sm:inline text-gray-300">·</span>
            <span>{builtBy}</span>
            <span className="hidden sm:inline text-gray-300">·</span>
            <a
              href={googleStoreLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-700 hover:text-[#0053e2] font-semibold transition-colors"
            >
              View our store on Google
            </a>
          </div>

          {/* Right: Circular Outline Social Media Icons */}
          <div className="flex items-center gap-2 shrink-0">
            {socialLinks.map((social, sIdx) => (
              <a
                key={sIdx}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                title={social.label}
                className="w-8 h-8 rounded-full border border-gray-300 hover:border-gray-900 text-gray-700 hover:text-black flex items-center justify-center transition-all hover:scale-105 shadow-2xs"
              >
                <Icon icon={social.icon} className="w-4 h-4" />
              </a>
            ))}
          </div>

        </div>
      </div>

    </footer>
  );
}
