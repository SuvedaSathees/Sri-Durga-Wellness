/**
 * API layer. Import from "@sdw/core/api" only in composition roots (apps/* /src/app, /platform)
 * and in @sdw/controllers — never in screens or components (enforced by tests/architecture.test.ts).
 */
export { createApiClient, type ApiClient, type ApiClientOptions, type RequestOptions } from "./client";
export { allEndpoints, buildPath, endpoints, type AuthRequirement, type Endpoint, type HttpMethod } from "./endpoints";
export { createTokenStore, type SecureStorage, type TokenStore } from "./token-store";
export { createServices, type Services } from "./services";
export type * from "./services";
export type { AxiosAdapter } from "axios";
