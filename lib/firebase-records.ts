import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from 'firebase/firestore'
import { getDownloadURL, ref, uploadString } from 'firebase/storage'
import { firebaseDb, firebaseStorage } from './firebase'
import type { DayRecord } from './types'

const stalePhotoFallback = '/records/evening-sky.png'

function isDataImage(src: string): boolean {
  return src.startsWith('data:image/')
}

function isDataAudio(src: string | undefined): src is string {
  return Boolean(src?.startsWith('data:audio/'))
}

function normalizeRecord(record: DayRecord): DayRecord {
  if (typeof record.photo === 'string' && record.photo.startsWith('blob:')) {
    return {
      ...record,
      photo: stalePhotoFallback,
      hasPhoto: false,
    }
  }

  return record
}

function cleanForFirestore<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function assertFirebaseReady() {
  if (!firebaseDb || !firebaseStorage) {
    throw new Error('Firebaseの環境変数が未設定です。')
  }
}

function recordsCollection(uid: string) {
  if (!firebaseDb) throw new Error('Firebaseの環境変数が未設定です。')
  return collection(firebaseDb, 'users', uid, 'records')
}

function recordDocument(uid: string, recordId: string) {
  if (!firebaseDb) throw new Error('Firebaseの環境変数が未設定です。')
  return doc(firebaseDb, 'users', uid, 'records', recordId)
}

async function uploadRecordPhoto(uid: string, record: DayRecord): Promise<string> {
  if (!firebaseStorage || !isDataImage(record.photo)) return record.photo

  const photoRef = ref(firebaseStorage, `users/${uid}/records/${record.id}/photo.jpg`)
  await uploadString(photoRef, record.photo, 'data_url', {
    contentType: 'image/jpeg',
  })
  return getDownloadURL(photoRef)
}

async function uploadRecordAudio(
  uid: string,
  record: DayRecord,
): Promise<string | undefined> {
  if (!firebaseStorage || !isDataAudio(record.audio)) return record.audio

  const audioRef = ref(firebaseStorage, `users/${uid}/records/${record.id}/audio.webm`)
  await uploadString(audioRef, record.audio, 'data_url', {
    contentType: 'audio/webm',
  })
  return getDownloadURL(audioRef)
}

export async function saveUserRecord(
  uid: string,
  record: DayRecord,
): Promise<DayRecord> {
  assertFirebaseReady()

  const normalized = normalizeRecord(record)
  const photo = normalized.hasPhoto === false ? normalized.photo : await uploadRecordPhoto(uid, normalized)
  const audio = await uploadRecordAudio(uid, normalized)
  const savedRecord: DayRecord = {
    ...normalized,
    photo,
    audio,
  }

  await setDoc(
    recordDocument(uid, savedRecord.id),
    {
      ...cleanForFirestore(savedRecord),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )

  return savedRecord
}

export async function saveUserRecordReactions(
  uid: string,
  recordId: string,
  aiReactions: DayRecord['aiReactions'],
  customAiReactions: DayRecord['customAiReactions'],
): Promise<void> {
  assertFirebaseReady()

  await setDoc(
    recordDocument(uid, recordId),
    {
      aiReactions: cleanForFirestore(aiReactions ?? []),
      customAiReactions: cleanForFirestore(customAiReactions ?? []),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export function subscribeToUserRecords(
  uid: string,
  onRecords: (records: DayRecord[]) => void,
  onError: (message: string) => void,
): Unsubscribe {
  const recordsQuery = query(recordsCollection(uid), orderBy('date', 'desc'))

  return onSnapshot(
    recordsQuery,
    (snapshot) => {
      const records = snapshot.docs
        .map((recordSnapshot) => {
          const data = recordSnapshot.data() as Partial<DayRecord>
          if (!data.id || !data.date || !data.insight) return null
          return normalizeRecord(data as DayRecord)
        })
        .filter((record): record is DayRecord => Boolean(record))

      onRecords(records)
    },
    (error) => {
      onError(error.message)
    },
  )
}
