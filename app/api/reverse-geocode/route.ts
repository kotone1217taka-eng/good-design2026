import { NextResponse } from 'next/server'
import {
  buildLocationName,
  type NominatimReverseResult,
} from '@/lib/location-name'

export const dynamic = 'force-dynamic'

const nominatimEndpoint = 'https://nominatim.openstreetmap.org/reverse'

function parseCoordinate(value: string | null): number | undefined {
  if (!value) return undefined
  const coordinate = Number(value)
  if (!Number.isFinite(coordinate)) return undefined
  return coordinate
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const latitude = parseCoordinate(requestUrl.searchParams.get('lat'))
  const longitude = parseCoordinate(requestUrl.searchParams.get('lon'))

  if (latitude === undefined || longitude === undefined) {
    return NextResponse.json({ locationName: undefined }, { status: 400 })
  }

  const url = new URL(nominatimEndpoint)
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('lat', String(latitude))
  url.searchParams.set('lon', String(longitude))
  url.searchParams.set('zoom', '18')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('namedetails', '1')
  url.searchParams.set('layer', 'address,poi')
  url.searchParams.set('accept-language', 'ja,en')

  if (process.env.NOMINATIM_EMAIL) {
    url.searchParams.set('email', process.env.NOMINATIM_EMAIL)
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 7000)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'MemoryPhotoDiary/1.0',
      },
      next: { revalidate: 60 * 60 * 24 * 30 },
    })

    if (!response.ok) {
      return NextResponse.json({ locationName: undefined }, { status: 502 })
    }

    const result = (await response.json()) as NominatimReverseResult
    return NextResponse.json({ locationName: buildLocationName(result) })
  } catch {
    return NextResponse.json({ locationName: undefined }, { status: 502 })
  } finally {
    clearTimeout(timeout)
  }
}
