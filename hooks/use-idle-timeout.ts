import { useEffect } from "react"

/**
 * useIdleTimeout
 * Triggers onTimeout callback after timeoutMs of inactivity (no mousemove, keydown, click, scroll, touchstart).
 */
export function useIdleTimeout(onTimeout: () => void, timeoutMs: number = 10 * 60 * 1000) {
  useEffect(() => {
    let timer: NodeJS.Timeout

    const resetTimer = () => {
      clearTimeout(timer)
      timer = setTimeout(onTimeout, timeoutMs)
    }

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"]
    
    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, resetTimer)
    })

    // Initialize timer
    resetTimer()

    // Cleanup listeners and timer
    return () => {
      clearTimeout(timer)
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer)
      })
    }
  }, [onTimeout, timeoutMs])
}
