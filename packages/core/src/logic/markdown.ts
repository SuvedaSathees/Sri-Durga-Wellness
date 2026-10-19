/**
 * A small, safe Markdown parser for content from the API (service descriptions, blog posts,
 * policies, FAQ answers). It produces a plain tree — no HTML strings — that each app renders with
 * its own components (DOM on web, <Text>/<View> on mobile), so content can never inject scripts.
 *
 * Supported: #–#### headings, paragraphs, - and 1. lists, > quotes, ---, ![images](https://…),
 * **bold**, *italic* / _italic_, `code` and [links](https://… | mailto: | tel: | /path).
 */

export type MdInline =
  | { type: "text"; text: string }
  | { type: "strong"; children: MdInline[] }
  | { type: "em"; children: MdInline[] }
  | { type: "code"; text: string }
  | { type: "link"; href: string; external: boolean; children: MdInline[] };

export type MdBlock =
  | { type: "heading"; level: 2 | 3 | 4; children: MdInline[] }
  | { type: "paragraph"; children: MdInline[] }
  | { type: "list"; ordered: boolean; items: MdInline[][] }
  | { type: "quote"; children: MdBlock[] }
  | { type: "rule" }
  | { type: "image"; src: string; alt: string };

/** Only web, mail, phone and site-relative links survive; javascript: and friends are dropped. */
export function safeHref(url: string): string | null {
  const trimmed = url.trim();
  if (/^(https?:|mailto:|tel:)/i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;
  if (trimmed.startsWith("#")) return trimmed;
  return null;
}

function safeImageSrc(url: string): string | null {
  const trimmed = url.trim();
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;
  if (/^https:\/\//i.test(trimmed)) return trimmed;
  return null;
}

const INLINE = /(\*\*([^*]+)\*\*)|(\*([^*\s][^*]*?)\*)|(_([^_\s][^_]*?)_)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)\s]+)\))/g;

export function parseInline(text: string): MdInline[] {
  const nodes: MdInline[] = [];
  const regex = new RegExp(INLINE.source, "g");
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) nodes.push({ type: "text", text: text.slice(last, m.index) });
    if (m[2] !== undefined) nodes.push({ type: "strong", children: parseInline(m[2]) });
    else if (m[4] !== undefined) nodes.push({ type: "em", children: parseInline(m[4]) });
    else if (m[6] !== undefined) nodes.push({ type: "em", children: parseInline(m[6]) });
    else if (m[8] !== undefined) nodes.push({ type: "code", text: m[8] });
    else if (m[10] !== undefined && m[11] !== undefined) {
      const href = safeHref(m[11]);
      nodes.push(
        href
          ? { type: "link", href, external: /^https?:/i.test(href), children: parseInline(m[10]) }
          : { type: "text", text: m[10] },
      );
    }
    last = regex.lastIndex;
  }
  if (last < text.length) nodes.push({ type: "text", text: text.slice(last) });
  return nodes;
}

const isSpecial = (t: string) =>
  t === "" ||
  /^(#{1,4})\s+/.test(t) ||
  /^[-*]\s+/.test(t) ||
  /^\d+[.)]\s+/.test(t) ||
  /^>\s?/.test(t) ||
  /^-{3,}$/.test(t);

export function parseMarkdown(source: string): MdBlock[] {
  const lines = (source ?? "").replace(/\r\n?/g, "\n").split("\n");
  const blocks: MdBlock[] = [];
  let i = 0;
  const at = (n: number) => (lines[n] ?? "").trim();

  while (i < lines.length) {
    const t = at(i);
    if (t === "") {
      i++;
      continue;
    }
    const heading = /^(#{1,4})\s+(.*)$/.exec(t);
    if (heading) {
      // The screen supplies the page title, so # and ## both become level 2.
      const level = Math.min(4, Math.max(2, heading[1]!.length)) as 2 | 3 | 4;
      blocks.push({ type: "heading", level, children: parseInline(heading[2]!) });
      i++;
      continue;
    }
    if (/^-{3,}$/.test(t) || /^\*{3,}$/.test(t)) {
      blocks.push({ type: "rule" });
      i++;
      continue;
    }
    const image = /^!\[([^\]]*)\]\(([^)\s]+)\)$/.exec(t);
    if (image) {
      const src = safeImageSrc(image[2]!);
      if (src) blocks.push({ type: "image", src, alt: image[1] ?? "" });
      i++;
      continue;
    }
    if (/^>\s?/.test(t)) {
      const quote: string[] = [];
      while (i < lines.length && /^>\s?/.test(at(i))) quote.push(at(i++).replace(/^>\s?/, ""));
      blocks.push({ type: "quote", children: parseMarkdown(quote.join("\n")) });
      continue;
    }
    const listMatch = /^[-*]\s+/.test(t) ? /^[-*]\s+/ : /^\d+[.)]\s+/.test(t) ? /^\d+[.)]\s+/ : null;
    if (listMatch) {
      const items: MdInline[][] = [];
      while (i < lines.length && listMatch.test(at(i))) items.push(parseInline(at(i++).replace(listMatch, "")));
      blocks.push({ type: "list", ordered: !/^[-*]/.test(t), items });
      continue;
    }
    const paragraph: string[] = [];
    while (i < lines.length && !isSpecial(at(i))) paragraph.push(at(i++));
    if (paragraph.length === 0) {
      i++;
      continue;
    }
    blocks.push({ type: "paragraph", children: parseInline(paragraph.join(" ")) });
  }
  return blocks;
}

/** Plain text (for previews, share text and accessibility labels). */
export function markdownToPlainText(text: string): string {
  return (text ?? "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`>#]/g, "")
    .replace(/^\s*[-]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}
