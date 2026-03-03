# アクセシビリティ検証 (WCAG 2.1 AA)

指定されたHTMLページ（$ARGUMENTS または全4ページ）に対して WCAG 2.1 AA 準拠のアクセシビリティ検証を実施してください。

## 検証項目

### 1. 知覚可能 (Perceivable)
- 全 `<img>` に適切な `alt` テキストがあるか
- 装飾画像に `alt=""` と `aria-hidden="true"` が設定されているか
- テキストと背景のコントラスト比が 4.5:1 以上（大文字 3:1 以上）か
  - 特に: `--color-primary`（#FFCB05）上のテキスト色を確認
  - `--color-secondary`（#1B2A4A）上の白テキストを確認
- `<html lang="ja">` が設定されているか
- フォームの `<label>` が対応する `<input>` と正しく紐付いているか（`for`/`id`）

### 2. 操作可能 (Operable)
- キーボードのみで全操作が可能か
  - Tab キーで全インタラクティブ要素にフォーカスが到達するか
  - Enter/Space で全ボタン・リンクが動作するか
  - Escape でモバイルメニューが閉じるか（`[data-menu-close]` 属性の要素も確認）
  - `.magnetic-btn` がキーボードフォーカスで正常に動作するか（マウス追従がキーボード操作を妨げないこと）
- `*:focus-visible` のアウトラインスタイルが設定されているか
- フォーカストラップ: モバイルメニュー（全画面ダークネイビーオーバーレイ `.mobile-menu__inner`）内で Tab が循環するか（`js/main.js`）
- スキップリンク（`.skip-link`）が存在し、メインコンテンツにジャンプできるか
- タッチターゲット: モバイルで全インタラクティブ要素が最小 44x44px か
  - フォーム入力: min-height 48px か
  - フローティングCTA: min-height 52px か
- タッチフィードバック: `:active` で `scale(0.97)` が設定されているか（ボタン・カード）
- `.scroll-progress` バー: キーボード操作を妨げない（装飾的・`aria-hidden="true"` が望ましい）か

### 3. 理解可能 (Understandable)
- フォームエラーメッセージが `aria-invalid`, `aria-describedby` で通知されるか
- エラー通知に `role="alert"` または `aria-live="polite"` が使われているか
- 必須フィールドに `required` 属性と視覚的な「必須」ラベルがあるか

### 4. 堅牢 (Robust)
- `aria-expanded`, `aria-hidden`, `aria-label` がモバイルメニュー（`.mobile-menu__inner`）に設定されているか
- モバイルメニューの閉じるボタン（`.mobile-menu__close`）に `aria-label` があるか
- `prefers-reduced-motion: reduce` でアニメーションが完全無効化されるか（`custom.css` 末尾）
  - `.scroll-progress`, `.particle`, `.magnetic-btn`, `.tilt-card` のアニメーションも含む
  - `.stagger-container` / `.stagger-item` のアニメーションも含む
- `.sr-only` クラスがスクリーンリーダー専用テキストに使われているか
- `.scroll-progress` に適切なARIA属性（`role="progressbar"` または `aria-hidden="true"`）があるか

## 出力フォーマット
各原則ごとに ✅ / ⚠️ / ❌ で評価し、問題箇所にはファイル名・行番号・修正コード例を提示してください。
