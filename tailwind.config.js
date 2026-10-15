// Tailwind を事前ビルドするための設定（以前は各ページの <script src="https://cdn.tailwindcss.com"> + インラインの tailwind.config で実行時に生成していた）
// 再生成: npm run build:css（クラスを足した・HTML を変えたら毎回）
module.exports = {
  content: ['./*.html', './js/*.js', './scripts/build-stores.mjs'],
  theme: {
    extend: {
      colors: {
        // pika.dark は文字・アイコン用（白/淡黄の背景でコントラスト 4.5:1 以上・2026-10-15 に #B8930A から変更）
        pika: { DEFAULT: '#FFCB05', dark: '#7A5F00', light: '#FFF7CC', '50': '#FFFDF0' },
        navy: { DEFAULT: '#1B2A4A', deep: '#0B1628', light: '#2A3F6A' },
        accent: '#E63946',
        body: '#1D1D1B',
        cream: '#FAF6EE',
        cool: '#EEF2F7',
      },
      fontFamily: {
        heading: ['Zen Kaku Gothic New', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', 'Noto Sans CJK JP', 'Meiryo', 'sans-serif'],
        body: ['Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', 'Noto Sans CJK JP', 'Meiryo', 'sans-serif'],
        num: ['Sora', 'sans-serif'],
      },
    },
  },
}
