import { RouterProvider } from "react-router-dom"

import router from "../routes"

/**
 * Wire the router into the React tree. Wrapped in a provider so future
 * guards (auth, i18n readiness) can live here without touching routes.
 */
export default function AppRouter() {
  return <RouterProvider router={router} />
}
