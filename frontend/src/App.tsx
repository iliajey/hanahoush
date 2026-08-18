import AppRouter from "./app/routes/AppRouter"
import { HanahoushCursor } from "./design/cursor/HanahoushCursor"
import { NoiseLayer } from "./design/background"

/**
 * Application shell — minimal and stable.
 * Composition happens inside routers / providers, not here.
 * Global design-system surfaces (living cursor + film noise) mount here.
 */
export default function App() {
  return (
    <>
      <NoiseLayer />
      <HanahoushCursor />
      <AppRouter />
    </>
  )
}
