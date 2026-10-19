/**
 * All web routes. Screens are code-split and loaded on demand. Private routes sit under <RequireAuth>.
 * URLs never carry personal data, tokens or meeting links.
 */
import { createBrowserRouter, createHashRouter, type RouteObject } from "react-router";
import type { ComponentType } from "react";
import { SiteLayout } from "../components/layout/SiteLayout";
import { RequireAuth } from "./RequireAuth";
import { RouteError } from "./RouteError";

type ScreenModule = Record<string, ComponentType>;
const screen = (load: () => Promise<ScreenModule>, name: string) => () => load().then((m) => ({ Component: m[name]! }));

const publicRoutes: RouteObject[] = [
  { index: true, lazy: screen(() => import("../features/home/screens/HomeScreen"), "HomeScreen") },
  { path: "about", lazy: screen(() => import("../features/content/screens/AboutScreen"), "AboutScreen") },
  { path: "services", lazy: screen(() => import("../features/services/screens/ServicesScreen"), "ServicesScreen") },
  {
    path: "services/:slug",
    lazy: screen(() => import("../features/services/screens/ServiceDetailScreen"), "ServiceDetailScreen"),
  },
  { path: "book", lazy: screen(() => import("../features/booking/screens/BookingScreen"), "BookingScreen") },
  {
    path: "free-consultation",
    lazy: screen(() => import("../features/booking/screens/ConsultationScreen"), "ConsultationScreen"),
  },
  { path: "contact", lazy: screen(() => import("../features/content/screens/ContactScreen"), "ContactScreen") },
  { path: "shop", lazy: screen(() => import("../features/shop/screens/ShopScreen"), "ShopScreen") },
  { path: "shop/:slug", lazy: screen(() => import("../features/shop/screens/ProductScreen"), "ProductScreen") },
  { path: "cart", lazy: screen(() => import("../features/shop/screens/CartScreen"), "CartScreen") },
  { path: "classes", lazy: screen(() => import("../features/classes/screens/ClassesScreen"), "ClassesScreen") },
  {
    path: "classes/:slug",
    lazy: screen(() => import("../features/classes/screens/ClassDetailScreen"), "ClassDetailScreen"),
  },
  { path: "courses", lazy: screen(() => import("../features/courses/screens/CoursesScreen"), "CoursesScreen") },
  {
    path: "courses/:slug",
    lazy: screen(() => import("../features/courses/screens/CourseDetailScreen"), "CourseDetailScreen"),
  },
  {
    path: "learn/:slug/:lessonId",
    lazy: screen(() => import("../features/courses/screens/LessonScreen"), "LessonScreen"),
  },
  { path: "blog", lazy: screen(() => import("../features/content/screens/BlogScreen"), "BlogScreen") },
  { path: "blog/:slug", lazy: screen(() => import("../features/content/screens/PostScreen"), "PostScreen") },
  { path: "policies/:slug", lazy: screen(() => import("../features/content/screens/PolicyScreen"), "PolicyScreen") },
  { path: "login", lazy: screen(() => import("../features/auth/screens/LoginScreen"), "LoginScreen") },
  { path: "register", lazy: screen(() => import("../features/auth/screens/RegisterScreen"), "RegisterScreen") },
  {
    path: "forgot-password",
    lazy: screen(() => import("../features/auth/screens/ForgotPasswordScreen"), "ForgotPasswordScreen"),
  },
  {
    path: "reset-password",
    lazy: screen(() => import("../features/auth/screens/ResetPasswordScreen"), "ResetPasswordScreen"),
  },
];

const privateRoutes: RouteObject[] = [
  { path: "checkout", lazy: screen(() => import("../features/shop/screens/CheckoutScreen"), "CheckoutScreen") },
  { path: "pay/:paymentId", lazy: screen(() => import("../features/payments/screens/PaymentScreen"), "PaymentScreen") },
  {
    path: "account",
    lazy: screen(() => import("../features/account/screens/AccountLayout"), "AccountLayout"),
    children: [
      { index: true, lazy: screen(() => import("../features/account/screens/OverviewScreen"), "OverviewScreen") },
      {
        path: "appointments",
        lazy: screen(() => import("../features/account/screens/AppointmentsScreen"), "AppointmentsScreen"),
      },
      {
        path: "appointments/:id",
        lazy: screen(() => import("../features/account/screens/AppointmentScreen"), "AppointmentScreen"),
      },
      { path: "orders", lazy: screen(() => import("../features/account/screens/OrdersScreen"), "OrdersScreen") },
      {
        path: "orders/:reference",
        lazy: screen(() => import("../features/account/screens/OrderScreen"), "OrderScreen"),
      },
      { path: "payments", lazy: screen(() => import("../features/account/screens/PaymentsScreen"), "PaymentsScreen") },
      { path: "classes", lazy: screen(() => import("../features/account/screens/MyClassesScreen"), "MyClassesScreen") },
      { path: "classes/:id", lazy: screen(() => import("../features/account/screens/MyClassScreen"), "MyClassScreen") },
      { path: "courses", lazy: screen(() => import("../features/account/screens/MyCoursesScreen"), "MyCoursesScreen") },
      { path: "profile", lazy: screen(() => import("../features/account/screens/ProfileScreen"), "ProfileScreen") },
      { path: "settings", lazy: screen(() => import("../features/account/screens/SettingsScreen"), "SettingsScreen") },
    ],
  },
];

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <SiteLayout />,
    errorElement: <RouteError />,
    children: [
      {
        errorElement: <RouteError />,
        children: [...publicRoutes, { element: <RequireAuth />, children: privateRoutes }],
      },
      { path: "*", lazy: screen(() => import("../features/content/screens/NotFoundScreen"), "NotFoundScreen") },
    ],
  },
];

/**
 * Browser history in normal hosting. `hash` routing is only for hosts that can't serve index.html
 * for every path (e.g. the single-file demo).
 */
export function createRouter(mode: "browser" | "hash" = "browser") {
  return mode === "hash" ? createHashRouter(routes) : createBrowserRouter(routes);
}
