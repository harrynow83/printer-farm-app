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
import { updatePrinter, type Printer } from "@/lib/data-store"

interface EditPrinterDialogProps {
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void // Callback to refresh data in parent
  printer: Printer | null // The printer to edit
  ipRange: string // User-chosen IP range prefix
}

export function EditPrinterDialog({ isOpen, onClose, onUpdate, printer, ipRange }: EditPrinterDialogProps) {
  const [printerName, setPrinterName] = useState(printer?.name || "")
  const [ipLastOctet, setIpLastOctet] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (printer) {
      setPrinterName(printer.name)
      // Extract last octet from printer.ipAddress
      const parts = printer.ipAddress.split(".")
      if (parts.length === 4) {
        setIpLastOctet(parts[3])
      }
    }
  }, [printer])

  const handleSubmit = () => {
    setError(null) // Clear previous errors
    if (printer && printerName.trim() && ipLastOctet.trim()) {
      const fullIp = `${ipRange}${ipLastOctet}`
      const updatedPrinter = updatePrinter(printer.id, printerName, fullIp)
      if (updatedPrinter) {
        onUpdate() // Trigger refresh in parent
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
          <DialogTitle>Editar Impresora</DialogTitle>
          <DialogDescription>Modifica los detalles de la impresora.</DialogDescription>
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
          <Button onClick={handleSubmit}>Guardar Cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
