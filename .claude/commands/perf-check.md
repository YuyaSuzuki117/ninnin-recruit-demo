# パフォーマンス検証

指定されたHTMLページ（$ARGUMENTS または全4ページ）に対してパフォーマンスを検証してください。

## 検証項目

### 1. CDN 依存
- Tailwind CSS CDN（`cdn.tailwindcss.com`）が使用されている → 本番運用時のリスク評価
- Google Fonts CDN への接続
  - `<link rel="preconnect">` が設定されているか
  - フォントウェイトの読み込みが必要最小限か
  - `&display=swap` が指定されているか（FOUT対策）
- 他の外部CDNへの依存がないか

### 2. 画像最適化
- `img/` 内の画像ファイルサイズを確認
- `<img>` に `width` / `height` 属性が設定されているか（CLS防止）
- `loading="lazy"` がファーストビュー以外の画像に設定されているか
- WebP / AVIF など次世代フォーマットの使用状況
- プレースホルダー画像（placehold.co）が本番に残っていないか

### 3. CSS 効率
- `css/custom.css` のファイルサイズ確認
- 未使用のCSSルールがないか（主要セレクタのみ）
- `will-change` プロパティの使用が適切か（`.hero-chara` 等）
- アニメーションが `transform` / `opacity` のみでGPU最適化されているか
  - `initParallax`: translate3d でGPUコンポジットを使用しているか
  - `initCardTilt` (`.tilt-card`): transform がGPU最適化されているか
  - `.particle` アニメーション: GPUレイヤー昇格されているか
- `backdrop-filter: blur(4px)` がモバイルメニューオーバーレイで使用 → モバイル端末での描画コスト評価
- `@media (prefers-reduced-motion: reduce)` でアニメーションが無効化されているか

### 4. JavaScript 効率
- `js/main.js` のファイルサイズ確認
- DOMContentLoaded で初期化される関数の数（現在16個）と処理量
- IntersectionObserver インスタンス数の確認（5個以上使用されている → 統合の余地がないか）
  - `initScrollAnimations`, `initCountUpAnimated`, `initStaggerReveal`, `initActiveNavHighlight` 等
- `.particle` の生成数に上限が設定されているか（過剰なDOM要素追加によるメモリリーク防止）
- `initScrollProgress` が `requestAnimationFrame` でスロットリングされているか（毎フレームDOM更新を避ける）
- `initMagneticButtons`: mousemove イベントの頻度制御がされているか
- スクロールイベントに `{ passive: true }` が設定されているか
- `requestAnimationFrame` でスクロール処理がスロットリングされているか
- `<script>` に `defer` または `async` が設定されているか（head内の場合）

### 5. ネットワーク
- 外部リクエスト数の確認（フォント・CDN・画像）
- レンダリングブロッキングリソースの特定
  - `<script src="https://cdn.tailwindcss.com">` が `<head>` 内でブロッキングしていないか
  - CSS の読み込み順序（Tailwind → custom.css）
- HTTP/2 プッシュの候補になるリソース

## 出力フォーマット
各項目に ✅ / ⚠️ / ❌ で評価。パフォーマンス改善のインパクトが大きい順に優先度付きで提案してください。
