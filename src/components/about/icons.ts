import Atom from "@lucide/astro/icons/atom";
import Citrus from "@lucide/astro/icons/citrus";
import Clover from "@lucide/astro/icons/clover";
import Droplets from "@lucide/astro/icons/droplets";
import Factory from "@lucide/astro/icons/factory";
import Globe from "@lucide/astro/icons/globe";
import HandCoins from "@lucide/astro/icons/hand-coins";
import HandHeart from "@lucide/astro/icons/hand-heart";
import HeartHandshake from "@lucide/astro/icons/heart-handshake";
import Leaf from "@lucide/astro/icons/leaf";
import Lightbulb from "@lucide/astro/icons/lightbulb";
import Microscope from "@lucide/astro/icons/microscope";
import PackageCheck from "@lucide/astro/icons/package-check";
import ShieldCheck from "@lucide/astro/icons/shield-check";
import Sprout from "@lucide/astro/icons/sprout";

/** The lucide icons `config/about.ts` refers to by name. */
export const ICONS = {
  atom: Atom,
  citrus: Citrus,
  clover: Clover,
  droplets: Droplets,
  factory: Factory,
  globe: Globe,
  "hand-coins": HandCoins,
  "hand-heart": HandHeart,
  "heart-handshake": HeartHandshake,
  leaf: Leaf,
  lightbulb: Lightbulb,
  microscope: Microscope,
  "package-check": PackageCheck,
  "shield-check": ShieldCheck,
  sprout: Sprout,
} as const;

export type IconName = keyof typeof ICONS;
