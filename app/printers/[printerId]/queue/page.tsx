"use client"

import type React from "react"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getPrinterById, addPrintJobToQueue, completePrintJob, type Printer } from "@/lib/data-store"
import { ArrowLeft, Upload, CheckCircle, FileText, Search } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useNotifications } from "@/hooks/use-notifications" // Import useNotifications

interface PrinterQueuePageProps {
  params: {
    printerId: string
  }
}

export default function PrinterQueuePage({ params }: PrinterQueuePageProps) {
  const { printerId } = params
  const searchParams = useSearchParams()
  const groupId = searchParams.get("groupId")

  const [printer, setPrinter] = useState<Printer | null>(null)
  const [fileName, setFileName] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  const { showSuccess, showError, showInfo } = useNotifications() // Initialize notifications

  const fetchData = useCallback(() => {
    const currentPrinter = getPrinterById(printerId)
    setPrinter(currentPrinter || null)
  }, [printerId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileName(e.target.files[0].name)
    } else {
      setFileName("")
    }
  }

  const handleUploadFile = () => {
    if (fileName && printer) {
      addPrintJobToQueue(printer.id, fileName)
      setFileName("")
      fetchData()
      showSuccess("Archivo Añadido", `"${fileName}" ha sido añadido a la cola de ${printer.name}.`)
    } else {
      showError("Error de Subida", "Por favor, selecciona un archivo para subir.")
    }
  }

  const handleCompleteJob = () => {
    if (printer && printer.queue.length > 0) {
      const completedFileName = printer.queue[0]?.fileName || "un trabajo"
      completePrintJob(printer.id)
      fetchData()
      showSuccess("Trabajo Finalizado", `"${completedFileName}" ha sido marcado como finalizado en ${printer.name}.`)
    } else {
      showError("Error", "No hay trabajos pendientes para finalizar.")
    }
  }

  // Filtered print jobs based on search term
  const filteredQueue = useMemo(() => {
    if (!printer) return []
    if (!searchTerm) return printer.queue
    const lowerCaseSearchTerm = searchTerm.toLowerCase()
    return printer.queue.filter((job) => job.fileName.toLowerCase().includes(lowerCaseSearchTerm))
  }, [searchTerm, printer])

  const filteredCompletedJobs = useMemo(() => {
    if (!printer) return []
    if (!searchTerm) return printer.completedJobs
    const lowerCaseSearchTerm = searchTerm.toLowerCase()
    return printer.completedJobs.filter((job) => job.fileName.toLowerCase().includes(lowerCaseSearchTerm))
  }, [searchTerm, printer])

  if (!printer) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
        <p className="text-lg text-muted-foreground">Cargando impresora o impresora no encontrada...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 p-4 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            href={groupId ? `/groups/${groupId}` : "/"}
            className="text-muted-foreground hover:text-gray-900 dark:hover:text-gray-50"
          >
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Volver a la impresora</span>
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Cola de Impresión: {printer.name}</h1>
        </div>
      </header>

      <main className="space-y-8">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar trabajos de impresión..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Trabajos por Imprimir ({filteredQueue.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredQueue.length === 0 ? (
              <p className="text-muted-foreground">
                No hay trabajos pendientes en la cola que coincidan con la búsqueda.
              </p>
            ) : (
              <ul className="space-y-2">
                {filteredQueue.map((job) => (
                  <li key={job.id} className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>{job.fileName}</span>
                    <span className="ml-auto text-xs">Añadido: {new Date(job.timestamp).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <div className="flex-1 flex items-center gap-2 min-w-0">
                <Input type="file" id="file-upload-queue" className="hidden" onChange={handleFileChange} />
                <Label htmlFor="file-upload-queue" className="flex-1 min-w-0">
                  <Button asChild variant="outline" className="w-full bg-transparent">
                    <span className="flex items-center justify-center overflow-hidden">
                      <Upload className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{fileName ? fileName : "Seleccionar Archivo"}</span>
                    </span>
                  </Button>
                </Label>
                <Button onClick={handleUploadFile} disabled={!fileName}>
                  Subir a Cola
                </Button>
              </div>
              <Button onClick={handleCompleteJob} disabled={printer.queue.length === 0}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Marcar como Finalizado
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trabajos Terminados ({filteredCompletedJobs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredCompletedJobs.length === 0 ? (
              <p className="text-muted-foreground">No hay trabajos terminados que coincidan con la búsqueda.</p>
            ) : (
              <ul className="space-y-2">
                {filteredCompletedJobs.map((job) => (
                  <li key={job.id} className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>{job.fileName}</span>
                    <span className="ml-auto text-xs">
                      Terminado: {job.completedAt ? new Date(job.completedAt).toLocaleString() : "N/A"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
