# 30秒の観察

アプリを開いて30秒以内に、その場で面白いと思ったものを撮るためのNext.jsアプリです。写真と任意の音声を保存し、AIが写真から気づいたこと、面白いと感じた点、その場の雰囲気を個人的な記録として返します。

## Vercelデプロイ

OpenAI APIはブラウザに公開せず、`/api/observe` のサーバー処理から呼び出します。ユーザーごとの写真・音声・AI結果はFirebase Authentication、Firestore、Storageに保存します。

VercelのProject Settingsで以下の環境変数を設定してください。

```env
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

`OPENAI_API_KEY` には `NEXT_PUBLIC_` を付けません。Firebaseの値はFirebase ConsoleでWebアプリを追加すると表示されます。AuthenticationではGoogleログインを有効にし、Firestore DatabaseとStorageを作成してください。

## Firebase Rules

ユーザーごとに自分の記録だけを読み書きできるように、`firestore.rules` と `storage.rules` の内容をFirebase Consoleに設定してください。

## 開発

```bash
pnpm install
pnpm dev
```

ローカルでAI分析とFirebase保存まで試す場合は、`.env.local` に `.env.example` と同じキーを設定してください。
