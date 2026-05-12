import { createBrowserRouter } from "react-router-dom";
import { RootRoute } from "../pages/RootRoute";

export const router = createBrowserRouter([
  {
    path: "*",
    element: <RootRoute />
  }
]);
