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
      "Find Thynkers Lyquid near you, place a bulk order or partner with Ceylon Future Beverages as a distributor or export partner. Get in touch with our team.",
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
      both: "Available at leading supermarkets and selected locations across Sri Lanka.",
      supermarkets: "Available at leading supermarkets across Sri Lanka.",
      others: "Available at selected locations across Sri Lanka.",
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
   * The page's questions, answered only from what the site already states
   * (labels, product pages, the form). A question without an answer is left
   * out, and the section with it if none have one. TODO: caffeine, delivery
   * areas and times, and the reply time wait on the business.
   */
  faq: {
    eyebrow: "FAQs",
    title: "Frequently asked questions",
    intro: "Quick answers about finding, ordering and enjoying Thynkers Lyquid.",
    items: [
      {
        q: "Where can I buy Thynkers Lyquid?",
        a: "Thynkers Lyquid is available at leading supermarkets and selected locations across Sri Lanka. See “Find Thynkers Lyquid Near You” above for where to find it. If it isn’t stocked near you, tell us your town and the shops you’d like to buy it from, and we’ll pass it on to our team.",
      },
      {
        q: "Can I order online?",
        a: "Not yet. The site has no checkout, so orders are placed through an enquiry. Choose a Mixed Pack or a bulk order, send us the form above, and our team will get back to you to arrange it.",
      },
      {
        q: "What is a Mixed Pack?",
        a: "A Mixed Pack is six 250 ml cans, mixed any way you like from Matcha Original, Mango & Passion and Pineapple: two of each, all one flavour, or whatever suits you. Build your mix on any flavour’s page and it’s sent with your enquiry.",
      },
      {
        q: "How do I place a bulk order?",
        a: "Choose “Bulk Orders” in the form above, tell us how many cans of each flavour you need, who it’s for (an office, café, gym, shop or event), where to deliver and when you need it. For six cans or fewer, a Mixed Pack is the simpler way to order.",
      },
      {
        q: "Can I become a distributor or export partner?",
        a: "Yes. We’re expanding across Sri Lanka and into international markets, and we’re looking for distributors, retailers and export partners. Choose “Distribution / Export” in the form and tell us where you sell today, the monthly volume you expect and the markets you cover.",
      },
      {
        q: "What flavours are available?",
        a: "There are three: Matcha Original, Mango & Passion and Pineapple. Every can is 250 ml and carries our signature gotu kola infusion, made in Sri Lanka for clear thinking and mindful energy.",
      },
      {
        q: "What is it made from?",
        a: "Each can is made with Sri Lankan gotu kola extract, with no added preservatives, no artificial colours and no artificial flavours. The full ingredients and nutrition information are on each product’s page.",
      },
      {
        q: "Is it suitable for children?",
        a: "Thynkers Lyquid is not recommended for children under 12 years, or for pregnant and breastfeeding women.",
      },
      {
        q: "How should I store it?",
        a: "Keep the cans in a cool, dry place away from direct sunlight; they keep for 12 months. It’s best served chilled. Once opened, refrigerate it and drink within 2 days. A little sediment is normal for a drink made with natural ingredients.",
      },
      {
        q: "I’m a journalist. Who do I contact?",
        a: "Choose “Media” as the inquiry type in the form above and tell us your outlet, what the story is about and your deadline, or email us directly.",
      },
      {
        q: "I have feedback about Thynkers Lyquid. Where do I send it?",
        a: "We’d love to hear it. Choose “Feedback” in the form above, or use “General Questions” for anything else, and our team will read it.",
      },
    ] as { q: string; a: string }[],
  },

  more: {
    faq: "Have a quick question? You may find the answer in our",
    faqLink: "FAQs",
    follow: "Follow us",
  },
};
