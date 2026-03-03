# SEO 検証

指定されたHTMLページ（$ARGUMENTS または全4ページ）に対して SEO 検証を実施してください。

## 検証項目

### 1. メタタグ
- `<title>` が各ページで固有かつ60文字以内か
- `<meta name="description">` が各ページで固有かつ120文字以内か
- `<meta name="robots" content="index, follow">` が存在するか
- `<link rel="canonical">` が正しいURLを指しているか
- `<meta name="viewport">` が設定されているか
- `<meta name="format-detection" content="telephone=no">` があるか

### 2. OGP（Open Graph Protocol）
- `og:title`, `og:description`, `og:type`, `og:url` が設定されているか
- `og:image` が有効なURLを指しているか（推奨: 1200x630px）
- `og:site_name`, `og:locale` が設定されているか
- Twitter Card メタタグ（`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`）

### 3. JSON-LD 構造化データ
- Organization スキーマ: 会社名（株式会社NINJA）、ロゴ、所在地が正確か
- JobPosting スキーマ: 各求人情報が含まれているか
  - `title`, `description`, `datePosted`, `validThrough` が設定されているか
  - `validThrough`（求人有効期限）が未来日であるか ← **特に注意**
  - `hiringOrganization`, `jobLocation` が正確か
  - `employmentType` が正しいか（FULL_TIME / PART_TIME）

### 4. HTML構造
- `<h1>` が各ページに1つだけ存在するか
- 見出しレベル（h1→h2→h3）が順序通りか（スキップなし）
- `<nav>` にパンくずリストが含まれているか（index.html 以外）

### 5. パフォーマンス関連
- `<link rel="preconnect">` で Google Fonts への事前接続があるか
- 画像に `width` / `height` 属性または適切な CSS サイズ指定があるか

## 出力フォーマット
各項目ごとに ✅ / ⚠️ / ❌ で評価。JSON-LD の `validThrough` が過去日の場合は ❌ として修正コードを提示してください。
