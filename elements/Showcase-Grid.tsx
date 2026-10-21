'use client';

/**
 * cms/plugin/gadgets/elements/Showcase-Grid.tsx
 *
 * Exelic Gadgets Showcase Product Grid Builder Element Definition:
 *  - 100% Server-Side Rendered (SSR) on live pages via lib/builderData.tsx & ui/ShowcaseProductGrid.tsx.
 *  - Tab: Content configures Single Category Selection, Product Limit, Currency Symbol, and Section Titles.
 *  - Tab: Style configures Grid Layout Style:
 *      1. 'featured-left': 1 Large Hero Left, 2 Horizontal Right, Bottom 4-Col Grid (Matches Screenshot)
 *      2. 'featured-right': 2 Horizontal Left, 1 Large Hero Right, Bottom 4-Col Grid
 *      3. 'dual-featured': Dual Large Hero Cards Side-by-Side, Bottom 4-Col Grid
 *      4. 'three-featured': 3 Hero Cards Side-by-Side, Bottom 4-Col Grid
 *  - Tab: Advanced configures Margin and Padding.
 */

import React, { useState, useEffect } from 'react';
import type { BuilderElementDef } from '@/hook';
import {
  Text,
  NumberControl,
  Select,
  Url,
  Dimensions,
} from '@/components/builder/controls';
import { xFetch } from '@/lib/express';
import ShowcaseProductGrid from '../ui/ShowcaseProductGrid';

/**
 * Single Category Selector Dropdown for sidebar under Tab: Content
 */
function SingleCategoryDropdown({
  value = 'all',
  onChange,
}: {
  value?: string;
  onChange: (val: string) => void;
}) {
  const [cats, setCats] = useState<{ value: string; label: string }[]>([
    { value: 'all', label: 'All Products (Latest / Any Category)' },
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    // Fetch categories via standard builder endpoint
    xFetch('/builder-post/cats?type=product-category')
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data.cats) ? data.cats : [];
        if (list.length > 0) {
          const formatted = list.map((c: any) => ({
            value: String(c._id || c.id),
            label: c.title || c.name || 'Category',
          }));
          setCats([{ value: 'all', label: 'All Products (Latest / Any Category)' }, ...formatted]);
        }
      })
      .catch(() => {
        // Fallback fetch
        fetch('/api/admin-posts?type=product-category')
          .then((r) => r.json())
          .then((d) => {
            const list = d.categories || d.cats || [];
            if (Array.isArray(list) && list.length > 0) {
              const formatted = list.map((c: any) => ({
                value: String(c._id || c.id),
                label: c.title || c.name || 'Category',
              }));
              setCats([{ value: 'all', label: 'All Products (Latest / Any Category)' }, ...formatted]);
            }
          })
          .catch(() => {});
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-1">
      <Select
        label="Select Product Category"
        value={value || 'all'}
        onChange={onChange}
        options={cats}
      />
      {loading && (
        <span className="text-[10px] text-blue-600 block animate-pulse">
          Loading store categories...
        </span>
      )}
    </div>
  );
}

const showcaseGridElement: BuilderElementDef = {
  type: 'gadgets-showcase-grid',
  label: 'Showcase Product Grid',
  category: 'gadgets',
  icon: 'solar:widget-add-bold',
  schema: {
    content: {
      titlePrefix: 'A Watch For',
      titleHighlight: 'Everyone',
      viewAllLink: '',
      categoryId: 'all',
      limit: 7,
      currencySymbol: 'KSh',
    },
    style: {
      gridStyle: 'featured-left',
    },
    advanced: {
      margin: { top: 0, right: 0, bottom: 30, left: 0, unit: 'px' },
      padding: { top: 0, right: 0, bottom: 0, left: 0, unit: 'px' },
    },
  },

  controls: [
    // ══════════════════════ TAB: CONTENT ══════════════════════
    {
      tab: 'Content',
      section: 'Category & Limit',
      controls: [
        {
          name: 'categoryId',
          label: 'Category',
          responsive: false,
          render: (value: any, onChange: any) => (
            <SingleCategoryDropdown value={value} onChange={onChange} />
          ),
        },
        {
          name: 'limit',
          label: 'Product Limit',
          responsive: false,
          render: (value: any, onChange: any) => (
            <NumberControl
              label="Product Limit"
              value={value ?? 7}
              onChange={onChange}
              min={3}
              max={30}
            />
          ),
        },
        {
          name: 'currencySymbol',
          label: 'Currency Symbol',
          responsive: false,
          render: (value: any, onChange: any) => (
            <Text
              label="Currency Symbol"
              value={value ?? 'KSh'}
              onChange={onChange}
              placeholder="e.g. KSh, $, ৳"
            />
          ),
        },
      ],
    },

    {
      tab: 'Content',
      section: 'Header Titles',
      controls: [
        {
          name: 'titlePrefix',
          label: 'Title Prefix (Black Text)',
          responsive: false,
          render: (value: any, onChange: any) => (
            <Text
              label="Title Prefix"
              value={value ?? 'A Watch For'}
              onChange={onChange}
              placeholder="e.g. A Watch For"
            />
          ),
        },
        {
          name: 'titleHighlight',
          label: 'Title Highlight (Gradient Text)',
          responsive: false,
          render: (value: any, onChange: any) => (
            <Text
              label="Title Highlight"
              value={value ?? 'Everyone'}
              onChange={onChange}
              placeholder="e.g. Everyone"
            />
          ),
        },
        {
          name: 'viewAllLink',
          label: 'View All Link (Optional)',
          responsive: false,
          render: (value: any, onChange: any) => (
            <Url
              label="View All Link"
              value={value ?? ''}
              onChange={onChange}
              placeholder="/category/watches"
            />
          ),
        },
      ],
    },

    // ══════════════════════ TAB: STYLE ══════════════════════
    {
      tab: 'Style',
      section: 'Grid Layout Style',
      controls: [
        {
          name: 'gridStyle',
          label: 'Showcase Grid Style',
          responsive: false,
          render: (value: any, onChange: any) => (
            <Select
              label="Grid Layout Style"
              value={value ?? 'featured-left'}
              onChange={onChange}
              options={[
                {
                  value: 'featured-left',
                  label: 'Style 1: Featured Left (1 Big Left + 2 Right + Bottom 4-Col)',
                },
                {
                  value: 'featured-right',
                  label: 'Style 2: Featured Right (2 Left + 1 Big Right + Bottom 4-Col)',
                },
                {
                  value: 'dual-featured',
                  label: 'Style 3: Dual Large Hero (2 Big Top + Bottom 4-Col)',
                },
                {
                  value: 'three-featured',
                  label: 'Style 4: Three Hero Cards (3 Big Top + Bottom 4-Col)',
                },
              ]}
            />
          ),
        },
      ],
    },

    // ══════════════════════ TAB: ADVANCED ══════════════════════
    {
      tab: 'Advanced',
      section: 'Spacing',
      controls: [
        {
          name: 'margin',
          label: 'Margin',
          responsive: true,
          render: (value: any, onChange: any) => (
            <Dimensions type="margin" label="Margin" value={value} onChange={onChange} />
          ),
        },
        {
          name: 'padding',
          label: 'Padding',
          responsive: true,
          render: (value: any, onChange: any) => (
            <Dimensions type="padding" label="Padding" value={value} onChange={onChange} />
          ),
        },
      ],
    },
  ],

  render: (element: any) => {
    const s = element?.schema || {};
    const c = s.content || {};
    const st = s.style || {};
    const a = s.advanced || {};

    return (
      <ShowcaseProductGrid
        titlePrefix={c.titlePrefix}
        titleHighlight={c.titleHighlight}
        viewAllLink={c.viewAllLink}
        categoryId={c.categoryId}
        limit={c.limit}
        gridStyle={st.gridStyle}
        currencySymbol={c.currencySymbol}
        margin={a.margin}
        padding={a.padding}
      />
    );
  },
};

export default showcaseGridElement;
