/* routes/marketplace/+page.server.ts */
import { resolve } from '$lib/utils/paths';
import { redirect } from '@sveltejs/kit';

export function load() {
  redirect(308, resolve('/marketplace/products/'));
}
