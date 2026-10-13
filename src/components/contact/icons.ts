import Boxes from "@lucide/astro/icons/boxes";
import Globe from "@lucide/astro/icons/globe";
import MessageCircle from "@lucide/astro/icons/message-circle";
import Store from "@lucide/astro/icons/store";

/** The lucide icons `config/contact.ts` refers to by name. */
export const ICONS = {
  boxes: Boxes,
  globe: Globe,
  "message-circle": MessageCircle,
  store: Store,
} as const;

export type IconName = keyof typeof ICONS;
