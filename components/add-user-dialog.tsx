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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select" // Import Select components
import { addUser } from "@/lib/data-store"
import type { User } from "@/lib/data-store" // Import User type for role

interface AddUserDialogProps {
  isOpen: boolean
  onClose: () => void
  onAdd: () => void
}

export function AddUserDialog({ isOpen, onClose, onAdd }: AddUserDialogProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<User["role"]>("user") // New state for role, default to 'user'
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = () => {
    setError(null)
    if (username.trim() && password.trim()) {
      const newUser = addUser(username, password, role) // Pass the selected role
      if (newUser) {
        setUsername("")
        setPassword("")
        setRole("user") // Reset role to default
        onAdd()
        onClose()
      } else {
        setError("El nombre de usuario ya existe.")
      }
    } else {
      setError("Por favor, ingresa un nombre de usuario y una contraseña.")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <div>
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Usuario</DialogTitle>
            <DialogDescription>
              Ingresa el nombre de usuario, la contraseña y el rol para el nuevo usuario.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Usuario
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="col-span-3"
                placeholder="nuevo_usuario"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="col-span-3"
                placeholder="contraseña_segura"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Rol
              </Label>
              <Select value={role} onValueChange={(value: User["role"]) => setRole(value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuario</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-red-500 text-sm mt-2 col-span-4 text-center">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>Agregar Usuario</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
