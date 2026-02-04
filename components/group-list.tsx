"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "./auth-provider"
import { getPrinterGroups, type PrinterGroup } from "@/lib/data-store" // Removed getPrinters
import { AddGroupDialog } from "./add-group-dialog" // Corrected import: changed back to named import
import { PrinterGroupCard } from "./printer-group-card"
import { PlusCircle, LogOut } from "lucide-react"

export default function GroupList() {
  const { user, role, logout } = useAuth()
  const isAdmin = role === "admin"
  const [printerGroups, setPrinterGroups] = useState<PrinterGroup[]>([])
  const [isAddGroupDialogOpen, setIsAddGroupDialogOpen] = useState(false)

  const fetchData = useCallback(() => {
    setPrinterGroups(getPrinterGroups())
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="w-full dark:bg-orange-900 dark:border-orange-700 shadow-md rounded-lg overflow-hidden border-2">
      <header className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-lg shadow-sm gap-1.5 mb-3.5">
        <h1 className="font-bold text-gray-900 dark:text-gray-50 text-2xl">
          Bienvenido, {user} ({role})
        </h1>
        <div className="flex gap-0.5 leading-7 mx-0 px-0.5">
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
        {printerGroups.length === 0 ? (
          <div className="text-center p-10 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
            <p className="text-lg text-muted-foreground">
              No hay grupos de impresoras creados.
              {isAdmin && ' Haz clic en "Crear Grupo" para empezar.'}
            </p>
          </div>
        ) : (
          <div className="flex-grow flex flex-col p-6 sm:p-8 font-thin sm:px-3 sm:py-0 leading-7 w-auto px-3 my-0 py-3">
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
