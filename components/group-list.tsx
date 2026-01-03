"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "./auth-provider"
import { getPrinterGroups, type PrinterGroup } from "@/lib/data-store"
import { AddGroupDialog } from "./add-group-dialog"
import { PrinterGroupCard } from "./printer-group-card"
import { PlusCircle, LogOut } from "lucide-react"

export default function GroupList() {
  const { user, role, logout } = useAuth()
  const isAdmin = role === "admin"
  const [printerGroups, setPrinterGroups] = useState<PrinterGroup[]>([])
  const [isAddGroupDialogOpen, setIsAddGroupDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      console.log("GroupList: Fetching printer groups...")
      const groups = await getPrinterGroups()
      console.log("GroupList: Groups fetched:", groups)
      setPrinterGroups(Array.isArray(groups) ? groups : [])
    } catch (error) {
      console.error("GroupList: Error fetching data:", error)
      setPrinterGroups([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <p className="text-lg text-muted-foreground">Cargando grupos...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 p-4 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
          Bienvenido, {user} ({role})
        </h1>
        <div className="flex gap-2">
          {isAdmin && (
            <Button onClick={() => setIsAddGroupDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Crear Grupo
            </Button>
          )}
          <Button variant="outline" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </header>

      <main className="space-y-8">
        {!Array.isArray(printerGroups) || printerGroups.length === 0 ? (
          <div className="text-center p-10 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
            <p className="text-lg text-muted-foreground">
              No hay grupos de impresoras creados.
              {isAdmin && ' Haz clic en "Crear Grupo" para empezar.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {printerGroups.map((group) => (
              <PrinterGroupCard key={group.id} group={group} onUpdate={fetchData} />
            ))}
          </div>
        )}
      </main>

      <AddGroupDialog isOpen={isAddGroupDialogOpen} onClose={() => setIsAddGroupDialogOpen(false)} onAdd={fetchData} />
    </div>
  )
}
