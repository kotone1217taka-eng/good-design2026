import type { DayRecord } from './types'
import { getTodayIso } from './date'

/**
 * バックエンドなしのプロトタイプ用モックデータ。
 * 「今日」は 2026-06-15 を想定。今日はまだ記録していない状態。
 */
export const MOCK_RECORDS: DayRecord[] = [
  {
    id: 'rec-2026-06-14',
    date: '2026-06-14',
    photo: '/records/convenience-store-night.png',
    note: '今日も朝練で眠かった。午後練もきつかった。帰りに同期とコンビニでアイスを食べた。特に何もない日。',
    hasVoice: true,
    insight: {
      discovery:
        '「特に何もない」と言いながら、あなたは帰り道の寄り道を覚えていました。',
      margin: '練習後の5分のコンビニ',
      key: '明日は、練習のあとに少し気がゆるむ瞬間を探してみてください。',
      sentence: '何もない日にも、帰り道だけは少し違っていた。',
    },
  },
  {
    id: 'rec-2026-06-13',
    date: '2026-06-13',
    photo: '/records/morning-track.png',
    note: '6時起き。グラウンドに一番乗りだった。まだ誰もいなくて静かだった。寒い。',
    hasVoice: true,
    insight: {
      discovery:
        'あなたが覚えていたのは記録ではなく、まだ誰もいないグラウンドの静けさでした。',
      margin: 'まだ誰もいない、朝のいちばん静かな時間',
      key: '明日は、目が覚めて最初に見た景色を覚えておいてください。',
      sentence: '眠い朝の向こうに、まだ誰も使っていない一日があった。',
    },
  },
  {
    id: 'rec-2026-06-12',
    date: '2026-06-12',
    photo: '/records/evening-sky.png',
    note: '練習の合間に体育館の窓から空を見た。雲がきれいだった。メニューはきつかった。',
    hasVoice: false,
    insight: {
      discovery:
        'あなたは練習の合間に、空のことをちゃんと覚えていました。',
      margin: '見上げたときの、ほんの少しの間',
      key: '明日は、移動のあいだに空を一度だけ見上げてみてください。',
      sentence: '見上げた空は、昨日とは少しだけ違う色をしていた。',
    },
  },
  {
    id: 'rec-2026-06-11',
    date: '2026-06-11',
    photo: '/records/vending-machine.png',
    note: '夜練終わり。自販機でスポドリ買った。先輩と少し話した。疲れた。',
    hasVoice: true,
    insight: {
      discovery:
        'あなたが覚えていたのは、技術や記録ではなく、先輩と過ごした時間でした。',
      margin: '誰かと並んで立っていた、言葉の少ない時間',
      key: '明日は、誰かの何気ない一言を一つだけ覚えてみてください。',
      sentence: '同じ練習のなかに、誰かと過ごした時間がまぎれていた。',
    },
  },
  {
    id: 'rec-2026-06-10',
    date: '2026-06-10',
    photo: '/records/convenience-store-night.png',
    note: 'オフ。一日中だらだらした。夕方コンビニまで散歩した。',
    hasVoice: false,
    insight: {
      discovery:
        'あなたは、何もしない一日のなかでも、夕方の散歩のことを残そうとしました。',
      margin: '行く当てのない、夕方の散歩',
      key: '明日は、いつもの道のどこかにある小さな違いを探してみてください。',
      sentence: 'いつもと同じ一日に、覚えておきたい何かが一つだけあった。',
    },
  },
  {
    id: 'rec-2026-06-09',
    date: '2026-06-09',
    photo: '/records/morning-track.png',
    note: 'タイム計測。あまり伸びなかった。悔しい。でも朝の空気はよかった。',
    hasVoice: true,
    insight: {
      discovery:
        '記録のことを書きながら、あなたは朝の空気のこともちゃんと覚えていました。',
      margin: '走り出す前の、息を整えていた数十秒',
      key: '明日は、いちばん力を抜けた瞬間がいつだったか探してみてください。',
      sentence: 'きつい一日の端に、力を抜けた数秒がちゃんとあった。',
    },
  },
  {
    id: 'rec-2026-06-08',
    date: '2026-06-08',
    photo: '/records/evening-sky.png',
    note: '筋トレの日。きつい。帰りに夕焼けがすごかった。',
    hasVoice: false,
    insight: {
      discovery:
        'きついと書きながら、あなたは帰り道の夕焼けを覚えていました。',
      margin: '見上げたときの、ほんの少しの間',
      key: '明日は、移動のあいだに空を一度だけ見上げてみてください。',
      sentence: '見上げた空は、昨日とは少しだけ違う色をしていた。',
    },
  },
]

/** 「今日」の日付（プロトタイプ固定） */
export const TODAY = getTodayIso()
