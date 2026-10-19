/** Renders the shared Markdown tree (from @sdw/core) as DOM elements — never as HTML strings. */
import { Fragment, type ReactNode } from "react";
import { Link } from "react-router";
import { parseMarkdown, parseInline, type MdBlock, type MdInline } from "@sdw/core";

function inline(nodes: MdInline[], key = "i"): ReactNode[] {
  return nodes.map((n, i) => {
    const k = `${key}-${i}`;
    switch (n.type) {
      case "text":
        return <Fragment key={k}>{n.text}</Fragment>;
      case "strong":
        return <strong key={k}>{inline(n.children, k)}</strong>;
      case "em":
        return <em key={k}>{inline(n.children, k)}</em>;
      case "code":
        return <code key={k}>{n.text}</code>;
      case "link":
        return n.href.startsWith("/") ? (
          <Link key={k} to={n.href}>
            {inline(n.children, k)}
          </Link>
        ) : (
          <a key={k} href={n.href} {...(n.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
            {inline(n.children, k)}
          </a>
        );
    }
  });
}

function blocks(list: MdBlock[], key = "b"): ReactNode[] {
  return list.map((b, i) => {
    const k = `${key}-${i}`;
    switch (b.type) {
      case "heading":
        return b.level === 2 ? (
          <h2 key={k}>{inline(b.children, k)}</h2>
        ) : b.level === 3 ? (
          <h3 key={k}>{inline(b.children, k)}</h3>
        ) : (
          <h4 key={k}>{inline(b.children, k)}</h4>
        );
      case "paragraph":
        return <p key={k}>{inline(b.children, k)}</p>;
      case "list": {
        const items = b.items.map((item, j) => <li key={`${k}-${j}`}>{inline(item, `${k}-${j}`)}</li>);
        return b.ordered ? <ol key={k}>{items}</ol> : <ul key={k}>{items}</ul>;
      }
      case "quote":
        return <blockquote key={k}>{blocks(b.children, k)}</blockquote>;
      case "rule":
        return <hr key={k} />;
      case "image":
        return (
          <figure key={k}>
            <img src={b.src} alt={b.alt} loading="lazy" decoding="async" />
            {b.alt ? <figcaption>{b.alt}</figcaption> : null}
          </figure>
        );
    }
  });
}

export function Markdown({ text, className = "prose" }: { text: string; className?: string }) {
  return <div className={className}>{blocks(parseMarkdown(text))}</div>;
}

/** One line of inline Markdown (bold, links) without block wrappers. */
export function InlineMarkdown({ text }: { text: string }) {
  return <>{inline(parseInline(text))}</>;
}
