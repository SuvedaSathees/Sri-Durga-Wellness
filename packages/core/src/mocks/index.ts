/**
 * Mock backend for development and demos. Import only from composition roots
 * (apps/* /src/app) — never from screens or components.
 */
export { createMockApi, type MockApi, type MockPersistence } from "./adapter";
export { createMockBackend, mockHandlerIds, type MockBackend, type MockControls, type MockState } from "./backend";
export { MOCK_UPI } from "./catalog";
