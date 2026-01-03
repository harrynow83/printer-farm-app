import type { Printer } from "./data-store"
import { addErrorLog } from "./data-store" // NEW: Import addErrorLog

// Define a type for the notification function to be passed
type ShowErrorFunction = (title: string, description?: string) => void

interface MoonrakerStatusResponse {
  status: Printer["status"]
  progress: number // 0-100
  eta: number | null // seconds
}

/**
 * Fetches the real-time status, progress, and ETA of a printer from its Moonraker API via a Next.js proxy.
 * @param ipAddress The IP address of the printer.
 * @param showError A function to display error notifications.
 * @returns An object containing the status, progress (0-100), and ETA (in seconds) or default values if an error occurs.
 */
export async function fetchMoonrakerStatus(
  ipAddress: string,
  showError: ShowErrorFunction,
): Promise<MoonrakerStatusResponse> {
  const proxyUrl = `/api/moonraker/printer/objects/query?webhooks&printer&print_stats&ip=${ipAddress}`

  try {
    const response = await fetch(proxyUrl, { cache: "no-store" })

    if (!response.ok) {
      const errorText = await response.text() // Read the response as text for debugging
      const errorMessage = `Error ${response.status}: ${response.statusText}. Detalles: ${errorText.substring(0, 150)}...`
      showError("Fallo de Conexión Moonraker", `No se pudo obtener el estado de ${ipAddress}.`)
      addErrorLog(
        "Fallo de Conexión Moonraker",
        `No se pudo obtener el estado de la impresora ${ipAddress}.`,
        `URL: ${proxyUrl}, Estado: ${response.status} ${response.statusText}, Respuesta: ${errorText}`,
      )
      console.error(
        `Moonraker API proxy error for ${ipAddress}: ${response.status} ${response.statusText}. Raw: ${errorText}`,
      )
      return { status: "offline", progress: 0, eta: null }
    }

    const data = await response.json()

    const printerState = data?.result?.status?.webhooks?.state
    const printerPrintStatsState = data?.result?.status?.printer?.state
    const printStats = data?.result?.status?.print_stats

    let status: Printer["status"] = "offline"
    let progress = 0
    let eta: number | null = null

    if (printerState === "printing" || printerPrintStatsState === "printing") {
      status = "printing"
    } else if (printerState === "error" || printerPrintStatsState === "error") {
      status = "error"
    } else if (
      printerState === "ready" ||
      printerPrintStatsState === "ready" ||
      printerState === "paused" ||
      printerPrintStatsState === "paused"
    ) {
      status = "online"
    }

    // Calculate progress and ETA if printing
    if (status === "printing" && printStats) {
      if (printStats.print_duration && printStats.total_duration) {
        progress = (printStats.print_duration / printStats.total_duration) * 100
        progress = Math.min(100, Math.max(0, Number.parseFloat(progress.toFixed(1)))) // Clamp between 0-100, one decimal
      }
      if (printStats.eta) {
        eta = Math.max(0, Math.floor(printStats.eta - printStats.print_duration)) // Remaining time
      }
    } else {
      // Reset progress and ETA if not printing
      progress = 0
      eta = null
    }

    return { status, progress, eta }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    showError("Error de Red Moonraker", `No se pudo conectar con ${ipAddress}.`)
    addErrorLog(
      "Error de Red Moonraker",
      `Fallo al intentar obtener el estado de la impresora ${ipAddress}.`,
      `URL: ${proxyUrl}, Mensaje: ${errorMessage}`,
    )
    console.error(`Failed to fetch Moonraker status for ${ipAddress} via proxy:`, error)
    return { status: "offline", progress: 0, eta: null }
  }
}

/**
 * Sends a command to the Moonraker API via proxy.
 * @param ipAddress The IP address of the printer.
 * @param command The Moonraker command to send (e.g., 'pause', 'resume', 'cancel').
 * @param showError A function to display error notifications.
 */
async function sendMoonrakerCommand(
  ipAddress: string,
  command: string,
  showError: ShowErrorFunction,
): Promise<boolean> {
  const proxyUrl = `/api/moonraker/printer/print/${command}?ip=${ipAddress}`
  try {
    const response = await fetch(proxyUrl, {
      method: "POST", // Moonraker commands are typically POST requests
      cache: "no-store",
    })
    if (!response.ok) {
      const errorText = await response.text()
      showError("Fallo de Comando Moonraker", `No se pudo enviar el comando '${command}' a ${ipAddress}.`)
      addErrorLog(
        "Fallo de Comando Moonraker",
        `No se pudo enviar el comando '${command}' a la impresora ${ipAddress}.`,
        `URL: ${proxyUrl}, Estado: ${response.status} ${response.statusText}, Respuesta: ${errorText}`,
      )
      console.error(
        `Failed to send Moonraker command '${command}' to ${ipAddress}: ${response.statusText}. Response: ${errorText}`,
      )
      return false
    }
    return true
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    showError("Error de Red Moonraker", `No se pudo enviar el comando '${command}' a ${ipAddress}.`)
    addErrorLog(
      "Error de Red Moonraker",
      `Fallo al intentar enviar el comando '${command}' a la impresora ${ipAddress}.`,
      `URL: ${proxyUrl}, Mensaje: ${errorMessage}`,
    )
    console.error(`Error sending Moonraker command '${command}' to ${ipAddress}:`, error)
    return false
  }
}

/**
 * Sends a G-code command to the Moonraker API via proxy.
 * @param ipAddress The IP address of the printer.
 * @param gcode The G-code command to send (e.g., 'G28').
 * @param showError A function to display error notifications.
 */
export async function sendGcodeCommand(
  ipAddress: string,
  gcode: string,
  showError: ShowErrorFunction,
): Promise<boolean> {
  const proxyUrl = `/api/moonraker/printer/gcode/script?ip=${ipAddress}`
  try {
    const response = await fetch(proxyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ script: gcode }), // G-code is sent in the body as 'script'
      cache: "no-store",
    })
    if (!response.ok) {
      const errorText = await response.text()
      showError("Fallo de G-code", `No se pudo enviar el G-code '${gcode}' a ${ipAddress}.`)
      addErrorLog(
        "Fallo de G-code",
        `No se pudo enviar el G-code '${gcode}' a la impresora ${ipAddress}.`,
        `URL: ${proxyUrl}, Estado: ${response.status} ${response.statusText}, Respuesta: ${errorText}`,
      )
      console.error(
        `Failed to send G-code command '${gcode}' to ${ipAddress}: ${response.statusText}. Response: ${errorText}`,
      )
      return false
    }
    return true
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    showError("Error de Red G-code", `No se pudo enviar el G-code '${gcode}' a ${ipAddress}.`)
    addErrorLog(
      "Error de Red G-code",
      `Fallo al intentar enviar el G-code '${gcode}' a la impresora ${ipAddress}.`,
      `URL: ${proxyUrl}, Mensaje: ${errorMessage}`,
    )
    console.error(`Error sending G-code command '${gcode}' to ${ipAddress}:`, error)
    return false
  }
}

// Update the exported functions to pass showError
export const pausePrint = (ipAddress: string, showError: ShowErrorFunction) =>
  sendMoonrakerCommand(ipAddress, "pause", showError)
export const resumePrint = (ipAddress: string, showError: ShowErrorFunction) =>
  sendMoonrakerCommand(ipAddress, "resume", showError)
export const cancelPrint = (ipAddress: string, showError: ShowErrorFunction) =>
  sendMoonrakerCommand(ipAddress, "cancel", showError)

// Helper to format seconds into HH:MM:SS
export function formatTime(seconds: number | null): string {
  if (seconds === null || seconds < 0) return "--:--:--"
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return [h, m, s].map((v) => v.toString().padStart(2, "0")).join(":")
}
