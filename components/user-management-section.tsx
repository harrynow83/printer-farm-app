"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, UserIcon, Pencil, UserPlus } from "lucide-react" // NEW: Import UserPlus icon
import { getUsers, removeUser, type User } from "@/lib/data-store"
import { useAuth } from "./auth-provider"
import { EditUserDialog } from "./edit-user-dialog"
import { AddUserDialog } from "./add-user-dialog" // NEW: Import AddUserDialog
import { useRealtimeUpdates } from "@/hooks/use-realtime-updates"

interface UserManagementSectionProps {
  onUserChange: () => void // Callback to notify parent of user list changes
}

export function UserManagementSection({ onUserChange }: UserManagementSectionProps) {
  const { role, user } = useAuth()
  const isAdmin = role === "admin"
  const [users, setUsers] = useState<User[]>([])
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false)
  const [userToEdit, setUserToEdit] = useState<User | null>(null)
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false) // NEW: State for add user dialog

  // Configurar actualizaciones en tiempo real para usuarios
  useRealtimeUpdates({
    events: ["user_added", "user_updated", "user_deleted"],
    onUpdate: () => {
      console.log("UserManagement: Received realtime update, refreshing users...")
      fetchUsers()
    },
    userId: user,
  })

  const fetchUsers = useCallback(async () => {
    const usersList = await getUsers()
    setUsers(usersList)
  }, [])

  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
    }
  }, [isAdmin, fetchUsers])

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!isAdmin) {
      alert("No tienes permisos para realizar esta acción.")
      return
    }
    if (confirm(`¿Estás seguro de que quieres eliminar al usuario "${username}"?`)) {
      const success = await removeUser(userId)
      if (success) {
        fetchUsers() // Refresh the list
        onUserChange() // Notify parent (dashboard) if needed
      } else {
        alert("Fallo al eliminar el usuario.")
      }
    }
  }

  // NEW: Handle edit user
  const handleEditUser = (user: User) => {
    if (!isAdmin) {
      alert("No tienes permisos para realizar esta acción.")
      return
    }
    setUserToEdit(user)
    setIsEditUserDialogOpen(true)
  }

  if (!isAdmin) {
    return null // Only render for admins
  }

  return (
    <Card className="w-full bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        {" "}
        {/* Modified: Added flex-row and justify-between */}
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <UserIcon className="h-6 w-6 text-muted-foreground" />
          Gestión de Usuarios
        </CardTitle>
        {/* Este es el botón "Agregar Usuario" */}
        <Button onClick={() => setIsAddUserDialogOpen(true)} size="sm">
          <UserPlus className="mr-2 h-4 w-4" />
          Agregar Usuario
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {users.length === 0 ? (
          <p className="text-muted-foreground">No hay usuarios registrados.</p>
        ) : (
          <ul className="space-y-2">
            {users.map((userItem) => (
              <li
                key={userItem.id}
                className="flex items-center justify-between p-3 border rounded-md bg-gray-50 dark:bg-gray-700"
              >
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900 dark:text-gray-50">{userItem.username}</span>
                  <span className="text-sm text-muted-foreground">Rol: {userItem.role}</span>
                </div>
                <div className="flex gap-2">
                  {/* NEW: Edit Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditUser(userItem)}
                    aria-label={`Editar usuario ${userItem.username}`}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Editar</span>
                  </Button>
                  {/* Prevent admin from deleting themselves */}
                  {userItem.username !== "admin" && ( // Assuming 'admin' is the primary admin account
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteUser(userItem.id, userItem.username)}
                      aria-label={`Eliminar usuario ${userItem.username}`}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Eliminar</span>
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      {/* NEW: Edit User Dialog */}
      <EditUserDialog
        isOpen={isEditUserDialogOpen}
        onClose={() => setIsEditUserDialogOpen(false)}
        onUpdate={fetchUsers}
        user={userToEdit}
      />
      {/* Y al final del componente, el diálogo asociado: */}
      <AddUserDialog isOpen={isAddUserDialogOpen} onClose={() => setIsAddUserDialogOpen(false)} onAdd={fetchUsers} />
    </Card>
  )
}
