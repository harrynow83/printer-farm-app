"use client"

import { useEffect, useCallback, useRef } from "react"
import { subscribeToEvent, type EventType, type RealtimeEvent } from "@/lib/realtime-events"
import { useAuth } from "@/components/auth-provider"

interface UseRealtimeUpdatesOptions {
  events: EventType[]
  onUpdate?: (event: RealtimeEvent) => void
  enabled?: boolean
  userId?: string | null // Hacer userId opcional
}

export function useRealtimeUpdates({ events, onUpdate, enabled = true, userId }: UseRealtimeUpdatesOptions) {
  const unsubscribeFunctions = useRef<(() => void)[]>([])
  const authContext = useAuth()
  const user = authContext.user

  const handleEvent = useCallback(
    (event: RealtimeEvent) => {
      // No procesar eventos que nosotros mismos generamos (evitar loops)
      // Solo si tenemos userId disponible
      if (userId && event.userId === userId) {
        return
      }

      console.log(`Realtime event received: ${event.type}`, event.payload)

      if (onUpdate) {
        onUpdate(event)
      }
    },
    [onUpdate, userId],
  )

  useEffect(() => {
    if (!enabled) return

    // Limpiar suscripciones anteriores
    unsubscribeFunctions.current.forEach((unsubscribe) => unsubscribe())
    unsubscribeFunctions.current = []

    // Crear nuevas suscripciones
    events.forEach((eventType) => {
      const unsubscribe = subscribeToEvent(eventType, handleEvent)
      unsubscribeFunctions.current.push(unsubscribe)
    })

    // Cleanup al desmontar
    return () => {
      unsubscribeFunctions.current.forEach((unsubscribe) => unsubscribe())
      unsubscribeFunctions.current = []
    }
  }, [events, handleEvent, enabled])
}

// Hook específico para actualizaciones de dashboard
export function useDashboardUpdates(onUpdate: () => void) {
  const authContext = useAuth()
  const user = authContext.user

  useRealtimeUpdates({
    events: [
      "group_added",
      "group_updated",
      "group_deleted",
      "printer_added",
      "printer_updated",
      "printer_deleted",
      "printer_status_updated",
    ],
    onUpdate: () => onUpdate(),
    userId: user,
  })
}

// Hook específico para actualizaciones de usuarios
export function useUserUpdates(onUpdate: () => void) {
  const authContext = useAuth()
  const user = authContext.user

  useRealtimeUpdates({
    events: ["user_added", "user_updated", "user_deleted"],
    onUpdate: () => onUpdate(),
    userId: user,
  })
}

// Hook específico para actualizaciones de cola de impresión
export function usePrintQueueUpdates(printerId: string, onUpdate: () => void) {
  const authContext = useAuth()
  const user = authContext.user

  useRealtimeUpdates({
    events: ["print_job_added", "print_job_completed", "printer_status_updated"],
    onUpdate: (event) => {
      // Solo actualizar si el evento es para esta impresora específica
      if (event.payload?.id === printerId || event.payload?.printerId === printerId) {
        onUpdate()
      }
    },
    userId: user,
  })
}

// Hook específico para actualizaciones de logs de errores
export function useErrorLogsUpdates(onUpdate: () => void) {
  const authContext = useAuth()
  const user = authContext.user

  useRealtimeUpdates({
    events: ["error_logged", "errors_cleared"],
    onUpdate: () => onUpdate(),
    userId: user,
  })
}
