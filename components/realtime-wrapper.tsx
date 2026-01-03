"use client"

import { useAuth } from "./auth-provider"
import { RealtimeIndicator } from "./realtime-indicator"

export function RealtimeWrapper() {
  const { user, isLoading } = useAuth()

  // Solo mostrar el indicador si el usuario está autenticado y no está cargando
  if (isLoading || !user) {
    return null
  }

  return <RealtimeIndicator />
}
