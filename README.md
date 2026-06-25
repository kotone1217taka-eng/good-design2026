# きょうの余白

写真と声から、明日の通学時間の見方を少し変える観察文を返すNext.jsアプリです。

## Vercelデプロイ

このアプリはOpenAI APIをサーバー側から呼び出します。GitHub Pagesのような静的ホスティングではAPIキーを安全に隠せないため、Vercelにデプロイしてください。

VercelのProject Settingsで以下の環境変数を設定します。

```env
OPENAI_API_KEY=sk-...
```

`OPENAI_API_KEY` は `NEXT_PUBLIC_` を付けません。ブラウザへ公開せず、`/api/observe` のサーバー処理だけで使います。

## 開発

```bash
pnpm install
pnpm dev
```

ローカルでAI分析まで試す場合は、`.env.local` に `OPENAI_API_KEY` を設定してください。
