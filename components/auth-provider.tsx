"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import {
  getLoggedInUser,
  getUserByUsername,
  setLoggedInUser,
  clearLoggedInUser,
  verifyPassword,
  initializeData, // Import initializeData
} from "@/lib/data-store"

interface AuthContextType {
  user: string | null
  role: "admin" | "user" | null
  login: (username: string, password: string) => boolean
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<string | null>(null)
  const [role, setRole] = useState<"admin" | "user" | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Initialize localStorage data only on the client side
    initializeData()

    const storedUser = getLoggedInUser()
    if (storedUser) {
      const userData = getUserByUsername(storedUser)
      if (userData) {
        setUser(storedUser)
        setRole(userData.role)
      } else {
        clearLoggedInUser() // User not found, clear invalid login
      }
    }
    setIsLoading(false)
  }, []) // Empty dependency array ensures this runs once on mount

  const login = (username: string, password: string): boolean => {
    if (verifyPassword(username, password)) {
      setLoggedInUser(username)
      const userData = getUserByUsername(username)
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
