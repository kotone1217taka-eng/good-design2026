type NominatimAddress = Record<string, string | null | undefined>
type NominatimNames = Record<string, string | null | undefined>

export type NominatimReverseResult = {
  name?: string | null
  category?: string | null
  type?: string | null
  addresstype?: string | null
  display_name?: string | null
  address?: NominatimAddress
  namedetails?: NominatimNames
}

const cityKeys = ['city', 'town', 'village', 'municipality']
const localityKeys = [
  'neighbourhood',
  'suburb',
  'quarter',
  'city_district',
  'borough',
  'district',
]
const facilityKeys = [
  'attraction',
  'tourism',
  'amenity',
  'leisure',
  'shop',
  'building',
  'office',
  'historic',
  'railway',
  'aeroway',
  'man_made',
  'natural',
]
const nonFacilityAddressTypes = new Set([
  'country',
  'state',
  'county',
  'city',
  'town',
  'village',
  'suburb',
  'neighbourhood',
  'road',
  'house',
  'postcode',
])

function cleanText(value: string | null | undefined): string | undefined {
  const normalized = value?.replace(/\s+/g, ' ').trim()
  return normalized || undefined
}

function pickFirst(
  source: NominatimAddress | NominatimNames | undefined,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const value = cleanText(source?.[key])
    if (value) return value
  }

  return undefined
}

function pushUnique(parts: string[], value: string | undefined) {
  if (!value) return
  if (parts.some((part) => part === value || part.includes(value) || value.includes(part))) {
    return
  }

  parts.push(value)
}

function pickFacilityName(result: NominatimReverseResult): string | undefined {
  const address = result.address
  const addressFacility = pickFirst(address, facilityKeys)
  if (addressFacility) return addressFacility

  const typedName = cleanText(result.name)
  const typedNameLooksLikeAddress =
    result.addresstype && nonFacilityAddressTypes.has(result.addresstype)
  if (typedName && !typedNameLooksLikeAddress) return typedName

  const namedDetail = pickFirst(result.namedetails, [
    'name:ja',
    'brand:ja',
    'official_name:ja',
    'name',
    'brand',
    'official_name',
  ])
  if (namedDetail && !typedNameLooksLikeAddress) return namedDetail

  return undefined
}

export function buildLocationName(
  result: NominatimReverseResult | undefined,
): string | undefined {
  if (!result?.address && !result?.name) return undefined

  const address = result.address ?? {}
  const country = pickFirst(address, ['country'])
  const state = pickFirst(address, ['state', 'province', 'region'])
  const city = pickFirst(address, cityKeys)
  const locality = pickFirst(address, localityKeys)
  const road = pickFirst(address, ['road'])
  const facility = pickFacilityName(result)
  const parts: string[] = []

  pushUnique(parts, country)
  pushUnique(parts, state)
  pushUnique(parts, city)

  if (facility) {
    pushUnique(parts, facility)
  } else {
    pushUnique(parts, locality)
    if (parts.length < 4) pushUnique(parts, road)
  }

  return parts.slice(0, 4).join('、') || cleanText(result.display_name)
}
