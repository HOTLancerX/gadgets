'use client';

/**
 * plugin/gadgets/elements/Pro-Category.tsx
 *
 * Gadgets Pro-Category Carousel Builder Element:
 *  - Title on the LEFT, Category tabs on the RIGHT
 *  - Multiple categories can be selected and display as proportional tabs
 *  - Product list below dynamically switches with the selected category tab
 *  - Responsive slides in one line across Desktop, Tablet, and Mobile
 *  - Dynamic box style selector (defaults to Gadgets Box 1)
 *  - Powered by Embla Carousel
 */

import React from 'react';
import type { BuilderElementDef } from '@/hook';
import {
    Text,
    NumberControl,
    Toggle,
} from '@/components/builder/controls';
import CategorySelector from './CategorySelector';
import BoxStyleSelector from './BoxStyleSelector';
import ProCategorySlider from '../ui/ProCategorySlider';

const ProCategoryElement: BuilderElementDef = {
    type: 'gadgets-pro-category',
    label: 'Gadgets Pro-Category Slider',
    category: 'gadgets',
    icon: 'solar:slider-vertical-bold-duotone',
    schema: {
        content: {
            titlePrefix: 'Find your',
            titleHighlight: 'Sound',
            categoryTabs: [
                { id: 'all', label: 'New in' },
            ],
            limit: 10,
            boxStyle: 'Gadgets Box 1',
            viewAllLink: '',
            currencySymbol: 'KSh',
        },
        slider: {
            slidesDesktop: 5,
            slidesTablet: 3,
            slidesMobile: 1.5,
            gapDesktop: 4,
            gapTablet: 3,
            gapMobile: 2,
            showArrows: true,
        },
    },

    controls: [
        {
            tab: 'Content',
            section: 'Header & Categories',
            controls: [
                {
                    name: 'titlePrefix',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <Text label="Title Prefix (Left)" value={value ?? ''} onChange={onChange} />
                    ),
                },
                {
                    name: 'titleHighlight',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <Text label="Title Highlight (Gradient)" value={value ?? ''} onChange={onChange} />
                    ),
                },
                {
                    name: 'categoryTabs',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <CategorySelector value={value ?? []} onChange={onChange} />
                    ),
                },
                {
                    name: 'limit',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <NumberControl label="Products Per Category" value={value ?? 10} onChange={onChange} min={2} max={48} />
                    ),
                },
                {
                    name: 'boxStyle',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <BoxStyleSelector value={value ?? ''} onChange={onChange} />
                    ),
                },
                {
                    name: 'currencySymbol',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <Text label="Currency Symbol (e.g. KSh, $, ৳)" value={value ?? 'KSh'} onChange={onChange} />
                    ),
                },
                {
                    name: 'viewAllLink',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <Text label="View All URL" value={value ?? ''} onChange={onChange} />
                    ),
                },
            ],
        },
        {
            tab: 'Layout',
            section: 'Responsive Slides In One Line',
            controls: [
                {
                    name: 'slidesDesktop',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <NumberControl label="Desktop Slides (≥1024px)" value={value ?? 5} onChange={onChange} min={1} max={12} />
                    ),
                },
                {
                    name: 'slidesTablet',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <NumberControl label="Tablet Slides (768px-1023px)" value={value ?? 3} onChange={onChange} min={1} max={8} />
                    ),
                },
                {
                    name: 'slidesMobile',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <NumberControl label="Mobile Slides (<768px)" value={value ?? 1.5} onChange={onChange} min={1} max={6} />
                    ),
                },
            ],
        },
        {
            tab: 'Layout',
            section: 'Slide Gaps & Navigation',
            controls: [
                {
                    name: 'gapDesktop',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <NumberControl label="Desktop Gap" value={value ?? 4} onChange={onChange} min={0} max={12} />
                    ),
                },
                {
                    name: 'gapTablet',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <NumberControl label="Tablet Gap" value={value ?? 3} onChange={onChange} min={0} max={12} />
                    ),
                },
                {
                    name: 'gapMobile',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <NumberControl label="Mobile Gap" value={value ?? 2} onChange={onChange} min={0} max={12} />
                    ),
                },
                {
                    name: 'showArrows',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <Toggle label="Show Navigation Arrows" value={value !== false} onChange={onChange} />
                    ),
                },
            ],
        },
        {
            tab: 'Layout',
            section: 'Image Heights (px)',
            controls: [
                {
                    name: 'imageHeightDesktop',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <NumberControl label="Desktop Image Height (px)" value={value ?? 210} onChange={onChange} min={80} max={400} />
                    ),
                },
                {
                    name: 'imageHeightMobile',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <NumberControl label="Mobile Image Height (px)" value={value ?? 170} onChange={onChange} min={80} max={300} />
                    ),
                },
            ],
        },
    ],

    render: (element: any) => {
        const c = element.schema?.content ?? {};
        const sl = element.schema?.slider ?? {};
        const s = element.schema?.style ?? {};
        const a = element.schema?.advanced ?? {};

        // Backward compatibility if single categoryId was stored previously
        let tabs = c.categoryTabs;
        if (!tabs && c.categoryId) {
            tabs = [{ id: c.categoryId, label: 'Category' }];
        }

        return (
            <ProCategorySlider
                titlePrefix={c.titlePrefix}
                titleHighlight={c.titleHighlight}
                categoryTabs={tabs}
                limit={c.limit}
                boxStyle={c.boxStyle}
                currencySymbol={c.currencySymbol}
                viewAllLink={c.viewAllLink}
                slidesDesktop={sl.slidesDesktop ?? 5}
                slidesTablet={sl.slidesTablet ?? 3}
                slidesMobile={sl.slidesMobile ?? 1.5}
                gapDesktop={sl.gapDesktop ?? 4}
                gapTablet={sl.gapTablet ?? 3}
                gapMobile={sl.gapMobile ?? 2}
                imageHeightDesktop={sl.imageHeightDesktop ?? s.imageHeightDesktop ?? 210}
                imageHeightMobile={sl.imageHeightMobile ?? s.imageHeightMobile ?? 170}
                showArrows={sl.showArrows !== false}
                margin={a.margin ?? s.margin}
                padding={a.padding ?? s.padding}
            />
        );
    },
};

export default ProCategoryElement;
