"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { getPrinterGroups, getPrintersByGroupId, type Printer, type PrinterGroup } from "@/lib/data-store"
import { PrinterCard } from "@/components/printer-card"
import { AddPrinterDialog } from "@/components/add-printer-dialog"
import { PlusCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface GroupPageProps {
  params: {
    groupId: string
  }
}

export default function GroupPage({ params }: GroupPageProps) {
  const groupId = params.groupId

  const { role } = useAuth()
  const isAdmin = role === "admin"
  const [group, setGroup] = useState<PrinterGroup | null>(null)
  const [printers, setPrinters] = useState<Printer[]>([])
  const [isAddPrinterDialogOpen, setIsAddPrinterDialogOpen] = useState(false)

  // User-chosen IP range prefix
  const ipRangePrefix = "192.168.1." // You can make this configurable if needed

  const fetchData = useCallback(() => {
    const groups = getPrinterGroups()
    const currentGroup = groups.find((g) => g.id === groupId)
    setGroup(currentGroup || null)

    if (currentGroup) {
      const printersInGroup = getPrintersByGroupId(groupId)
      setPrinters(printersInGroup)
    }
  }, [groupId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      {/* --- Encabezado de la Página de Grupo --- */}
      {/* Modifica el padding (p-4 md:p-8), el color de fondo (bg-white dark:bg-gray-900), */}
      {/* las sombras (shadow-sm) y el espaciado (gap-4 mb-8). */}
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 p-4 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
        <div className="flex items-center gap-4">
          {/* Botón "Volver a grupos" */}
          {/* El estilo de 'variant="outline"' se define en components/ui/button.tsx y globals.css. */}
          <Link href="/" className="text-muted-foreground hover:text-gray-900 dark:hover:text-gray-50">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Volver a grupos</span>
            </Button>
          </Link>
          {/* Título del Grupo */}
          {/* Ajusta el tamaño de fuente (text-3xl), el peso (font-bold) y los colores. */}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
            Grupo: {group ? group.name : "Cargando..."}
          </h1>
        </div>
        {/* Botón "Agregar Impresora" (solo para admin) */}
        {/* El estilo del botón se define en components/ui/button.tsx y globals.css. */}
        {isAdmin && (
          <Button onClick={() => setIsAddPrinterDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Agregar Impresora
          </Button>
        )}
      </header>

      <main className="space-y-8">
        {/* --- Contenedor de Tarjetas de Impresora --- */}
        {/* Esta cuadrícula define cómo se distribuyen las tarjetas de impresora. */}
        {/* Modifica las columnas (grid-cols-1 md:grid-cols-2 lg:grid-cols-3) y el espaciado (gap-4). */}
        {/* Para cambiar el tamaño de las tarjetas, ajusta el contenido dentro de PrinterCard. */}
        {printers.length === 0 ? (
          <div className="text-center p-10 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
            <p className="text-lg text-muted-foreground">
              No hay impresoras en este grupo.
              {isAdmin && ' Haz clic en "Agregar Impresora" para añadir una.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {printers.map((printer) => (
              <PrinterCard key={printer.id} printer={printer} groupId={groupId} onUpdate={fetchData} />
            ))}
          </div>
        )}
      </main>

      {/* Diálogo para añadir impresora */}
      {/* El estilo de este diálogo se controla en components/add-printer-dialog.tsx. */}
      <AddPrinterDialog
        isOpen={isAddPrinterDialogOpen}
        onClose={() => setIsAddPrinterDialogOpen(false)}
        onAdd={fetchData}
        groupId={groupId}
        ipRange={ipRangePrefix}
      />
    </div>
  )
}
