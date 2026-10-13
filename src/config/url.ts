/**
 * Prefixes a root-absolute path with Astro's `base`, so the site also works
 * from a subpath (the GitHub Pages demo at `/cbf-demo/`). With the default
 * base of `/` it returns the path unchanged. Paths that already carry the base
 * (`Astro.url.pathname`, imported asset URLs) and non-root paths pass through.
 */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export const url = (path: string) =>
  !path.startsWith("/") || (BASE && (path === BASE || path.startsWith(`${BASE}/`)))
    ? path
    : `${BASE}${path}`;
