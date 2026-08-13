export type PhotoInput = {
  src: string
}

export type PhotoLocation = {
  latitude: number
  longitude: number
  accuracy?: number
}

export type DayRecord = {
  id: string
  date: string
  createdAt: string
  updatedAt?: string
  photo: string
  hasPhoto?: boolean
  location?: PhotoLocation
  locationName?: string
}
