export type PhotoInput = {
  src: string
}

export type DayRecord = {
  id: string
  date: string
  createdAt: string
  updatedAt?: string
  photo: string
  hasPhoto?: boolean
}
