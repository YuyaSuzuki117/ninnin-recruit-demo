# 4ページ整合性チェック

全4ページ（index.html, jobs.html, interview.html, entry.html）の整合性を検証してください。

## 検証項目

### 1. ヘッダー統一
- `.header-top-bar` の内容（電話番号・受付時間テキスト）が全ページで同一か
- `.site-header` のロゴ・ナビゲーションリンクが全ページで同一か
- ナビゲーションリンクの href が正しいファイルを指しているか
- モバイルメニュー（`#mobile-menu`）の内容が全ページで同一か
- ハンバーガーボタン（`#menu-toggle`）の構造が全ページで同一か

### 2. フッター統一
- `.site-footer` の内容（会社情報・リンク・コピーライト）が全ページで同一か
- フッター内リンクの href が正しいか
- コピーライトの年が最新か

### 3. 共通要素
- `.floating-cta`（フローティングCTA）が全ページに存在するか
- `#page-top-btn`（ページトップボタン）が全ページに存在するか
- スキップリンク（`.skip-link`）が全ページに存在するか
- `aria-live` リージョン（フォーム用）が必要なページに存在するか

### 4. Tailwind 設定
- `<script>tailwind.config = {...}</script>` の内容が全ページで同一か
  - colors（primary, accent, secondary, body, bg-alt）
  - fontFamily（heading, body, num）
- Google Fonts の `<link>` が全ページで同一か
- `<link rel="stylesheet" href="css/custom.css">` が全ページに存在するか
- `<script src="js/main.js"></script>` が全ページに存在するか（defer 属性の有無も確認）

### 5. コンテンツ整合性
- 電話番号 `03-6262-9556` が全ページで統一されているか
- 店舗数「全国7拠点」の表記が統一されているか
- 会社名「株式会社NINJA」の表記が統一されているか
- CTAボタンのリンク先（entry.html）が正しいか

### 6. メタ情報
- `<meta name="theme-color">` が全ページで統一されているか
- favicon の参照パスが全ページで統一されているか
- OGP の `og:site_name` が全ページで統一されているか

## 出力フォーマット
ページ間で差異がある箇所を表形式で一覧表示し、どのページをマスターとすべきか（通常は index.html）を提案してください。
