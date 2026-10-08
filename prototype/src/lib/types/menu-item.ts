/* lib/types/menu-item.ts */
export type MenuItemType = {
  id?: string;
  text: string;
  href?: string;
  children?: MenuItemType[];
  // When true, render `data-sveltekit-reload` so the link performs a full
  // browser navigation instead of client-side routing. Needed for links that
  // target static sites/endpoints outside the SvelteKit app (e.g. /2026/, /legacy/).
  reload?: boolean;
};
