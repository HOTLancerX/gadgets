'use client';

/**
 * cms/plugin/gadgets/Header/AccountGadgets.tsx
 *
 * Exelic Gadgets Account component matching screenshot proportions.
 * Displays user icon + "Account" label.
 * - Logged out: Opens Login/Signup modal.
 * - Logged in: Opens rich profile popup with account navigation & sign out.
 */

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { useUser } from '@/context/Provider';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import AuthForm from '@/components/Auth';

const EXPRESS_API = process.env.NEXT_PUBLIC_EXPRESS_API_URL ?? 'https://cms.96s.info';
function getLicenseKey(): string {
  return process.env.NEXT_PUBLIC_LICENSE_KEY ?? '';
}

type ModalMode = 'login' | 'signup' | null;

interface AccountGadgetsProps {
  color?: string;
  className?: string;
}

export default function AccountGadgets({
  color = '#0053e2',
  className = '',
}: AccountGadgetsProps) {
  const { user, refresh } = useUser();
  const router = useRouter();
  const [modal, setModal] = useState<ModalMode>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  // Close popup on outside click
  useEffect(() => {
    if (!popupOpen) return;
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setPopupOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [popupOpen]);

  // Close modal on Escape
  useEffect(() => {
    if (!modal) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModal(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [modal]);

  // Logged IN Dropdown Popup
  if (user) {
    const displayName = user.name || user.email?.split('@')[0] || 'Account';
    const initial = (user.name?.[0] || user.email?.[0] || 'U').toUpperCase();

    return (
      <div className={`relative ${className}`} ref={popupRef}>
        <button
          onClick={() => setPopupOpen(!popupOpen)}
          className="flex flex-col items-center justify-center group cursor-pointer focus:outline-hidden"
          title={displayName}
        >
          <div className="w-6 h-6 flex items-center justify-center">
            {user.image ? (
              <img
                src={user.image}
                alt={displayName}
                className="w-5.5 h-5.5 rounded-full object-cover border border-blue-200"
              />
            ) : (
              <Icon
                icon="solar:user-circle-linear"
                className="w-6 h-6 group-hover:scale-105 transition-transform"
                style={{ color }}
              />
            )}
          </div>
          <span className="text-[11px] font-semibold text-gray-800 group-hover:text-[#0053e2] transition-colors leading-tight mt-0.5 truncate max-w-16.25">
            {user.name ? user.name.split(' ')[0] : 'Account'}
          </span>
        </button>

        {/* User Popup Dropdown */}
        {popupOpen && (
          <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0"
                style={{ backgroundColor: color }}
              >
                {initial}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900 truncate">{displayName}</p>
                <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
              </div>
            </div>

            <div className="py-1 text-xs">
              <Link
                href="/account"
                onClick={() => setPopupOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-gray-700 hover:bg-blue-50/60 hover:text-[#0053e2] transition"
              >
                <Icon icon="solar:user-bold" className="w-4 h-4 text-gray-400" />
                <span>My Account</span>
              </Link>
              <Link
                href="/account/settings"
                onClick={() => setPopupOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-gray-700 hover:bg-blue-50/60 hover:text-[#0053e2] transition"
              >
                <Icon icon="solar:settings-bold" className="w-4 h-4 text-gray-400" />
                <span>Account Settings</span>
              </Link>
              {user.type === 'admin' && (
                <Link
                  href="/admin"
                  onClick={() => setPopupOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-gray-700 hover:bg-blue-50/60 hover:text-[#0053e2] transition"
                >
                  <Icon icon="solar:shield-bold" className="w-4 h-4 text-violet-500" />
                  <span>Admin Panel</span>
                </Link>
              )}
            </div>

            <div className="border-t border-gray-100 pt-1">
              <button
                onClick={async () => {
                  setPopupOpen(false);
                  await fetch(`${EXPRESS_API}/auth/logout`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                      'Content-Type': 'application/json',
                      'x-license-key': getLicenseKey(),
                    },
                  }).catch(() => {});
                  await signOut({ redirect: false });
                  router.replace('/');
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition cursor-pointer"
              >
                <Icon icon="solar:logout-bold" className="w-4 h-4" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Logged OUT Trigger & Modal
  return (
    <>
      <div className={`relative ${className}`}>
        <button
          onClick={() => setModal('login')}
          className="flex flex-col items-center justify-center group cursor-pointer focus:outline-hidden"
          title="Account"
        >
          <Icon
            icon="solar:user-outline"
            className="w-6 h-6 group-hover:scale-105 transition-transform"
            style={{ color }}
          />
          <span className="text-[11px] font-semibold text-gray-800 group-hover:text-[#0053e2] transition-colors leading-tight mt-0.5">
            Account
          </span>
        </button>
      </div>

      {/* Login / Signup Modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModal(null);
          }}
        >
          <div className="relative w-full max-w-md">
            <button
              onClick={() => setModal(null)}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition cursor-pointer"
            >
              <Icon icon="solar:close-circle-bold" className="text-xl" />
            </button>

            <AuthForm mode={modal} />
          </div>
        </div>
      )}
    </>
  );
}