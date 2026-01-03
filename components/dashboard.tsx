"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "./auth-provider"
import { getPrinterGroups, getPrinters, type PrinterGroup, type Printer } from "@/lib/data-store"
import { AddGroupDialog } from "./add-group-dialog"
import { UserManagementSection } from "./user-management-section"
import { PrinterGroupCard } from "./printer-group-card"
import { PlusCircle, LogOut, Search, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRealtimeUpdates } from "@/hooks/use-realtime-updates"

export default function Dashboard() {
  const { user, role, logout } = useAuth()
  const isAdmin = role === "admin"
  const [printerGroups, setPrinterGroups] = useState<PrinterGroup[]>([])
  const [allPrinters, setAllPrinters] = useState<Printer[]>([])
  const [isAddGroupDialogOpen, setIsAddGroupDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  // Configurar actualizaciones en tiempo real
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
    onUpdate: () => {
      console.log("Dashboard: Received realtime update, refreshing data...")
      fetchData()
    },
    userId: user,
  })

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      console.log("Dashboard: Fetching data...")

      const groups = await getPrinterGroups()
      const printers = await getPrinters()

      console.log("Dashboard: Groups fetched:", groups)
      console.log("Dashboard: Printers fetched:", printers)

      // Asegurar que siempre sean arrays válidos
      const validGroups = Array.isArray(groups) ? groups : []
      const validPrinters = Array.isArray(printers) ? printers : []

      setPrinterGroups(validGroups)
      setAllPrinters(validPrinters)
    } catch (error) {
      console.error("Dashboard: Error fetching data:", error)
      // En caso de error, asegurar que los estados sean arrays vacíos
      setPrinterGroups([])
      setAllPrinters([])
    } finally {
      setIsLoading(false)
    }
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
    // Asegurar que printerGroups sea un array antes de filtrar
    if (!Array.isArray(printerGroups)) {
      console.warn("Dashboard: printerGroups is not an array:", printerGroups)
      return []
    }

    if (!searchTerm) {
      return printerGroups.filter((group) => group != null) // Filtrar elementos null/undefined
    }

    const lowerCaseSearchTerm = searchTerm.toLowerCase()

    // Filter groups by name
    const groupsMatchingName = printerGroups.filter(
      (group) => group && group.name && group.name.toLowerCase().includes(lowerCaseSearchTerm),
    )

    // Find groups that contain printers matching the search term
    const groupsWithMatchingPrinters = printerGroups.filter((group) => {
      if (!group || !Array.isArray(group.printerIds)) return false

      const printersInGroup = Array.isArray(allPrinters)
        ? allPrinters.filter((printer) => printer && group.printerIds.includes(printer.id))
        : []

      return printersInGroup.some(
        (printer) =>
          printer &&
          printer.name &&
          printer.ipAddress &&
          (printer.name.toLowerCase().includes(lowerCaseSearchTerm) ||
            printer.ipAddress.toLowerCase().includes(lowerCaseSearchTerm)),
      )
    })

    // Combine and deduplicate the results
    const combinedGroups = [...groupsMatchingName, ...groupsWithMatchingPrinters]
    const uniqueGroupIds = new Set(combinedGroups.map((group) => group?.id).filter(Boolean))
    return Array.from(uniqueGroupIds)
      .map((id) => printerGroups.find((group) => group?.id === id))
      .filter((group): group is PrinterGroup => group != null) // Type guard para TypeScript
  }, [searchTerm, printerGroups, allPrinters])

  // Mostrar loading mientras se cargan los datos
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <p className="text-lg text-muted-foreground">Cargando dashboard...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      {/* --- Encabezado Principal --- */}
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 p-4 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
        {/* Título de bienvenida */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
          Bienvenido, {user} ({role})
        </h1>
        {/* Contenedor de botones de acción */}
        <div className="flex gap-2">
          {isAdmin && (
            <>
              {/* Botón "Ver Registros de Errores" */}
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
          <Button variant="outline" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </header>

      <main className="space-y-8">
        {/* Sección de Gestión de Usuarios (solo para admin) */}
        {isAdmin && <UserManagementSection onUserChange={handleUserChange} />}

        {/* --- Barra de Búsqueda --- */}
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
        {/* 🎯 AQUÍ ES DONDE CAMBIAS EL TAMAÑO DE LAS TARJETAS */}
        {/* 
          OPCIONES DE TAMAÑO:
          - Tarjetas grandes: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
          - Tarjetas medianas: grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 (actual)
          - Tarjetas pequeñas: grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7
          - Tarjetas muy pequeñas: grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8
        */}
        {filteredPrinterGroups.length === 0 ? (
          <div className="text-center p-10 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
            <p className="text-lg text-muted-foreground">
              No hay grupos de impresoras creados o que coincidan con la búsqueda.
              {isAdmin && ' Haz clic en "Crear Grupo" para empezar.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
            {filteredPrinterGroups.map((group) => (
              <PrinterGroupCard
                key={group.id}
                group={group}
                printersInGroup={
                  Array.isArray(allPrinters)
                    ? allPrinters.filter((printer) => printer && group.printerIds.includes(printer.id))
                    : []
                }
                onUpdate={fetchData}
              />
            ))}
          </div>
        )}
      </main>

      {/* Diálogos (modales) para añadir grupo */}
      <AddGroupDialog
        isOpen={isAddGroupDialogOpen}
        onClose={() => setIsAddGroupDialogOpen(false)}
        onAdd={handleAddGroup}
      />
    </div>
  )
}
