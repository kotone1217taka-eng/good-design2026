import {
  buildLocationName,
  type NominatimReverseResult,
} from '@/lib/location-name'
import type { PhotoLocation } from '@/lib/types'

export async function reverseGeocodeLocationName(
  location: PhotoLocation,
): Promise<string | undefined> {
  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: String(location.latitude),
    lon: String(location.longitude),
    zoom: '18',
    addressdetails: '1',
    namedetails: '1',
    layer: 'address,poi',
    'accept-language': 'ja,en',
  })

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${params}`,
      { cache: 'no-store' },
    )

    if (!response.ok) return undefined

    const result = (await response.json()) as NominatimReverseResult
    return buildLocationName(result)
  } catch {
    return undefined
  }
}
