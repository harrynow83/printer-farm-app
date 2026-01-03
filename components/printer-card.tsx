"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Trash2, ExternalLink, PrinterIcon, Wifi, Pencil, Pause, Play, XCircle } from "lucide-react" // Removed Terminal icon
import type { Printer } from "@/lib/data-store"
import { useAuth } from "./auth-provider"
import { updatePrinterStatus, removePrinter } from "@/lib/data-store"
import { cn } from "@/lib/utils"
import { EditPrinterDialog } from "./edit-printer-dialog"
// Removed import for SendGcodeDialog
import { fetchMoonrakerStatus, formatTime, pausePrint, resumePrint, cancelPrint } from "@/lib/moonraker-api"
import Link from "next/link"
import { useNotifications } from "@/hooks/use-notifications" // Import useNotifications

interface PrinterCardProps {
  printer: Printer
  groupId: string
  onUpdate: () => void
}

export function PrinterCard({ printer, groupId, onUpdate }: PrinterCardProps) {
  const { role } = useAuth()
  const isAdmin = role === "admin"
  const [isEditPrinterDialogOpen, setIsEditPrinterDialogOpen] = useState(false)
  // Removed state for isSendGcodeDialogOpen
  const [currentPrinterStatus, setCurrentPrinterStatus] = useState<Printer["status"]>(printer.status)
  const [currentProgress, setCurrentProgress] = useState<number>(printer.progress || 0)
  const [currentEta, setCurrentEta] = useState<number | null>(printer.eta || null)

  const { showSuccess, showError, showInfo } = useNotifications() // Initialize notifications

  useEffect(() => {
    // Initialize local state with prop values
    setCurrentPrinterStatus(printer.status)
    setCurrentProgress(printer.progress || 0)
    setCurrentEta(printer.eta || null)

    const interval = setInterval(async () => {
      // Pass showError to fetchMoonrakerStatus
      const {
        status: newStatus,
        progress: newProgress,
        eta: newEta,
      } = await fetchMoonrakerStatus(printer.ipAddress, showError)

      // Check for status changes and trigger notifications
      if (printer.status !== newStatus) {
        if (newStatus === "online" && printer.status === "offline") {
          showSuccess("Impresora Conectada", `${printer.name} está ahora en línea.`)
        } else if (newStatus === "offline") {
          showError("Impresora Desconectada", `${printer.name} está ahora fuera de línea.`)
        } else if (newStatus === "printing" && printer.status !== "printing") {
          showInfo("Impresión Iniciada", `${printer.name} ha comenzado a imprimir.`)
        } else if (newStatus === "error") {
          showError("Error de Impresora", `${printer.name} ha reportado un error.`)
        }
        // If printing finished (status changed from printing to online and queue is empty)
        if (printer.status === "printing" && newStatus === "online" && printer.queue.length === 0) {
          showSuccess("Impresión Finalizada", `${printer.name} ha terminado de imprimir.`)
        }
      }

      // Always update local state to reflect the latest fetched data
      setCurrentPrinterStatus(newStatus)
      setCurrentProgress(newProgress)
      setCurrentEta(newEta)

      // Only update global store and trigger parent re-render if the fetched status
      // is different from the printer prop's status (which comes from the global store)
      // or if progress/eta have changed. This prevents unnecessary localStorage writes and re-renders.
      if (printer.status !== newStatus || printer.progress !== newProgress || printer.eta !== newEta) {
        updatePrinterStatus(printer.id, newStatus, newProgress, newEta)
        onUpdate() // Trigger parent update to re-fetch and re-render with latest data
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [
    printer.ipAddress,
    printer.id,
    printer.status,
    printer.progress,
    printer.eta,
    printer.queue.length, // Added for print finished check
    onUpdate,
    showSuccess, // Added notification hooks to dependencies
    showError,
    showInfo,
  ])

  const getStatusColorClasses = (status: Printer["status"]) => {
    switch (status) {
      case "online":
        return "bg-green-100 text-green-800 border-green-200"
      case "printing":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "error":
        return "bg-red-100 text-red-800 border-red-200"
      case "offline":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const handleDeletePrinter = () => {
    if (confirm(`¿Estás seguro de que quieres eliminar la impresora "${printer.name}"?`)) {
      removePrinter(groupId, printer.id)
      onUpdate()
      showSuccess("Impresora Eliminada", `"${printer.name}" ha sido eliminada.`)
    }
  }

  const handleEditPrinter = () => {
    setIsEditPrinterDialogOpen(true)
  }

  const handlePausePrint = async () => {
    // Pass showError to pausePrint
    const success = await pausePrint(printer.ipAddress, showError)
    if (success) {
      onUpdate()
      showSuccess("Impresión Pausada", `La impresión en "${printer.name}" ha sido pausada.`)
    }
  }

  const handleResumePrint = async () => {
    // Pass showError to resumePrint
    const success = await resumePrint(printer.ipAddress, showError)
    if (success) {
      onUpdate()
      showSuccess("Impresión Reanudada", `La impresión en "${printer.name}" ha sido reanudada.`)
    }
  }

  const handleCancelPrint = async () => {
    if (confirm(`¿Estás seguro de que quieres cancelar la impresión en "${printer.name}"?`)) {
      // Pass showError to cancelPrint
      const success = await cancelPrint(printer.ipAddress, showError)
      if (success) {
        onUpdate()
        showSuccess("Impresión Cancelada", `La impresión en "${printer.name}" ha sido cancelada.`)
      }
    }
  }

  // Removed handleSendGcode function

  return (
    <Card className="w-full bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <PrinterIcon className="h-5 w-5 text-muted-foreground" />
          {printer.name}
        </CardTitle>
        <Badge className={cn("border", getStatusColorClasses(currentPrinterStatus))}>
          {currentPrinterStatus.charAt(0).toUpperCase() + currentPrinterStatus.slice(1)}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <img
            src={printer.imageUrl || "/placeholder.svg?height=80&width=80"}
            alt={`Imagen de ${printer.name}`}
            className="w-16 h-16 rounded-md object-cover"
          />
          <div className="flex-1">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Wifi className="h-4 w-4" />
              IP: {printer.ipAddress}
            </p>
            <p className="text-sm text-muted-foreground">Trabajos en cola: {printer.queue.length}</p>
          </div>
        </div>

        {/* Progress Bar */}
        {currentPrinterStatus === "printing" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Progreso de impresión:</span>
              <span className="font-medium">{currentProgress.toFixed(1)}%</span>
            </div>
            <Progress value={currentProgress} className="w-full" />
            {currentEta !== null && (
              <p className="text-sm text-muted-foreground text-right">Tiempo restante: {formatTime(currentEta)}</p>
            )}
          </div>
        )}

        <div className="flex justify-center mt-4">
          <Link href={`/printers/${printer.id}/queue?groupId=${groupId}`} passHref>
            <Button asChild className="w-full">
              <a>Trabajos en cola</a>
            </Button>
          </Link>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <Button asChild variant="outline" className="flex-1 min-w-[120px] bg-transparent">
            <a href={`http://${printer.ipAddress}`} target="_blank" rel="noopener noreferrer">
              <span className="flex items-center justify-center">
                <ExternalLink className="mr-2 h-4 w-4" />
                Abrir Impresora
              </span>
            </a>
          </Button>
          {isAdmin && (
            <>
              {/* Pause/Resume/Cancel Buttons */}
              {currentPrinterStatus === "printing" && (
                <Button
                  variant="outline"
                  onClick={handlePausePrint}
                  aria-label="Pausar impresión"
                  className="flex-1 min-w-[120px] bg-transparent"
                >
                  <Pause className="mr-2 h-4 w-4" />
                  Pausar
                </Button>
              )}
              {currentPrinterStatus === "online" && printer.queue.length > 0 && (
                <Button
                  variant="outline"
                  onClick={handleResumePrint}
                  aria-label="Reanudar impresión"
                  className="flex-1 min-w-[120px] bg-transparent"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Reanudar
                </Button>
              )}
              {(currentPrinterStatus === "printing" ||
                currentPrinterStatus === "online" ||
                currentPrinterStatus === "paused") &&
                printer.queue.length > 0 && (
                  <Button
                    variant="destructive"
                    onClick={handleCancelPrint}
                    aria-label="Cancelar impresión"
                    className="flex-1 min-w-[120px]"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancelar
                  </Button>
                )}

              {/* Removed Send G-code Button */}
              {/* <Button
                variant="outline"
                onClick={handleSendGcode}
                aria-label="Enviar comando G-code"
                className="flex-1 min-w-[120px] bg-transparent"
              >
                <Terminal className="mr-2 h-4 w-4" />
                Enviar G-code
              </Button> */}

              <Button
                variant="outline"
                onClick={handleEditPrinter}
                aria-label="Editar impresora"
                className="flex-1 min-w-[120px] bg-transparent"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeletePrinter}
                aria-label="Eliminar impresora"
                className="flex-1 min-w-[120px]"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </Button>
            </>
          )}
        </div>
      </CardContent>
      <EditPrinterDialog
        isOpen={isEditPrinterDialogOpen}
        onClose={() => setIsEditPrinterDialogOpen(false)}
        onUpdate={onUpdate}
        printer={printer}
        ipRange={printer.ipAddress.split(".").slice(0, 3).join(".") + "."}
      />
      {/* Removed SendGcodeDialog component */}
      {/* <SendGcodeDialog
        isOpen={isSendGcodeDialogOpen}
        onClose={() => setIsSendGcodeDialogOpen(false)}
        printerIp={printer.ipAddress}
        onCommandSent={onUpdate}
        showError={showError}
      /> */}
    </Card>
  )
}
