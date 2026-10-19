/**
 * Deep links use the same paths as the website, so a link shared from the site
 * (https://<site>/shop/calm-evening-herbal-tea) or sridurgawellness://shop/… opens the same screen.
 * Add the production web domain to `prefixes` once it is known (and set up associated domains /
 * Android app links for it).
 */
import type { LinkingOptions } from "@react-navigation/native";
import type { RootStackParamList } from "./types";

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ["sridurgawellness://"],
  config: {
    screens: {
      Tabs: {
        screens: {
          HomeTab: "",
          ServicesTab: "services",
          ShopTab: "shop",
          LearnTab: "classes",
          AccountTab: "account",
        },
      },
      ServiceDetail: "services/:slug",
      Booking: "book",
      Consultation: "free-consultation",
      Contact: "contact",
      About: "about",
      Product: "shop/:slug",
      Cart: "cart",
      Checkout: "checkout",
      Payment: "pay/:paymentId",
      ClassDetail: "classes/:slug",
      CourseDetail: "courses/:slug",
      Lesson: "learn/:slug/:lessonId",
      Blog: "blog",
      Post: "blog/:slug",
      Policy: "policies/:slug",
      Login: "login",
      Register: "register",
      ForgotPassword: "forgot-password",
      ResetPassword: "reset-password",
      Appointments: "account/appointments",
      Appointment: "account/appointments/:id",
      Orders: "account/orders",
      Order: "account/orders/:reference",
      Payments: "account/payments",
      MyClasses: "account/classes",
      MyClass: "account/classes/:id",
      MyCourses: "account/courses",
      Profile: "account/profile",
      Settings: "account/settings",
    },
  },
};
