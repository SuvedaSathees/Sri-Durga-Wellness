import type { ApiClient } from "../client";
import { createAccountService } from "./account";
import { createAdminService } from "./admin";
import { createAuthService } from "./auth";
import { createBookingService } from "./booking";
import { createCatalogService } from "./catalog";
import { createContentService } from "./content";
import { createClassesService, createCoursesService } from "./learning";
import { createPaymentsService } from "./payments";
import { createShopService } from "./shop";

/** All API services, built on one client. Hooks receive this object through ApiProvider. */
export function createServices(api: ApiClient) {
  return {
    auth: createAuthService(api),
    content: createContentService(api),
    catalog: createCatalogService(api),
    booking: createBookingService(api),
    shop: createShopService(api),
    payments: createPaymentsService(api),
    classes: createClassesService(api),
    courses: createCoursesService(api),
    account: createAccountService(api),
    admin: createAdminService(api),
  };
}

export type Services = ReturnType<typeof createServices>;
export type * from "./account";
export type * from "./admin";
export type * from "./auth";
export type * from "./booking";
export type * from "./catalog";
export type * from "./content";
export type * from "./learning";
export type * from "./payments";
export type * from "./shop";
