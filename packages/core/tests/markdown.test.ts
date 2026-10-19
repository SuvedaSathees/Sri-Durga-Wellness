import { test } from "node:test";
import assert from "node:assert/strict";
import { markdownToPlainText, parseMarkdown } from "../src";

test("markdown is parsed into a safe tree", () => {
  const blocks = parseMarkdown(
    "# Title\n\nHello **world** and [site](https://example.com).\n\n- one\n- two\n\n1. first\n\n> quoted\n\n---\n\n[bad](javascript:alert(1)) ![x](javascript:1)",
  );
  assert.deepEqual(
    blocks.map((b) => b.type),
    ["heading", "paragraph", "list", "list", "quote", "rule", "paragraph"],
  );
  assert.deepEqual(blocks[0], { type: "heading", level: 2, children: [{ type: "text", text: "Title" }] });
  const para = blocks[1];
  assert.ok(para?.type === "paragraph");
  if (para?.type === "paragraph") {
    assert.deepEqual(para.children[1], { type: "strong", children: [{ type: "text", text: "world" }] });
    assert.deepEqual(para.children[3], {
      type: "link",
      href: "https://example.com",
      external: true,
      children: [{ type: "text", text: "site" }],
    });
  }
  const last = blocks.at(-1);
  assert.ok(
    last?.type === "paragraph" && !JSON.stringify(last).includes("javascript"),
    "unsafe links become plain text",
  );
});

test("plain text strips formatting", () => {
  assert.equal(markdownToPlainText("## Hi\n**bold** [link](/x)"), "Hi bold link");
});
