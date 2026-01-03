"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updatePrinterGroup, type PrinterGroup } from "@/lib/data-store"

interface EditGroupDialogProps {
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void // Callback to refresh data in parent
  group: PrinterGroup | null // The group to edit
}

export function EditGroupDialog({ isOpen, onClose, onUpdate, group }: EditGroupDialogProps) {
  const [groupName, setGroupName] = useState(group?.name || "")

  useEffect(() => {
    if (group) {
      setGroupName(group.name)
    }
  }, [group])

  const handleSubmit = () => {
    if (group && groupName.trim()) {
      updatePrinterGroup(group.id, groupName)
      setGroupName("")
      onUpdate() // Trigger refresh in parent
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Grupo de Impresoras</DialogTitle>
          <DialogDescription>Modifica el nombre del grupo.</DialogDescription>
        </DialogHeader>
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
          <Button onClick={handleSubmit}>Guardar Cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
