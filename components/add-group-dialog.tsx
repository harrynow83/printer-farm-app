"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogTitle, DialogDescription, DialogContent } from "@/components/ui/dialog" // Ensure DialogContent is imported
import { addPrinterGroup } from "@/lib/data-store"

export function AddGroupDialog({ isOpen, onClose, onAdd }) {
  const [groupName, setGroupName] = useState("")

  const handleSubmit = () => {
    if (groupName.trim()) {
      addPrinterGroup(groupName)
      setGroupName("")
      onAdd()
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        {/* Envuelve todo el contenido en un único div */}
        <div>
          <DialogTitle>Crear Nuevo Grupo de Impresoras</DialogTitle>
          <DialogDescription>Ingresa el nombre para tu nuevo grupo de impresoras.</DialogDescription>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="groupName" className="text-right">
                Nombre
              </Label>
              <Input
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="col-span-3"
                placeholder="Oficina Principal"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>Crear Grupo</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
