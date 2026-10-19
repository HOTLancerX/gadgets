'use client';

/**
 * plugin/gadgets/elements/Explore-Products.tsx
 *
 * Gadgets Explore Products Builder Element:
 *  - "Explore our products" header with side arrow controls
 *  - Responsive product slider with Box-2 card style
 *  - Interactive color pattern swatches that swap device images
 *  - Multi-category filter tabs support
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
import ExploreProductsSlider from '../ui/ExploreProductsSlider';

const ExploreProductsElement: BuilderElementDef = {
    type: 'gadgets-explore-products',
    label: 'Gadgets Explore Products',
    category: 'gadgets',
    icon: 'solar:smart-phone-bold-duotone',
    schema: {
        content: {
            titlePrefix: 'Explore our',
            titleHighlight: 'products',
            categoryTabs: [],
            limit: 10,
            boxStyle: 'Gadgets Box 2',
            viewAllLink: '',
            currencySymbol: 'KSh',
        },
        slider: {
            slidesDesktop: 4,
            slidesTablet: 2.5,
            slidesMobile: 1.3,
            gapDesktop: 4,
            gapTablet: 3,
            gapMobile: 2,
            showArrows: true,
            imageHeightDesktop: 210,
            imageHeightMobile: 170,
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
                        <Text label="Title Prefix" value={value ?? ''} onChange={onChange} />
                    ),
                },
                {
                    name: 'titleHighlight',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <Text label="Title Highlight" value={value ?? ''} onChange={onChange} />
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
                        <NumberControl label="Product Limit" value={value ?? 10} onChange={onChange} min={2} max={48} />
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
                        <NumberControl label="Desktop Slides (≥1024px)" value={value ?? 4} onChange={onChange} min={1} max={12} />
                    ),
                },
                {
                    name: 'slidesTablet',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <NumberControl label="Tablet Slides (768px-1023px)" value={value ?? 2.5} onChange={onChange} min={1} max={8} />
                    ),
                },
                {
                    name: 'slidesMobile',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <NumberControl label="Mobile Slides (<768px)" value={value ?? 1.3} onChange={onChange} min={1} max={4} />
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
                        <Toggle label="Show Side Navigation Arrows" value={value !== false} onChange={onChange} />
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

        let tabs = c.categoryTabs;
        if (!tabs && c.categoryId) {
            tabs = [{ id: c.categoryId, label: 'Category' }];
        }

        return (
            <ExploreProductsSlider
                titlePrefix={c.titlePrefix}
                titleHighlight={c.titleHighlight}
                categoryTabs={tabs}
                limit={c.limit}
                boxStyle={c.boxStyle}
                currencySymbol={c.currencySymbol}
                viewAllLink={c.viewAllLink}
                slidesDesktop={sl.slidesDesktop ?? 4}
                slidesTablet={sl.slidesTablet ?? 2.5}
                slidesMobile={sl.slidesMobile ?? 1.3}
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

export default ExploreProductsElement;
