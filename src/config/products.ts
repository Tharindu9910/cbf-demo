/**
 * Copy and facts shared by the Products pages (`/products/` and each
 * `/products/<id>/`). Per-product copy lives in `content/flavours/*.json`;
 * what the whole range has in common lives here, once.
 *
 * As on the About page, an empty value hides what depends on it: a FAQ
 * without an answer, a retailer list with no logos. Nothing ships as a
 * placeholder.
 */
import type { ImageMetadata } from "astro";
import { url } from "./url";

/** Name, per 100 ml, per 250 ml can; `sub` rows sit indented under their parent. */
export interface NutritionRow {
  name: string;
  per100: string;
  perServing: string;
  sub?: boolean;
}

/**
 * The label's nutrition panel. The company profile gives the same figures for
 * every flavour. TODO: confirm per flavour; a flavour with its own panel sets
 * `nutrition` in its JSON and that wins.
 */
export const NUTRITION: NutritionRow[] = [
  { name: "Energy", per100: "30 kcal", perServing: "75 kcal" },
  { name: "Protein", per100: "0.1 g", perServing: "0.25 g" },
  { name: "Total Fat", per100: "0 g", perServing: "0 g" },
  { name: "Saturated Fat", per100: "0 g", perServing: "0 g", sub: true },
  { name: "Carbohydrate", per100: "7.5 g", perServing: "18.75 g" },
  { name: "Total Sugar", per100: "7.1 g", perServing: "17.75 g", sub: true },
  { name: "Sodium (Na)", per100: "4.66 mg", perServing: "11.65 mg" },
  { name: "Salt (NaCl)", per100: "0 g", perServing: "0 g" },
  { name: "Calcium (Ca)", per100: "5.62 mg", perServing: "14.05 mg" },
  { name: "Dietary Fiber", per100: "0.1 g", perServing: "0.25 g" },
  { name: "Vitamin B12", per100: "2 µg", perServing: "5 µg" },
];

/** The Matcha Original label's ingredient line, as the Gotu Kola section prints it. */
export const MATCHA_INGREDIENTS =
  "Carbonated water, Sugar, Gotu Kola Extract, Citric Acid (INS 330), Matcha Natural Flavour, L-Theanine, Vitamin B12.";

/** Storage and care, as every label prints it. */
export const STORAGE = [
  "Store in a cool, dry place, away from direct sunlight.",
  "Refrigerate after opening and drink within 2 days.",
  "Sediment is normal for a drink made with natural ingredients.",
];

/** The "Zero …" claims printed on every label. */
export const FREE_FROM = [
  "Artificial flavours",
  "Artificial colours",
  "Added preservatives",
  "Alcohol",
];

/** The label's advisory, word for word in meaning. */
export const ADVISORY =
  "Not recommended for children under 12 years, or for pregnant and breastfeeding women.";

/** The listing page's opening. */
export const LISTING = {
  seo: {
    title: "Our Products | Thynkers Lyquid Gotukola Drinks",
    description:
      "Explore Ceylon Future Beverages' collections, starting with Thynkers Lyquid: sparkling, gotu kola-infused drinks in Matcha Original, Mango & Passion and Pineapple, plus a Mixed Pack of any six cans. More coming soon. Made in Sri Lanka.",
  },
  eyebrow: "Our Products",
  title: "Crafted from Ceylon’s Nature",
  intro: "Discover our range of natural beverages, made in Sri Lanka.",
  ctas: {
    range: "Explore Our Range",
    ingredients: { label: "Our Ingredients", href: url("/#gotu-kola") },
  },
  /** The heading over every collection under the hero. */
  collection: {
    title: "Our Collections",
    /** The pills beside the heading, after "All": one per kind of drink. Each collection names its `group`. */
    filters: [
      { id: "sparkling", label: "Sparkling Drinks" },
      { id: "energy", label: "Energy Drinks" },
    ],
  },
  /** The next collection's teaser, after Thynkers Lyquid. No name or picture until it launches. */
  comingSoon: {
    /** Its pill. TODO: no collection is confirmed as an energy drink yet; the teaser stands in. */
    group: "energy",
    eyebrow: "Coming Soon",
    title: "Something new is brewing",
    body: "A completely different drink, from the same Ceylon roots. Watch this space.",
  },
  /** One pill per `category` in the flavours collection, after "All". Thynkers Lyquid only. */
  filters: [
    { id: "fruit", label: "Fruit Drinks" },
    { id: "tea", label: "Tea Drinks" },
    { id: "bundle", label: "Bundles" },
  ],
  /** The banner that closes the page. */
  bulk: {
    eyebrow: "For cafés, offices & retailers",
    title: "Good things are better in bulk.",
    body: "Bring Ceylon Future Beverages to your workplace, café, or retail space.",
    enquire: "Enquire About Bulk Orders",
    retailer: "Find a Retailer",
  },
};

/** A category's name as the card's eyebrow. */
export const categoryLabel = (id: string) => LISTING.filters.find((f) => f.id === id)?.label ?? "";

/**
 * The brands on sale, each a collection on the listing with its banner over
 * its grid. Only real brands go here: the product pages find theirs by name.
 * A collection still to launch is `LISTING.comingSoon`.
 */
export const BRANDS = [
  {
    id: "thynkers-lyquid",
    name: "Thynkers Lyquid",
    /** Its pill on the listing, from `LISTING.collection.filters`. */
    group: "sparkling",
    line: "Fuel the Thought",
    body: "Sparkling, gotu kola–infused drinks crafted for clear thinking and mindful energy.",
    badges: ["Real Gotu Kola", "No Preservatives", "No Artificial Colours"],
  },
] as const;

/**
 * The detail page's benefits row. `confirmed: false` keeps a claim off the
 * page until the business signs it off: at 7.1 g sugar per 100 ml the drink is
 * above common "low sugar" thresholds, so the comparison needs substantiating.
 */
export const BENEFITS = [
  { icon: "sprout", title: "Real Gotu Kola", note: "Sri Lankan gotu kola extract in every can", confirmed: true },
  { icon: "flask", title: "No Preservatives", note: "A 12-month shelf life without them", confirmed: true },
  { icon: "palette", title: "No Artificial Colours", note: "Clean, honest colour", confirmed: true },
  { icon: "candy", title: "Less Sugar", note: "Than regular sodas", confirmed: false },
  { icon: "map-pin", title: "Made in Sri Lanka", note: "Crafted with Ceylon\u2019s botanicals", confirmed: true },
] as const;

/**
 * The quick questions on every product page. TODO: an answer for caffeine.
 * An entry with no answer is not shown.
 */
export const FAQS = [
  { q: "Does it contain caffeine?", a: "" },
  {
    q: "Is it suitable for kids?",
    a: "Thynkers Lyquid is not recommended for children under 12 years, or for pregnant and breastfeeding women.",
  },
  {
    q: "How should I store it?",
    a: "Keep the cans in a cool, dry place away from direct sunlight; they keep for 12 months. Thynkers Lyquid is best served chilled. Once opened, refrigerate it and drink within 2 days.",
  },
];

/**
 * One place that stocks the range. Only `id`, `name` and `group` are needed;
 * every other field hides its line while empty, so leave unknowns as "" and
 * never as a placeholder.
 */
export interface Retailer {
  id: string;
  name: string;
  /** Supermarket chains, or single locations ("Also available at"). */
  group: "supermarket" | "other";
  /** e.g. "Co-working space". Shown on location cards. */
  type?: string;
  /** e.g. "Available at selected outlets". Shown on supermarket cards. */
  note?: string;
  address?: string;
  /** Where inside the location to find it, e.g. "the café". */
  whereInside?: string;
  /** Imported from `assets/images/stores/` (PNG or SVG, transparent). Without one the store's initials stand in. */
  logo?: ImageMetadata;
  /** A supermarket's store locator, or a location's Google Maps link. */
  link?: string;
}

/**
 * Every place that stocks the range: the single list behind the Contact
 * page's "Where to Buy", the products listing strip, each product page's
 * "Available at" and the home page's "Order Now". While empty, all of them
 * are hidden.
 *
 * To add one: put its logo in `src/assets/images/stores/`, import it here
 * and add an entry. TODO: the chains' names, logos (with permission), notes
 * and locator links; Hatch Works and the ECU campus once confirmed.
 */
export const RETAILERS: Retailer[] = [
  { id: "laugfs", name: "LAUGFS Supermarket", group: "supermarket", note: "", link: "" },
  { id: "kasagala", name: "Kasagala Supermarket", group: "supermarket", note: "", link: "" },
  { id: "abc", name: "ABC Supermarket", group: "supermarket", note: "", link: "" },
  { id: "hatch-works", name: "Hatch Works", group: "other", type: "Co-working space", address: "", whereInside: "", link: "" },
  { id: "ecu-campus", name: "ECU Campus", group: "other", type: "University campus", address: "", whereInside: "", link: "" },
];

/** The list split by group, in list order. */
export function retailersByGroup() {
  return {
    supermarkets: RETAILERS.filter((r) => r.group === "supermarket"),
    others: RETAILERS.filter((r) => r.group === "other"),
  };
}

/**
 * Product reviews still carry sample copy (`placeholder` in content/reviews).
 * They show in development so the layout can be judged, never in a build.
 */
export const SHOW_PLACEHOLDER_REVIEWS = import.meta.env.DEV;
