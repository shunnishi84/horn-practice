# wind-trainer-worker

Cloudflare Workers API for WindTrainer. Verifies Firebase ID tokens and stores
sessions/settings in D1, scoped per user.

## セットアップ

```bash
npm install
```

1. Firebaseプロジェクトを作成し、Authentication を有効化する
2. D1データベースを作成する
   ```bash
   npx wrangler d1 create wind-trainer-db
   ```
   出力された `database_id` を `wrangler.toml` の `REPLACE_WITH_D1_DATABASE_ID` に設定する
3. `wrangler.toml` の `FIREBASE_PROJECT_ID` をFirebaseプロジェクトIDに、`ALLOWED_ORIGIN` をフロントエンドの配信オリジンに設定する
4. マイグレーションを適用する
   ```bash
   npm run db:migrate:local   # ローカル開発用
   npm run db:migrate:remote  # 本番D1に適用
   ```
5. ローカル起動 / デプロイ
   ```bash
   npm run dev
   npm run deploy
   ```

## API

すべて `Authorization: Bearer <Firebase IDトークン>` が必須。

- `GET /api/sessions` — 自分のセッション一覧
- `POST /api/sessions` — セッションを1件保存
- `DELETE /api/sessions` — 自分のセッションを全削除
- `GET /api/settings` — 自分の設定を取得
- `PUT /api/settings` — 自分の設定を保存（upsert）
