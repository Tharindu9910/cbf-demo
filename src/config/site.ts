/**
 * Site-wide facts: brand, navigation, SEO defaults and the organisation data
 * behind the JSON-LD. One file, so the copy the page shows and the copy search
 * engines read can't drift apart.
 *
 * Fields marked TODO are placeholders until the business confirms them. Leave
 * them empty rather than guessing — empty values are dropped from the JSON-LD,
 * whereas a wrong address or phone number is worse for the site than none.
 */

import { url } from "./url";
/**
 * The brand's social profiles, in the footer's order. The company profile
 * gives every handle as `ceylonfuturebeverages`; these are the standard URLs
 * for it. TODO: confirm the YouTube (@handle) and LinkedIn (company page) URLs.
 * An empty `href` shows the name without a link and drops it from `sameAs`.
 */
export const SOCIAL_LINKS = [
  { label: "Facebook", icon: "facebook", href: "https://www.facebook.com/ceylonfuturebeverages" },
  { label: "YouTube", icon: "youtube", href: "https://www.youtube.com/@ceylonfuturebeverages" },
  { label: "Instagram", icon: "instagram", href: "https://www.instagram.com/ceylonfuturebeverages/" },
  { label: "LinkedIn", icon: "linkedin", href: "https://www.linkedin.com/company/ceylonfuturebeverages" },
  { label: "TikTok", icon: "tiktok", href: "https://www.tiktok.com/@ceylonfuturebeverages" },
] as const;

export const SITE = {
  name: "Ceylon Future Beverages",
  shortName: "CFB",
  brand: "Thynkers Lyquid",
  locale: "en_LK",
  lang: "en",
  themeColor: "#0d2b12",

  /**
   * The company leads every default: Thynkers Lyquid is CFB's first product
   * line, not the whole site. Claims come from `docs/company-profile.md` only.
   */
  title: "Ceylon Future Beverages | Natural Beverages from Sri Lanka",
  description:
    "Ceylon Future Beverages turns Sri Lanka's botanicals into natural, functional drinks for the world. Meet Thynkers Lyquid, our Gotukola sparkling drink.",
  /** The company in one line (company profile, About Us), for the JSON-LD. */
  about:
    "Ceylon Future Beverages (CFB) is an innovation-driven beverage company transforming Sri Lanka's rich natural resources into high-value products for global markets.",

  /** The registered company name, as the footer shows it. */
  legalName: "Ceylon Future Beverages (Pvt) Limited",
  tagline: "Nature. Reimagined.",
  alternateName: "CFB",
  founder: { name: "Suresh Jayarathna", jobTitle: "Founder" },

  /** The Thynkers Lyquid brand, as the company profile introduces it. */
  brandSlogan: "Fuel the Thought",
  brandDescription:
    "Thynkers Lyquid is a Gotukola based beverage crafted to support clear thinking and mindful energy, designed for moments that demand focus without the noise of conventional energy drinks.",

  /** Social profile URLs, for `sameAs`. Filled from `SOCIAL_LINKS`. */
  sameAs: SOCIAL_LINKS.map((s) => s.href as string).filter(Boolean),

  contact: {
    email: "info@ceylonfuturebeverages.com",
    telephone: "+94 77 517 4952",
  },

  /** From the company profile. TODO: the postal code. */
  address: {
    streetAddress: "124/1, Galwarama",
    addressLocality: "Alawwa",
    addressRegion: "",
    postalCode: "",
    addressCountry: "LK",
  },

  /** Search-engine ownership verification tokens. TODO: paste from each console. */
  verification: {
    google: "",
    bing: "",
  },
} as const;

/** The address on one line, for the footer and the Contact page. Empty parts are skipped. */
export const FULL_ADDRESS = [SITE.address.streetAddress, SITE.address.addressLocality, "Sri Lanka"]
  .filter(Boolean)
  .join(", ");

/**
 * The header's links. "FAQs" had no destination in the Next build (`#`); it
 * now opens the FAQ section at the foot of the Contact page (`#faq`) until a
 * page of its own exists. Page links keep the trailing
 * slash (`trailingSlash: "always"` in astro.config.mjs).
 */
export const NAV_LINKS = [
  { label: "Home", href: url("/") },
  { label: "About Us", href: url("/about/") },
  { label: "Our Products", href: url("/products/") },
  { label: "FAQs", href: url("/contact/#faq") },
] as const;

/** The FAQs page. TODO: set to "/faqs/" once it exists; until then "More FAQs" links are hidden. */
export const FAQ_HREF = "";

/** The Contact page. Every enquiry link (see `inquiryHref`) points here. */
export const CONTACT_HREF = url("/contact/");

/**
 * What a visitor is getting in touch about. `store` lands on "Where to Buy";
 * the rest open the form with that inquiry type selected.
 */
export type InquiryIntent = "store" | "bulk" | "mixed" | "distribution" | "general" | "feedback";

/** The Contact page section each intent lands on. */
const INTENT_TARGET: Record<InquiryIntent, string> = {
  store: "where-to-buy",
  bulk: "form",
  mixed: "form",
  distribution: "form",
  general: "form",
  feedback: "form",
};

/** A Mixed Pack's mix as one query value: `matcha-original:2,pineapple:4`. Empty flavours are left out. */
export function encodeMix(mix: { flavour: string; count: number }[]) {
  return mix
    .filter((m) => m.count > 0)
    .map((m) => `${m.flavour}:${m.count}`)
    .join(",");
}

/**
 * A link to the Contact page for one kind of enquiry: `intent` says what the
 * visitor wants, `product` and `pack` (ids from `content/flavours`) say what.
 * The page's form reads them from the query string to pre-fill itself.
 */
export function inquiryHref({
  intent,
  product,
  pack,
  quantity,
  mix,
  topic,
}: {
  intent: InquiryIntent;
  product?: string;
  pack?: string;
  /** How many, from the product page's quantity stepper. */
  quantity?: number;
  /** A Mixed Pack's cans per flavour. */
  mix?: { flavour: string; count: number }[];
  /** Picks a more specific form template than the intent's (`FORM_TEMPLATES` in config/contact.ts). */
  topic?: "stockist" | "review";
}) {
  const query = new URLSearchParams({ intent });
  if (product) query.set("product", product);
  if (pack) query.set("pack", pack);
  if (quantity && quantity > 1) query.set("quantity", String(quantity));
  if (mix?.length) query.set("mix", encodeMix(mix));
  if (topic) query.set("topic", topic);
  return `${CONTACT_HREF}?${query}#${INTENT_TARGET[intent]}`;
}

/** The footer's "Quick Links": the header's pages, then Where to Buy and Contact. */
export const FOOTER_LINKS = [
  ...NAV_LINKS.map((link) =>
    link.label === "Our Products" ? { ...link, label: "Products" } : link,
  ),
  { label: "Where to Buy", href: inquiryHref({ intent: "store" }) },
  { label: "Contact", href: CONTACT_HREF },
] as const;
