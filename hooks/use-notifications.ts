"use client"

import { useToast } from "@/components/ui/use-toast"

export function useNotifications() {
  const { toast } = useToast()

  const showSuccess = (title: string, description?: string) => {
    toast({
      title,
      description,
      className: "bg-green-500 text-white", // Estilo personalizado para éxito
    })
  }

  const showError = (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "destructive", // Utiliza la variante destructiva de shadcn/ui
    })
  }

  const showInfo = (title: string, description?: string) => {
    toast({
      title,
      description,
      // Por defecto, usa la variante 'default' de shadcn/ui
    })
  }

  return { showSuccess, showError, showInfo }
}
