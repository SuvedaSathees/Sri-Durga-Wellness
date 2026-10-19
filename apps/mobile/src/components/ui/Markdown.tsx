/** Renders the shared Markdown tree with native <Text>/<View> — never as HTML. */
import { Fragment, type ReactNode } from "react";
import { Image, StyleSheet, View } from "react-native";
import { useLinkTo } from "@react-navigation/native";
import { parseMarkdown, type MdBlock, type MdInline } from "@sdw/core";
import { openExternal, openWebPage } from "../../platform/links";
import { imageSource } from "../../platform/images";
import { theme } from "../../theme";
import { Text } from "./Text";

function useInline() {
  const linkTo = useLinkTo();
  const render = (nodes: MdInline[], key = "i"): ReactNode[] =>
    nodes.map((n, i) => {
      const k = `${key}-${i}`;
      switch (n.type) {
        case "text":
          return <Fragment key={k}>{n.text}</Fragment>;
        case "strong":
          return (
            <Text key={k} style={styles.strong}>
              {render(n.children, k)}
            </Text>
          );
        case "em":
          return (
            <Text key={k} style={styles.em}>
              {render(n.children, k)}
            </Text>
          );
        case "code":
          return (
            <Text key={k} style={styles.code}>
              {n.text}
            </Text>
          );
        case "link":
          return (
            <Text
              key={k}
              style={styles.link}
              accessibilityRole="link"
              onPress={() => {
                if (n.href.startsWith("/")) linkTo(n.href);
                else if (/^https:/i.test(n.href)) void openWebPage(n.href);
                else void openExternal(n.href);
              }}
            >
              {render(n.children, k)}
            </Text>
          );
      }
    });
  return render;
}

export function Markdown({ text }: { text: string }) {
  const inline = useInline();
  const blocks = (list: MdBlock[], key = "b"): ReactNode[] =>
    list.map((b, i) => {
      const k = `${key}-${i}`;
      switch (b.type) {
        case "heading":
          return (
            <Text key={k} variant={b.level === 2 ? "h3" : "label"} style={styles.heading}>
              {inline(b.children, k)}
            </Text>
          );
        case "paragraph":
          return <Text key={k}>{inline(b.children, k)}</Text>;
        case "list":
          return (
            <View key={k} style={styles.list}>
              {b.items.map((item, j) => (
                <View key={j} style={styles.item}>
                  <Text style={styles.bullet} accessibilityElementsHidden importantForAccessibility="no">
                    {b.ordered ? `${j + 1}.` : "•"}
                  </Text>
                  <Text style={styles.itemText}>{inline(item, `${k}-${j}`)}</Text>
                </View>
              ))}
            </View>
          );
        case "quote":
          return (
            <View key={k} style={styles.quote}>
              {blocks(b.children, k)}
            </View>
          );
        case "rule":
          return <View key={k} style={styles.rule} />;
        case "image": {
          const source = imageSource(b.src);
          return source ? (
            <Image key={k} source={source} accessibilityLabel={b.alt} style={styles.image} resizeMode="cover" />
          ) : null;
        }
      }
    });
  return <View style={styles.root}>{blocks(parseMarkdown(text))}</View>;
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  heading: { marginTop: 6 },
  strong: { fontWeight: "700", color: theme.color.text },
  em: { fontStyle: "italic" },
  code: { fontFamily: "monospace", backgroundColor: theme.color.bgAlt },
  link: { color: theme.color.primary, textDecorationLine: "underline" },
  list: { gap: 6 },
  item: { flexDirection: "row", gap: 8 },
  bullet: { width: 18, color: theme.color.accent },
  itemText: { flex: 1 },
  quote: {
    borderLeftWidth: 3,
    borderLeftColor: theme.color.accent,
    backgroundColor: theme.color.surfaceMuted,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: theme.color.borderStrong },
  image: { width: "100%", aspectRatio: 16 / 10, borderRadius: theme.radius.lg },
});
