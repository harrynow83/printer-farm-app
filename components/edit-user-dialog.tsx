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
import { updateUser, type User } from "@/lib/data-store"
import { Mail, User as UserIcon, Lock, Shield, Pencil } from "lucide-react"

interface EditUserDialogProps {
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
  user: User | null
}

export function EditUserDialog({ isOpen, onClose, onUpdate, user }: EditUserDialogProps) {
  const [username, setUsername] = useState(user?.username || "")
  const [email, setEmail] = useState(user?.email || "")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState<User["role"]>(user?.role || "user")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setUsername(user.username)
      setEmail(user.email || "")
      setRole(user.role)
      setPassword("")
      setConfirmPassword("")
      setError(null)
    }
  }, [user])

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = () => {
    setError(null)
    if (!user) {
      setError("No se ha seleccionado ningún usuario para editar.")
      return
    }

    if (!username.trim()) {
      setError("El nombre de usuario es obligatorio.")
      return
    }

    if (!email.trim()) {
      setError("El correo electrónico es obligatorio.")
      return
    }

    if (!validateEmail(email)) {
      setError("Por favor, ingresa un correo electrónico válido.")
      return
    }

    if (password && password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.")
      return
    }

    if (password && password !== confirmPassword) {
      setError("Las contraseñas no coinciden.")
      return
    }

    const updatedUser = updateUser(
      user.id, 
      username.trim(), 
      email.trim(),
      password.trim() || undefined, 
      role
    )

    if (updatedUser) {
      setUsername("")
      setEmail("")
      setPassword("")
      setConfirmPassword("")
      setRole("user")
      onUpdate()
      onClose()
    } else {
      setError("El nombre de usuario o correo electrónico ya existe.")
    }
  }

  const handleClose = () => {
    setPassword("")
    setConfirmPassword("")
    setError(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <div>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" />
              Editar Usuario
            </DialogTitle>
            <DialogDescription>
              Modifica los detalles del usuario. Los campos con * son obligatorios.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-username" className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                Nombre de Usuario *
              </Label>
              <Input
                id="edit-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="nombre_de_usuario"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-email" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Correo Electrónico *
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@ejemplo.com"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  Nueva Contraseña
                </Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Dejar vacío para no cambiar"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-confirmPassword" className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  Confirmar
                </Label>
                <Input
                  id="edit-confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repetir contraseña"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-role" className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                Rol del Usuario
              </Label>
              <Select value={role} onValueChange={(value: User["role"]) => setRole(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuario - Acceso básico</SelectItem>
                  <SelectItem value="admin">Administrador - Acceso completo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                <p className="text-destructive text-sm text-center">{error}</p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
