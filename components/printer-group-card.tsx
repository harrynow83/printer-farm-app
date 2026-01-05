"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { PrinterGroup, Printer } from "@/lib/data-store"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Trash2, Pencil, ArrowRight, PrinterIcon, Wifi, WifiOff } from "lucide-react"
import { useAuth } from "./auth-provider"
import { removePrinterGroup } from "@/lib/data-store"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { EditGroupDialog } from "./edit-group-dialog"

interface PrinterGroupCardProps {
  group: PrinterGroup
  printersInGroup: Printer[]
  onUpdate: () => void // Callback to refresh data in parent
}

export function PrinterGroupCard({ group, printersInGroup, onUpdate }: PrinterGroupCardProps) {
  const { role } = useAuth()
  const isAdmin = role === "admin"
  const [isEditGroupDialogOpen, setIsEditGroupDialogOpen] = useState(false)

  const handleDeleteGroup = (e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation when deleting
    e.stopPropagation() // Stop event propagation to the Link
    if (confirm(`¿Estás seguro de que quieres eliminar el grupo "${group.name}" y todas sus impresoras?`)) {
      removePrinterGroup(group.id)
      onUpdate()
    }
  }

  const handleEditGroup = (e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation
    e.stopPropagation() // Stop event propagation
    setIsEditGroupDialogOpen(true)
  }

  // Ensure printersInGroup is an array, even if it somehow comes as undefined
  const safePrintersInGroup = printersInGroup || []
  const onlineCount = safePrintersInGroup.filter((p) => p.status === "ready" || p.status === "printing").length
  const offlineCount = safePrintersInGroup.length - onlineCount

  return (
    <Card
      className={cn(
        "w-full shadow-lg rounded-3xl overflow-hidden border-0 transition-all duration-300",
        "flex flex-col justify-between h-full bg-white dark:bg-gray-900",
        "hover:shadow-2xl hover:translate-y-[-4px]", // Efecto de elevación más suave
      )}
    >
      <Link href={`/groups/${group.id}`} className="flex-grow flex flex-col p-8 sm:p-10 transition-colors group">
        <CardHeader className="flex flex-col items-center text-center gap-8 space-y-0 p-0 pb-10">
          {/* --- Imagen del Grupo --- */}
          <div className="relative flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
            <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <img
              src={group.imageUrl || "/placeholder.svg?height=160&width=160&query=printer group"}
              alt={`Imagen del grupo ${group.name}`}
              className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl object-cover border-4 border-white dark:border-gray-800 shadow-xl relative z-10"
            />
          </div>
          <div className="w-full">
            {/* --- Título del Grupo --- */}
            <CardTitle className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-gray-50 truncate mb-4">
              {group.name}
            </CardTitle>

            <div className="flex flex-wrap justify-center gap-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-bold border border-transparent">
                <PrinterIcon className="h-4 w-4" />
                <span>{safePrintersInGroup.length} Total</span>
              </div>

              {onlineCount > 0 && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm font-bold border border-green-100 dark:border-green-800">
                  <Wifi className="h-4 w-4" />
                  <span>{onlineCount} Online</span>
                </div>
              )}

              {offlineCount > 0 && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-bold border border-red-100 dark:border-red-800">
                  <WifiOff className="h-4 w-4" />
                  <span>{offlineCount} Offline</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 flex flex-col justify-center items-center mt-auto">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold group-hover:gap-4 transition-all">
            <span>Explorar Grupo</span>
            <ArrowRight className="h-5 w-5" />
          </div>
        </CardContent>
      </Link>

      {isAdmin && (
        <div className="px-6 pb-6 pt-4 flex justify-center gap-4 border-t border-gray-100 dark:border-gray-800 mt-auto bg-gray-50/50 dark:bg-gray-950/20">
          <Button
            variant="secondary"
            size="icon"
            onClick={handleEditGroup}
            className="h-10 w-10 rounded-full shadow-sm"
          >
            <Pencil className="h-5 w-5" />
          </Button>
          <Button
            variant="destructive"
            size="icon"
            onClick={handleDeleteGroup}
            className="h-10 w-10 rounded-full shadow-sm"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      )}
      {/* Diálogo de Edición de Grupo */}
      {/* El estilo de este diálogo se controla en components/edit-group-dialog.tsx. */}
      <EditGroupDialog
        isOpen={isEditGroupDialogOpen}
        onClose={() => setIsEditGroupDialogOpen(false)}
        onUpdate={onUpdate}
        group={group}
      />
    </Card>
  )
}
