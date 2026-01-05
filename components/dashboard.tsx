"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "./auth-provider"
import { getPrinterGroups, getPrinters, type PrinterGroup, type Printer } from "@/lib/data-store"
import { AddGroupDialog } from "./add-group-dialog"
import { UserManagementSection } from "./user-management-section"
import { PrinterGroupCard } from "./printer-group-card"
import { PlusCircle, LogOut, Search, AlertCircle } from "lucide-react" // NEW: Import AlertCircle
import Link from "next/link" // NEW: Import Link

export default function Dashboard() {
  const { user, role, logout } = useAuth()
  const isAdmin = role === "admin"
  const [printerGroups, setPrinterGroups] = useState<PrinterGroup[]>([])
  const [allPrinters, setAllPrinters] = useState<Printer[]>([])
  const [isAddGroupDialogOpen, setIsAddGroupDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const fetchData = useCallback(() => {
    setPrinterGroups(getPrinterGroups())
    setAllPrinters(getPrinters())
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAddGroup = (groupName: string) => {
    fetchData()
  }

  const handleUserChange = () => {
    console.log("User list changed, refreshing dashboard data if necessary.")
  }

  // Filtered groups and printers based on search term
  const filteredPrinterGroups = useMemo(() => {
    if (!searchTerm) {
      return printerGroups
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase()

    // Filter groups by name
    const groupsMatchingName = printerGroups.filter((group) => group.name.toLowerCase().includes(lowerCaseSearchTerm))

    // Find groups that contain printers matching the search term
    const groupsWithMatchingPrinters = printerGroups.filter((group) => {
      const printersInGroup = allPrinters.filter((printer) => group.printerIds.includes(printer.id))
      return printersInGroup.some(
        (printer) =>
          printer.name.toLowerCase().includes(lowerCaseSearchTerm) ||
          printer.ipAddress.toLowerCase().includes(lowerCaseSearchTerm),
      )
    })

    // Combine and deduplicate the results
    const combinedGroups = [...groupsMatchingName, ...groupsWithMatchingPrinters]
    const uniqueGroupIds = new Set(combinedGroups.map((group) => group.id))
    return Array.from(uniqueGroupIds).map((id) => printerGroups.find((group) => group.id === id)!)
  }, [searchTerm, printerGroups, allPrinters])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8 lg:p-12">
      <div className="max-w-[1400px] mx-auto">
        {/* --- Encabezado Principal --- */}
        {/* Modifica el padding (p-4 md:p-8), el color de fondo (bg-white dark:bg-gray-900), */}
        {/* las sombras (shadow-sm) y el espaciado (gap-4 mb-8) aquí. */}
        <header className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 p-4 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
          {/* Título de bienvenida */}
          {/* Ajusta el tamaño de fuente (text-3xl), el peso (font-bold) y los colores (text-gray-900 dark:text-gray-50) */}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
            Bienvenido, {user} ({role})
          </h1>
          {/* Contenedor de botones de acción */}
          {/* Modifica el espaciado entre botones (gap-2) */}
          <div className="flex gap-2">
            {isAdmin && (
              <>
                {/* NEW: Botón "Ver Registros de Errores" */}
                <Link href="/errors" passHref>
                  <Button variant="outline">
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Ver Registros de Errores
                  </Button>
                </Link>
                {/* Botón "Crear Grupo" */}
                <Button onClick={() => setIsAddGroupDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Crear Grupo
                </Button>
              </>
            )}
            {/* Botón "Cerrar Sesión" */}
            {/* El estilo de 'variant="outline"' se define en components/ui/button.tsx y globals.css (variables --secondary, --border) */}
            <Button variant="outline" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </header>

        <main className="space-y-10">
          {/* Sección de Gestión de Usuarios (solo para admin) */}
          {/* El estilo de esta sección se controla en components/user-management-section.tsx */}
          {isAdmin && <UserManagementSection onUserChange={handleUserChange} />}

          {/* --- Barra de Búsqueda --- */}
          {/* Modifica el padding (pl-10 pr-4 py-2), el radio de borde (rounded-md), */}
          {/* los bordes (border border-input), el fondo (bg-background) y las sombras (shadow-sm). */}
          {/* El color del icono de búsqueda (text-muted-foreground) se define en globals.css. */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar impresoras o grupos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* --- Contenedor de Tarjetas de Grupo --- */}
          {filteredPrinterGroups.length === 0 ? (
            <div className="text-center p-12 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
              <p className="text-lg text-muted-foreground">
                No hay grupos de impresoras creados o que coincidan con la búsqueda.
                {isAdmin && ' Haz clic en "Crear Grupo" para empezar.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {filteredPrinterGroups.map((group) => (
                <PrinterGroupCard
                  key={group.id}
                  group={group}
                  printersInGroup={allPrinters.filter((printer) => group.printerIds.includes(printer.id))}
                  onUpdate={fetchData}
                />
              ))}
            </div>
          )}
        </main>

        {/* Diálogos (modales) para añadir grupo */}
        {/* El estilo de estos diálogos se controla en sus respectivos archivos de componente. */}
        <AddGroupDialog
          isOpen={isAddGroupDialogOpen}
          onClose={() => setIsAddGroupDialogOpen(false)}
          onAdd={handleAddGroup}
        />
      </div>
    </div>
  )
}
