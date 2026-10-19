/** Writes the web app's CSS variables from the shared tokens: `npm run tokens:css`. */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { toCssVariables } from "../src/index";

const target = fileURLToPath(new URL("../../../apps/web/src/styles/tokens.css", import.meta.url));
writeFileSync(target, toCssVariables());
console.log(`Wrote ${target}`);
