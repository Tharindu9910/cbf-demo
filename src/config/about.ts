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
import farmerHarvest from "../assets/images/about/farmer-harvest.jpg";
import founderSuresh from "../assets/images/about/founder-suresh.jpg";
import labBeaker from "../assets/images/about/lab-beaker.jpg";
import stepCraft from "../assets/images/about/step-craft.jpg";
import stepResearch from "../assets/images/about/step-research.jpg";
import stepSource from "../assets/images/about/step-source.jpg";
import stepDeliver from "../assets/images/about/step-deliver.jpg";
import thynkersCans from "../assets/images/about/thynkers-brands-bg.png";
import { url } from "./url";

export interface AboutImage {
  src: ImageMetadata;
  alt: string;
}

/**
 * Whether production happens in the company's own facility. The company
 * profile (October 2026) says it runs through a contract manufacturing
 * partnership, so this is false. The Contact page's "Reliable supply" bullet
 * shows only while it is true.
 */
export const OWN_FACILITY: boolean = false;

export const ABOUT = {
  seo: {
    title: "About Ceylon Future Beverages | Our Story & Mission",
    description:
      "An innovation-driven Sri Lankan beverage company turning Ceylon's botanical heritage into world-class natural drinks. Our vision, values, founder and process.",
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
      "We go beyond traditional beverage manufacturing. By combining research, formulation expertise and sustainable sourcing, we craft modern beverages that celebrate Sri\u00a0Lanka’s natural ingredients while meeting international quality and safety standards. Our portfolio spans natural beverages, juices, herbal infusions and functional drinks, designed for today’s evolving consumers.",
    ],
    /** The closing statement beside a green rule; `accent` runs are set in green. */
    ambition: [
      { text: "Our ambition is clear: " },
      { text: "to build globally competitive", accent: true },
      { text: " beverage brands " },
      { text: "while", accent: true },
      { text: " creating lasting value at origin, here in Sri\u00a0Lanka." },
    ] as { text: string; accent?: boolean }[],
    /**
     * The photo collage, from origin to product: the farm (tall, left), then
     * the production line and the lab stacked on the right.
     */
    images: {
      farm: {
        src: farmerHarvest,
        alt: "A smiling farmer crouching in a field, digging with a hand trowel and holding a bunch of freshly picked herbs",
      },
      production: {
        src: canFillingLine,
        alt: "Aluminium cans rising up a conveyor and lining up beneath a stainless steel can filling machine",
      },
      lab: {
        src: labBeaker,
        alt: "A gloved hand holding a 50ml beaker of orange fruit blend in the lab",
      },
    } satisfies Record<string, AboutImage>,
    /**
     * The number strip. Only stats with a value are shown, and the strip
     * needs at least two. `icon` sets a mark before the value, and `kicker` a small line above it. TODO: the founding year and real counts. "Stores"
     * waits until `RETAILERS` (config/products.ts) matches the profile's outlets.
     */
    stats: [
      { value: "", label: "Founded" },
      { value: "Sri\u00a0Lanka", kicker: "Based in", label: "", icon: "sri-lanka" },
      { value: "10,000", label: "Cans a day, production capacity" },
      { value: "", label: "Local suppliers" },
      { value: "", label: "Stores" },
    ] as { value: string; label: string; kicker?: string; icon?: "sri-lanka" }[],
  },

  /** As set in the Vision & Mission band mockup. */
  vision:
    "To be a globally recognized innovator in natural beverages inspired by Ceylon’s rich botanical diversity.",
  mission:
    "To create differentiated, science\u2011driven beverage innovations by elevating Sri\u00a0Lanka’s natural ingredients into sustainable, high\u2011value products for the world.",

  /** "Why We Exist": three columns after Vision & Mission, from the company profile. */
  purpose: {
    eyebrow: "Our Purpose",
    title: "Sri\u00a0Lanka exports raw ingredients. We export innovation.",
    columns: [
      {
        icon: "lightbulb",
        title: "What We Do",
        points: [
          "Develop innovative beverages from Sri\u00a0Lanka\u2019s indigenous botanicals and fruits.",
          "Add formulation, branding and IP value locally before going global.",
        ],
      },
      {
        icon: "globe",
        title: "Why We Exist",
        points: [
          "Sri\u00a0Lanka exports raw ingredients; we export value-added innovation.",
          "Global demand is shifting toward natural, functional and clean-label beverages.",
        ],
      },
      {
        icon: "shield-check",
        title: "How We Win",
        points: [
          "A Nature + Science approach.",
          "Innovation-led product development.",
          "Designed for international regulatory and quality standards.",
          "Scalable across multiple beverage categories.",
        ],
      },
    ],
  },

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
      { icon: "sprout", title: "Innovation with Purpose", body: "New ideas for real\u2011world impact." },
      { icon: "hand-heart", title: "Respect for Nature", body: "Source responsibly and protect ecosystems." },
      { icon: "clover", title: "Value Creation at Origin", body: "Turn local richness into global value." },
      { icon: "shield-check", title: "Quality Without Compromise", body: "International quality in every product." },
      { icon: "heart-handshake", title: "Responsible Growth", body: "Support people, partners and planet." },
      { icon: "globe", title: "Global Mindset", body: "Bring Ceylon’s goodness to the world." },
    ],
  },

  /** The journey from page 20 of the company profile ("From Ceylon to the World"). */
  howWeWork: {
    eyebrow: "How We Work",
    title: "From Ceylon to the world.",
    /** Connect reuses the Our Story farm photo. */
    steps: [
      {
        icon: "sprout",
        title: "Source",
        body: "We partner with nature and local farmers, cultivating and responsibly sourcing pure gotukola and other high-quality ingredients.",
        image: { src: stepSource, alt: "Rows of green tea bushes stretching to the horizon under a soft sunrise sky" } as AboutImage | undefined,
      },
      {
        icon: "heart-handshake",
        title: "Connect",
        body: "We build meaningful partnerships with farming communities and like-minded collaborators who share our commitment to people and planet.",
        image: {
          src: farmerHarvest,
          alt: "A smiling farmer crouching in a field, holding a bunch of freshly picked herbs",
        } as AboutImage | undefined,
      },
      {
        icon: "microscope",
        title: "Create",
        body: "We blend nature and science to develop functional formulas, backed by research and crafted with care for exceptional taste and nutrition.",
        image: { src: stepResearch, alt: "A scientist in a hairnet and face mask looking through a microscope in a lab" } as AboutImage | undefined,
      },
      {
        icon: "factory",
        title: "Produce",
        body: "We bottle our drinks in safe, high-quality packaging to rigorous standards, so you can enjoy goodness you can trust in every bottle.",
        image: { src: stepCraft, alt: "Aluminium cans being filled on a stainless-steel production line" } as AboutImage | undefined,
      },
      {
        icon: "globe",
        title: "Export",
        body: "We share our goodness across the world, promoting healthier lifestyles and a more sustainable future for generations to come.",
        image: { src: stepDeliver, alt: "A container ship stacked with shipping containers, moored at a harbour" } as AboutImage | undefined,
      },
    ],
  },

  quality: {
    eyebrow: "Quality",
    title: "From Sri\u00a0Lankan ingredients to international-ready beverages.",
    intro:
      "We combine traditional botanical knowledge with modern food science and rigorous quality evaluation. Our products are independently tested by Bureau Veritas for safety, quality, nutritional composition and shelf stability.",
    /**
     * Only certifications the company holds (`held: true`) are shown. The lab
     * that tests the products is ISO/IEC 17025 accredited, but that is the
     * lab's accreditation, not one of ours, so it isn't listed. TODO: confirm each one
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

  /**
   * The section stays hidden until name, title and quote are all filled in.
   * TODO: the quote is drafted from the founder's stated vision in the company
   * profile; get his sign-off on the wording.
   */
  people: {
    eyebrow: "Our People",
    title: "The team behind the vision.",
    founder: {
      name: "Suresh Jayarathna",
      title: "Founder, BSc (Hons), MBA (UK)",
      quote:
        "My vision is to transform Sri\u00a0Lanka\u2019s natural resources into innovative, globally competitive consumer products through technology, entrepreneurship and value addition.",
      /** A square-ish portrait, ~800×1000. Cropped from the company profile. */
      photo: {
        src: founderSuresh,
        alt: "Portrait of Suresh Jayarathna, founder of Ceylon Future Beverages, hands clasped in front of his face",
      } as AboutImage | undefined,
    },
    /** Optional wide team photo. */
    teamPhoto: undefined as AboutImage | undefined,
  },

  /**
   * The founder's story and the board, after "Our People". Hidden while
   * `directors` is empty; the bio column is hidden while `bio` is empty.
   */
  leadership: {
    eyebrow: "Leadership",
    title: "Built on technology, data and Ceylon\u2019s nature.",
    bio: [
      "Suresh Jayarathna is a Sri\u00a0Lankan entrepreneur, technology professional and business strategist. He holds a BSc (Hons) in Statistics and Operations Research and an MBA, a grounding in analytical thinking, business strategy and data-driven decision-making.",
      "Before founding Ceylon Future Beverages, he built his career in technology and digital transformation at one of Sri\u00a0Lanka\u2019s largest apparel manufacturers, leading automation, process optimisation and technology-led business initiatives.",
      "Seeing the untapped potential in the island\u2019s agricultural and natural resources, he founded the company to turn them into modern, natural and functional beverages for local and international markets.",
    ],
    directorsTitle: "Board of Directors",
    directors: [
      { name: "Suresh Jayarathna", role: "Director", area: "Manufacturing Operations & Sales" },
      { name: "Bhagya Lakmali", role: "Director", area: "Research & Development" },
    ],
  },

  /**
   * "Our Brands": the company's four beverage lines, then a large card per
   * brand on sale. A brand joins its line through `family` in `BRANDS`
   * (config/products.ts); a line with no brand shows `comingSoon`.
   */
  brandLines: {
    eyebrow: "Our Brands",
    title: "One company. Four beverage lines.",
    brandsLabel: "Our brands",
    comingSoon: "Coming soon",
    /** More brand names than this in a line card, and the rest become "+N more". */
    maxListed: 3,
    lines: [
      {
        id: "botanicals",
        icon: "leaf",
        name: "CFB Botanicals\u2122",
        focus: "Herbal & indigenous ingredient-based beverages",
        examples: "Gotukola, tea, belimal, cinnamon, pepper and more",
      },
      {
        id: "juicery",
        icon: "citrus",
        name: "CFB Juicery\u2122",
        focus: "Clean-label fruit juices & blends",
        examples: "Tropical, functional, low-sugar, export-friendly",
      },
      {
        id: "functional",
        icon: "atom",
        name: "CFB Functional\u2122",
        focus: "Science-backed functional beverages",
        examples: "Focus, hydration, immunity, recovery and more",
      },
      {
        id: "coconut",
        icon: "droplets",
        name: "CFB CocoNut\u2122",
        focus: "Next-generation coconut hydration",
        examples: "King coconut innovations, enhanced coconut waters, functional coconut blends",
      },
    ],
  },

  /**
   * The About page's large card per brand, keyed by its id in `BRANDS`
   * (config/products.ts). A brand without an entry still gets a card, with
   * `BRANDS.body`, a plain green ground and an "Explore" link.
   */
  brandCards: {
    "thynkers-lyquid": {
      body: "Our first brand: sparkling, gotu kola\u2013infused drinks crafted to fuel the thought.",
      cta: "Explore Thynkers",
      image: {
        src: thynkersCans,
        alt: "Three Thynkers Lyquid cans, Mango & Passion, Pineapple and Original, resting on fresh gotu kola leaves",
      },
    },
  } as Record<string, { body?: string; cta?: string; image?: AboutImage }>,

  closing: {
    title: "Innovate responsibly. Build globally. Stay rooted.",
    primary: { label: "Order Now", href: url("/products/") },
    secondary: { label: "Partner With Us", href: url("/contact/#partner") },
  },
};
