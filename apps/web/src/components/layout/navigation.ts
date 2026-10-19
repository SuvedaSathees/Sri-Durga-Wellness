/** Main navigation, shared by the header, the mobile menu and the footer. Labels are i18n keys. */
export const MAIN_NAV = [
  { to: "/", label: "Home", end: true },
  { to: "/about", label: "About" },
  { to: "/services", label: "Services" },
  { to: "/classes", label: "Online Classes" },
  { to: "/courses", label: "Courses" },
  { to: "/shop", label: "Shop" },
  { to: "/blog", label: "Journal" },
  { to: "/contact", label: "Contact" },
] as const;

export const POLICY_NAV = [
  { to: "/policies/privacy-policy", label: "Privacy Policy" },
  { to: "/policies/terms-of-use", label: "Terms of Use" },
  { to: "/policies/refund-and-cancellation-policy", label: "Refund & Cancellation" },
  { to: "/policies/medical-disclaimer", label: "Medical Disclaimer" },
] as const;
