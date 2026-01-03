"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff } from "lucide-react"
import { useRealtimeUpdates } from "@/hooks/use-realtime-updates"
import { cn } from "@/lib/utils"

export function RealtimeIndicator() {
  const [isConnected, setIsConnected] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [showUpdateBadge, setShowUpdateBadge] = useState(false)

  // Escuchar todos los eventos para mostrar el indicador de actividad
  // No pasamos userId aquí para evitar dependencia del contexto de autenticación
  useRealtimeUpdates({
    events: [
      "user_added",
      "user_updated",
      "user_deleted",
      "group_added",
      "group_updated",
      "group_deleted",
      "printer_added",
      "printer_updated",
      "printer_deleted",
      "printer_status_updated",
      "print_job_added",
      "print_job_completed",
      "error_logged",
      "errors_cleared",
    ],
    onUpdate: (event) => {
      setLastUpdate(new Date())
      setShowUpdateBadge(true)

      // Ocultar el badge después de 3 segundos
      setTimeout(() => {
        setShowUpdateBadge(false)
      }, 3000)
    },
    // No pasamos userId para evitar loops de eventos propios
  })

  // Simular detección de conexión (en una implementación real, esto podría ser más sofisticado)
  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(navigator.onLine)
    }

    window.addEventListener("online", checkConnection)
    window.addEventListener("offline", checkConnection)

    return () => {
      window.removeEventListener("online", checkConnection)
      window.removeEventListener("offline", checkConnection)
    }
  }, [])

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
      {/* Indicador de conexión */}
      <Badge
        variant={isConnected ? "default" : "destructive"}
        className={cn(
          "flex items-center gap-1 transition-all duration-200",
          isConnected ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600",
        )}
      >
        {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
        {isConnected ? "En línea" : "Sin conexión"}
      </Badge>

      {/* Badge de actualización reciente */}
      {showUpdateBadge && (
        <Badge variant="secondary" className="animate-pulse bg-blue-500 text-white hover:bg-blue-600">
          Actualizado
        </Badge>
      )}

      {/* Timestamp de última actualización */}
      {lastUpdate && (
        <div className="text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded">
          Última actualización: {lastUpdate.toLocaleTimeString()}
        </div>
      )}
    </div>
  )
}
