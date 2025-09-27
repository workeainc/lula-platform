import { lazy } from "react";

const dashboardRoutes = [
  {
    path: "",
    Element: lazy(() => import("@/views/dashboard")),
    index: true,
    key: "dashboard",
  },
  {
    path: "user",
    Element: lazy(() => import("@/views/dashboard/user/AdminUsers")),
    index: true,
    key: "user",
  },
  {
    path: "streamer",
    Element: lazy(() => import("@/views/dashboard/streamer")),
    index: true,
    key: "streamer",
  },
  {
    path: "payment",
    Element: lazy(() => import("@/views/dashboard/payment/AdminTransactions")),
    index: true,
    key: "payment",
  },
  {
    path: "calls",
    Element: lazy(() => import("@/views/dashboard/call/AdminCalls")),
    index: true,
    key: "calls",
  },
  {
    path: "payout",
    Element: lazy(() => import("@/views/dashboard/payout")),
    index: true,
    key: "payout",
  },
  {
    path: "setting",
    Element: lazy(() => import("@/views/dashboard/settings")),
    index: false,
    key: "setting",
  },
  {
    path: "account",
    Element: lazy(() => import("@/views/dashboard/account")),
    index: true,
    key: "account",
  },
  {
    path: "account/add",
    Element: lazy(() => import("@/views/dashboard/account/add")),
    index: true,
    key: "account.add",
  },
  {
    path: "account/:id/edit",
    Element: lazy(() => import("@/views/dashboard/account/edit")),
    index: true,
    key: "account.edit",
  },
];

export default dashboardRoutes;
