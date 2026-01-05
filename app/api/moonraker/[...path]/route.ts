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
  console.log(`[v0] Proxying request to: ${targetUrl}`)

  try {
    const response = await fetch(targetUrl, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    })

    const responseText = await response.text()
    console.log(`[v0] Response status: ${response.status}, Content-Type: ${response.headers.get("content-type")}`)
    console.log(`[v0] Response text (first 200 chars): ${responseText.substring(0, 200)}`)

    if (!response.ok) {
      console.error(
        `[v0] Proxy fetch failed for ${targetUrl}: ${response.status} ${response.statusText}. Raw response: ${responseText}`,
      )
      return NextResponse.json(
        {
          error: `Moonraker error: ${response.statusText}`,
          rawResponse: responseText,
          details: responseText.substring(0, 500),
        },
        { status: response.status },
      )
    }

    try {
      const data = JSON.parse(responseText)
      return NextResponse.json(data)
    } catch (parseError) {
      console.error(
        `[v0] Failed to parse JSON response from ${targetUrl}. Response was: ${responseText.substring(0, 500)}`,
      )
      return NextResponse.json(
        {
          error: "Invalid JSON response from Moonraker",
          rawResponse: responseText,
          details: `The printer returned: "${responseText.substring(0, 200)}..."`,
          isTextResponse: true,
        },
        { status: 502 }, // Bad Gateway - upstream returned invalid response
      )
    }
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`[v0] Proxy caught network error for ${targetUrl}:`, errorMessage, error)

    return NextResponse.json(
      {
        error: "Network error connecting to printer",
        message: errorMessage,
        targetUrl: targetUrl,
      },
      { status: 500 },
    )
  }
}
