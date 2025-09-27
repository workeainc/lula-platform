import { lazy } from "react";

const authRoutes = [
  {
    path: "/login",
    Element: lazy(() => import("@/views/auth/otp-login")),
    index: false,
    key: "login",
  },
  {
    path: "/otp-login",
    Element: lazy(() => import("@/views/auth/otp-login")),
    index: false,
    key: "otp-login",
  },
];

export default authRoutes;
