"use client"

import React from "react"

import { useState, useEffect, useRef } from "react"
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
import { ImageIcon, Upload, Trash2, Pencil } from "lucide-react"

// Iconos predefinidos para impresoras
const PRINTER_ICONS = [
  "/placeholder.svg?height=80&width=80",
  "https://img.icons8.com/color/96/3d-printer.png",
  "https://img.icons8.com/color/96/printer.png",
  "https://img.icons8.com/fluency/96/3d-printer.png",
  "https://img.icons8.com/dusk/96/3d-printer.png",
  "https://img.icons8.com/external-flaticons-flat-flat-icons/96/external-3d-printer-computer-technology-flaticons-flat-flat-icons.png",
]

interface EditPrinterDialogProps {
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
  printer: Printer | null
  ipRange: string
}

export function EditPrinterDialog({ isOpen, onClose, onUpdate, printer, ipRange }: EditPrinterDialogProps) {
  const [printerName, setPrinterName] = useState(printer?.name || "")
  const [ipLastOctet, setIpLastOctet] = useState("")
  const [imageUrl, setImageUrl] = useState(printer?.imageUrl || "")
  const [customImageUrl, setCustomImageUrl] = useState("")
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (printer) {
      setPrinterName(printer.name)
      setImageUrl(printer.imageUrl || "/placeholder.svg?height=80&width=80")
      const parts = printer.ipAddress.split(".")
      if (parts.length === 4) {
        setIpLastOctet(parts[3])
      }
    }
  }, [printer])

  const handleImageSelect = (url: string) => {
    setImageUrl(url)
    setCustomImageUrl("")
  }

  const handleCustomImageUrl = () => {
    if (customImageUrl.trim()) {
      setImageUrl(customImageUrl.trim())
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setImageUrl(base64String)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = () => {
    setError(null)
    if (printer && printerName.trim() && ipLastOctet.trim()) {
      const fullIp = `${ipRange}${ipLastOctet}`
      const updatedPrinter = updatePrinter(printer.id, printerName, fullIp, imageUrl)
      if (updatedPrinter) {
        onUpdate()
        onClose()
      } else {
        setError("La direccion IP ya esta en uso por otra impresora.")
      }
    } else {
      setError("Por favor, ingresa el nombre de la impresora y el ultimo octeto de la IP.")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-primary" />
            Editar Impresora
          </DialogTitle>
          <DialogDescription>Modifica los detalles de la impresora, incluyendo su icono.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="printerName">Nombre de la Impresora</Label>
            <Input
              id="printerName"
              value={printerName}
              onChange={(e) => setPrinterName(e.target.value)}
              placeholder="Ej: Ender 3 Pro"
            />
          </div>
          
          {/* IP */}
          <div className="space-y-2">
            <Label htmlFor="ipAddress">Direccion IP</Label>
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground bg-muted px-2 py-2 rounded-l-md border border-r-0">{ipRange}</span>
              <Input
                id="ipAddress"
                value={ipLastOctet}
                onChange={(e) => setIpLastOctet(e.target.value.replace(/[^0-9]/g, ""))}
                className="flex-1 rounded-l-none"
                placeholder="101"
                maxLength={3}
              />
            </div>
          </div>

          {/* Seccion de Imagen/Icono */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              Icono de la Impresora
            </Label>
            
            {/* Preview actual */}
            <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg border">
              <img
                src={imageUrl || "/placeholder.svg?height=80&width=80"}
                alt="Preview"
                className="w-16 h-16 rounded-md object-cover border bg-background"
              />
              <div className="flex-1">
                <p className="text-sm font-medium">Imagen actual</p>
                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                  {imageUrl?.startsWith("data:") ? "Imagen subida" : imageUrl}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setImageUrl("/placeholder.svg?height=80&width=80")}
                className="bg-transparent"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Iconos predefinidos */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Selecciona un icono predefinido:</p>
              <div className="flex flex-wrap gap-2">
                {PRINTER_ICONS.map((icon, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleImageSelect(icon)}
                    className={`p-1 rounded-md border-2 transition-all ${
                      imageUrl === icon 
                        ? "border-primary bg-primary/10" 
                        : "border-transparent hover:border-muted-foreground/30"
                    }`}
                  >
                    <img src={icon || "/placeholder.svg"} alt={`Icon ${index + 1}`} className="w-10 h-10 object-contain" />
                  </button>
                ))}
              </div>
            </div>

            {/* URL personalizada */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">O introduce una URL de imagen:</p>
              <div className="flex gap-2">
                <Input
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                  placeholder="https://ejemplo.com/imagen.png"
                  className="flex-1"
                />
                <Button 
                  variant="outline" 
                  onClick={handleCustomImageUrl}
                  disabled={!customImageUrl.trim()}
                  className="bg-transparent"
                >
                  Aplicar
                </Button>
              </div>
            </div>

            {/* Subir imagen */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">O sube una imagen desde tu dispositivo:</p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-transparent"
              >
                <Upload className="mr-2 h-4 w-4" />
                Subir Imagen
              </Button>
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
              <p className="text-destructive text-sm text-center">{error}</p>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Guardar Cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
