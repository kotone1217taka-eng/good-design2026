# Photo Diary Calendar

毎日1枚の写真を撮り、カレンダーを絵日記のように埋めていくNext.jsアプリです。

文章、音声、AI分析は使いません。その日に残したいものを写真1枚だけで記録し、あとから月のカレンダーや「今週の絵日記」として見返せます。

## Vercelデプロイ

ユーザーごとの写真記録はFirebase Authentication、Firestore、Storageに保存します。

VercelのProject Settingsで以下の環境変数を設定してください。

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

Firebase ConsoleでWebアプリを追加すると値が表示されます。AuthenticationではGoogleログインを有効にし、Firestore DatabaseとStorageを作成してください。

## Firebase Rules

ユーザーごとに自分の写真記録だけを読み書きできるように、`firestore.rules` と `storage.rules` の内容をFirebase Consoleに設定してください。

## 開発

```bash
pnpm install
pnpm dev
```

ローカルでFirebase保存まで試す場合は、`.env.local` に `.env.example` と同じキーを設定してください。
