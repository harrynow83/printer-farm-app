import { v4 as uuidv4 } from "uuid"

// Helper to "hash" passwords for localStorage (not secure for production)
const hashPassword = (password: string) => btoa(password)

export interface User {
  id: string
  username: string
  email: string
  passwordHash: string
  role: "admin" | "user"
  createdAt: number
  lastLogin?: number
}

export interface PrintJob {
  id: string
  fileName: string
  timestamp: number
  completedAt?: number // New: Timestamp when the job was completed
}

export interface Printer {
  id: string
  name: string
  ipAddress: string // Added IP address
  status: "online" | "offline" | "printing" | "error"
  queue: PrintJob[]
  completedJobs: PrintJob[] // NEW: Array to store completed print jobs
  imageUrl?: string
  progress?: number // New: Current print progress (0-100)
  eta?: number | null // New: Estimated time remaining in seconds
}

export interface PrinterGroup {
  id: string
  name: string
  printerIds: string[]
  imageUrl?: string
}

// NEW: Interface for application errors
export interface AppError {
  id: string
  timestamp: number
  title: string
  description?: string
  details?: string // More technical details for debugging
}

const USERS_KEY = "users"
const LOGGED_IN_USER_KEY = "loggedInUser"
const PRINTER_GROUPS_KEY = "printerGroups"
const PRINTERS_KEY = "printers"
const ERROR_LOGS_KEY = "errorLogs" // NEW: Key for error logs

// --- Initialization ---
export const initializeData = () => {
  if (typeof window !== "undefined") {
    // Ensure localStorage is available
    if (!localStorage.getItem(USERS_KEY)) {
      const defaultUsers: User[] = [
        { id: uuidv4(), username: "admin", email: "admin@example.com", passwordHash: hashPassword("adminpass"), role: "admin", createdAt: Date.now() },
        { id: uuidv4(), username: "user", email: "user@example.com", passwordHash: hashPassword("userpass"), role: "user", createdAt: Date.now() },
      ]
      localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers))
    }
    if (!localStorage.getItem(PRINTER_GROUPS_KEY)) {
      localStorage.setItem(PRINTER_GROUPS_KEY, JSON.stringify([]))
    }
    if (!localStorage.getItem(PRINTERS_KEY)) {
      localStorage.setItem(PRINTERS_KEY, JSON.stringify([]))
    }
    // NEW: Initialize error logs
    if (!localStorage.getItem(ERROR_LOGS_KEY)) {
      localStorage.setItem(ERROR_LOGS_KEY, JSON.stringify([]))
    }
  }
}

// --- User Management ---
export const getUsers = (): User[] => {
  if (typeof window === "undefined") return []
  const usersJson = localStorage.getItem(USERS_KEY)
  return usersJson ? JSON.parse(usersJson) : []
}

export const getUserByUsername = (username: string): User | undefined => {
  if (typeof window === "undefined") return undefined
  const users = getUsers()
  return users.find((user) => user.username === username)
}

export const verifyPassword = (username: string, passwordAttempt: string): boolean => {
  if (typeof window === "undefined") return false
  const user = getUserByUsername(username)
  return user ? user.passwordHash === hashPassword(passwordAttempt) : false
}

export const setLoggedInUser = (username: string) => {
  if (typeof window === "undefined") return
  localStorage.setItem(LOGGED_IN_USER_KEY, username)
}

export const getLoggedInUser = (): string | null => {
  if (typeof window === "undefined") return null
  return localStorage.getItem(LOGGED_IN_USER_KEY)
}

export const clearLoggedInUser = () => {
  if (typeof window === "undefined") return
  localStorage.removeItem(LOGGED_IN_USER_KEY)
}

// New: Add User
export const addUser = (username: string, email: string, password: string, role: "admin" | "user" = "user"): User | null => {
  if (typeof window === "undefined") return null
  const users = getUsers()
  if (users.some((u) => u.username === username)) {
    return null // Username already exists
  }
  if (users.some((u) => u.email === email)) {
    return null // Email already exists
  }
  const newUser: User = {
    id: uuidv4(),
    username,
    email,
    passwordHash: hashPassword(password),
    role,
    createdAt: Date.now(),
  }
  localStorage.setItem(USERS_KEY, JSON.stringify([...users, newUser]))
  return newUser
}

// Update last login timestamp
export const updateUserLastLogin = (userId: string): void => {
  if (typeof window === "undefined") return
  const users = getUsers()
  const updatedUsers = users.map((u) =>
    u.id === userId ? { ...u, lastLogin: Date.now() } : u
  )
  localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers))
}

// New: Remove User
export const removeUser = (userId: string): boolean => {
  if (typeof window === "undefined") return false
  let users = getUsers()
  const initialLength = users.length
  users = users.filter((user) => user.id !== userId)
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
  return users.length < initialLength // True if a user was removed
}

// NEW: Update User
export const updateUser = (
  userId: string,
  newUsername: string,
  newEmail: string,
  newPassword?: string, // Optional new password
  newRole?: "admin" | "user", // Optional new role
): User | null => {
  if (typeof window === "undefined") return null
  const users = getUsers()
  const userIndex = users.findIndex((u) => u.id === userId)

  if (userIndex === -1) {
    return null // User not found
  }

  // Check if new username already exists for another user
  if (users.some((u) => u.id !== userId && u.username === newUsername)) {
    return null // New username already exists
  }

  // Check if new email already exists for another user
  if (users.some((u) => u.id !== userId && u.email === newEmail)) {
    return null // New email already exists
  }

  const userToUpdate = users[userIndex]
  const updatedUser: User = {
    ...userToUpdate,
    username: newUsername,
    email: newEmail,
    role: newRole !== undefined ? newRole : userToUpdate.role,
    passwordHash: newPassword ? hashPassword(newPassword) : userToUpdate.passwordHash,
  }

  users[userIndex] = updatedUser
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
  return updatedUser
}

// --- Printer Group Management ---
export const getPrinterGroups = (): PrinterGroup[] => {
  if (typeof window === "undefined") return []
  const groupsJson = localStorage.getItem(PRINTER_GROUPS_KEY)
  return groupsJson ? JSON.parse(groupsJson) : []
}

export const addPrinterGroup = (name: string): PrinterGroup => {
  if (typeof window === "undefined") throw new Error("localStorage not available")
  const groups = getPrinterGroups()
  const newGroup: PrinterGroup = {
    id: uuidv4(),
    name,
    printerIds: [],
    imageUrl: "/placeholder.svg?height=100&width=100", // Default placeholder
  }
  localStorage.setItem(PRINTER_GROUPS_KEY, JSON.stringify([...groups, newGroup]))
  return newGroup
}

export const updatePrinterGroup = (groupId: string, newName: string): PrinterGroup | null => {
  if (typeof window === "undefined") return null
  const groups = getPrinterGroups()
  const updatedGroups = groups.map((group) => (group.id === groupId ? { ...group, name: newName } : group))
  localStorage.setItem(PRINTER_GROUPS_KEY, JSON.stringify(updatedGroups))
  return updatedGroups.find((g) => g.id === groupId) || null
}

export const removePrinterGroup = (groupId: string) => {
  if (typeof window === "undefined") return
  let groups = getPrinterGroups()
  const groupToRemove = groups.find((g) => g.id === groupId)
  if (groupToRemove) {
    // Remove associated printers
    let printers = getPrinters()
    printers = printers.filter((p) => !groupToRemove.printerIds.includes(p.id))
    localStorage.setItem(PRINTERS_KEY, JSON.stringify(printers))

    groups = groups.filter((group) => group.id !== groupId)
    localStorage.setItem(PRINTER_GROUPS_KEY, JSON.stringify(groups))
  }
}

// --- Printer Management ---
export const getPrinters = (): Printer[] => {
  if (typeof window === "undefined") return []
  const printersJson = localStorage.getItem(PRINTERS_KEY)
  const printers: Printer[] = printersJson ? JSON.parse(printersJson) : []
  // Ensure queue and completedJobs are always arrays, even if missing from stored data
  return printers.map((p) => ({
    ...p,
    queue: p.queue || [],
    completedJobs: p.completedJobs || [],
  }))
}

export const getPrintersByGroupId = (groupId: string): Printer[] => {
  if (typeof window === "undefined") return []
  const allPrinters = getPrinters()
  const groups = getPrinterGroups()
  const group = groups.find((g) => g.id === groupId)
  if (!group) return []
  return allPrinters.filter((printer) => group.printerIds.includes(printer.id))
}

export const getPrinterById = (printerId: string): Printer | undefined => {
  if (typeof window === "undefined") return undefined
  const printers = getPrinters()
  return printers.find((printer) => printer.id === printerId)
}

export const addPrinter = (groupId: string, name: string, ipAddress: string): Printer | null => {
  if (typeof window === "undefined") throw new Error("localStorage not available")
  const printers = getPrinters()

  // Check for unique IP address
  if (printers.some((p) => p.ipAddress === ipAddress)) {
    return null // IP already exists
  }

  const newPrinter: Printer = {
    id: uuidv4(),
    name,
    ipAddress, // Store IP address
    status: "online", // Default status
    queue: [],
    completedJobs: [], // Initialize completedJobs array
    imageUrl: "/placeholder.svg?height=80&width=80", // Default placeholder
    progress: 0, // Initialize progress
    eta: null, // Initialize ETA
  }
  localStorage.setItem(PRINTERS_KEY, JSON.stringify([...printers, newPrinter]))

  // Add printer ID to the group
  const groups = getPrinterGroups()
  const updatedGroups = groups.map((group) =>
    group.id === groupId ? { ...group, printerIds: [...group.printerIds, newPrinter.id] } : group,
  )
  localStorage.setItem(PRINTER_GROUPS_KEY, JSON.stringify(updatedGroups))

  return newPrinter
}

export const updatePrinter = (printerId: string, newName: string, newIpAddress: string): Printer | null => {
  if (typeof window === "undefined") return null
  const printers = getPrinters()

  // Check for unique IP address, excluding the current printer being updated
  if (printers.some((p) => p.id !== printerId && p.ipAddress === newIpAddress)) {
    return null // IP already exists for another printer
  }

  const updatedPrinters = printers.map((printer) =>
    printer.id === printerId ? { ...printer, name: newName, ipAddress: newIpAddress } : printer,
  )
  localStorage.setItem(PRINTERS_KEY, JSON.stringify(updatedPrinters))
  return updatedPrinters.find((p) => p.id === printerId) || null
}

export const removePrinter = (groupId: string, printerId: string) => {
  if (typeof window === "undefined") return
  let printers = getPrinters()
  printers = printers.filter((printer) => printer.id !== printerId)
  localStorage.setItem(PRINTERS_KEY, JSON.stringify(printers))

  // Remove printer ID from the group
  const groups = getPrinterGroups()
  const updatedGroups = groups.map((group) =>
    group.id === groupId ? { ...group, printerIds: group.printerIds.filter((id) => id !== printerId) } : group,
  )
  localStorage.setItem(PRINTER_GROUPS_KEY, JSON.stringify(updatedGroups))
}

export const updatePrinterStatus = (
  printerId: string,
  status: Printer["status"],
  progress = 0,
  eta: number | null = null,
) => {
  if (typeof window === "undefined") return
  const printers = getPrinters()
  const updatedPrinters = printers.map((printer) =>
    printer.id === printerId ? { ...printer, status, progress, eta } : printer,
  )
  localStorage.setItem(PRINTERS_KEY, JSON.stringify(updatedPrinters))
}

// --- Print Queue Management ---
export const addPrintJobToQueue = (printerId: string, fileName: string) => {
  if (typeof window === "undefined") return
  const printers = getPrinters()
  const updatedPrinters = printers.map((printer) => {
    if (printer.id === printerId) {
      const newJob: PrintJob = { id: uuidv4(), fileName, timestamp: Date.now() }
      return {
        ...printer,
        queue: [...printer.queue, newJob],
        status: printer.status === "online" ? "printing" : printer.status,
      }
    }
    return printer
  })
  localStorage.setItem(PRINTERS_KEY, JSON.stringify(updatedPrinters))
}

export const completePrintJob = (printerId: string) => {
  if (typeof window === "undefined") return
  const printers = getPrinters()
  const updatedPrinters = printers.map((printer) => {
    if (printer.id === printerId) {
      const completedJob = printer.queue[0] // Get the first job in queue
      if (completedJob) {
        const newQueue = printer.queue.slice(1) // Remove the first job
        const newStatus = newQueue.length > 0 ? "printing" : "online" // If queue empty, go back to online
        return {
          ...printer,
          queue: newQueue,
          completedJobs: [...printer.completedJobs, { ...completedJob, completedAt: Date.now() }], // Add to completed jobs with timestamp
          status: newStatus,
          progress: 0,
          eta: null,
        } // Reset progress/eta
      }
    }
    return printer
  })
  localStorage.setItem(PRINTERS_KEY, JSON.stringify(updatedPrinters))
}

// NEW: Error Log Management
export const getErrorsLog = (): AppError[] => {
  if (typeof window === "undefined") return []
  const logsJson = localStorage.getItem(ERROR_LOGS_KEY)
  return logsJson ? JSON.parse(logsJson) : []
}

export const addErrorLog = (title: string, description?: string, details?: string) => {
  if (typeof window === "undefined") return
  const logs = getErrorsLog()
  const newError: AppError = {
    id: uuidv4(),
    timestamp: Date.now(),
    title,
    description,
    details,
  }
  // Keep a reasonable number of logs, e.g., last 100
  const updatedLogs = [newError, ...logs].slice(0, 100)
  localStorage.setItem(ERROR_LOGS_KEY, JSON.stringify(updatedLogs))
}

export const clearErrorLogs = () => {
  if (typeof window === "undefined") return
  localStorage.setItem(ERROR_LOGS_KEY, JSON.stringify([]))
}
