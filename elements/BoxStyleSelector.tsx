'use client';

/**
 * plugin/gadgets/elements/BoxStyleSelector.tsx
 *
 * Dedicated Box Style Selector for Gadgets elements.
 * Dynamically queries all registered product-box hooks across plugins.
 */

import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { getHooks } from '@/hook';

export default function BoxStyleSelector({
    value,
    onChange,
}: {
    value: string;
    onChange: (boxLabel: string) => void;
}) {
    const [boxes, setBoxes] = useState<{ label: string; pluginNx: string }[]>([]);

    useEffect(() => {
        const registered = getHooks('root.pages').filter(
            (p) => p.type === 'product-box' && p.slug === 'dynamic'
        );
        setBoxes(registered.map((b) => ({ label: b.label, pluginNx: b.pluginNx ?? '' })));
    }, []);

    const activeLabel = value || 'Gadgets Box 1';

    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-700 tracking-wide">
                Product Card Box
            </label>
            <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto pr-1">
                {boxes.map((box) => {
                    const isSelected = box.label === activeLabel;
                    return (
                        <button
                            key={`${box.label}::${box.pluginNx}`}
                            type="button"
                            onClick={() => onChange(box.label)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left transition-all cursor-pointer ${
                                isSelected
                                    ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-600/30'
                                    : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50'
                            }`}
                        >
                            <span
                                className={`shrink-0 w-3 h-3 rounded-full border-2 ${
                                    isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300 bg-white'
                                }`}
                            />
                            <div className="flex-1 min-w-0">
                                <p className={`text-xs font-bold leading-tight ${isSelected ? 'text-blue-900' : 'text-gray-800'}`}>
                                    {box.label}
                                </p>
                                <p className="text-[10px] text-gray-400 font-mono truncate">
                                    {box.pluginNx || 'system'}
                                </p>
                            </div>
                            {isSelected && (
                                <Icon icon="solar:check-circle-bold" width={16} className="text-blue-600 shrink-0" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
