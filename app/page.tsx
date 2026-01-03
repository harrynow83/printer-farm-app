"use client"

import { useAuth } from "@/components/auth-provider"
import LoginForm from "@/components/login-form"
import GroupList from "@/components/group-list"

function AppContent() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
        <p className="text-lg text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  return user ? <GroupList /> : <LoginForm />
}

export default function Home() {
  return (
    // AuthProvider is now in app/layout.tsx, so it's removed from here
    <AppContent />
  )
}
