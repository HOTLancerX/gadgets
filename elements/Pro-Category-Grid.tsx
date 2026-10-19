'use client';

/**
 * plugin/gadgets/elements/Pro-Category-Grid.tsx
 *
 * Gadgets Pro-Category Grid Builder Element:
 *  - Title on the LEFT, Category tabs on the RIGHT
 *  - Multiple categories can be selected and display as proportional tabs
 *  - Multi-row responsive product grid below
 *  - Dynamic box style selector (defaults to Gadgets Box 1)
 */

import React from 'react';
import type { BuilderElementDef } from '@/hook';
import {
    Text,
    NumberControl,
} from '@/components/builder/controls';
import CategorySelector from './CategorySelector';
import BoxStyleSelector from './BoxStyleSelector';
import ProCategoryGrid from '../ui/ProCategoryGrid';

const ProCategoryGridElement: BuilderElementDef = {
    type: 'gadgets-pro-category-grid',
    label: 'Gadgets Pro-Category Grid',
    category: 'gadgets',
    icon: 'solar:widget-add-bold-duotone',
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
        grid: {
            columnsDesktop: 5,
            columnsTablet: 3,
            columnsMobile: 2,
            gapDesktop: 4,
            gapTablet: 3,
            gapMobile: 2,
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
                        <NumberControl label="Total Products Per Category" value={value ?? 10} onChange={onChange} min={2} max={48} />
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
            section: 'Responsive Grid Columns',
            controls: [
                {
                    name: 'columnsDesktop',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <NumberControl label="Desktop Columns (≥1024px)" value={value ?? 5} onChange={onChange} min={1} max={12} />
                    ),
                },
                {
                    name: 'columnsTablet',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <NumberControl label="Tablet Columns (768px-1023px)" value={value ?? 3} onChange={onChange} min={1} max={8} />
                    ),
                },
                {
                    name: 'columnsMobile',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <NumberControl label="Mobile Columns (<768px)" value={value ?? 2} onChange={onChange} min={1} max={4} />
                    ),
                },
            ],
        },
        {
            tab: 'Layout',
            section: 'Grid Gaps (0-12)',
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
        const g = element.schema?.grid ?? {};
        const s = element.schema?.style ?? {};
        const a = element.schema?.advanced ?? {};

        let tabs = c.categoryTabs;
        if (!tabs && c.categoryId) {
            tabs = [{ id: c.categoryId, label: 'Category' }];
        }

        return (
            <ProCategoryGrid
                titlePrefix={c.titlePrefix}
                titleHighlight={c.titleHighlight}
                categoryTabs={tabs}
                limit={c.limit}
                boxStyle={c.boxStyle}
                currencySymbol={c.currencySymbol}
                viewAllLink={c.viewAllLink}
                columnsDesktop={g.columnsDesktop ?? 5}
                columnsTablet={g.columnsTablet ?? 3}
                columnsMobile={g.columnsMobile ?? 2}
                gapDesktop={g.gapDesktop ?? 4}
                gapTablet={g.gapTablet ?? 3}
                gapMobile={g.gapMobile ?? 2}
                imageHeightDesktop={g.imageHeightDesktop ?? s.imageHeightDesktop ?? 210}
                imageHeightMobile={g.imageHeightMobile ?? s.imageHeightMobile ?? 170}
                margin={a.margin ?? s.margin}
                padding={a.padding ?? s.padding}
            />
        );
    },
};

export default ProCategoryGridElement;
