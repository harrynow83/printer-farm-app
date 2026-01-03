import { supabase, isSupabaseAvailable } from "./supabase"

// Tipos de eventos que pueden ocurrir
export type EventType =
  | "user_added"
  | "user_updated"
  | "user_deleted"
  | "group_added"
  | "group_updated"
  | "group_deleted"
  | "printer_added"
  | "printer_updated"
  | "printer_deleted"
  | "printer_status_updated"
  | "print_job_added"
  | "print_job_completed"
  | "error_logged"
  | "errors_cleared"

export interface RealtimeEvent {
  type: EventType
  payload: any
  timestamp: number
  userId?: string // ID del usuario que hizo el cambio
}

// Sistema de eventos personalizado para localStorage
class LocalStorageEventSystem {
  private listeners: Map<EventType, Set<(event: RealtimeEvent) => void>> = new Map()
  private broadcastChannel: BroadcastChannel | null = null

  constructor() {
    // Usar BroadcastChannel si está disponible (para comunicación entre pestañas)
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      this.broadcastChannel = new BroadcastChannel("printer-app-events")
      this.broadcastChannel.addEventListener("message", (event) => {
        this.handleIncomingEvent(event.data)
      })
    }

    // También escuchar eventos de storage para cambios directos en localStorage
    if (typeof window !== "undefined") {
      window.addEventListener("storage", (event) => {
        if (event.key && event.newValue) {
          this.handleStorageChange(event.key, event.newValue)
        }
      })
    }
  }

  private handleIncomingEvent(event: RealtimeEvent) {
    const listeners = this.listeners.get(event.type)
    if (listeners) {
      listeners.forEach((listener) => listener(event))
    }
  }

  private handleStorageChange(key: string, newValue: string) {
    // Mapear cambios de localStorage a eventos
    let eventType: EventType | null = null

    switch (key) {
      case "users":
        eventType = "user_updated"
        break
      case "printerGroups":
        eventType = "group_updated"
        break
      case "printers":
        eventType = "printer_updated"
        break
      case "errorLogs":
        eventType = "error_logged"
        break
    }

    if (eventType) {
      const event: RealtimeEvent = {
        type: eventType,
        payload: JSON.parse(newValue),
        timestamp: Date.now(),
      }
      this.handleIncomingEvent(event)
    }
  }

  subscribe(eventType: EventType, callback: (event: RealtimeEvent) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }
    this.listeners.get(eventType)!.add(callback)

    // Retornar función de cleanup
    return () => {
      const listeners = this.listeners.get(eventType)
      if (listeners) {
        listeners.delete(callback)
      }
    }
  }

  emit(eventType: EventType, payload: any, userId?: string) {
    const event: RealtimeEvent = {
      type: eventType,
      payload,
      timestamp: Date.now(),
      userId,
    }

    // Emitir a otras pestañas/ventanas
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(event)
    }

    // También emitir localmente
    this.handleIncomingEvent(event)
  }

  cleanup() {
    if (this.broadcastChannel) {
      this.broadcastChannel.close()
    }
  }
}

// Sistema de eventos para Supabase
class SupabaseEventSystem {
  private listeners: Map<EventType, Set<(event: RealtimeEvent) => void>> = new Map()
  private subscriptions: any[] = []

  constructor() {
    this.setupSupabaseSubscriptions()
  }

  private setupSupabaseSubscriptions() {
    if (!supabase) return

    // Suscribirse a cambios en usuarios
    const usersSubscription = supabase
      .channel("users_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "users" }, (payload) => {
        let eventType: EventType
        switch (payload.eventType) {
          case "INSERT":
            eventType = "user_added"
            break
          case "UPDATE":
            eventType = "user_updated"
            break
          case "DELETE":
            eventType = "user_deleted"
            break
          default:
            return
        }
        this.handleSupabaseEvent(eventType, payload)
      })
      .subscribe()

    // Suscribirse a cambios en grupos de impresoras
    const groupsSubscription = supabase
      .channel("printer_groups_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "printer_groups" }, (payload) => {
        let eventType: EventType
        switch (payload.eventType) {
          case "INSERT":
            eventType = "group_added"
            break
          case "UPDATE":
            eventType = "group_updated"
            break
          case "DELETE":
            eventType = "group_deleted"
            break
          default:
            return
        }
        this.handleSupabaseEvent(eventType, payload)
      })
      .subscribe()

    // Suscribirse a cambios en impresoras
    const printersSubscription = supabase
      .channel("printers_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "printers" }, (payload) => {
        let eventType: EventType
        switch (payload.eventType) {
          case "INSERT":
            eventType = "printer_added"
            break
          case "UPDATE":
            eventType = "printer_updated"
            break
          case "DELETE":
            eventType = "printer_deleted"
            break
          default:
            return
        }
        this.handleSupabaseEvent(eventType, payload)
      })
      .subscribe()

    // Suscribirse a cambios en logs de errores
    const errorLogsSubscription = supabase
      .channel("error_logs_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "error_logs" }, (payload) => {
        let eventType: EventType
        switch (payload.eventType) {
          case "INSERT":
            eventType = "error_logged"
            break
          case "DELETE":
            eventType = "errors_cleared"
            break
          default:
            return
        }
        this.handleSupabaseEvent(eventType, payload)
      })
      .subscribe()

    this.subscriptions = [usersSubscription, groupsSubscription, printersSubscription, errorLogsSubscription]
  }

  private handleSupabaseEvent(eventType: EventType, payload: any) {
    const event: RealtimeEvent = {
      type: eventType,
      payload: payload.new || payload.old || payload,
      timestamp: Date.now(),
    }

    const listeners = this.listeners.get(eventType)
    if (listeners) {
      listeners.forEach((listener) => listener(event))
    }
  }

  subscribe(eventType: EventType, callback: (event: RealtimeEvent) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }
    this.listeners.get(eventType)!.add(callback)

    // Retornar función de cleanup
    return () => {
      const listeners = this.listeners.get(eventType)
      if (listeners) {
        listeners.delete(callback)
      }
    }
  }

  emit(eventType: EventType, payload: any, userId?: string) {
    // Para Supabase, los eventos se emiten automáticamente cuando cambian los datos
    // Esta función existe para mantener la compatibilidad de la API
    console.log(`Supabase event emitted: ${eventType}`, payload)
  }

  cleanup() {
    this.subscriptions.forEach((subscription) => {
      if (subscription && typeof subscription.unsubscribe === "function") {
        subscription.unsubscribe()
      }
    })
    this.subscriptions = []
  }
}

// Instancia global del sistema de eventos
export const eventSystem = isSupabaseAvailable ? new SupabaseEventSystem() : new LocalStorageEventSystem()

// Función helper para emitir eventos
export const emitEvent = (eventType: EventType, payload: any, userId?: string) => {
  eventSystem.emit(eventType, payload, userId)
}

// Función helper para suscribirse a eventos
export const subscribeToEvent = (eventType: EventType, callback: (event: RealtimeEvent) => void) => {
  return eventSystem.subscribe(eventType, callback)
}
