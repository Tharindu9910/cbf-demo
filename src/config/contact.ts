/**
 * The Contact page's copy and data (content plan of 11 October 2026), kept
 * apart from the components so the business can edit it in one place.
 *
 * Same rule as `site.ts` and `about.ts`: fields marked TODO wait on the
 * business, and an empty value hides what depends on it (a details row, the
 * reply-time promise, the carton option) rather than shipping a placeholder.
 *
 * The address, phone and email come from `SITE` (config/site.ts), so the
 * footer, the JSON-LD and this page can't disagree.
 */
import teaLake from "../assets/images/contact/tea-lake-aerial.jpg";
import type { InquiryIntent } from "./site";

/** The form's inquiry types, in dropdown order. `value` is what the form posts. */
export const INQUIRY_TYPES = [
  { value: "general", label: "General" },
  { value: "bulk", label: "Bulk Order" },
  /** Only offered when the visitor comes from a product page's Mixed Pack order button. */
  { value: "mixed", label: "Mixed Pack Order", linkOnly: true },
  { value: "distribution", label: "Distribution / Export" },
  { value: "feedback", label: "Feedback" },
  { value: "media", label: "Media" },
] as const;

export type InquiryType = (typeof INQUIRY_TYPES)[number]["value"];

/**
 * The subject and message the form starts with, one per way into it. Edit the
 * wording freely; the visitor can change all of it before sending, and a
 * template only replaces text they haven't touched.
 *
 * Placeholders, filled from the link or the form's own fields:
 * - `{product}`  the product the link came from ("Thynkers Lyquid" without one)
 * - `{quantity}` how many Mixed Packs (1 when not given)
 * - `{mix}`      a Mixed Pack's flavours, one "- 2 × Matcha Original" line each
 *
 * Which one is used:
 * - general       "Contact" in the header and footer; the General Questions card
 * - stockist      Where to Buy › "Can't find it near you? Let us know"
 * - bulk          the Bulk Orders card; "Enquire About Bulk Orders" on the products
 *                 page; the "Bulk Inquiry" bar on a product page. The cans per
 *                 flavour have their own fields, so the message needn't ask.
 * - mixed         the order button with a Mixed Pack built on a product page.
 *                 Locked: the visitor can't edit it, only add a message. Its
 *                 `message` is the order summary shown above the message box.
 * - distribution  the Distributors & Export card; "Become a Partner"
 * - review        "Write a review" on a product page
 * - feedback, media  chosen from the form's "Inquiry type" dropdown
 */
export const FORM_TEMPLATES: Record<string, { subject: string; message: string }> = {
  general: {
    subject: "Question about Thynkers Lyquid",
    message: "Hi,\n\nMy question:\n",
  },
  stockist: {
    subject: "Can’t find Thynkers Lyquid near me",
    message:
      "Hi,\n\nI couldn’t find Thynkers Lyquid near me.\n\nMy town / area:\nShops I’d like to buy it from:\n",
  },
  bulk: {
    subject: "Bulk order enquiry",
    message:
      "Hi,\n\nI’d like to order Thynkers Lyquid in bulk.\n\nFor (office, café, shop, event…):\nDelivery location:\nNeeded by:\n",
  },
  mixed: {
    subject: "Mixed Pack order: {quantity} × 6 cans",
    message: "{quantity} × Mixed Pack (6 × 250 ml), each with:\n{mix}",
  },
  distribution: {
    subject: "Distribution / export partnership",
    message:
      "Hi,\n\nWe’re interested in distributing Thynkers Lyquid.\n\nWhere we sell today (supermarkets, cafés, online…):\nExpected monthly volume:\nMarkets we cover:\n",
  },
  review: {
    subject: "My review of {product}",
    message: "My rating (out of 5):\n\nWhat I thought of {product}:\n",
  },
  feedback: {
    subject: "Feedback",
    message: "Hi,\n\nMy feedback:\n",
  },
  media: {
    subject: "Media enquiry",
    message: "Hi,\n\nPublication / outlet:\nWhat the story is about:\nDeadline:\n",
  },
};

export const CONTACT = {
  seo: {
    title: "Contact Us | Ceylon Future Beverages",
    description:
      "Find our drinks near you, order in bulk, or partner with Ceylon Future Beverages as a distributor, retailer or export partner. Based in Alawwa, Sri Lanka.",
  },

  hero: {
    eyebrow: "Contact Us",
    title: "Let’s Talk",
    intro:
      "Whether you’re looking for Thynkers Lyquid near you, placing a bulk order or exploring a partnership, we’d love to hear from you.",
    /** Aerial of a tea estate hugging a still lake, a lone tree in the water. */
    image: {
      src: teaLake,
      alt: "Aerial view of tea bushes in neat rows around a dark lake with a single bare tree in the water",
    },
  },

  /** "How can we help?": each card lands on its section, or opens the form with its type selected. */
  help: {
    title: "How can we help?",
    cards: [
      {
        icon: "store",
        title: "Find a Store",
        body: "Find Thynkers Lyquid at a supermarket near you.",
        intent: "store",
      },
      {
        icon: "boxes",
        title: "Bulk Orders",
        body: "Orders for offices, cafés, gyms and events.",
        intent: "bulk",
      },
      {
        icon: "globe",
        title: "Distributors & Export",
        body: "Bring our brands to your market.",
        intent: "distribution",
      },
      {
        icon: "message-circle",
        title: "General Questions",
        body: "Product questions, feedback or anything else.",
        intent: "general",
      },
    ] as { icon: string; title: string; body: string; intent: InquiryIntent }[],
  },

  form: {
    title: "Send us a message",
    /** TODO: the reply time the team is comfortable promising, e.g. "1–2 working days". Hidden while empty. */
    replyTime: "",
    submit: "Send Message",
    success: "Thank you! Our team will get back to you shortly.",
    error: "Sorry, your message couldn’t be sent. Please try again, or email us directly.",
    privacy: "We’ll only use your details to reply to your message.",
  },

  details: {
    title: "Get in touch",
    /** TODO: e.g. "Mon–Fri, 8.30 am – 5.00 pm". Hidden while empty. */
    hours: "",
    /** TODO: the WhatsApp number, if the team uses one, in international form ("+94 77 …"). Hidden while empty. */
    whatsapp: "",
  },

  whereToBuy: {
    title: "Find Thynkers Lyquid Near You",
    /** The subtext follows what `RETAILERS` (config/products.ts) lists, so it never claims stockists it can't name. */
    intro: {
      both: "Available at leading supermarkets across Sri Lanka, and online.",
      supermarkets: "Available at leading supermarkets across Sri Lanka.",
      others: "Available online across Sri Lanka.",
      none: "Ask us where to find Thynkers Lyquid in your area.",
    },
    supermarkets: "Supermarkets",
    others: "Also available at",
    branchLink: "Find nearest branch",
    directions: "Get Directions",
    prompt: "Can’t find it near you?",
    promptLink: "Let us know",
  },

  partner: {
    eyebrow: "Partner With Us",
    title: "Grow with Ceylon Future Beverages",
    body: "We’re expanding across Sri Lanka and into international markets, and we’re looking for distributors, retailers and export partners who share our vision.",
    /** The certification bullet lists only what `ABOUT.quality.certifications` marks as held. */
    natural: {
      title: "Natural, differentiated products",
      body: "Made from Ceylon’s botanical heritage.",
    },
    /** Shown only while `OWN_FACILITY` (config/about.ts) is true. */
    supply: {
      title: "Reliable supply",
      body: "Produced in our own facility.",
    },
    cta: "Become a Partner",
  },

  /**
   * The site's FAQ (the header's "FAQs" link lands here). Every answer is
   * checked against the company profile (docs/company-profile.md); the two
   * facts it doesn't cover come from the can's label (`ADVISORY` in
   * config/products.ts) and the site's own ordering (Mixed Pack, the form).
   * A question without an answer is left out, and the section with it if
   * none have one. TODO: caffeine, delivery areas and times wait on the business.
   */
  faq: {
    eyebrow: "FAQs",
    title: "Frequently asked questions",
    intro: "Quick answers about Ceylon Future Beverages, Thynkers Lyquid, and how to buy or partner with us.",
    items: [
      {
        q: "Who is Ceylon Future Beverages?",
        a: "Ceylon Future Beverages (Pvt) Limited is an innovation-driven beverage company based in Alawwa, Sri Lanka. We turn Sri Lanka’s indigenous botanicals and fruits into high-value beverages for global markets, combining Ceylon’s botanical heritage with modern food science. Thynkers Lyquid is our first brand.",
      },
      {
        q: "What brands do you make?",
        a: "Our portfolio is built on four lines: CFB Botanicals™ (herbal and indigenous-ingredient beverages, such as gotu kola, tea and cinnamon), CFB Juicery™ (clean-label fruit juices and blends), CFB Functional™ (science-backed functional beverages) and CFB CocoNut™ (next-generation coconut hydration, including king coconut). Thynkers Lyquid, a CFB Botanicals™ drink, is available now.",
      },
      {
        q: "What is gotu kola, and why do you use it?",
        a: "Gotu kola (Centella asiatica) is a traditional Sri Lankan leafy green, long linked with memory and concentration. It contains naturally occurring compounds, such as asiaticoside, madecassoside and asiatic acid, that researchers are studying for brain health and antioxidant activity. We use it because it’s uniquely Sri Lankan, and we turn it into a modern, convenient drink for consumers here and around the world.",
      },
      {
        q: "What Thynkers Lyquid flavours are available?",
        a: "Three: Matcha Original, Mango & Passion and Pineapple. Each comes in a 250 ml can with our signature gotu kola infusion, crafted for clear thinking and mindful energy, and keeps for 12 months.",
      },
      {
        q: "What’s in a can of Thynkers Lyquid?",
        a: "Every can is made with natural gotu kola extract, with no preservatives and no artificial colours. A 250 ml can has 75 kcal, 17.75 g of sugars and no fat or salt. The full ingredients and nutrition table are on each product’s page.",
      },
      {
        q: "Are your products independently tested?",
        a: "Yes. Our products are tested by Bureau Veritas, an independent laboratory accredited to ISO/IEC 17025, to verify safety, quality, nutritional composition and shelf stability.",
      },
      {
        q: "Where are your drinks made?",
        a: "In Sri Lanka, through a contract manufacturing partnership with a professionally managed beverage production facility. We can currently produce up to 10,000 cans a day, and that capacity scales with demand at home and abroad.",
      },
      {
        q: "Where can I buy Thynkers Lyquid?",
        a: "In Sri Lanka at LAUGFS, SPAR, Sampath, Atukorala and Kasagala Green Super supermarkets, and online through Celeste Online. If it isn’t stocked near you, tell us your town and the shops you’d like to buy it from.",
      },
      {
        q: "Can I order directly from you?",
        a: "Yes, through an enquiry. For a small order, build a Mixed Pack of any six cans on any flavour’s page. For an office, café, gym, shop or event, choose “Bulk Orders” in the form above and tell us how many cans of each flavour you need, where to deliver and when. Our team will get back to you to arrange it.",
      },
      {
        q: "Can I become a distributor or export partner?",
        a: "Yes. We’re looking for distributors, retailers and export partners in Sri Lanka and abroad. Cans ship in cartons of 12: 3,960 cans to a pallet, or 39,600 cans in a 20 ft container. Choose “Distribution / Export” in the form and tell us where you sell today, the volume you expect and the markets you cover.",
      },
      {
        q: "Is Thynkers Lyquid suitable for children?",
        a: "It is not recommended for children under 12 years, or for pregnant and breastfeeding women.",
      },
    ] as { q: string; a: string }[],
  },

  more: {
    faq: "Have a quick question? You may find the answer in our",
    faqLink: "FAQs",
  },
};
