import { createElement } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Overview from "./pages/Overview";
import KRIAnalytics from "./pages/KRIAnalytics";
import TechnicalDataQuality from "./pages/TechnicalDataQuality";

export const router = createBrowserRouter([
  {
    path: "/",
    element: createElement(Navigate, { to: "/login", replace: true }),
  },
  {
    path: "/login",
    element: createElement(Login),
  },
  {
    path: "/overview",
    element: createElement(Overview),
  },
  {
    path: "/kri-analytics",
    element: createElement(KRIAnalytics),
  },
  {
    path: "/technical",
    element: createElement(TechnicalDataQuality),
  },
  {
    path: "*",
    element: createElement(Navigate, { to: "/login", replace: true }),
  },
]);
