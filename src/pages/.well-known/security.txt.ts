import type { APIRoute } from "astro";

import { SITE } from "../../config/site";
import { url } from "../../config/url";

/**
 * RFC 9116 security contact. `Expires` is required and rolls forward a year
 * from each build, so a deploy at least yearly keeps it valid.
 */
export const GET: APIRoute = ({ site }) => {
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  const contact = SITE.contact.email
    ? `mailto:${SITE.contact.email}`
    : new URL(url("/#about"), site).href;

  return new Response(
    [
      `Contact: ${contact}`,
      `Expires: ${expires.toISOString()}`,
      "Preferred-Languages: en",
      `Canonical: ${new URL(url("/.well-known/security.txt"), site).href}`,
      "",
    ].join("\n"),
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
};
