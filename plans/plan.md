# Update CBF-astro packages to latest

## Context
The user wants CBF-astro on the latest Astro and package versions. It is already on Astro 7 and nearly current: `npm outdated` shows only patch/minor bumps. TypeScript 7.0.2 is out, but `@astrojs/check@0.9.10` (latest, used by `npm run build`) peers on `typescript ^5 || ^6`, so we stay on TS 6 (user's choice). No code migration is needed: these releases are all within the same majors.

## Changes (in `CBF-astro/`)
1. `package.json`: bump the ranges
   - `astro` ^7.3.5 → ^7.3.8
   - `@lucide/astro` ^1.52.0 → ^1.55.0
   - `prettier` ^3.9.9 → ^3.9.10
   - `prettier-plugin-astro` ^1.1.0 → ^1.1.1
   - Leave the rest; they are already latest (`@astrojs/sitemap` 3.7.4, `@astrojs/check` 0.9.10, `tailwindcss`/`@tailwindcss/vite` 4.3.3, `three` 0.186.1, `@types/three` 0.186.0, `gsap` 3.15.0, `sharp` 0.35.5, `prettier-plugin-tailwindcss` 0.8.1). `typescript` stays ^6.0.3.
2. Run `npm install` to update `package-lock.json`, then `npm update` to pull the latest in-range versions of transitive deps.
3. No changes to `astro.config.mjs` or source expected. If the build surfaces a deprecation/type error, fix it in place.

## Verification
- `npm outdated` shows only `typescript` (7.x, intentionally held).
- `npm run build` (astro check + build) passes with no new errors/warnings.
- `npm run preview` and spot-check `/`, `/about/`, `/products/`: hero cans render, carousel works, no CSP errors in the console.
