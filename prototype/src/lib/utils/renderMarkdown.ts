/* lib/utils/renderMarkdown.ts */
import { remark } from 'remark';
import { resolve } from './paths';

// Apply the lab destination adapter to Markdown rendered at runtime as well as mdsvex.
function demoLinks() {
  return (tree: any) => {
    const walk = (node: any) => {
      if (node.type === 'link' && typeof node.url === 'string' && node.url.startsWith('/')) node.url = resolve(node.url);
      node.children?.forEach(walk);
    };
    walk(tree);
  };
}
import remarkHtml from 'remark-html';
import { defaultSchema } from 'hast-util-sanitize';

/**
 * Element types that vendor-submitted Marketplace copy is never allowed to
 * produce.
 *
 * Headings are excluded because they would compete with the page's own document
 * outline. Code blocks are excluded because this copy is prose, not source: a
 * `<pre>` defaults to `white-space: pre`, so a single long line refuses to wrap
 * and overflows its column (issue #1521).
 *
 * `hast-util-sanitize` UNWRAPS a disallowed element rather than deleting it, so
 * the vendor's words survive — only the misleading element is dropped.
 */
const vendorProseSchema = {
  ...defaultSchema,
  tagNames: (defaultSchema.tagNames ?? []).filter((tag) => !/^(h[1-6]|pre|code)$/.test(tag))
};

export async function processMarkdown(md: string) {
  const result = await remark().use(demoLinks).use(remarkHtml).process(md);
  return result.toString();
}

/**
 * Collapse padding between a list marker and its content down to one space.
 *
 * Vendor-submitted copy is frequently pasted out of Word, which leaves a tab
 * stop's worth of spaces after the bullet (e.g. `1.` + eight spaces). CommonMark
 * consumes at most three of those as part of the marker, so the four-or-more
 * that remain make the item body an indented code block instead of list content.
 *
 * `vendorProseSchema` already guarantees such a block cannot reach the page as a
 * `<pre>`. Normalizing first is what preserves the author's evident intent — the
 * result is the list they meant to write, rather than a flat run of unwrapped
 * text. See issue #1521.
 *
 * Only genuine CommonMark markers are matched: `-`/`*`/`+`, or up to nine digits
 * followed by `.`/`)`. A literal `•` never starts a list, so its padding is
 * ordinary inline whitespace that collapses on render and is left alone.
 */
function normalizeListMarkerPadding(md: string): string {
  return md.replace(/^([ \t]{0,3})([-*+]|\d{1,9}[.)])[ \t]{2,}(?=\S)/gm, '$1$2 ');
}

export async function processMarkdownSanitized(md: string) {
  const normalized = normalizeListMarkerPadding(md).replace(/(?<!\n)\n(?!\n)/g, '  \n');
  const result = await remark().use(demoLinks).use(remarkHtml, { sanitize: vendorProseSchema }).process(normalized);
  return result.toString();
}
