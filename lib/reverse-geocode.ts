import { withBasePath } from '@/lib/base-path'
import type { PhotoLocation } from '@/lib/types'

type ReverseGeocodeResponse = {
  locationName?: string
}

export async function reverseGeocodeLocationName(
  location: PhotoLocation,
): Promise<string | undefined> {
  const params = new URLSearchParams({
    lat: String(location.latitude),
    lon: String(location.longitude),
  })

  try {
    const response = await fetch(withBasePath(`/api/reverse-geocode/?${params}`), {
      cache: 'no-store',
    })

    if (!response.ok) return undefined

    const data = (await response.json()) as ReverseGeocodeResponse
    return data.locationName
  } catch {
    return undefined
  }
}
