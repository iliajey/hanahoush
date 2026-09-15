import { useCallback, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"

const CLICKS_REQUIRED = 10
const RESET_MS = 2000
const COOLDOWN_MS = 30_000

/**
 * Easter egg: 10 consecutive Home clicks (within RESET_MS gaps) navigate to
 * /credits. Counter resets on inactivity; refresh resets (in-memory only);
 * cooldown blocks repeat triggers. No click logging, no persistence.
 *
 * On the triggering click the Link/NavLink default navigation is suppressed
 * so the router lands on /credits instead of racing back to "/".
 */
export function useHomeClickEgg(enabled = true) {
  const navigate = useNavigate()
  const clicks = useRef(0)
  const timer = useRef<number | null>(null)
  const cooldownUntil = useRef(0)

  const clearTimer = () => {
    if (timer.current != null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
  }

  useEffect(() => clearTimer, [])

  const armReset = useCallback(() => {
    clearTimer()
    timer.current = window.setTimeout(() => {
      clicks.current = 0
      timer.current = null
    }, RESET_MS)
  }, [])

  const onHomeClick = useCallback(
    (event?: { preventDefault?: () => void }) => {
      if (!enabled) return
      if (Date.now() < cooldownUntil.current) return
      clicks.current += 1
      if (clicks.current >= CLICKS_REQUIRED) {
        clicks.current = 0
        clearTimer()
        cooldownUntil.current = Date.now() + COOLDOWN_MS
        event?.preventDefault?.()
        navigate("/credits")
        return
      }
      armReset()
    },
    [enabled, navigate, armReset],
  )

  return { onHomeClick }
}

export const EGG_CONFIG = { CLICKS_REQUIRED, RESET_MS, COOLDOWN_MS }
