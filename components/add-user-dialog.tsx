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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addUser } from "@/lib/data-store"
import type { User } from "@/lib/data-store"
import { Mail, User as UserIcon, Lock, Shield } from "lucide-react"

interface AddUserDialogProps {
  isOpen: boolean
  onClose: () => void
  onAdd: () => void
}

export function AddUserDialog({ isOpen, onClose, onAdd }: AddUserDialogProps) {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState<User["role"]>("user")
  const [error, setError] = useState<string | null>(null)

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = () => {
    setError(null)
    
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
    
    if (!password.trim()) {
      setError("La contraseña es obligatoria.")
      return
    }
    
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.")
      return
    }
    
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.")
      return
    }

    const newUser = addUser(username, email, password, role)
    if (newUser) {
      setUsername("")
      setEmail("")
      setPassword("")
      setConfirmPassword("")
      setRole("user")
      onAdd()
      onClose()
    } else {
      setError("El nombre de usuario o correo electrónico ya existe.")
    }
  }

  const handleClose = () => {
    setUsername("")
    setEmail("")
    setPassword("")
    setConfirmPassword("")
    setRole("user")
    setError(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <div>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-primary" />
              Registrar Nuevo Usuario
            </DialogTitle>
            <DialogDescription>
              Completa el formulario para crear una nueva cuenta de usuario.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                Nombre de Usuario
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ej: juan_perez"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Correo Electrónico
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ej: usuario@ejemplo.com"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  Contraseña
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 caracteres"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  Confirmar
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repetir contraseña"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role" className="flex items-center gap-2">
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
              Registrar Usuario
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
