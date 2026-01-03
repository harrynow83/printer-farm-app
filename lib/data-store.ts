import { supabase, isSupabaseAvailable } from "./supabase"
import { v4 as uuidv4 } from "uuid"
import { emitEvent } from "./realtime-events"

// Helper to "hash" passwords for localStorage (not secure for production)
const hashPassword = (password: string) => btoa(password)

export interface User {
  id: string
  username: string
  passwordHash: string
  role: "admin" | "user"
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

// 🎨 **NUEVAS FUNCIONES PARA IMÁGENES PERSONALIZADAS**

/**
 * Obtiene una imagen por defecto basada en el nombre del grupo
 */
const getDefaultGroupImage = (groupName: string): string => {
  const name = groupName.toLowerCase()

  // Mapeo de nombres a imágenes específicas
  if (name.includes("oficina") || name.includes("office")) {
    return "/images/grupos/oficina.jpg"
  } else if (name.includes("almacen") || name.includes("warehouse") || name.includes("deposito")) {
    return "/images/grupos/almacen.jpg"
  } else if (name.includes("laboratorio") || name.includes("lab")) {
    return "/images/grupos/laboratorio.jpg"
  } else if (name.includes("produccion") || name.includes("fabrica") || name.includes("factory")) {
    return "/images/grupos/produccion.jpg"
  } else if (name.includes("diseño") || name.includes("design") || name.includes("creativo")) {
    return "/images/grupos/diseno.jpg"
  } else if (name.includes("administracion") || name.includes("admin")) {
    return "/images/grupos/administracion.jpg"
  } else if (name.includes("ventas") || name.includes("sales")) {
    return "/images/grupos/ventas.jpg"
  } else if (name.includes("soporte") || name.includes("support") || name.includes("tecnico")) {
    return "/images/grupos/soporte.jpg"
  }

  // Imagen por defecto si no coincide con ningún patrón
  return "/images/grupos/default.jpg"
}

/**
 * Obtiene una imagen por defecto basada en el nombre de la impresora
 */
const getDefaultPrinterImage = (printerName: string): string => {
  const name = printerName.toLowerCase()

  // Mapeo por marca
  if (name.includes("hp") || name.includes("hewlett")) {
    return "/images/impresoras/hp.jpg"
  } else if (name.includes("canon")) {
    return "/images/impresoras/canon.jpg"
  } else if (name.includes("epson")) {
    return "/images/impresoras/epson.jpg"
  } else if (name.includes("brother")) {
    return "/images/impresoras/brother.jpg"
  } else if (name.includes("xerox")) {
    return "/images/impresoras/xerox.jpg"
  } else if (name.includes("samsung")) {
    return "/images/impresoras/samsung.jpg"
  } else if (name.includes("lexmark")) {
    return "/images/impresoras/lexmark.jpg"
  }

  // Mapeo por tipo
  else if (name.includes("laser")) {
    return "/images/impresoras/laser.jpg"
  } else if (name.includes("inkjet") || name.includes("tinta")) {
    return "/images/impresoras/inkjet.jpg"
  } else if (name.includes("3d")) {
    return "/images/impresoras/3d.jpg"
  } else if (name.includes("plotter")) {
    return "/images/impresoras/plotter.jpg"
  }

  // Imagen por defecto
  return "/images/impresoras/default.jpg"
}

// --- Initialization ---
export const initializeData = async () => {
  if (isSupabaseAvailable && supabase) {
    // Initialize with Supabase
    console.log("Using Supabase for data storage")

    // Check if default users exist, if not create them
    const { data: existingUsers } = await supabase.from("users").select("username").in("username", ["admin", "user"])

    if (!existingUsers || existingUsers.length === 0) {
      await supabase.from("users").insert([
        { username: "admin", password_hash: hashPassword("adminpass"), role: "admin" },
        { username: "user", password_hash: hashPassword("userpass"), role: "user" },
      ])
    }
  } else {
    // Initialize with localStorage
    console.log("Using localStorage for data storage")

    if (typeof window !== "undefined") {
      // Ensure localStorage is available
      if (!localStorage.getItem(USERS_KEY)) {
        const defaultUsers: User[] = [
          { id: uuidv4(), username: "admin", passwordHash: hashPassword("adminpass"), role: "admin" },
          { id: uuidv4(), username: "user", passwordHash: hashPassword("userpass"), role: "user" },
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
}

// --- User Management ---
export const getUsers = async (): Promise<User[]> => {
  try {
    if (isSupabaseAvailable && supabase) {
      const { data, error } = await supabase.from("users").select("*").order("username")

      if (error) {
        console.error("Error fetching users:", error)
        return []
      }

      return data.map((user) => ({
        id: user.id,
        username: user.username,
        passwordHash: user.password_hash,
        role: user.role,
      }))
    } else {
      // Use localStorage
      if (typeof window === "undefined") return []
      const usersJson = localStorage.getItem(USERS_KEY)
      const users = usersJson ? JSON.parse(usersJson) : []
      return Array.isArray(users) ? users : []
    }
  } catch (error) {
    console.error("Error in getUsers:", error)
    return []
  }
}

export const getUserByUsername = async (username: string): Promise<User | undefined> => {
  try {
    if (isSupabaseAvailable && supabase) {
      const { data, error } = await supabase.from("users").select("*").eq("username", username).single()

      if (error || !data) {
        return undefined
      }

      return {
        id: data.id,
        username: data.username,
        passwordHash: data.password_hash,
        role: data.role,
      }
    } else {
      // Use localStorage
      if (typeof window === "undefined") return undefined
      const users = await getUsers()
      return users.find((user) => user.username === username)
    }
  } catch (error) {
    console.error("Error in getUserByUsername:", error)
    return undefined
  }
}

export const verifyPassword = async (username: string, passwordAttempt: string): Promise<boolean> => {
  try {
    const user = await getUserByUsername(username)
    return user ? user.passwordHash === hashPassword(passwordAttempt) : false
  } catch (error) {
    console.error("Error in verifyPassword:", error)
    return false
  }
}

export const setLoggedInUser = (username: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(LOGGED_IN_USER_KEY, username)
  }
}

export const getLoggedInUser = (): string | null => {
  if (typeof window === "undefined") return null
  return localStorage.getItem(LOGGED_IN_USER_KEY)
}

export const clearLoggedInUser = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(LOGGED_IN_USER_KEY)
  }
}

export const addUser = async (
  username: string,
  password: string,
  role: "admin" | "user" = "user",
): Promise<User | null> => {
  try {
    if (isSupabaseAvailable && supabase) {
      const { data, error } = await supabase
        .from("users")
        .insert({
          username,
          password_hash: hashPassword(password),
          role,
        })
        .select()
        .single()

      if (error) {
        console.error("Error adding user:", error)
        return null
      }

      const newUser = {
        id: data.id,
        username: data.username,
        passwordHash: data.password_hash,
        role: data.role,
      }

      // Emitir evento de usuario añadido
      emitEvent("user_added", newUser, username)

      return newUser
    } else {
      // Use localStorage
      if (typeof window === "undefined") return null
      const users = await getUsers()
      if (users.some((u) => u.username === username)) {
        return null // Username already exists
      }
      const newUser: User = {
        id: uuidv4(),
        username,
        passwordHash: hashPassword(password),
        role,
      }
      localStorage.setItem(USERS_KEY, JSON.stringify([...users, newUser]))

      // Emitir evento de usuario añadido
      emitEvent("user_added", newUser, username)

      return newUser
    }
  } catch (error) {
    console.error("Error in addUser:", error)
    return null
  }
}

export const removeUser = async (userId: string): Promise<boolean> => {
  try {
    if (isSupabaseAvailable && supabase) {
      const { error } = await supabase.from("users").delete().eq("id", userId)

      // Emitir evento de usuario eliminado
      emitEvent("user_deleted", { id: userId }, userId)

      return !error
    } else {
      // Use localStorage
      if (typeof window === "undefined") return false
      let users = await getUsers()
      const initialLength = users.length
      users = users.filter((user) => user.id !== userId)
      localStorage.setItem(USERS_KEY, JSON.stringify(users))

      // Emitir evento de usuario eliminado
      emitEvent("user_deleted", { id: userId }, userId)

      return users.length < initialLength // True if a user was removed
    }
  } catch (error) {
    console.error("Error in removeUser:", error)
    return false
  }
}

export const updateUser = async (
  userId: string,
  newUsername: string,
  newPassword?: string,
  newRole?: "admin" | "user",
): Promise<User | null> => {
  try {
    if (isSupabaseAvailable && supabase) {
      const updateData: any = { username: newUsername }

      if (newPassword) {
        updateData.password_hash = hashPassword(newPassword)
      }

      if (newRole) {
        updateData.role = newRole
      }

      const { data, error } = await supabase.from("users").update(updateData).eq("id", userId).select().single()

      if (error) {
        console.error("Error updating user:", error)
        return null
      }

      const updatedUser = {
        id: data.id,
        username: data.username,
        passwordHash: data.password_hash,
        role: data.role,
      }

      // Emitir evento de usuario actualizado
      emitEvent("user_updated", updatedUser, newUsername)

      return updatedUser
    } else {
      // Use localStorage
      if (typeof window === "undefined") return null
      const users = await getUsers()
      const userIndex = users.findIndex((u) => u.id === userId)

      if (userIndex === -1) {
        return null // User not found
      }

      // Check if new username already exists for another user
      if (users.some((u) => u.id !== userId && u.username === newUsername)) {
        return null // New username already exists
      }

      const userToUpdate = users[userIndex]
      const updatedUser: User = {
        ...userToUpdate,
        username: newUsername,
        role: newRole !== undefined ? newRole : userToUpdate.role,
        passwordHash: newPassword ? hashPassword(newPassword) : userToUpdate.passwordHash,
      }

      users[userIndex] = updatedUser
      localStorage.setItem(USERS_KEY, JSON.stringify(users))

      // Emitir evento de usuario actualizado
      emitEvent("user_updated", updatedUser, newUsername)

      return updatedUser
    }
  } catch (error) {
    console.error("Error in updateUser:", error)
    return null
  }
}

// --- Printer Group Management ---
export const getPrinterGroups = async (): Promise<PrinterGroup[]> => {
  try {
    if (isSupabaseAvailable && supabase) {
      const { data, error } = await supabase.from("printer_groups").select("*").order("name")

      if (error) {
        console.error("Error fetching printer groups:", error)
        return []
      }

      // Asegurar que data sea un array
      if (!Array.isArray(data)) {
        console.warn("Supabase returned non-array data for printer groups:", data)
        return []
      }

      return data.map((group) => ({
        id: group.id,
        name: group.name,
        printerIds: Array.isArray(group.printer_ids) ? group.printer_ids : [],
        imageUrl: group.image_url || getDefaultGroupImage(group.name),
      }))
    } else {
      // Use localStorage
      if (typeof window === "undefined") return []
      const groupsJson = localStorage.getItem(PRINTER_GROUPS_KEY)

      if (!groupsJson) {
        return []
      }

      let groups
      try {
        groups = JSON.parse(groupsJson)
      } catch (parseError) {
        console.error("Error parsing groups from localStorage:", parseError)
        return []
      }

      // Asegurar que groups sea un array
      if (!Array.isArray(groups)) {
        console.warn("localStorage groups is not an array:", groups)
        return []
      }

      return groups.map((group) => ({
        ...group,
        imageUrl: group.imageUrl || getDefaultGroupImage(group.name),
        printerIds: Array.isArray(group.printerIds) ? group.printerIds : [],
      }))
    }
  } catch (error) {
    console.error("Error in getPrinterGroups:", error)
    return []
  }
}

export const addPrinterGroup = async (name: string): Promise<PrinterGroup | null> => {
  try {
    const defaultImageUrl = getDefaultGroupImage(name) // 🎨 Obtener imagen personalizada

    if (isSupabaseAvailable && supabase) {
      const { data, error } = await supabase
        .from("printer_groups")
        .insert({
          name,
          printer_ids: [],
          image_url: defaultImageUrl, // 🎨 Usar imagen personalizada
        })
        .select()
        .single()

      if (error) {
        console.error("Error adding printer group:", error)
        return null
      }

      const newGroup = {
        id: data.id,
        name: data.name,
        printerIds: Array.isArray(data.printer_ids) ? data.printer_ids : [],
        imageUrl: data.image_url || defaultImageUrl,
      }

      // Emitir evento de grupo añadido
      emitEvent("group_added", newGroup)

      return newGroup
    } else {
      // Use localStorage
      if (typeof window === "undefined") return null
      const groups = await getPrinterGroups()
      const newGroup: PrinterGroup = {
        id: uuidv4(),
        name,
        printerIds: [],
        imageUrl: defaultImageUrl, // 🎨 Usar imagen personalizada
      }
      localStorage.setItem(PRINTER_GROUPS_KEY, JSON.stringify([...groups, newGroup]))

      // Emitir evento de grupo añadido
      emitEvent("group_added", newGroup)

      return newGroup
    }
  } catch (error) {
    console.error("Error in addPrinterGroup:", error)
    return null
  }
}

export const updatePrinterGroup = async (groupId: string, newName: string): Promise<PrinterGroup | null> => {
  try {
    const defaultImageUrl = getDefaultGroupImage(newName) // 🎨 Actualizar imagen basada en nuevo nombre

    if (isSupabaseAvailable && supabase) {
      const { data, error } = await supabase
        .from("printer_groups")
        .update({
          name: newName,
          image_url: defaultImageUrl, // 🎨 Actualizar imagen
        })
        .eq("id", groupId)
        .select()
        .single()

      if (error) {
        console.error("Error updating printer group:", error)
        return null
      }

      const updatedGroup = {
        id: data.id,
        name: data.name,
        printerIds: Array.isArray(data.printer_ids) ? data.printer_ids : [],
        imageUrl: data.image_url || defaultImageUrl,
      }

      // Emitir evento de grupo actualizado
      emitEvent("group_updated", updatedGroup)

      return updatedGroup
    } else {
      // Use localStorage
      if (typeof window === "undefined") return null
      const groups = await getPrinterGroups()
      const updatedGroups = groups.map((group) =>
        group.id === groupId
          ? { ...group, name: newName, imageUrl: defaultImageUrl } // 🎨 Actualizar imagen
          : group,
      )
      localStorage.setItem(PRINTER_GROUPS_KEY, JSON.stringify(updatedGroups))

      const updatedGroup = updatedGroups.find((g) => g.id === groupId) || null

      // Emitir evento de grupo actualizado
      emitEvent("group_updated", updatedGroup)

      return updatedGroup
    }
  } catch (error) {
    console.error("Error in updatePrinterGroup:", error)
    return null
  }
}

export const removePrinterGroup = async (groupId: string): Promise<void> => {
  try {
    if (isSupabaseAvailable && supabase) {
      // First get the group to find associated printers
      const { data: group } = await supabase.from("printer_groups").select("printer_ids").eq("id", groupId).single()

      if (group && group.printer_ids) {
        // Remove associated printers
        await supabase.from("printers").delete().in("id", group.printer_ids)
      }

      // Remove the group
      await supabase.from("printer_groups").delete().eq("id", groupId)
    } else {
      // Use localStorage
      if (typeof window === "undefined") return
      let groups = await getPrinterGroups()
      const groupToRemove = groups.find((g) => g.id === groupId)
      if (groupToRemove) {
        // Remove associated printers
        let printers = await getPrinters()
        printers = printers.filter((p) => !groupToRemove.printerIds.includes(p.id))
        localStorage.setItem(PRINTERS_KEY, JSON.stringify(printers))

        groups = groups.filter((group) => group.id !== groupId)
        localStorage.setItem(PRINTER_GROUPS_KEY, JSON.stringify(groups))
      }
    }

    // Emitir evento de grupo eliminado
    emitEvent("group_deleted", { id: groupId })
  } catch (error) {
    console.error("Error in removePrinterGroup:", error)
  }
}

// --- Printer Management ---
export const getPrinters = async (): Promise<Printer[]> => {
  try {
    if (isSupabaseAvailable && supabase) {
      const { data, error } = await supabase.from("printers").select("*").order("name")

      if (error) {
        console.error("Error fetching printers:", error)
        return []
      }

      return data.map((printer) => ({
        id: printer.id,
        name: printer.name,
        ipAddress: printer.ip_address,
        status: printer.status,
        queue: Array.isArray(printer.queue) ? printer.queue : [],
        completedJobs: Array.isArray(printer.completed_jobs) ? printer.completed_jobs : [],
        imageUrl: printer.image_url || getDefaultPrinterImage(printer.name), // 🎨 Usar imagen personalizada
        progress: printer.progress || 0,
        eta: printer.eta,
      }))
    } else {
      // Use localStorage
      if (typeof window === "undefined") return []
      const printersJson = localStorage.getItem(PRINTERS_KEY)
      const printers: Printer[] = printersJson ? JSON.parse(printersJson) : []
      // Ensure queue and completedJobs are always arrays, even if missing from stored data
      return Array.isArray(printers)
        ? printers.map((p) => ({
            ...p,
            queue: Array.isArray(p.queue) ? p.queue : [],
            completedJobs: Array.isArray(p.completedJobs) ? p.completedJobs : [],
            imageUrl: p.imageUrl || getDefaultPrinterImage(p.name), // 🎨 Usar imagen personalizada
          }))
        : []
    }
  } catch (error) {
    console.error("Error in getPrinters:", error)
    return []
  }
}

export const getPrintersByGroupId = async (groupId: string): Promise<Printer[]> => {
  try {
    if (isSupabaseAvailable && supabase) {
      const { data: group } = await supabase.from("printer_groups").select("printer_ids").eq("id", groupId).single()

      if (!group || !group.printer_ids || group.printer_ids.length === 0) {
        return []
      }

      const { data, error } = await supabase.from("printers").select("*").in("id", group.printer_ids).order("name")

      if (error) {
        console.error("Error fetching printers by group:", error)
        return []
      }

      // Asegurar que data sea un array
      if (!Array.isArray(data)) {
        console.warn("Supabase returned non-array data for printers:", data)
        return []
      }

      return data.map((printer) => ({
        id: printer.id,
        name: printer.name,
        ipAddress: printer.ip_address,
        status: printer.status,
        queue: Array.isArray(printer.queue) ? printer.queue : [],
        completedJobs: Array.isArray(printer.completed_jobs) ? printer.completed_jobs : [],
        imageUrl: printer.image_url || getDefaultPrinterImage(printer.name),
        progress: printer.progress || 0,
        eta: printer.eta,
      }))
    } else {
      // Use localStorage
      if (typeof window === "undefined") return []

      const allPrinters = await getPrinters()
      const groups = await getPrinterGroups()

      // Validación defensiva
      if (!Array.isArray(groups)) {
        console.error("getPrintersByGroupId: groups is not an array:", groups)
        return []
      }

      if (!Array.isArray(allPrinters)) {
        console.error("getPrintersByGroupId: allPrinters is not an array:", allPrinters)
        return []
      }

      const group = groups.find((g) => g && g.id === groupId)
      if (!group || !Array.isArray(group.printerIds)) {
        return []
      }

      return allPrinters.filter((printer) => printer && group.printerIds.includes(printer.id))
    }
  } catch (error) {
    console.error("Error in getPrintersByGroupId:", error)
    return []
  }
}

export const getPrinterById = async (printerId: string): Promise<Printer | undefined> => {
  try {
    if (isSupabaseAvailable && supabase) {
      const { data, error } = await supabase.from("printers").select("*").eq("id", printerId).single()

      if (error || !data) {
        return undefined
      }

      return {
        id: data.id,
        name: data.name,
        ipAddress: data.ip_address,
        status: data.status,
        queue: Array.isArray(data.queue) ? data.queue : [],
        completedJobs: Array.isArray(data.completed_jobs) ? data.completed_jobs : [],
        imageUrl: data.image_url || getDefaultPrinterImage(data.name), // 🎨 Usar imagen personalizada
        progress: data.progress || 0,
        eta: data.eta,
      }
    } else {
      // Use localStorage
      if (typeof window === "undefined") return undefined
      const printers = await getPrinters()
      return printers.find((printer) => printer.id === printerId)
    }
  } catch (error) {
    console.error("Error in getPrinterById:", error)
    return undefined
  }
}

export const addPrinter = async (groupId: string, name: string, ipAddress: string): Promise<Printer | null> => {
  try {
    const defaultImageUrl = getDefaultPrinterImage(name) // 🎨 Obtener imagen personalizada

    if (isSupabaseAvailable && supabase) {
      // Check for unique IP address
      const { data: existingPrinter } = await supabase
        .from("printers")
        .select("id")
        .eq("ip_address", ipAddress)
        .single()

      if (existingPrinter) {
        return null // IP already exists
      }

      const { data, error } = await supabase
        .from("printers")
        .insert({
          name,
          ip_address: ipAddress,
          status: "online",
          queue: [],
          completed_jobs: [],
          image_url: defaultImageUrl, // 🎨 Usar imagen personalizada
          progress: 0,
          eta: null,
        })
        .select()
        .single()

      if (error) {
        console.error("Error adding printer:", error)
        return null
      }

      // Add printer ID to the group
      const { data: group } = await supabase.from("printer_groups").select("printer_ids").eq("id", groupId).single()

      if (group) {
        const updatedPrinterIds = [...(Array.isArray(group.printer_ids) ? group.printer_ids : []), data.id]
        await supabase.from("printer_groups").update({ printer_ids: updatedPrinterIds }).eq("id", groupId)
      }

      const newPrinter = {
        id: data.id,
        name: data.name,
        ipAddress: data.ip_address,
        status: data.status,
        queue: Array.isArray(data.queue) ? data.queue : [],
        completedJobs: Array.isArray(data.completed_jobs) ? data.completed_jobs : [],
        imageUrl: data.image_url || defaultImageUrl,
        progress: data.progress || 0,
        eta: data.eta,
      }

      // Emitir evento de impresora añadida
      emitEvent("printer_added", newPrinter)

      return newPrinter
    } else {
      // Use localStorage
      if (typeof window === "undefined") return null
      const printers = await getPrinters()

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
        imageUrl: defaultImageUrl, // 🎨 Usar imagen personalizada
        progress: 0, // Initialize progress
        eta: null, // Initialize ETA
      }
      localStorage.setItem(PRINTERS_KEY, JSON.stringify([...printers, newPrinter]))

      // Add printer ID to the group
      const groups = await getPrinterGroups()
      if (Array.isArray(groups)) {
        const updatedGroups = groups.map((group) => {
          if (!group || group.id !== groupId) return group

          return {
            ...group,
            printerIds: Array.isArray(group.printerIds) ? [...group.printerIds, newPrinter.id] : [newPrinter.id],
          }
        })
        localStorage.setItem(PRINTER_GROUPS_KEY, JSON.stringify(updatedGroups))
      }

      // Emitir evento de impresora añadida
      emitEvent("printer_added", newPrinter)

      return newPrinter
    }
  } catch (error) {
    console.error("Error in addPrinter:", error)
    return null
  }
}

export const updatePrinter = async (
  printerId: string,
  newName: string,
  newIpAddress: string,
): Promise<Printer | null> => {
  try {
    const defaultImageUrl = getDefaultPrinterImage(newName) // 🎨 Actualizar imagen basada en nuevo nombre

    if (isSupabaseAvailable && supabase) {
      // Check for unique IP address, excluding current printer
      const { data: existingPrinter } = await supabase
        .from("printers")
        .select("id")
        .eq("ip_address", newIpAddress)
        .neq("id", printerId)
        .single()

      if (existingPrinter) {
        return null // IP already exists for another printer
      }

      const { data, error } = await supabase
        .from("printers")
        .update({
          name: newName,
          ip_address: newIpAddress,
          image_url: defaultImageUrl, // 🎨 Actualizar imagen
        })
        .eq("id", printerId)
        .select()
        .single()

      if (error) {
        console.error("Error updating printer:", error)
        return null
      }

      const updatedPrinter = {
        id: data.id,
        name: data.name,
        ipAddress: data.ip_address,
        status: data.status,
        queue: Array.isArray(data.queue) ? data.queue : [],
        completedJobs: Array.isArray(data.completed_jobs) ? data.completed_jobs : [],
        imageUrl: data.image_url || defaultImageUrl,
        progress: data.progress || 0,
        eta: data.eta,
      }

      // Emitir evento de impresora actualizada
      emitEvent("printer_updated", updatedPrinter)

      return updatedPrinter
    } else {
      // Use localStorage
      if (typeof window === "undefined") return null
      const printers = await getPrinters()

      // Check for unique IP address, excluding the current printer being updated
      if (printers.some((p) => p.id !== printerId && p.ipAddress === newIpAddress)) {
        return null // IP already exists for another printer
      }

      const updatedPrinters = printers.map((printer) =>
        printer.id === printerId
          ? { ...printer, name: newName, ipAddress: newIpAddress, imageUrl: defaultImageUrl } // 🎨 Actualizar imagen
          : printer,
      )
      localStorage.setItem(PRINTERS_KEY, JSON.stringify(updatedPrinters))

      const updatedPrinter = updatedPrinters.find((p) => p.id === printerId) || null

      // Emitir evento de impresora actualizada
      emitEvent("printer_updated", updatedPrinter)

      return updatedPrinter
    }
  } catch (error) {
    console.error("Error in updatePrinter:", error)
    return null
  }
}

export const removePrinter = async (groupId: string, printerId: string): Promise<void> => {
  try {
    if (isSupabaseAvailable && supabase) {
      // Remove printer from database
      await supabase.from("printers").delete().eq("id", printerId)

      // Remove printer ID from the group
      const { data: group } = await supabase.from("printer_groups").select("printer_ids").eq("id", groupId).single()

      if (group && group.printer_ids) {
        const updatedPrinterIds = group.printer_ids.filter((id: string) => id !== printerId)
        await supabase.from("printer_groups").update({ printer_ids: updatedPrinterIds }).eq("id", groupId)
      }
    } else {
      // Use localStorage
      if (typeof window === "undefined") return

      let printers = await getPrinters()
      if (Array.isArray(printers)) {
        printers = printers.filter((printer) => printer && printer.id !== printerId)
        localStorage.setItem(PRINTERS_KEY, JSON.stringify(printers))
      }

      // Remove printer ID from the group
      const groups = await getPrinterGroups()
      if (Array.isArray(groups)) {
        const updatedGroups = groups.map((group) => {
          if (!group || group.id !== groupId) return group

          return {
            ...group,
            printerIds: Array.isArray(group.printerIds) ? group.printerIds.filter((id) => id !== printerId) : [],
          }
        })
        localStorage.setItem(PRINTER_GROUPS_KEY, JSON.stringify(updatedGroups))
      }
    }

    // Emitir evento de impresora eliminada
    emitEvent("printer_deleted", { id: printerId, groupId })
  } catch (error) {
    console.error("Error in removePrinter:", error)
  }
}

export const updatePrinterStatus = async (
  printerId: string,
  status: Printer["status"],
  progress = 0,
  eta: number | null = null,
): Promise<void> => {
  try {
    if (isSupabaseAvailable && supabase) {
      await supabase
        .from("printers")
        .update({
          status,
          progress,
          eta,
        })
        .eq("id", printerId)
    } else {
      // Use localStorage
      if (typeof window === "undefined") return
      const printers = await getPrinters()
      const updatedPrinters = printers.map((printer) =>
        printer.id === printerId ? { ...printer, status, progress, eta } : printer,
      )
      localStorage.setItem(PRINTERS_KEY, JSON.stringify(updatedPrinters))
    }

    // Emitir evento de estado de impresora actualizado
    emitEvent("printer_status_updated", { id: printerId, status, progress, eta })
  } catch (error) {
    console.error("Error in updatePrinterStatus:", error)
  }
}

// --- Print Queue Management ---
export const addPrintJobToQueue = async (printerId: string, fileName: string): Promise<void> => {
  try {
    if (isSupabaseAvailable && supabase) {
      const { data: printer } = await supabase.from("printers").select("queue, status").eq("id", printerId).single()

      if (printer) {
        const newJob: PrintJob = {
          id: crypto.randomUUID(),
          fileName,
          timestamp: Date.now(),
        }
        const updatedQueue = [...(Array.isArray(printer.queue) ? printer.queue : []), newJob]
        const newStatus = printer.status === "online" ? "printing" : printer.status

        await supabase
          .from("printers")
          .update({
            queue: updatedQueue,
            status: newStatus,
          })
          .eq("id", printerId)
      }
    } else {
      // Use localStorage
      if (typeof window === "undefined") return
      const printers = await getPrinters()
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

    // Emitir evento de trabajo añadido a la cola
    emitEvent("print_job_added", { printerId, fileName })
  } catch (error) {
    console.error("Error in addPrintJobToQueue:", error)
  }
}

export const completePrintJob = async (printerId: string): Promise<void> => {
  try {
    if (isSupabaseAvailable && supabase) {
      const { data: printer } = await supabase
        .from("printers")
        .select("queue, completed_jobs")
        .eq("id", printerId)
        .single()

      if (printer && printer.queue && printer.queue.length > 0) {
        const completedJob = printer.queue[0]
        const newQueue = printer.queue.slice(1)
        const newStatus = newQueue.length > 0 ? "printing" : "online"
        const updatedCompletedJobs = [
          ...(Array.isArray(printer.completed_jobs) ? printer.completed_jobs : []),
          { ...completedJob, completedAt: Date.now() },
        ]

        await supabase
          .from("printers")
          .update({
            queue: newQueue,
            completed_jobs: updatedCompletedJobs,
            status: newStatus,
            progress: 0,
            eta: null,
          })
          .eq("id", printerId)
      }
    } else {
      // Use localStorage
      if (typeof window === "undefined") return
      const printers = await getPrinters()
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

    // Emitir evento de trabajo completado
    emitEvent("print_job_completed", { printerId })
  } catch (error) {
    console.error("Error in completePrintJob:", error)
  }
}

// --- Error Log Management ---
export const getErrorsLog = async (): Promise<AppError[]> => {
  try {
    if (isSupabaseAvailable && supabase) {
      const { data, error } = await supabase
        .from("error_logs")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(100)

      if (error) {
        console.error("Error fetching error logs:", error)
        return []
      }

      return data.map((log) => ({
        id: log.id,
        timestamp: log.timestamp,
        title: log.title,
        description: log.description,
        details: log.details,
      }))
    } else {
      // Use localStorage
      if (typeof window === "undefined") return []
      const logsJson = localStorage.getItem(ERROR_LOGS_KEY)
      const logs = logsJson ? JSON.parse(logsJson) : []
      return Array.isArray(logs) ? logs : []
    }
  } catch (error) {
    console.error("Error in getErrorsLog:", error)
    return []
  }
}

export const addErrorLog = async (title: string, description?: string, details?: string): Promise<void> => {
  try {
    if (isSupabaseAvailable && supabase) {
      await supabase.from("error_logs").insert({
        timestamp: Date.now(),
        title,
        description,
        details,
      })
    } else {
      // Use localStorage
      if (typeof window === "undefined") return
      const logs = await getErrorsLog()
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

    // Emitir evento de error registrado
    emitEvent("error_logged", { title, description, details })
  } catch (error) {
    console.error("Error in addErrorLog:", error)
  }
}

export const clearErrorLogs = async (): Promise<void> => {
  try {
    if (isSupabaseAvailable && supabase) {
      await supabase.from("error_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000") // Delete all records
    } else {
      // Use localStorage
      if (typeof window === "undefined") return
      localStorage.setItem(ERROR_LOGS_KEY, JSON.stringify([]))
    }

    // Emitir evento de logs limpiados
    emitEvent("errors_cleared", {})
  } catch (error) {
    console.error("Error in clearErrorLogs:", error)
  }
}

// Synchronous wrappers for backward compatibility (will use localStorage if available)
export const getUsersSync = (): User[] => {
  try {
    if (typeof window === "undefined") return []
    const usersJson = localStorage.getItem(USERS_KEY)
    const users = usersJson ? JSON.parse(usersJson) : []
    return Array.isArray(users) ? users : []
  } catch (error) {
    console.error("Error in getUsersSync:", error)
    return []
  }
}

export const getPrinterGroupsSync = (): PrinterGroup[] => {
  try {
    if (typeof window === "undefined") return []
    const groupsJson = localStorage.getItem(PRINTER_GROUPS_KEY)
    const groups = groupsJson ? JSON.parse(groupsJson) : []
    return Array.isArray(groups)
      ? groups.map((group) => ({
          ...group,
          imageUrl: group.imageUrl || getDefaultGroupImage(group.name), // 🎨 Usar imagen personalizada
        }))
      : []
  } catch (error) {
    console.error("Error in getPrinterGroupsSync:", error)
    return []
  }
}

export const getPrintersSync = (): Printer[] => {
  try {
    if (typeof window === "undefined") return []
    const printersJson = localStorage.getItem(PRINTERS_KEY)

    if (!printersJson) {
      return []
    }

    let printers
    try {
      printers = JSON.parse(printersJson)
    } catch (parseError) {
      console.error("Error parsing printers from localStorage:", parseError)
      return []
    }

    if (!Array.isArray(printers)) {
      console.warn("localStorage printers is not an array:", printers)
      return []
    }

    return printers.map((p) => ({
      ...p,
      queue: Array.isArray(p.queue) ? p.queue : [],
      completedJobs: Array.isArray(p.completedJobs) ? p.completedJobs : [],
      imageUrl: p.imageUrl || getDefaultPrinterImage(p.name),
    }))
  } catch (error) {
    console.error("Error in getPrintersSync:", error)
    return []
  }
}

export const getPrinterByIdSync = (printerId: string): Printer | undefined => {
  try {
    if (typeof window === "undefined") return undefined
    const printers = getPrintersSync()
    return printers.find((printer) => printer.id === printerId)
  } catch (error) {
    console.error("Error in getPrinterByIdSync:", error)
    return undefined
  }
}

export const getErrorsLogSync = (): AppError[] => {
  try {
    if (typeof window === "undefined") return []
    const logsJson = localStorage.getItem(ERROR_LOGS_KEY)
    const logs = logsJson ? JSON.parse(logsJson) : []
    return Array.isArray(logs) ? logs : []
  } catch (error) {
    console.error("Error in getErrorsLogSync:", error)
    return []
  }
}

// 🎨 **FUNCIONES ADICIONALES PARA GESTIÓN DE IMÁGENES**

/**
 * Actualiza la imagen de un grupo específico
 */
export const updateGroupImage = async (groupId: string, newImageUrl: string): Promise<boolean> => {
  try {
    if (isSupabaseAvailable && supabase) {
      const { error } = await supabase.from("printer_groups").update({ image_url: newImageUrl }).eq("id", groupId)

      return !error
    } else {
      if (typeof window === "undefined") return false
      const groups = await getPrinterGroups()
      const updatedGroups = groups.map((group) => (group.id === groupId ? { ...group, imageUrl: newImageUrl } : group))
      localStorage.setItem(PRINTER_GROUPS_KEY, JSON.stringify(updatedGroups))
      return true
    }
  } catch (error) {
    console.error("Error updating group image:", error)
    return false
  }
}

/**
 * Actualiza la imagen de una impresora específica
 */
export const updatePrinterImage = async (printerId: string, newImageUrl: string): Promise<boolean> => {
  try {
    if (isSupabaseAvailable && supabase) {
      const { error } = await supabase.from("printers").update({ image_url: newImageUrl }).eq("id", printerId)

      return !error
    } else {
      if (typeof window === "undefined") return false
      const printers = await getPrinters()
      const updatedPrinters = printers.map((printer) =>
        printer.id === printerId ? { ...printer, imageUrl: newImageUrl } : printer,
      )
      localStorage.setItem(PRINTERS_KEY, JSON.stringify(updatedPrinters))
      return true
    }
  } catch (error) {
    console.error("Error updating printer image:", error)
    return false
  }
}
