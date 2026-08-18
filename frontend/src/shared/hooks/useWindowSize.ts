import { useEffect, useState } from "react"

export interface WindowSize {
  width: number
  height: number
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
}

const MOBILE_BREAKPOINT = 640
const TABLET_BREAKPOINT = 1024

function getSize(): WindowSize {
  if (typeof window === "undefined") {
    return { width: 0, height: 0, isMobile: false, isTablet: false, isDesktop: false }
  }
  const width = window.innerWidth
  return {
    width,
    height: window.innerHeight,
    isMobile: width < MOBILE_BREAKPOINT,
    isTablet: width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT,
    isDesktop: width >= TABLET_BREAKPOINT,
  }
}

/** Tracks the current window size + device breakpoints. */
export function useWindowSize(): WindowSize {
  const [size, setSize] = useState<WindowSize>(getSize)

  useEffect(() => {
    let raf = 0
    const handleResize = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setSize(getSize()))
    }
    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
      cancelAnimationFrame(raf)
    }
  }, [])

  return size
}
