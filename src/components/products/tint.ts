/**
 * Each product's accent, as Tailwind classes. The CSP rules out inline
 * `style`, so a product's colour can't be passed in as a value; instead each
 * one gets its class strings here, written out in full so Tailwind's scanner
 * finds them. A new flavour adds a row (and its `--color-flavour-*` token).
 */
export interface Tint {
  /** The soft halo behind a cut-out shot on a light ground. */
  halo: string;
  /** The glow behind the gallery on the detail page's dark ground. */
  glow: string;
  /** A small dot in the accent colour. */
  dot: string;
  /** Accent text on the dark ground. */
  onDark: string;
  /** Accent text on ivory. */
  onLight: string;
}

const TINTS: Record<string, Tint> = {
  "matcha-original": {
    halo: "bg-radial from-flavour-matcha/22 via-flavour-matcha/6 via-45% to-transparent to-70%",
    glow: "bg-[radial-gradient(ellipse_55%_60%_at_30%_55%,color-mix(in_oklab,var(--color-brand-green)_32%,transparent),transparent_72%)]",
    dot: "bg-brand-green",
    onDark: "text-brand-green",
    onLight: "text-flavour-matcha",
  },
  "mango-passion": {
    halo: "bg-radial from-flavour-mango/22 via-flavour-mango/6 via-45% to-transparent to-70%",
    glow: "bg-[radial-gradient(ellipse_55%_60%_at_30%_55%,color-mix(in_oklab,var(--color-flavour-mango)_38%,transparent),transparent_72%)]",
    dot: "bg-flavour-mango",
    onDark: "text-flavour-mango",
    onLight: "text-flavour-mango-deep",
  },
  pineapple: {
    halo: "bg-radial from-flavour-pineapple/26 via-flavour-pineapple/7 via-45% to-transparent to-70%",
    glow: "bg-[radial-gradient(ellipse_55%_60%_at_30%_55%,color-mix(in_oklab,var(--color-flavour-pineapple)_36%,transparent),transparent_72%)]",
    dot: "bg-flavour-pineapple",
    onDark: "text-flavour-pineapple",
    onLight: "text-flavour-pineapple-deep",
  },
};

/** The Mixed Pack and anything without its own row: the brand's gold. */
const FALLBACK: Tint = {
  halo: "bg-radial from-brand-gold/24 via-brand-gold/7 via-45% to-transparent to-70%",
  glow: "bg-[radial-gradient(ellipse_55%_60%_at_30%_55%,color-mix(in_oklab,var(--color-brand-gold)_30%,transparent),transparent_72%)]",
  dot: "bg-brand-gold",
  onDark: "text-brand-gold",
  onLight: "text-brand-fern",
};

export const tintOf = (id: string): Tint => TINTS[id] ?? FALLBACK;
