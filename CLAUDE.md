# CLAUDE.md — ニンニン求人サイト (ninnin-recruit-demo)

## §0 Bootstrap（起動チェックリスト）
作業開始前に必ず以下を実施:
1. `git log --oneline -n 10` で直近の変更を確認
2. `css/custom.css` の `:root` CSS変数を確認（デザイントークンの正本）
3. 4ページ構成を把握: `index.html`（TOP）/ `jobs.html`（募集要項）/ `interview.html`（インタビュー）/ `entry.html`（応募フォーム）
4. `js/main.js` の初期化関数一覧を確認（機能の全体像）

## §1 コンテキスト管理
- **Single Focus:** 1機能/1タスクに集中。同時に複数の大規模変更を行わない。
- **/compact 運用:** 1機能完了ごとに `/compact` を実行してコンテキストを整理。
- **ファイル読込制限:** HTML は1セッション2ファイルまで同時に読み込む（各ファイルが大きいため）。
- **コミット単位:** 1機能 = 1コミット。4ページ一括変更時もまとめて1コミット。

## §2 鉄のルール
1. **HTML Valid:** `<!DOCTYPE html>`, `<html lang="ja">`, 適切な `<head>` メタ情報を必ず含める。閉じタグ漏れ禁止。
2. **Tailwind + Custom CSS 分離:**
   - レイアウト・スペーシング → Tailwind ユーティリティクラス（CDN版）
   - ブランド固有スタイル・コンポーネント → `css/custom.css`（CSS変数 + BEMライクなクラス名）
   - Tailwind の `tailwind.config` を変更したら**全4ページ**の `<script>` を同期すること
3. **JS 1ファイル集約:** JavaScript は `js/main.js` に集約。外部ライブラリ追加禁止（Tailwind CDN を除く）。
4. **4ページ統一:** ヘッダー・フッター・ナビゲーション・フローティングCTA は4ページで完全同一にすること。
5. **画像参照:** 画像は `img/` ディレクトリから参照。存在しない画像パスを書かない。プレースホルダーは `https://placehold.co/` を使用。
6. **言語:** 思考・説明・報告は全て日本語。コミットメッセージのみ英語（feat/fix/chore 等のプレフィクス付き）。
7. **No Guessing:** 推測禁止。既存コードを読んでパターンを確認してから変更すること。

## §3 プロジェクト構造
```
ninnin-recruit-demo/
├── index.html          # TOP（会社紹介・特徴・店舗一覧・実績数字・インタビュー抜粋・FAQ）
├── jobs.html           # 募集要項（正社員・アルバイトの職種別詳細条件テーブル）
├── interview.html      # スタッフインタビュー（Q&A形式・1日の流れ・写真ギャラリー）
├── entry.html          # 応募フォーム（バリデーション付き・応募の流れ説明）
├── css/
│   └── custom.css      # ブランドスタイル（CSS変数・全コンポーネント定義・アニメーション・a11y）
├── js/
│   └── main.js         # 全JS（ヘッダー・メニュー・スクロール・フォーム・カウントアップ等）
├── img/                # 画像アセット（favicon, OGP, 店舗写真, キャラクター等）
└── .claude/
    └── commands/       # Claude Code スキル定義
```

## §4 テックスタック & デザイントークン

**テックスタック:**
- HTML5 + Tailwind CSS (CDN) + Custom CSS + Vanilla JS
- フォント: Google Fonts (Zen Kaku Gothic New, Noto Sans JP, Sora)
- デプロイ: GitHub Pages (master push)

**カラーパレット（`:root` CSS変数）:**

| 変数名 | 値 | 用途 |
|--------|-----|------|
| `--color-primary` | `#FFCB05` | ブランドイエロー（CTA・アクセント） |
| `--color-primary-dark` | `#B8930A` | ホバー・テキスト用ダークイエロー |
| `--color-primary-light` | `#FFF7CC` | 背景ハイライト |
| `--color-accent` | `#E8380D` | 警告・必須マーク用レッド |
| `--color-secondary` | `#1B2A4A` | ネイビー（ヘッダー・フッター・ヒーロー背景） |
| `--color-text` | `#1D1D1B` | 見出しテキスト |
| `--color-body` | `#333` | 本文テキスト |
| `--color-bg` | `#fff` | ページ背景 |
| `--color-bg-alt` | `#F5F5F0` | セクション交互背景 |
| `--color-border` | `#C8C8C0` | ボーダー・区切り線 |
| `--color-dark` | `#1A1A1A` | フッター背景 |

**フォント:**

| 変数名 | フォント | 用途 |
|--------|---------|------|
| `--font-heading` | Zen Kaku Gothic New | 見出し（font-weight: 900） |
| `--font-body` | Noto Sans JP | 本文 |
| `--font-num` | Sora | 数字・英字ラベル |

**ブレイクポイント:**

| 名称 | 幅 | 用途 |
|------|-----|------|
| Mobile | `max-width: 767px` | スマートフォン（1カラム、フローティングCTA表示） |
| Tablet | `768px - 1023px` | タブレット（2カラムグリッド） |
| Desktop | `min-width: 1024px` | デスクトップ（フルレイアウト） |

## §5 コーディング規約

**HTML:**
- セマンティックタグ使用: `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`, `<article>`
- 全画像に `alt` 属性必須（装飾画像は `alt=""` + `aria-hidden="true"`）
- ID命名: `kebab-case`（例: `mobile-menu`, `entry-form`）
- Tailwind クラスの順序: レイアウト → スペーシング → タイポグラフィ → カラー → 装飾

**CSS（custom.css）:**
- コンポーネント名: `kebab-case`（例: `.feature-card`, `.hero-cta-primary`）
- セクション区切り: `/* ========== SECTION NAME ========== */` コメント
- レスポンシブ: モバイルファーストではなく、デスクトップ基準 → `@media (max-width)` でモバイル対応
- アニメーション: `--transition: 0.2s ease` / `--transition-mid: 0.3s ease` のCSS変数を使用
- スクロールアニメーション: `.fade-in`, `.slide-up`, `.slide-left`, `.slide-right`, `.scale-in` + `.visible`

**JavaScript（main.js）:**
- DOMContentLoaded で全 `init*()` 関数を呼び出す単一エントリポイント
- 関数命名: `init` + 機能名（camelCase）（例: `initStickyHeader`, `initMobileMenu`）
- `prefers-reduced-motion` を必ず尊重（アニメーション・スクロール）
- Intersection Observer パターンでスクロール連動処理
- `{ passive: true }` でスクロールイベントを登録

## §6 SEO & アクセシビリティ

**SEO:**
- 各ページに固有の `<title>` と `<meta name="description">`
- OGP メタタグ（og:title, og:description, og:image, og:url）完備
- JSON-LD 構造化データ: Organization + JobPosting（求人情報）
- `<link rel="canonical">` で正規URL指定
- `<meta name="robots" content="index, follow">`

**アクセシビリティ（WCAG 2.1 AA 準拠）:**
- スキップリンク: `.skip-link` でメインコンテンツへジャンプ
- フォーカス管理: `*:focus-visible` にアウトライン（`--color-primary`）
- フォーカストラップ: モバイルメニュー内でTab循環
- `aria-expanded`, `aria-hidden`, `aria-label` でモバイルメニュー状態を通知
- フォームエラー: `aria-invalid`, `aria-describedby`, `role="alert"`, `aria-live="polite"`
- `prefers-reduced-motion: reduce` でアニメーション完全無効化
- タッチターゲット: モバイルで最小 44px
- `.sr-only` クラスでスクリーンリーダー専用テキスト
- コントラスト比: テキスト/背景で4.5:1以上を確保

## §7 ドメイン知識

**会社情報:**
- 会社名: 株式会社NINJA
- ブランド名: ニンニン（ポケモンカード専門店）
- 代表電話: 03-6262-9556（採用専用ダイヤル）
- 受付時間: 平日 10:00〜18:00
- 従業員数: 50名以上

**店舗一覧（全7拠点）:**

| 店舗名 | エリア | 住所 |
|--------|--------|------|
| ニンニン秋葉原店 | 東京・秋葉原 | 千代田区外神田3-8-7 フジビル2F |
| ニンニン秋葉原2号店 | 東京・秋葉原 | 千代田区外神田3丁目15 麻野ビル2F |
| ニンニン中野店 | 東京・中野 | 中野区中野5-60-6 中野サンモール共同ビル4F |
| ニンニン池袋店 | 東京・池袋 | 豊島区東池袋1-23-13 第一岡村ビル3階 |
| ニンニン大阪日本橋店 | 大阪・日本橋 | 浪速区日本橋3-8-26 稲原ビル1階 |
| ニンニン大阪日本橋2号店 | 大阪・日本橋 | 浪速区日本橋西1丁目2-25 St難波ビル2F |
| トレレン秋葉原店 | 東京・秋葉原 | 千代田区（トレカレンタルスペース） |

**募集職種:**
- 正社員: 店舗スタッフ / EC運営スタッフ
- アルバイト: 店舗スタッフ
- 共通: 未経験歓迎、社員割引あり、交通費支給

## §8 デプロイ
- **ホスティング:** GitHub Pages
- **リポジトリ:** `YuyaSuzuki117/ninnin-recruit-demo`
- **デプロイ方法:** `master` ブランチへの push で自動デプロイ
- **デプロイ前チェック:**
  1. 全4ページをローカルで開いてリンク切れ確認
  2. ヘッダー/フッター/ナビが4ページで同一か確認
  3. モバイル表示を確認（DevTools で 375px 幅）
  4. コミットメッセージは英語プレフィクス付き
