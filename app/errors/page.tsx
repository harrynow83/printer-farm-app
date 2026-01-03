"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/components/auth-provider"
import { getErrorsLog, clearErrorLogs, type AppError } from "@/lib/data-store"
import { ArrowLeft, Trash2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRealtimeUpdates } from "@/hooks/use-realtime-updates"

export default function ErrorLogsPage() {
  const { role, isLoading, user } = useAuth()
  const isAdmin = role === "admin"
  const [errors, setErrors] = useState<AppError[]>([])

  // Configurar actualizaciones en tiempo real para logs de errores
  useRealtimeUpdates({
    events: ["error_logged", "errors_cleared"],
    onUpdate: () => {
      console.log("ErrorLogs: Received realtime update, refreshing errors...")
      fetchErrors()
    },
    userId: user,
  })

  const fetchErrors = useCallback(async () => {
    if (isAdmin) {
      const errorsList = await getErrorsLog()
      setErrors(errorsList)
    }
  }, [isAdmin])

  useEffect(() => {
    fetchErrors()
  }, [fetchErrors])

  const handleClearLogs = async () => {
    if (confirm("¿Estás seguro de que quieres eliminar todos los registros de errores?")) {
      await clearErrorLogs()
      fetchErrors() // Refresh the list
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
        <p className="text-lg text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950 p-4">
        <Card className="w-full max-w-md text-center p-8">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <CardTitle className="text-2xl font-bold mb-2">Acceso Denegado</CardTitle>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              No tienes permisos para ver esta página. Solo los administradores pueden acceder a los registros de
              errores.
            </p>
            <Link href="/">
              <Button>Volver al Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 p-4 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-muted-foreground hover:text-gray-900 dark:hover:text-gray-50">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Volver al Dashboard</span>
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Registros de Errores</h1>
        </div>
        {errors.length > 0 && (
          <Button variant="destructive" onClick={handleClearLogs}>
            <Trash2 className="mr-2 h-4 w-4" />
            Limpiar Registros
          </Button>
        )}
      </header>

      <main className="space-y-4">
        {errors.length === 0 ? (
          <div className="text-center p-10 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
            <p className="text-lg text-muted-foreground">No hay registros de errores.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {errors.map((error) => (
              <Card key={error.id} className="bg-white dark:bg-gray-800 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    {error.title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{new Date(error.timestamp).toLocaleString()}</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  {error.description && <p className="text-sm text-foreground">{error.description}</p>}
                  {error.details && (
                    <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md text-xs font-mono overflow-auto max-h-32">
                      <pre className="whitespace-pre-wrap">{error.details}</pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
