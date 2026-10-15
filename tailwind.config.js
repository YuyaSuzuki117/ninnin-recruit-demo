// Tailwind を事前ビルドするための設定（以前は各ページの <script src="https://cdn.tailwindcss.com"> + インラインの tailwind.config で実行時に生成していた）
// 再生成: npm run build:css（クラスを足した・HTML を変えたら毎回）
module.exports = {
  content: ['./*.html', './js/*.js', './scripts/build-stores.mjs'],
  theme: {
    extend: {
      colors: {
        pika: { DEFAULT: '#FFCB05', dark: '#B8930A', light: '#FFF7CC', '50': '#FFFDF0' },
        navy: { DEFAULT: '#1B2A4A', deep: '#0B1628', light: '#2A3F6A' },
        accent: '#E63946',
        body: '#1D1D1B',
        cream: '#FAF6EE',
        cool: '#EEF2F7',
      },
      fontFamily: {
        heading: ['Zen Kaku Gothic New', 'Noto Sans JP', 'sans-serif'],
        body: ['Noto Sans JP', 'sans-serif'],
        num: ['Sora', 'sans-serif'],
      },
    },
  },
}
