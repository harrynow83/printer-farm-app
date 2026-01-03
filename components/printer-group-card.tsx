"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { PrinterGroup } from "@/lib/data-store"
import { getPrintersByGroupId } from "@/lib/data-store"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Trash2, Pencil, ArrowRight, PrinterIcon } from "lucide-react"
import { useAuth } from "./auth-provider"
import { removePrinterGroup } from "@/lib/data-store"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { EditGroupDialog } from "./edit-group-dialog"

interface PrinterGroupCardProps {
  group: PrinterGroup
  printersInGroup?: any[]
  onUpdate: () => void
}

export function PrinterGroupCard({ group, printersInGroup, onUpdate }: PrinterGroupCardProps) {
  const { role } = useAuth()
  const isAdmin = role === "admin"
  const [isEditGroupDialogOpen, setIsEditGroupDialogOpen] = useState(false)
  const [printerCount, setPrinterCount] = useState(0)

  // Si no se proporciona printersInGroup, obtenerlo del grupo
  useEffect(() => {
    const fetchPrinterCount = async () => {
      if (printersInGroup) {
        setPrinterCount(printersInGroup.length)
      } else {
        try {
          const printers = await getPrintersByGroupId(group.id)
          setPrinterCount(Array.isArray(printers) ? printers.length : 0)
        } catch (error) {
          console.error("Error fetching printer count:", error)
          setPrinterCount(0)
        }
      }
    }

    fetchPrinterCount()
  }, [group.id, printersInGroup])

  const handleDeleteGroup = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (confirm(`¿Estás seguro de que quieres eliminar el grupo "${group.name}" y todas sus impresoras?`)) {
      await removePrinterGroup(group.id)
      onUpdate()
    }
  }

  const handleEditGroup = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsEditGroupDialogOpen(true)
  }

  return (
    <Card
      className={cn(
        "w-full group-card-bg dark:group-card-bg-dark group-card-border dark:group-card-border-dark shadow-md rounded-lg overflow-hidden",
        "flex flex-col justify-between h-full",
        "transition-all duration-200 hover:shadow-lg hover:scale-[1.02]",
        "hover:bg-gradient-to-br hover:from-[hsl(var(--group-card-bg))] hover:to-[hsl(var(--group-card-border))]",
        "dark:hover:from-[hsl(var(--group-card-bg-dark))] dark:hover:to-[hsl(var(--group-card-border-dark))]",
      )}
    >
      {/* 🎯 AQUÍ CAMBIAS EL PADDING INTERNO DE LA TARJETA */}
      {/* 
        OPCIONES DE PADDING:
        - Muy compacto: p-2 sm:p-3
        - Compacto: p-3 sm:p-4 (ejemplo actual)
        - Normal: p-4 sm:p-6
        - Espacioso: p-6 sm:p-8 (original)
        - Muy espacioso: p-8 sm:p-10
      */}
      <Link href={`/groups/${group.id}`} className="flex-grow flex flex-col p-3 sm:p-4">
        <CardHeader className="flex items-start gap-3 space-y-0 pb-3">
          <div className="relative">
            {/* 🎯 AQUÍ CAMBIAS EL TAMAÑO DE LA IMAGEN */}
            {/* 
              OPCIONES DE IMAGEN:
              - Muy pequeña: w-6 h-6 sm:w-8 sm:h-8
              - Pequeña: w-8 h-8 sm:w-10 sm:h-10 (ejemplo actual)
              - Normal: w-10 h-10 sm:w-12 sm:h-12
              - Grande: w-12 h-12 sm:w-16 sm:h-16 (original)
              - Muy grande: w-16 h-16 sm:w-20 sm:h-20
            */}
            <img
              src={group.imageUrl || "/placeholder.svg?height=100&width=100"}
              alt={`Imagen del grupo ${group.name}`}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-md object-cover flex-shrink-0 ring-2 ring-[hsl(var(--group-card-border))] dark:ring-[hsl(var(--group-card-border-dark))]"
            />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
          </div>
          {/* 🎯 AQUÍ CAMBIAS EL TAMAÑO DEL TÍTULO */}
          {/* 
            OPCIONES DE TÍTULO:
            - Muy pequeño: text-sm sm:text-base
            - Pequeño: text-base sm:text-lg (ejemplo actual)
            - Normal: text-lg sm:text-xl
            - Grande: text-xl sm:text-2xl
            - Muy grande: text-2xl sm:text-3xl (original)
          */}
          <CardTitle className="flex-1 text-base sm:text-lg font-bold group-card-text dark:group-card-text-light min-w-0 whitespace-normal break-words">
            {group.name}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-grow flex flex-col justify-between group-card-text dark:group-card-text-light text-center pt-2 space-y-3">
          {/* 🎯 AQUÍ CAMBIAS EL TAMAÑO DEL CONTADOR */}
          {/* 
            OPCIONES DE CONTADOR:
            - Muy pequeño: text-xs sm:text-sm
            - Pequeño: text-sm sm:text-base (ejemplo actual)
            - Normal: text-base sm:text-lg (original)
            - Grande: text-lg sm:text-xl
          */}
          <div className="flex items-center justify-center gap-2 text-sm sm:text-base font-semibold">
            <div className="p-1.5 rounded-full bg-[hsl(var(--group-card-border))] dark:bg-[hsl(var(--group-card-border-dark))]">
              <PrinterIcon className="h-3 w-3" />
            </div>
            <span>{printerCount} Impresoras</span>
          </div>

          <div className="flex flex-col items-center">
            <p className="text-xs sm:text-sm font-semibold opacity-80">Ver detalles del grupo</p>
            <div className="mt-1 p-1.5 rounded-full bg-[hsl(var(--group-card-border))] dark:bg-[hsl(var(--group-card-border-dark))] transition-transform group-hover:translate-x-1">
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </CardContent>
      </Link>

      {isAdmin && (
        <div className="p-2 pt-0 flex justify-end gap-1 border-t border-[hsl(var(--group-card-border))] dark:border-[hsl(var(--group-card-border-dark))]">
          <Button
            variant="outline"
            size="sm"
            onClick={handleEditGroup}
            aria-label="Editar grupo"
            className="hover:bg-[hsl(var(--group-card-border))] dark:hover:bg-[hsl(var(--group-card-border-dark)))] bg-transparent"
          >
            <Pencil className="h-3 w-3" />
            <span className="sr-only">Editar grupo</span>
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDeleteGroup} aria-label="Eliminar grupo">
            <Trash2 className="h-3 w-3" />
            <span className="sr-only">Eliminar grupo</span>
          </Button>
        </div>
      )}

      <EditGroupDialog
        isOpen={isEditGroupDialogOpen}
        onClose={() => setIsEditGroupDialogOpen(false)}
        onUpdate={onUpdate}
        group={group}
      />
    </Card>
  )
}
