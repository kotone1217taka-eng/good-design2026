import type { DayRecord } from './types'
import { getTodayIso } from './date'

export const MOCK_RECORDS: DayRecord[] = [
  {
    id: 'rec-2026-06-14',
    date: '2026-06-14',
    createdAt: '2026-06-14T10:00:00.000Z',
    photo: '/records/convenience-store-night.png',
    hasPhoto: true,
    hasVoice: true,
    hasAudio: false,
    insight: {
      standout: ['店先の明るい光', '夜の暗さに浮いた看板'],
      interesting: ['明るい場所だけが小さな舞台のように見える'],
      atmosphere: ['夜の帰り道の静けさ'],
      comment: '暗い道の中で、コンビニの光だけが少し大げさに残っている。',
      keywords: {
        photo: ['コンビニ', '夜', '看板', '光'],
        voice: ['帰り道'],
      },
    },
  },
  {
    id: 'rec-2026-06-13',
    date: '2026-06-13',
    createdAt: '2026-06-13T10:00:00.000Z',
    photo: '/records/morning-track.png',
    hasPhoto: true,
    hasVoice: false,
    hasAudio: false,
    insight: {
      standout: ['誰もいないトラック', '朝の薄い光'],
      interesting: ['広い場所なのに、静けさのほうが先に写っている'],
      atmosphere: ['まだ動き出す前の空気'],
      comment: 'トラックの線だけが、朝の静かな広さを区切っている。',
      keywords: {
        photo: ['トラック', '朝', '線', '静けさ'],
        voice: [],
      },
    },
  },
]

export const TODAY = getTodayIso()
