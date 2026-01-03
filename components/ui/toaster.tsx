"use client"

import { Toaster as ShadcnToaster } from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast" // Import useToast hook

export function Toaster() {
  const { toasts } = useToast() // Get toasts from the hook

  return <ShadcnToaster toasts={toasts} /> // Pass toasts to the ShadcnToaster component
}
