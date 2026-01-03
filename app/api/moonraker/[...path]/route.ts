import { NextResponse } from "next/server"

const MOONRAKER_PORT = 7125 // Default Moonraker API port

export async function GET(request: Request) {
  const { searchParams, pathname } = new URL(request.url)
  const printerIp = searchParams.get("ip")
  // Remove the 'ip' parameter from searchParams before forwarding
  searchParams.delete("ip")
  const moonrakerPath = pathname.replace("/api/moonraker/", "") // Get the path after /api/moonraker/

  if (!printerIp) {
    return NextResponse.json({ error: "Printer IP is required" }, { status: 400 })
  }

  const targetUrl = `http://${printerIp}:${MOONRAKER_PORT}/${moonrakerPath}?${searchParams.toString()}`
  console.log(`Proxying request to: ${targetUrl}`)

  try {
    const response = await fetch(targetUrl, { cache: "no-store" }) // Ensure no caching for real-time data

    if (!response.ok) {
      const errorText = await response.text() // Read the response as text for debugging
      console.error(
        `Proxy fetch failed for ${targetUrl}: ${response.status} ${response.statusText}. Raw response: ${errorText}`,
      )
      return NextResponse.json(
        { error: `Failed to fetch from Moonraker: ${response.statusText}`, rawResponse: errorText },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    let errorMessage = "Internal server error during proxy fetch"
    let rawResponse = ""
    // Attempt to read response text if available in error object (e.g., from a failed .json() parse)
    if (error.response && typeof error.response.text === "function") {
      try {
        rawResponse = await error.response.text()
        errorMessage = `JSON parse error. Raw response: ${rawResponse.substring(0, 200)}...` // Log first 200 chars
      } catch (textError) {
        console.error("Failed to read error response text:", textError)
      }
    } else if (error instanceof Error) {
      errorMessage = error.message
    }

    console.error(`Proxy caught error for ${targetUrl}: ${errorMessage}`, error)
    return NextResponse.json({ error: errorMessage, rawResponse: rawResponse }, { status: 500 })
  }
}
