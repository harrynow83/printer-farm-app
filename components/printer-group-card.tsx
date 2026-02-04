"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { PrinterGroup, Printer } from "@/lib/data-store"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Trash2, Pencil, ArrowRight, PrinterIcon, Wifi, WifiOff } from "lucide-react"
import { Badge } from "@/components/ui/badge"
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
        "w-full dark:bg-gray-800 shadow-md rounded-lg overflow-hidden border-gray-200 dark:border-gray-700 transition-all duration-300 mx-0 my-3 bg-stone-200 gap-0.5 px-0.5 mt-1 border-0 py-0.5 mb-3.5",
        "flex h-full flex-col",
        "hover:shadow-lg hover:translate-y-[-2px]",
      )}
    >
      <Link href={`/groups/${group.id}`} className="flex-grow flex flex-col group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pt-1 pr-1 pl-1 pb-1">
          <CardTitle className="text-lg font-medium flex items-center gap-2 truncate">
            <PrinterIcon className="h-5 w-5 text-muted-foreground" />
            {group.name}
          </CardTitle>
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300"
          >
            Grupo
          </Badge>
        </CardHeader>

        <CardContent className="p-4 space-x-1 pt-0 border-8">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <img
                src={group.imageUrl || "/placeholder.svg?height=80&width=80&query=printer group"}
                alt={`Imagen del grupo ${group.name}`}
                className="w-20 h-20 rounded-md object-cover border border-gray-100 dark:border-gray-700 shadow-sm"
              />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <PrinterIcon className="h-4 w-4" />
                {safePrintersInGroup.length} Impresoras en total
              </p>
              <div className="flex gap-2 mt-2">
                <span className="inline-flex items-center text-xs font-medium text-green-600 dark:text-green-400">
                  <Wifi className="h-3 w-3 mr-1" /> {onlineCount}
                </span>
                <span className="inline-flex items-center text-xs font-medium text-red-600 dark:text-red-400">
                  <WifiOff className="h-3 w-3 mr-1" /> {offlineCount}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-4">
            <Button asChild className="w-full h-9 text-sm">
              <span className="flex items-center gap-2">
                Explorar Grupo <ArrowRight className="h-4 w-4" />
              </span>
            </Button>
          </div>
        </CardContent>
      </Link>

      {isAdmin && (
        <div className="px-4 pt-0 flex justify-end mt-auto pl-0.5 gap-1 pb-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleEditGroup}
            className="h-8 w-8 p-0 rounded-md bg-transparent"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDeleteGroup} className="h-8 w-8 p-0 rounded-md">
            <Trash2 className="h-4 w-4" />
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
