'use client';

/**
 * cms/plugin/gadgets/elements/Brand.tsx
 *
 * Gadgets Brand Directory Builder Element:
 *  - Matches the "Shop Technology Brands in Kenya" design
 *  - Top badge, heading, description
 *  - Search input, sorting (A-Z, Z-A, Most Products, Least Products)
 *  - A-Z alphabet letter filter bar with disabled states for empty letters
 *  - Counter row
 *  - Responsive 5-column brand card grid with brand logos & product counts
 *  - Dynamic permalink routing
 */

import React from 'react';
import type { BuilderElementDef } from '@/hook';
import {
    Text,
    Toggle,
    ColorPickerPopup,
    Dimensions,
} from '@/components/builder/controls';
import BrandDirectory from '../ui/BrandDirectory';

const BrandElement: BuilderElementDef = {
    type: 'gadgets-brand',
    label: 'Brand Directory',
    category: 'gadgets',
    icon: 'solar:tag-bold-duotone',
    schema: {
        content: {
            badgeText: 'BRAND DIRECTORY',
            title: 'Shop Technology Brands in Kenya',
            description: "Browse every technology brand available at Exelic Gadgets, including smartphones, laptops, gaming, audio, wearables and accessories. Search or browse A-Z to shop each brand's complete catalogue in Kenya.",
            searchPlaceholder: 'Search brands, e.g. Apple or Samsung',
            catalogNote: 'All catalogue brands, including new arrivals',
            hideEmptyBrands: false,
        },
        style: {
            accentColor: '#0053e2',
        },
    },

    controls: [
        {
            tab: 'Content',
            section: 'Header & Text',
            controls: [
                {
                    name: 'badgeText',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <Text label="Badge Text (Uppercase)" value={value ?? ''} onChange={onChange} />
                    ),
                },
                {
                    name: 'title',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <Text label="Directory Title" value={value ?? ''} onChange={onChange} />
                    ),
                },
                {
                    name: 'description',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <Text label="Description / Subtitle" value={value ?? ''} onChange={onChange} />
                    ),
                },
                {
                    name: 'searchPlaceholder',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <Text label="Search Placeholder" value={value ?? ''} onChange={onChange} />
                    ),
                },
                {
                    name: 'catalogNote',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <Text label="Catalog Note (Right of brand count)" value={value ?? ''} onChange={onChange} />
                    ),
                },
                {
                    name: 'hideEmptyBrands',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <Toggle label="Hide Brands with 0 Products" value={value === true} onChange={onChange} />
                    ),
                },
            ],
        },
        {
            tab: 'Style',
            section: 'Accent & Theme',
            controls: [
                {
                    name: 'accentColor',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <ColorPickerPopup label="Accent Color" value={value ?? '#0053e2'} onChange={onChange} />
                    ),
                },
            ],
        },
        {
            tab: 'Advanced',
            section: 'Spacing',
            controls: [
                {
                    name: 'margin',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <Dimensions label="Margin (px)" type="margin" value={value} onChange={onChange} />
                    ),
                },
                {
                    name: 'padding',
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <Dimensions label="Padding (px)" type="padding" value={value} onChange={onChange} />
                    ),
                },
            ],
        },
    ],

    render: (element: any) => {
        const c = element.schema?.content ?? {};
        const s = element.schema?.style ?? {};
        const a = element.schema?.advanced ?? {};

        return (
            <BrandDirectory
                badgeText={c.badgeText}
                title={c.title}
                description={c.description}
                searchPlaceholder={c.searchPlaceholder}
                catalogNote={c.catalogNote}
                hideEmptyBrands={c.hideEmptyBrands}
                accentColor={s.accentColor}
                margin={a.margin ?? s.margin}
                padding={a.padding ?? s.padding}
            />
        );
    },
};

export default BrandElement;
