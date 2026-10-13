import type { APIRoute } from "astro";

import { url } from "../config/url";

/** Generated so the sitemap URL always follows `site` in astro.config.mjs. */
export const GET: APIRoute = ({ site }) =>
  new Response(
    ["User-agent: *", "Allow: /", "", `Sitemap: ${new URL(url("/sitemap-index.xml"), site).href}`, ""].join(
      "\n",
    ),
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
