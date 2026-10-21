/**
 * plugin/gadgets/index.ts — Exelic Gadgets plugin registry.
 */

import { addHook, addBuilderElement, type PluginMeta } from "@/hook";
import HeaderGadgets from "./Header/Header";
import FooterGadgets from "./Footer/Footer";
import proSliderElement from "./elements/Pro-Slider";
import proMainSliderElement from "./elements/Pro-Main-Slider";
import gadgetsGridElement from "./elements/Grid";
import proCategoryElement from "./elements/Pro-Category";
import proCategoryGridElement from "./elements/Pro-Category-Grid";
import exploreProductsElement from "./elements/Explore-Products";
import offerAccordionElement from "./elements/Offer-Accordion";
import highlightsElement from "./elements/Highlights";
import posterGridElement from "./elements/Poster-Grid";
import showcaseGridElement from "./elements/Showcase-Grid";
import brandElement from "./elements/Brand";
import GadgetsBox1 from "./box/Box-1";
import GadgetsBox2 from "./box/Box-2";
import GadgetsCategoryLayout from "./product-category/Layout";
import GadgetsBrandLayout from "./product-brand/Layout";
import GadgetsProductLayout from "./product/Layout";

export const PLUGINS: PluginMeta = {
    nx:          "gadgets",
    name:        "Gadgets",
    version:     "1.0.0",
    description: "Exelic Gadgets header with proportional mega menu, instant search, and integrated cart & account actions, plus branded trust footer, Pro-Slider product tabs, Pro Main Slider hero peek carousel, Pro-Category Slider & Grid, Explore Products with interactive color swatches, Offer Accordion Banner Slider, Highlights Grid, Poster Grid, Showcase Product Grid, and Gadgets Boxes 1 & 2.",
    author:      "System",
    path:        "https://github.com/HOTLancerX/gadgets.git",
    icon:        "solar:devices-bold-duotone",
    color:       "from-blue-600 to-amber-500",
};

export function register() {
    // ── Builder Elements ──
    addBuilderElement(proMainSliderElement, PLUGINS.nx);
    addBuilderElement(proSliderElement, PLUGINS.nx);
    addBuilderElement(gadgetsGridElement, PLUGINS.nx);
    addBuilderElement(proCategoryElement, PLUGINS.nx);
    addBuilderElement(proCategoryGridElement, PLUGINS.nx);
    addBuilderElement(exploreProductsElement, PLUGINS.nx);
    addBuilderElement(offerAccordionElement, PLUGINS.nx);
    addBuilderElement(highlightsElement, PLUGINS.nx);
    addBuilderElement(posterGridElement, PLUGINS.nx);
    addBuilderElement(showcaseGridElement, PLUGINS.nx);
    addBuilderElement(brandElement, PLUGINS.nx);

    // ── Header, Footer & Product Boxes ──
    addHook("root.pages", [
        {
            key: "gadgets-header",
            label: "Gadgets Header",
            type: "header",
            slug: "layout",
            style: "left",
            position: 36,
            active: true,
            component: HeaderGadgets,
        },
        {
            key: "gadgets-footer",
            label: "Gadgets Footer",
            type: "footer",
            slug: "layout",
            style: "left",
            position: 36,
            active: true,
            component: FooterGadgets,
        },
        {
            key: "gadgets-box-1",
            label: "Gadgets Box 1",
            type: "product-box",
            slug: "dynamic",
            style: "left",
            position: 50,
            active: true,
            component: GadgetsBox1,
        },
        {
            key: "gadgets-box-2",
            label: "Gadgets Box 2 (Color Swatches)",
            type: "product-box",
            slug: "dynamic",
            style: "left",
            position: 51,
            active: true,
            component: GadgetsBox2,
        },
        {
            key: "gadgets-product-category",
            label: "Gadgets Category Layout",
            type: "product-category",
            slug: "dynamic",
            style: "left",
            position: 30,
            active: true,
            component: GadgetsCategoryLayout,
        },
        {
            key: "gadgets-brand",
            label: "Gadgets Brand Layout",
            type: "brands",
            slug: "dynamic",
            style: "left",
            position: 30,
            active: true,
            component: GadgetsBrandLayout,
        },
        {
            key: "gadgets-product",
            label: "Gadgets Product Layout",
            type: "product",
            slug: "dynamic",
            style: "left",
            position: 30,
            active: true,
            component: GadgetsProductLayout,
        },
    ], PLUGINS.nx);
}
