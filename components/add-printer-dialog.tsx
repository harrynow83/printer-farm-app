"use client"

import { useState } from "react"
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
import { addPrinter } from "@/lib/data-store" // Import addPrinter

interface AddPrinterDialogProps {
  isOpen: boolean
  onClose: () => void
  onAdd: () => void // Callback to refresh data in parent
  groupId: string // Pass groupId to know where to add the printer
  ipRange: string // User-chosen IP range prefix
}

export function AddPrinterDialog({ isOpen, onClose, onAdd, groupId, ipRange }: AddPrinterDialogProps) {
  const [printerName, setPrinterName] = useState("")
  const [ipLastOctet, setIpLastOctet] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = () => {
    setError(null) // Clear previous errors
    if (printerName.trim() && ipLastOctet.trim()) {
      const fullIp = `${ipRange}${ipLastOctet}`
      const newPrinter = addPrinter(groupId, printerName, fullIp) // Call addPrinter with groupId and IP
      if (newPrinter) {
        setPrinterName("")
        setIpLastOctet("")
        onAdd() // Trigger refresh in parent
        onClose()
      } else {
        setError("La dirección IP ya está en uso por otra impresora.")
      }
    } else {
      setError("Por favor, ingresa el nombre de la impresora y el último octeto de la IP.")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Agregar Nueva Impresora</DialogTitle>
          <DialogDescription>Ingresa los detalles de la impresora que deseas agregar a este grupo.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="printerName" className="text-right">
              Nombre
            </Label>
            <Input
              id="printerName"
              value={printerName}
              onChange={(e) => setPrinterName(e.target.value)}
              className="col-span-3"
              placeholder="Impresora HP LaserJet"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="ipAddress" className="text-right">
              Dirección IP
            </Label>
            <div className="col-span-3 flex items-center">
              <span className="mr-1 text-muted-foreground">{ipRange}</span>
              <Input
                id="ipAddress"
                value={ipLastOctet}
                onChange={(e) => setIpLastOctet(e.target.value.replace(/[^0-9]/g, ""))} // Only numbers
                className="flex-1"
                placeholder="101"
                maxLength={3}
              />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mt-2 col-span-4 text-center">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Agregar Impresora</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
