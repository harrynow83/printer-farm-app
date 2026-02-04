"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, UserIcon, Pencil, UserPlus, Mail, Shield, Clock, Users } from "lucide-react"
import { getUsers, removeUser, type User } from "@/lib/data-store"
import { useAuth } from "./auth-provider"
import { EditUserDialog } from "./edit-user-dialog"
import { AddUserDialog } from "./add-user-dialog"

interface UserManagementSectionProps {
  onUserChange: () => void
}

export function UserManagementSection({ onUserChange }: UserManagementSectionProps) {
  const { role } = useAuth()
  const isAdmin = role === "admin"
  const [users, setUsers] = useState<User[]>([])
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false)
  const [userToEdit, setUserToEdit] = useState<User | null>(null)
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false)

  const fetchUsers = useCallback(() => {
    setUsers(getUsers())
  }, [])

  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
    }
  }, [isAdmin, fetchUsers])

  const handleDeleteUser = (userId: string, username: string) => {
    if (!isAdmin) {
      alert("No tienes permisos para realizar esta acción.")
      return
    }
    if (confirm(`¿Estás seguro de que quieres eliminar al usuario "${username}"? Esta acción no se puede deshacer.`)) {
      const success = removeUser(userId)
      if (success) {
        fetchUsers()
        onUserChange()
      } else {
        alert("Fallo al eliminar el usuario.")
      }
    }
  }

  const handleEditUser = (user: User) => {
    if (!isAdmin) {
      alert("No tienes permisos para realizar esta acción.")
      return
    }
    setUserToEdit(user)
    setIsEditUserDialogOpen(true)
  }

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "Nunca"
    return new Date(timestamp).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  if (!isAdmin) {
    return null
  }

  const adminCount = users.filter(u => u.role === "admin").length
  const userCount = users.filter(u => u.role === "user").length

  return (
    <Card className="w-full bg-card border border-border shadow-lg rounded-xl overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-6 w-6 text-primary" />
            </div>
            Panel de Administración
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Gestiona los usuarios del sistema. Total: {users.length} usuarios ({adminCount} admins, {userCount} usuarios)
          </CardDescription>
        </div>
        <Button onClick={() => setIsAddUserDialogOpen(true)} className="shrink-0">
          <UserPlus className="mr-2 h-4 w-4" />
          Registrar Usuario
        </Button>
      </CardHeader>
      
      <CardContent className="pt-4">
        {users.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed border-border">
            <UserIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-lg">No hay usuarios registrados.</p>
            <p className="text-sm text-muted-foreground mt-1">Haz clic en "Registrar Usuario" para crear el primero.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((userItem) => (
              <div
                key={userItem.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-muted rounded-full">
                    <UserIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{userItem.username}</span>
                      <Badge 
                        variant={userItem.role === "admin" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        <Shield className="h-3 w-3 mr-1" />
                        {userItem.role === "admin" ? "Administrador" : "Usuario"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {userItem.email || "Sin email"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Creado: {formatDate(userItem.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditUser(userItem)}
                    aria-label={`Editar usuario ${userItem.username}`}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  {userItem.username !== "admin" && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteUser(userItem.id, userItem.username)}
                      aria-label={`Eliminar usuario ${userItem.username}`}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Eliminar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      <EditUserDialog
        isOpen={isEditUserDialogOpen}
        onClose={() => setIsEditUserDialogOpen(false)}
        onUpdate={fetchUsers}
        user={userToEdit}
      />
      <AddUserDialog 
        isOpen={isAddUserDialogOpen} 
        onClose={() => setIsAddUserDialogOpen(false)} 
        onAdd={fetchUsers} 
      />
    </Card>
  )
}
