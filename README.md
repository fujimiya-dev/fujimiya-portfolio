# 藤田都 — Portfolio (Next.js + TypeScript)

Next.js 15 (App Router) / TypeScript / Tailwind / Framer Motion / Prisma / Vercel Postgres / Vercel Blob / Auth.js の構成です。

## できること

- `/` `/works` `/experience` `/research` … 公開ページ。内容はすべてDBから取得
- `/works` `/experience` `/research` … 上部固定の検索バー＋タグ絞り込み（クライアント側フィルタ）
- `/admin` … ログイン保護された管理画面。**現時点ではWorksのみ**作成・編集・削除が実装済み
  - Experience / Research も同じパターン（`src/actions/works.ts` と `src/app/admin/works/*` をコピーして名前を変えるだけ）で追加できます。次に着手するならここがおすすめです。
- スクロールで要素がグラデーションの光とともに浮かび上がるモーション（`RevealSection.tsx`）

## セットアップ

```bash
npm install
cp .env.example .env
```

### 1. Vercel Postgres を作る

Vercelダッシュボード → Storage → Create Database → Postgres。作成すると `POSTGRES_PRISMA_URL` と `POSTGRES_URL_NON_POOLING` が発行されるので `.env` にコピーします（ローカル開発時は `vercel env pull` でも取得可）。

### 2. Vercel Blob を作る（画像アップロード用）

Storage → Create → Blob。発行された `BLOB_READ_WRITE_TOKEN` を `.env` に追加します。
※ 現バージョンの管理フォームは画像URLを直接貼り付ける形です。Blobへのアップロードボタンを追加する場合は `@vercel/blob` の `upload()` をクライアントコンポーネントから呼び出してください。

### 3. Auth.js の秘密鍵と管理者アカウント

```bash
openssl rand -base64 32   # → AUTH_SECRET に貼り付け
```

`.env` の `ADMIN_EMAIL` / `ADMIN_PASSWORD` に自分のログイン情報を設定してください。

### 4. DBスキーマを反映 & 初期データを投入

```bash
npm run db:push
npm run db:seed
```

`seed.ts` は既存のポートフォリオPDFの内容（Works 3件、Experience 5件、Research 2件、その他の活動、趣味）をそのまま投入します。管理者アカウントも同時に作成されます。

### 5. ローカルで起動

```bash
npm run dev
```

`http://localhost:3000/admin/login` から先ほどの `ADMIN_EMAIL` / `ADMIN_PASSWORD` でログインできます。

## Vercelへのデプロイ

1. このフォルダをGitHubリポジトリにpush
2. Vercelでリポジトリをインポート
3. 上記の環境変数（`POSTGRES_*` `BLOB_READ_WRITE_TOKEN` `AUTH_SECRET` `ADMIN_EMAIL` `ADMIN_PASSWORD`）をVercelのProject Settings → Environment Variablesに設定
4. デプロイ後、初回のみ `vercel env pull && npm run db:push && npm run db:seed` をローカルから実行（またはVercelのビルドフックにdb pushを組み込む）

## 次にやるとよいこと

- Experience / Research 用の admin CRUD（Worksをコピーして展開）
- 画像アップロードをURL貼り付けから `@vercel/blob` の直接アップロードに変更
- タグを独立したテーブルにして、タグ一覧ページやタグごとのカウント表示を追加
- 前回作成した静的デモ（グラデーション夜空・星のまたたき・オーバーレイナビ）の演出をTailwind/Framer Motionで再現し切る（現状は簡略版）
