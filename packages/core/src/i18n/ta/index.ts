/**
 * Tamil dictionary for both apps, keyed by the English text.
 *
 * This is a first draft and must be reviewed by a Tamil speaker before launch.
 * `npm test` fails if any t("…") string in either app has no Tamil entry.
 */
import { account } from "./account";
import { admin } from "./admin";
import { auth } from "./auth";
import { booking } from "./booking";
import { common } from "./common";
import { content } from "./content";
import { home } from "./home";
import { layout } from "./layout";
import { learning } from "./learning";
import { services } from "./services";
import { shop } from "./shop";

export const TA: Record<string, string> = {
  ...common,
  ...layout,
  ...home,
  ...services,
  ...booking,
  ...shop,
  ...learning,
  ...account,
  ...auth,
  ...content,
  ...admin,
};
