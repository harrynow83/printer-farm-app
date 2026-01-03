"use client"

import { useEffect } from "react"
import { eventSystem } from "@/lib/realtime-events"

export function useCleanup() {
  useEffect(() => {
    // Cleanup cuando la ventana se cierre
    const handleBeforeUnload = () => {
      eventSystem.cleanup()
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      eventSystem.cleanup()
    }
  }, [])
}
