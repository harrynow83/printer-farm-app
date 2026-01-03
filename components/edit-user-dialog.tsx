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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateUser, type User } from "@/lib/data-store" // Import updateUser

interface EditUserDialogProps {
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void // Callback to refresh data in parent
  user: User | null // The user to edit
}

export function EditUserDialog({ isOpen, onClose, onUpdate, user }: EditUserDialogProps) {
  const [username, setUsername] = useState(user?.username || "")
  const [password, setPassword] = useState("") // New password, optional
  const [role, setRole] = useState<User["role"]>(user?.role || "user")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setUsername(user.username)
      setRole(user.role)
      setPassword("") // Clear password field when opening for a new user
      setError(null) // Clear errors
    }
  }, [user])

  const handleSubmit = () => {
    setError(null)
    if (!user) {
      setError("No se ha seleccionado ningún usuario para editar.")
      return
    }

    if (username.trim()) {
      // Only pass password if it's not empty
      const updatedUser = updateUser(user.id, username.trim(), password.trim() || undefined, role)

      if (updatedUser) {
        setUsername("")
        setPassword("")
        setRole("user")
        onUpdate() // Trigger refresh in parent
        onClose()
      } else {
        setError("El nombre de usuario ya existe o hubo un error al actualizar.")
      }
    } else {
      setError("Por favor, ingresa un nombre de usuario.")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <div>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>Modifica los detalles del usuario.</DialogDescription>
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
                placeholder="nombre_de_usuario"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Nueva Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="col-span-3"
                placeholder="dejar en blanco para no cambiar"
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
            <Button onClick={handleSubmit}>Guardar Cambios</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
