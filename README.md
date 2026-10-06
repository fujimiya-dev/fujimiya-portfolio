# Fujimiya Portfolio

藤田都の個人ポートフォリオサイト。Next.js 15 (App Router) + TypeScript製で、作品(Works)・経歴(Experience)・研究(Research)をDBで管理し、コードを書き換えずに追加・編集できる自作の管理画面を備えています。日本語版・英語版の両方を1つのコードベースで提供しています。

**本番URL:** https://portfolio.fujimiya.dev （英語版: https://portfolio.fujimiya.dev/en）

## 技術スタック

| 分野 | 使用技術 |
|---|---|
| フレームワーク | Next.js 15 (App Router) / React 19 / TypeScript |
| スタイル | Tailwind CSS / Framer Motion |
| 3D演出 | React Three Fiber / three.js（トップページの夜空・草原） |
| DB / ORM | PostgreSQL (Neon) / Prisma |
| 認証 | Auth.js (NextAuth v5) / GitHub OAuthのみ |
| 画像ストレージ | Vercel Blob |
| お問い合わせ | Resend（メール送信） / Google reCAPTCHA v2 |
| ホスティング | Vercel |

## 主な機能

**公開ページ**
- `/`（Top・About me）、`/works`、`/experience`、`/research`、`/contact`、`/privacy`
- Works・Experience・Researchはすべてキーワード検索＋カテゴリ/タグ絞り込みに対応（クライアント側フィルタ）
- トップページの夜空・草原はReact Three Fiberで一から描画した3Dシーン（画像・動画は不使用）。初回アクセス時はハンドライティング風のイントロアニメーションを再生

**管理画面（`/admin`、GitHub OAuthでログイン保護）**
- Works / Experience / Researchの作成・編集・削除
- ドラッグ&ドロップによる並び替え
- 画像はURL直貼り or Vercel Blobへの直接アップロードの両方に対応
- 各項目に日本語/Englishタブがあり、同じフォームから英語版の文章も入力可能

**多言語対応（日本語 / 英語）**
- 日本語は`/`配下、英語は`/en`配下のパスベースルーティング
- Works・Experience・Researchの自由記述項目（タイトル・概要・本文など）は翻訳専用テーブルで管理し、英語が未入力の項目は自動的に日本語表示にフォールバック
- カテゴリ・タグ・区分などの固定語彙は、表示時のみ変換する単一の翻訳マップで対応（絞り込みロジックは日本語値のまま）

## プロジェクト構成（抜粋）

```
src/
  app/                  # ルーティング(App Router)。/en は middleware.ts が内部的に書き換えるため専用フォルダはない
    admin/              # 管理画面（(dashboard)配下がログイン必須、login/のみ公開）
    works/ experience/ research/ contact/ privacy/
  actions/              # Server Actions（Works/Experience/Research/Contact/画像アップロード）
  components/           # UIコンポーネント（*Form.tsx, *Explorer.tsx, *AdminList.tsx など）
  i18n/                 # 辞書(ja.ts/en.ts)・型定義・ロケール判定・パスヘルパー
  lib/                  # Prismaクライアント、認証設定、翻訳フォールバック、タグ翻訳マップ等
  middleware.ts         # /en のURL書き換え・ロケール判定・/admin の認証ガード
prisma/
  schema.prisma         # Work/Experience/ResearchItem と、対応する*Translationテーブル
  seed.ts
scripts/                # ビルド時にライセンス制約のあるフォントをSVGパスへ変換する一回限りのスクリプト群
```

## セットアップ

### 必要な環境変数

| 変数名 | 用途 |
|---|---|
| `DATABASE_URL` | Neonのpooled接続文字列 |
| `DATABASE_URL_UNPOOLED` | Neonの直接接続文字列（Prismaの`directUrl`） |
| `AUTH_SECRET` | Auth.jsのセッション署名鍵（`openssl rand -base64 32`で生成） |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | 管理画面ログイン用のGitHub OAuth App |
| `ALLOWED_GITHUB_USERNAME` | ログインを許可する単一のGitHubユーザー名 |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob（画像アップロード） |
| `RESEND_API_KEY` / `CONTACT_TO_EMAIL` | お問い合わせフォームの送信先 |
| `RECAPTCHA_SECRET_KEY` / `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | reCAPTCHA v2（サーバー側検証キー／クライアント側サイトキー） |

このリポジトリに`.env.example`は含まれていないため、上記を参考に`.env`を自分で作成してください。

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Neon (PostgreSQL) を用意

[Neon](https://neon.tech)でプロジェクトを作成し、発行されるpooled接続文字列を`DATABASE_URL`に、直接接続文字列（`-pooler`なしのホスト）を`DATABASE_URL_UNPOOLED`に設定します。

### 3. GitHub OAuth（管理画面ログイン）

[GitHub Developer Settings](https://github.com/settings/developers)でOAuth Appを作成します。Authorization callback URLは`https://<ドメイン>/api/auth/callback/github`。発行された値を`GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`に、ログインを許可するGitHubアカウントのユーザー名を`ALLOWED_GITHUB_USERNAME`に設定してください（このユーザー名と一致しないアカウントはログインできません）。

### 4. Vercel Blob（画像アップロード）

Vercelダッシュボード → Storage → Create → Blob。発行された`BLOB_READ_WRITE_TOKEN`を設定します。

### 5. お問い合わせフォーム（Resend + reCAPTCHA）

[Resend](https://resend.com)でAPIキーを発行して`RESEND_API_KEY`に、通知を受け取りたいメールアドレスを`CONTACT_TO_EMAIL`に設定します。[Google reCAPTCHA](https://www.google.com/recaptcha/admin)でv2（チェックボックス）のサイトキー・シークレットキーを発行し、それぞれ`NEXT_PUBLIC_RECAPTCHA_SITE_KEY` / `RECAPTCHA_SECRET_KEY`に設定します。

### 6. DBスキーマを反映

```bash
npm run db:push
```

> **注意:** このプロジェクトは開発・本番で同一のNeonデータベースを使う構成を前提にしています（別環境のDBは用意していません）。`db:push`は接続先に即座にスキーマ変更を反映するため、`DATABASE_URL`がどの環境を指しているか必ず確認してから実行してください。
>
> `npm run db:seed`（`prisma/seed.ts`）は**実行しないでください**。Workテーブルを`deleteMany()`で全削除してから初期制作時点のスナップショットを入れ直す内容で、現在の本番データ（翻訳・画像・カードサマリー等を含む）とはすでに大きく乖離しています。空のDBから作り直す場合を除き、このスクリプトは使用しないでください。

### 7. ローカルで起動

```bash
npm run dev
```

`http://localhost:3000/admin/login`から「GitHubでログイン」で、`ALLOWED_GITHUB_USERNAME`に設定したアカウントのみログインできます。

## 多言語対応の仕組み

- `middleware.ts`が`/en`および`/en/*`へのリクエストを対応する無プレフィックスのルートへ内部的にrewriteし、`x-locale`リクエストヘッダーを付与します。日本語版は`/`配下でこれまで通り、英語版は見た目上`/en`配下のURLを持ちますが、実体のページファイルは1つだけです。
- `src/i18n/server.ts`の`getLocale()`がこのヘッダーからロケールを判定し、`src/i18n/ja.ts` / `en.ts`の辞書を返します。キーの追加時は両ファイルを埋めないと型エラーになる仕組みです。
- Work / Experience / ResearchItemの自由記述項目は、対応する`*Translation`テーブル（`locale`列を持つ別テーブル）に英語訳を保持し、`src/lib/resolveTranslation.ts`が「英語が空なら日本語を表示」のフォールバックを行います。カテゴリ・タグ・区分などの固定語彙は元テーブルの日本語値のまま保持し、`src/lib/tagLabels.ts`の変換マップで表示時のみ英語化します（絞り込み・検索は常に日本語値で判定）。
- 言語切り替えボタンは通常のクライアント遷移ではなくフルページ遷移を行います。`/en`はNext.jsのルーター上は実体のセグメントではないため、クライアント側遷移だとレイアウト（ナビ・フッター・`<html lang>`）が再利用されて切り替わらないための対応です。

## デプロイ

VercelとこのGitHubリポジトリが連携済みで、`master`へのpushで自動デプロイされます。上記の環境変数をVercelのProject Settings → Environment Variablesに設定してください。スキーマを変更した場合は、デプロイ前後どちらかのタイミングで`npm run db:push`を実行して本番DBに反映する必要があります（マイグレーションファイルではなく`prisma db push`方式のため、自動では反映されません）。

## 注意点

- **DBは単一環境です。** `DATABASE_URL`は常に本番のNeonを指しており、ローカル開発環境から直接本番データを読み書きします。破壊的な操作（スキーマの削除を伴う変更など）を行う前は、Neon側でブランチ（バックアップ）を作成することを推奨します。
- **フォントはライセンス上埋め込めません。** トップページの見出しや各セクション見出しに使っている購入フォントは、再配布不可のライセンスのため、ビルド時に`scripts/`配下のスクリプトでグリフの輪郭だけをSVGパスとして抽出し、そのパスデータのみをコードに含めています（`.otf`本体はリポジトリに含まれません）。
- **管理画面は単一ユーザー運用を前提にしています。** `ALLOWED_GITHUB_USERNAME`に一致する1アカウントのみがログイン可能で、複数ユーザーでの利用は想定していません。
