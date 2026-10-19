/**
 * @sdw/core — shared by the web and mobile apps. Safe for UI code to import:
 * models (types), validation, pure business logic, i18n, config and the ApiError type.
 * The HTTP client and services live in "@sdw/core/api"; the mock backend in "@sdw/core/mocks".
 */
export type * from "./models";
export * from "./validation";
export * from "./logic";
export * from "./i18n";
export * from "./config";
export {
  ApiError,
  ERROR_CODES,
  ERROR_MESSAGES,
  errorMessage,
  isApiError,
  toApiError,
  type ApiErrorKind,
} from "./api/errors";
