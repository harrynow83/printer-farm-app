"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import {
  getLoggedInUser,
  getUserByUsername,
  setLoggedInUser,
  clearLoggedInUser,
  verifyPassword,
  initializeData,
} from "@/lib/data-store"
import { useCleanup } from "@/hooks/use-cleanup"

interface AuthContextType {
  user: string | null
  role: "admin" | "user" | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<string | null>(null)
  const [role, setRole] = useState<"admin" | "user" | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Configurar cleanup de eventos en tiempo real
  useCleanup()

  useEffect(() => {
    const initAuth = async () => {
      // Initialize database data
      await initializeData()

      const storedUser = getLoggedInUser()
      if (storedUser) {
        const userData = await getUserByUsername(storedUser)
        if (userData) {
          setUser(storedUser)
          setRole(userData.role)
        } else {
          clearLoggedInUser() // User not found, clear invalid login
        }
      }
      setIsLoading(false)
    }

    initAuth()
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    const isValid = await verifyPassword(username, password)
    if (isValid) {
      setLoggedInUser(username)
      const userData = await getUserByUsername(username)
      if (userData) {
        setUser(username)
        setRole(userData.role)
        return true
      }
    }
    return false
  }

  const logout = () => {
    clearLoggedInUser()
    setUser(null)
    setRole(null)
  }

  return <AuthContext.Provider value={{ user, role, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
