/**
 * The About Us page's copy and data (content plan of 10 October 2026), kept
 * apart from the components so the business can edit it in one place.
 *
 * Same rule as `site.ts`: fields marked TODO wait on the business, and an
 * empty value hides what depends on it (a stat, a certification, the founder
 * section) rather than shipping a placeholder.
 *
 * Images are optional. Drop a photo into `src/assets/images/about/`, import it
 * here and set it on the slot; until then each section falls back to a
 * photo-free layout.
 */
import type { ImageMetadata } from "astro";

import canFillingLine from "../assets/images/about/can-filling-line.jpg";
import coastline from "../assets/images/about/coastline-aerial.jpg";
import stepCraft from "../assets/images/about/step-craft.jpg";
import stepResearch from "../assets/images/about/step-research.jpg";
import stepSource from "../assets/images/about/step-source.jpg";
import stepDeliver from "../assets/images/about/step-deliver.jpg";
import { url } from "./url";

export interface AboutImage {
  src: ImageMetadata;
  alt: string;
}

/**
 * TODO: confirm. Production happens in the company's own facility. The
 * Quality intro says so only while this is true.
 */
export const OWN_FACILITY = true;
export const facility = OWN_FACILITY ? "our own facility" : "a certified facility";

export const ABOUT = {
  seo: {
    title: "About Us | Ceylon Future Beverages",
    description:
      "Ceylon Future Beverages turns Sri Lanka's herbs, fruits and botanicals into high-value natural beverages for the world. Our story, values and how we work.",
    image: "/og/about.jpg",
    imageAlt: "Ceylon Future Beverages: Nature. Reimagined.",
  },

  hero: {
    eyebrow: "About Us",
    title: "Nature. Reimagined.",
    intro:
      "An innovation-driven beverage company turning Sri\u00a0Lanka’s natural richness into high-value beverages for the world.",
    /** Aerial of Sri Lanka's south coast: green shallows meeting the sand. */
    image: {
      src: coastline,
      alt: "Aerial view of turquoise water and waves meeting a sandy beach on Sri Lanka's coast",
    } as AboutImage | undefined,
    /** Scrolls down to the story section (`AboutStory`, id "our-story"). */
    cta: { label: "Our Story", href: "#our-story" },
    /** Bottom-right sign-off, beside a vertical rule. */
    tagline: { title: "Rooted in Ceylon", kicker: "For a brighter tomorrow" },
  },

  story: {
    eyebrow: "Our Story",
    title: "Rooted in Ceylon. Built for the future.",
    paragraphs: [
      "Sri Lanka has always been rich in nature. Its herbs, fruits and botanicals have shaped the island’s food, wellness and way of life for centuries. At Ceylon Future Beverages, we believe these resources hold untapped global potential.",
      "We go beyond traditional beverage manufacturing. By combining research, innovation and world-class production, we craft modern beverages that celebrate Sri\u00a0Lanka’s natural ingredients while meeting international quality and safety standards.",
    ],
    /** The closing statement beside a green rule; `accent` runs are set in green. */
    ambition: [
      { text: "Our ambition is clear: " },
      { text: "to build globally competitive", accent: true },
      { text: " beverage brands " },
      { text: "while", accent: true },
      { text: " creating lasting value at origin, here in Sri\u00a0Lanka." },
    ] as { text: string; accent?: boolean }[],
    image: {
      src: canFillingLine,
      alt: "Aluminium cans rising up a conveyor and lining up beneath a stainless steel can filling machine",
    } as AboutImage,
    /**
     * The number strip. Only stats with a value are shown, and the strip
     * needs at least two. TODO: the founding year and real counts.
     */
    stats: [
      { value: "", label: "Founded" },
      { value: "Alawwa", label: "Based in Sri Lanka" },
      { value: "", label: "Local suppliers" },
      { value: "", label: "Stores" },
    ],
  },

  /** As set in the Vision & Mission band mockup. */
  vision:
    "To be a globally recognized innovator in natural beverages inspired by Ceylon’s rich botanical diversity.",
  mission:
    "To create differentiated, science\u2011driven beverage innovations by elevating Sri\u00a0Lanka’s natural ingredients into sustainable, high\u2011value products.",

  /**
   * The "next big beverage trend" video, between Vision & Mission and Values.
   * Self-hosted: the CSP (`default-src 'self'`) blocks YouTube/Vimeo iframes.
   *
   * TODO: export the video as H.264 MP4 (1080p, ~5–8 Mbps, `faststart`) into
   * `public/videos/`, set `src` (e.g. "/videos/next-big-beverage-trend.mp4"),
   * a poster frame and the running time. Captions (WebVTT) are strongly
   * recommended. Until `src` is set, the frame shows a "Coming soon" badge.
   */
  video: {
    eyebrow: "Watch",
    title: "The next big beverage trend.",
    body: "Where the world’s beverages are heading, and why Ceylon’s botanicals are ready for it.",
    src: "",
    /** A 16:9 frame from the video, ~1920×1080. */
    poster: undefined as AboutImage | undefined,
    /** e.g. "3:45" */
    duration: "",
    /** e.g. "/videos/next-big-beverage-trend.en.vtt" */
    captions: "",
  },

  values: {
    eyebrow: "Our Values",
    title: "Six principles. One direction.",
    items: [
      { icon: "sprout", title: "Innovation", body: "New ideas for real\u2011world impact." },
      { icon: "hand-heart", title: "Respect for Nature", body: "Source responsibly and protect ecosystems." },
      { icon: "clover", title: "Value Creation", body: "Turn local richness into global value." },
      { icon: "shield-check", title: "Quality First", body: "International quality in every product." },
      { icon: "heart-handshake", title: "Responsible Growth", body: "Support people, partners and planet." },
      { icon: "globe", title: "Global Mindset", body: "Bring Ceylon’s goodness to the world." },
    ],
  },

  howWeWork: {
    eyebrow: "How We Work",
    title: "From nature to bottle. A process built on care.",
    /**
     * TODO: steps 01–03 are low-resolution stand-ins cut from the design
     * mockup (~220px wide). Replace with real photos (~1200×840).
     */
    steps: [
      {
        icon: "sprout",
        title: "Source",
        body: "Select the finest Sri\u00a0Lankan botanicals.",
        image: { src: stepSource, alt: "Close-up of fresh green tea leaves" } as AboutImage | undefined,
      },
      {
        icon: "microscope",
        title: "Research",
        body: "Develop safe and effective formulations.",
        image: { src: stepResearch, alt: "A scientist looking through a microscope in a lab" } as AboutImage | undefined,
      },
      {
        icon: "factory",
        title: "Craft",
        body: "Blend and produce with global standards.",
        image: { src: stepCraft, alt: "Bottles of green beverage moving along a production line" } as AboutImage | undefined,
      },
      {
        icon: "package-check",
        title: "Deliver",
        body: "Bring natural goodness to global markets.",
        image: { src: stepDeliver, alt: "Three Thynkers Lyquid cans on a wooden surface with fresh leaves" } as AboutImage | undefined,
      },
    ],
  },

  quality: {
    eyebrow: "Quality",
    title: "Built on quality. Certified to international standards.",
    intro: `Every Ceylon Future Beverages product is made in ${facility} under internationally recognized food-safety and quality systems.`,
    /**
     * TODO: a facility photo (~1000×900). Until then the section is copy only;
     * the bottling-line photo already opens "Our Story".
     */
    image: undefined as AboutImage | undefined,
    /**
     * Only certifications with `held: true` are shown. TODO: confirm each one
     * the company holds today, the exact standard (ISO 22000 or ISO 9001?)
     * and its certificate number, and get the logo files from the
     * certifying bodies — their marks have usage rules.
     */
    certifications: [
      { code: "SLS", label: "Certified by the Sri Lanka Standards Institution", held: false },
      { code: "ISO", label: "Internationally recognized quality management", held: false },
      { code: "HACCP", label: "Food safety controlled at every critical step", held: false },
      { code: "GMP", label: "Good Manufacturing Practice in our facility", held: false },
    ] as { code: string; label: string; held: boolean; logo?: AboutImage }[],
  },

  /** The section stays hidden until name, title and quote are all filled in. TODO. */
  people: {
    eyebrow: "Our People",
    title: "The team behind the vision.",
    founder: {
      name: "",
      title: "",
      quote: "",
      /** A square-ish portrait, ~800×1000. */
      photo: undefined as AboutImage | undefined,
    },
    /** Optional wide team photo. */
    teamPhoto: undefined as AboutImage | undefined,
  },

  brands: {
    title: "Our Brands",
    name: "Thynkers Lyquid",
    body: "Our first brand: sparkling, gotu kola–infused drinks crafted to fuel the thought.",
    cta: { label: "Explore Thynkers", href: url("/products/") },
  },

  closing: {
    title: "From Ceylon’s natural heritage, for the world ahead.",
    primary: { label: "Order Now", href: url("/#order") },
    secondary: { label: "Partner With Us", href: url("/contact/#partner") },
  },
};
