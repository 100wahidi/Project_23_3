import { createElement } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Overview from "./pages/Overview";
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
    path: "/technical",
    element: createElement(TechnicalDataQuality),
  },
  {
    path: "*",
    element: createElement(Navigate, { to: "/login", replace: true }),
  },
]);
