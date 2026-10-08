/* lib/constants.ts */
import { browser } from '$app/environment';
import { resolve } from '$lib/utils/paths';

export const BASE_URL = browser ? resolve('/') : '/';

/**
 * Absolute origin of the production site, for the few places that genuinely
 * require a fully-qualified URL (RSS `<link>`/`<guid>`, calendar `.ics` bodies).
 *
 * Prefer root-relative links everywhere else. `fedramp.gov` 301s to
 * `www.fedramp.gov`, so a non-www self-link costs a redirect hop AND is treated
 * as cross-domain by GA4 — which appends a `?_gl=` linker parameter to it. A
 * `_gl` URL forces the receiving page to adopt the client ID it carries, so a
 * decorated feed link that gets copied into a newsletter pins every later
 * visitor to one client ID. See issue #1208.
 *
 * Sourced from VITE_SITE_URL (see .env.production) so this tracks the canonical
 * host in one place, matching src/routes/sitemap.xml/+server.ts.
 */
export const SITE_URL: string = import.meta.env.VITE_SITE_URL ?? 'https://www.fedramp.gov';
