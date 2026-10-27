// 店舗別求人ページ生成: data/stores.json → store-<slug>.html
// ヘッダー・フッター・フローティング CTA・head の共通部分・募集条件テーブル・JobPosting の雛形は jobs.html から切り出す（4 ページ統一を保つ）
// 使い方: node scripts/build-stores.mjs   （repo 直下で実行。sitemap.xml の店舗 URL も更新する）
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (f) => readFileSync(join(ROOT, f), 'utf8')
const stores = JSON.parse(read('data/stores.json'))
const jobs = read('jobs.html')

const slice = (src, from, to, { inclusiveEnd = true } = {}) => {
  const a = src.indexOf(from); const b = src.indexOf(to, a + from.length)
  if (a < 0 || b < 0) throw new Error(`marker not found: ${from} .. ${to}`)
  return src.slice(a, inclusiveEnd ? b + to.length : b)
}
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

// --- jobs.html から共通部分を切り出す ---
const headCommon = slice(jobs, '  <!-- Googleフォント -->', '  <!-- End X conversion tracking base code -->')
const bodyTop = slice(jobs, '<body class="font-body text-body">', '  </header>')
const bodyBottom = slice(jobs, '  <footer class="site-footer">', '</html>')
const tableFull = slice(slice(jobs, '<section id="full-time"', '</section>'), '<table class="job-table">', '</table>')
const tablePart = slice(slice(jobs, '<section id="part-time"', '</section>'), '<table class="job-table">', '</table>')
const ld = [...jobs.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]))
const jobFull = ld.find((j) => j['@type'] === 'JobPosting' && j.employmentType === 'FULL_TIME')
const jobPart = ld.find((j) => j['@type'] === 'JobPosting' && j.employmentType === 'PART_TIME')
const SITE = 'https://yuyasuzuki117.github.io/ninnin-recruit-demo/' // deploy-recruit.mjs が本番 URL に置換する
const GUIDE = 'cardshop-job-guide.html' // 「カードショップ バイト きつい／内容／知識」型の検索に答えるお仕事ガイド（このスクリプトの末尾で生成）
// 「募集中（○月○日 更新）」に出す日付 = 生成した日（JST）。AI の回答や求職者が「古い求人か」を判断する材料
const jst = new Date(Date.now() + 9 * 3600e3)
const updated = `${jst.getUTCFullYear()}年${jst.getUTCMonth() + 1}月${jst.getUTCDate()}日`
const typeParam = { part: 'entry.html?type=%E3%82%A2%E3%83%AB%E3%83%90%E3%82%A4%E3%83%88', full: 'entry.html?type=%E6%AD%A3%E7%A4%BE%E5%93%A1' }

const place = (s) => ({
  '@type': 'Place',
  name: `ニンニン ${s.name}`,
  address: {
    '@type': 'PostalAddress',
    ...(s.street ? { streetAddress: s.street } : {}),
    ...(s.postal ? { postalCode: s.postal } : {}),
    ...(s.city ? { addressLocality: s.city } : {}),
    addressRegion: s.pref,
    addressCountry: 'JP',
  },
})
const posting = (base, s) => ({
  ...base,
  title: base.title,
  identifier: { ...base.identifier, value: `${base.identifier.value}-${s.slug}` },
  jobLocation: place(s),
  url: `${SITE}store-${s.slug}.html`,
  applicationContact: { ...base.applicationContact, url: `${SITE}entry.html` },
  description: `${base.description}<p>勤務地はニンニン ${s.name}（${s.access}）です。</p>`,
})

const storeLinks = (current) => stores.map((s) => (s.slug === current
  ? `<li><span class="store-nav__current" aria-current="page">${s.name}</span></li>`
  : `<li><a href="store-${s.slug}.html">${s.name}の求人</a></li>`)).join('\n          ')

const faq = [
  ['勤務地は選べますか？', 'はい、面接時にご希望の勤務地をお伺いします。自宅から通いやすい店舗への配属を基本としています。複数の希望店舗をお伝えいただけると選考がスムーズです。'],
  ['ポケモンカードの知識がなくても応募できますか？', 'もちろん応募いただけます。入社後の研修でカードの種類・レアリティ・相場観などを丁寧にお教えします。現在活躍中のスタッフの中にも、入社時はポケカ初心者だった方が多数います。「興味がある」という気持ちがあれば十分です。'],
  ['学生でも応募できますか？', '大学生・専門学校生の方も応募いただけます（高校生は不可）。ただし基本は通し勤務・週3日以上のフルタイムのため、長く安定して働ける方を優先しています。'],
]
const faqHtml = faq.map(([q, a]) => `        <div class="faq-item">
          <div class="faq-item-header" role="button" tabindex="0" aria-expanded="false">
            <span>${q}</span>
            <svg class="faq-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/></svg>
          </div>
          <div class="faq-item-content"><p>${a}</p></div>
        </div>`).join('\n')

const page = (s) => {
  const full = `ニンニン${s.name}`
  const addr = s.street ? `${s.pref}${s.city}${s.street}` : ''
  const title = s.comingSoon
    ? `${full}（2026年秋口OPEN予定）のオープニングスタッフ求人｜ポケカ専門店ニンニン採用`
    : `${full}のアルバイト・正社員求人｜時給1,400円〜｜ポケカ・トレカのカードショップ｜${s.access.split('・')[0]}` // 駅が 2 つある店は title には最寄りだけ
  // 求職者の検索語（「カードショップ バイト」「トレカ 求人」）も入れる
  const desc = s.comingSoon
    ? `ポケモンカード専門のカードショップ「ニンニン」の${s.name}は2026年秋口にオープン予定。オープニングスタッフ（アルバイト・正社員）の募集を予定しています。未経験歓迎、ポケカの知識は入社後に学べます。`
    : `ポケモンカード専門のカードショップ「ニンニン」${s.name}（${addr}・${s.access}）のトレカ販売・買取スタッフ求人。アルバイトは時給1,400〜1,500円、正社員は月給25万円〜50万円。未経験歓迎、履歴書は面接時でOK。`
  const url = `${SITE}store-${s.slug}.html`
  // X の投稿にリンクを貼ったときのカード画像: 店舗ごとの絵（tmp/ninnin-yokohama/ogp-store-render.mjs で描く）が無ければ共通の ogp.png
  const ogImage = existsSync(join(ROOT, `img/ogp/store-${s.slug}.jpg`)) ? `${SITE}img/ogp/store-${s.slug}.jpg?v=20261024` : `${SITE}img/ogp.png?v=20261015`
  const loc = `&location=${encodeURIComponent(s.formValue)}`
  const breadcrumb = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'ホーム', item: `${SITE}` },
    { '@type': 'ListItem', position: 2, name: '店舗一覧', item: `${SITE}#stores` },
    { '@type': 'ListItem', position: 3, name: full, item: url },
  ] }
  const ldBlocks = [breadcrumb, ...(s.comingSoon ? [] : [posting(jobFull, s), posting(jobPart, s)])]
    .map((j) => `  <script type="application/ld+json">\n${JSON.stringify(j, null, 2)}\n  </script>`).join('\n')
  const mapUrl = addr ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(full + ' ' + addr)}` : ''

  const pick = s.comingSoon ? `
      <div class="store-coming-box">
        <p class="store-coming-box__lead">オープニングスタッフ募集予定</p>
        <p class="jp-text">${s.note}募集条件は他店舗と同じ基準を予定しています。応募フォームの希望勤務地で「心斎橋店」を選んでご応募ください。</p>
        <div class="job-pick__actions">
          <a class="btn-primary job-pick__btn" data-cta="store-coming" href="entry.html?location=${encodeURIComponent(s.formValue)}">応募フォームへ</a>
          <a class="job-pick__more" href="jobs.html">募集要項を見る →</a>
        </div>
      </div>` : `
      <div class="job-pick-grid">
        <div class="job-pick job-pick--main">
          <div class="job-pick__head">
            <span class="job-pick__tag job-pick__tag--pika">PART-TIME</span>
            <span class="job-pick__role">店舗スタッフ（アルバイト）</span>
          </div>
          <p class="job-pick__pay font-num">時給1,400〜1,500円</p>
          <p class="job-pick__step">試用期間 1,400円 → 本採用 1,500円（最短3ヶ月・最長1年）</p>
          <p class="job-pick__cond">平日 12:45〜20:15／土日祝 10:45〜20:15</p>
          <p class="job-pick__cond">週3日以上・通し勤務<span class="job-pick__note">高校生不可・学生は応相談・店舗により時短応相談</span></p>
          <div class="job-pick__actions">
            <a class="btn-primary job-pick__btn" data-cta="store-parttime" href="${typeParam.part}${loc}">${s.name}に応募する</a>
            <a class="job-pick__more" href="#part-time">詳細を見る ↓</a>
          </div>
          <ul class="job-pick__perks" aria-label="待遇"><li>研修制度</li><li>制服貸与</li><li>正社員登用あり</li><li>交通費一部支給（上限あり）</li></ul>
          <p class="job-pick__assure">履歴書は面接時にご持参（応募時は不要）・3営業日以内にご連絡</p>
        </div>
        <div class="job-pick">
          <div class="job-pick__head">
            <span class="job-pick__tag job-pick__tag--navy">FULL-TIME</span>
            <span class="job-pick__role">店舗スタッフ（正社員）</span>
          </div>
          <p class="job-pick__pay font-num">月給25万円〜50万円</p>
          <p class="job-pick__cond">10:00〜20:00（実働8時間）</p>
          <div class="job-pick__actions">
            <a class="btn-primary job-pick__btn" data-cta="store-fulltime" href="${typeParam.full}${loc}">${s.name}に応募する</a>
            <a class="job-pick__more" href="#full-time">詳細を見る ↓</a>
          </div>
          <ul class="job-pick__perks" aria-label="待遇"><li>社会保険完備</li><li>賞与年2回</li><li>昇給年1回</li><li>研修制度</li></ul>
          <p class="job-pick__assure">履歴書は面接時にご持参（応募時は不要）・3営業日以内にご連絡</p>
        </div>
      </div>`

  // 同じ都府県の他店舗（面接で複数の希望店舗を伝えられるので、近くの店舗にも回遊させる）
  const siblings = stores.filter((o) => o.pref === s.pref && o.slug !== s.slug)
    .map((o) => `<a href="store-${o.slug}.html" class="store-dl__map">${o.name}${o.comingSoon ? '（OPEN予定）' : ''}</a>`).join('・')
  const town = s.area.split('・').pop()
  const lead = s.comingSoon
    ? `${s.area}でポケカ・トレカのカードショップのアルバイトや正社員を探している方へ。${full}は2026年秋口にオープン予定のポケモンカード専門店です。カードの販売・買取・査定、オリパの企画、対戦スペースの運営など、お客様の「好き」を支える仕事をお任せします。`
    : `${full}は、${s.access}にある${s.kind || 'ポケモンカード専門のカードショップ'}です。${s.note || ''}${town}でトレカショップ・カードショップのアルバイトや正社員を探している方に向けて、この店舗で応募できる条件をまとめました。カードの販売・買取・査定、オリパの企画、対戦スペースの運営など、お客様の「好き」を支える仕事をお任せします。ポケカの知識は入社後の研修で身につきます。`
  const quote = s.quote ? `
          <blockquote class="store-quote"><p>「${s.quote}」</p><cite>${s.quoteBy}（<a href="${s.interview}">インタビューを読む</a>）</cite></blockquote>` : ''
  const storeInfo = `
  <section class="py-12 lg:py-16 bg-cream" aria-labelledby="store-info-title">
    <div class="max-w-[1140px] mx-auto px-4 lg:px-6">
      <div class="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
        <div>
          <p class="sec-label">STORE</p>
          <h2 id="store-info-title" class="font-heading font-bold text-2xl lg:text-3xl text-gray-900 mb-4">${s.area}のカードショップ「${full}」</h2>
          <p class="jp-text text-gray-700 leading-relaxed mb-5">${lead}</p>${quote}
          <dl class="store-dl">
            <dt>店舗名</dt><dd>${full}</dd>
            ${addr ? `<dt>住所</dt><dd>${addr}${mapUrl ? `<br><a href="${mapUrl}" target="_blank" rel="noopener noreferrer" class="store-dl__map">Googleマップで見る</a>` : ''}</dd>` : ''}
            <dt>アクセス</dt><dd>${s.access}</dd>
            ${s.stations ? `<dt>周辺の駅</dt><dd>${s.stations}${s.stations.includes('徒歩') ? '<br><span class="text-xs text-gray-500">※徒歩時間はGoogleマップの徒歩ルートによる目安</span>' : ''}</dd>` : ''}
            ${s.titles ? `<dt>取扱タイトル</dt><dd>${s.titles}</dd>` : ''}
            ${s.x ? `<dt>店舗の公式X</dt><dd><a href="https://x.com/${s.x}" target="_blank" rel="noopener noreferrer" class="store-dl__map">@${s.x}</a>（店内の様子・入荷情報）</dd>` : ''}
            <dt>募集職種</dt><dd>${s.comingSoon ? 'オープニングスタッフ（アルバイト・正社員）募集予定' : '店舗スタッフ（アルバイト・正社員）'}</dd>
            <dt>募集状況</dt><dd>${s.comingSoon ? '募集予定' : `募集中（${updated} 更新）`}</dd>
            ${siblings ? `<dt>近くの店舗</dt><dd>${siblings}<br><span class="text-xs text-gray-500">面接で複数の店舗を希望として伝えられます</span></dd>` : ''}
            <dt>採用ダイヤル</dt><dd><a href="tel:03-4363-7710" class="font-num">03-4363-7710</a>（年中無休 13:00〜20:00）</dd>
          </dl>
        </div>
        <div class="store-card store-card--page">
          <div class="store-img${s.photo ? '' : ' store-img--coming'}">
            ${s.badge ? `<span class="store-badge${/NEW|OPEN/.test(s.badge) ? ' store-badge--new' : ''}">${s.badge}</span>` : ''}
            ${s.photo ? `<img src="${s.photo}" alt="${full}の店内" decoding="async" loading="lazy">` : '<span class="store-coming-text font-num" aria-hidden="true">COMING SOON</span>'}
          </div>
        </div>
      </div>
    </div>
  </section>`

  const tables = s.comingSoon ? '' : `
  <section id="part-time" class="py-12 lg:py-16 bg-white" aria-labelledby="part-time-title">
    <div class="max-w-[1140px] mx-auto px-4 lg:px-6">
      <p class="sec-label">PART-TIME</p>
      <h2 id="part-time-title" class="font-heading font-bold text-2xl lg:text-3xl text-gray-900 mb-6">${s.name}のアルバイト募集条件</h2>
      <div class="table-scroll-wrapper">
        ${tablePart}
      </div>
      <p class="mt-5"><a class="btn-primary" data-cta="store-parttime-bottom" href="${typeParam.part}${loc}">アルバイトに応募する</a></p>
    </div>
  </section>
  <section id="full-time" class="py-12 lg:py-16 bg-cream" aria-labelledby="full-time-title">
    <div class="max-w-[1140px] mx-auto px-4 lg:px-6">
      <p class="sec-label">FULL-TIME</p>
      <h2 id="full-time-title" class="font-heading font-bold text-2xl lg:text-3xl text-gray-900 mb-6">${s.name}の正社員募集条件</h2>
      <div class="table-scroll-wrapper">
        ${tableFull}
      </div>
      <p class="mt-5"><a class="btn-primary" data-cta="store-fulltime-bottom" href="${typeParam.full}${loc}">正社員に応募する</a></p>
    </div>
  </section>`

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <meta name="robots" content="${s.comingSoon ? 'noindex, follow' : 'index, follow'}">
  <meta name="format-detection" content="telephone=no">
  <meta name="theme-color" content="#0B1628">
  <link rel="canonical" href="https://nin-nin-pokeka.jp/recruit/store-${s.slug}.html">
  <link rel="icon" href="img/favicon.png">

  <!-- OGPメタタグ -->
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${url}">
  <meta property="og:site_name" content="ニンニン採用情報">
  <meta property="og:locale" content="ja_JP">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(desc)}">
  <meta name="twitter:image" content="${ogImage}">

${headCommon}

${ldBlocks}
</head>
${bodyTop}

  <main id="main-content">

  <!-- パンくずリスト -->
  <div class="pt-16 lg:pt-[112px] bg-cream border-b border-gray-200">
    <div class="max-w-[1140px] mx-auto px-4 lg:px-6 py-2 lg:py-3">
      <nav class="breadcrumb" aria-label="パンくずリスト">
        <ol class="flex items-center flex-wrap text-sm">
          <li><a href="index.html">ホーム</a></li>
          <li><span class="mx-2" aria-hidden="true">&gt;</span></li>
          <li><a href="index.html#stores">店舗一覧</a></li>
          <li><span class="mx-2" aria-hidden="true">&gt;</span></li>
          <li aria-current="page"><span>${s.name}</span></li>
        </ol>
      </nav>
    </div>
  </div>

  <!-- ページヘッダー -->
  <div class="subpage-hero subpage-hero--lp">
    <div class="particle-container" aria-hidden="true"></div>
    <span class="sec-bg-num sec-bg-num--right" aria-hidden="true">STORE</span>
    <div class="max-w-[1140px] mx-auto px-4 lg:px-6 subpage-hero__content">
      <div class="flex items-center gap-4">
        <div class="w-1 h-10 bg-pika flex-shrink-0"></div>
        <div>
          <p class="text-pika text-xs font-bold tracking-widest font-num mb-1">${s.area.toUpperCase()}</p>
          <h1 class="font-heading font-black text-2xl lg:text-3xl text-white tracking-wide">${s.comingSoon ? `${full}のオープニングスタッフ求人` : `${full}のアルバイト・正社員求人`}</h1>
          <p class="subpage-hero__lead"><span class="whitespace-nowrap">大好きなポケモンカードに囲まれて働ける｜</span><span class="whitespace-nowrap">${s.access}</span></p>
        </div>
      </div>
    </div>
  </div>

  <!-- 応募の入口 -->
  <section class="bg-white py-5 lg:py-10 job-pick-sec" aria-label="職種を選んで応募">
    <div class="max-w-[1140px] mx-auto px-4 lg:px-6">${pick}
    </div>
  </section>
${storeInfo}
${tables}

  <!-- よくある質問（店舗共通） -->
  <section class="py-12 lg:py-16 bg-white" aria-labelledby="store-faq-title">
    <div class="max-w-[800px] mx-auto px-4 lg:px-6">
      <p class="sec-label">FAQ</p>
      <h2 id="store-faq-title" class="font-heading font-bold text-2xl lg:text-3xl text-gray-900 mb-6">よくある質問</h2>
      <div class="faq-list">
${faqHtml}
      </div>
      <p class="mt-4 text-sm"><a href="jobs.html#faq" class="store-dl__map">すべての質問を見る →</a></p>
      <p class="mt-2 text-sm"><a href="${GUIDE}" class="store-dl__map">カードショップのバイトってどんな仕事？（仕事内容・大変なところ・面接）→</a></p>
    </div>
  </section>

  <!-- 他の店舗 -->
  <section class="py-10 lg:py-14 bg-cream" aria-labelledby="store-nav-title">
    <div class="max-w-[1140px] mx-auto px-4 lg:px-6">
      <h2 id="store-nav-title" class="font-heading font-bold text-lg text-gray-900 mb-4">店舗別の求人を見る</h2>
      <nav aria-label="店舗別求人">
        <ul class="store-nav">
          ${storeLinks(s.slug)}
        </ul>
      </nav>
    </div>
  </section>

  <!-- 先輩の声への回遊リンク -->
  <div class="job-voice-link">
    <a href="${s.interview || 'interview.html'}">${s.interviewLabel || '先輩の声を読む'} <span aria-hidden="true">→</span></a>
  </div>

  <!-- CTA -->
  <section class="sec-cta">
    <div class="sec-cta-bg" aria-hidden="true"></div>
    <div class="max-w-[800px] mx-auto px-5 text-center relative z-10">
      <p class="text-sm font-num tracking-widest text-white/60 mb-4">JOIN OUR TEAM</p>
      <h2 class="text-2xl lg:text-4xl font-heading font-black text-white mb-4 tracking-wide">${s.name}で、あなたの「好き」を<br>仕事にしよう。</h2>
      <p class="text-gray-400 text-xs mb-2">お電話でのお問い合わせ・ご応募</p>
      <a href="tel:03-4363-7710" class="cta-phone font-num">03-4363-7710</a>
      <p class="text-gray-500 text-xs mb-8">年中無休 / 受付時間 13:00〜20:00</p>
      <a href="entry.html?location=${encodeURIComponent(s.formValue)}" class="btn-cta-large magnetic-btn cta-shimmer" data-cta="store-bottom">
        応募フォームへ進む
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
      </a>
      <p class="text-gray-500 text-xs mt-6">ポケモンカードが好きな方、未経験の方も歓迎いたします。</p>
    </div>
  </section>

  </main>

${bodyBottom}
`
}

for (const s of stores) writeFileSync(join(ROOT, `store-${s.slug}.html`), page(s))
console.log(`wrote ${stores.length} store pages`)

// --- お仕事ガイド: 求職者が応募前に検索する疑問（仕事内容・知識・きつい・時給・学生・面接）に、募集要項と店長インタビューの事実だけで答える ---
// 本文の事実の出どころ: jobs.html の募集要項・FAQ／interview.html の店長の発言（引用は原文のまま）
const guidePage = () => {
  const url = `${SITE}${GUIDE}`
  const title = 'カードショップのバイトはきつい？仕事内容・知識・時給をポケカ専門店が解説｜ニンニン採用'
  const desc = 'カードショップ（トレカショップ）のバイトの仕事内容、ポケカの知識は必要か、大変なところ、時給・給料、高校生や大学生は働けるか、面接で聞かれることを、全国11拠点のポケカ専門店ニンニンの募集条件と店長の声をもとにまとめました。'
  const h1 = 'カードショップのバイトってどんな仕事？'
  const isoDay = jst.toISOString().slice(0, 10)
  const org = { '@type': 'Organization', name: '株式会社NINJA', url: 'https://nin-nin-pokeka.jp/', logo: `${SITE}img/common/logo-square.png` }
  const ldBlocks = [
    { '@context': 'https://schema.org', '@type': 'Article', headline: h1, description: desc, inLanguage: 'ja', datePublished: '2026-10-28', dateModified: isoDay, author: org, publisher: org, image: `${SITE}img/index/gallery_cards.webp`, mainEntityOfPage: url },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ホーム', item: SITE },
      { '@type': 'ListItem', position: 2, name: '募集要項', item: `${SITE}jobs.html` },
      { '@type': 'ListItem', position: 3, name: h1, item: url },
    ] },
  ].map((j) => `  <script type="application/ld+json">\n${JSON.stringify(j, null, 2)}\n  </script>`).join('\n')
  const q = (text, by, href) => `<blockquote class="store-quote"><p>「${text}」</p><cite>${by}（<a href="${href}">インタビューを読む</a>）</cite></blockquote>`
  const list = (items) => `<ul class="guide-list">${items.map((i) => `<li>${i}</li>`).join('')}</ul>`
  const h2 = (id, text) => `<h2 id="${id}" class="font-heading font-bold text-xl lg:text-2xl text-gray-900 mt-10 mb-4">${text}</h2>`
  const storeItems = stores.map((o) => `<li><a href="store-${o.slug}.html">${o.name}${o.comingSoon ? '（OPEN予定）' : `（${o.access}）`}</a></li>`).join('\n          ')

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <meta name="robots" content="index, follow">
  <meta name="format-detection" content="telephone=no">
  <meta name="theme-color" content="#0B1628">
  <link rel="canonical" href="https://nin-nin-pokeka.jp/recruit/${GUIDE}">
  <link rel="icon" href="img/favicon.png">

  <!-- OGPメタタグ -->
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${url}">
  <meta property="og:site_name" content="ニンニン採用情報">
  <meta property="og:locale" content="ja_JP">
  <meta property="og:image" content="${SITE}img/ogp.png?v=20261015">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(desc)}">
  <meta name="twitter:image" content="${SITE}img/ogp.png?v=20261015">

${headCommon}

${ldBlocks}
</head>
${bodyTop}

  <main id="main-content">

  <!-- パンくずリスト -->
  <div class="pt-16 lg:pt-[112px] bg-cream border-b border-gray-200">
    <div class="max-w-[1140px] mx-auto px-4 lg:px-6 py-2 lg:py-3">
      <nav class="breadcrumb" aria-label="パンくずリスト">
        <ol class="flex items-center flex-wrap text-sm">
          <li><a href="index.html">ホーム</a></li>
          <li><span class="mx-2" aria-hidden="true">&gt;</span></li>
          <li><a href="jobs.html">募集要項</a></li>
          <li><span class="mx-2" aria-hidden="true">&gt;</span></li>
          <li aria-current="page"><span>お仕事ガイド</span></li>
        </ol>
      </nav>
    </div>
  </div>

  <!-- ページヘッダー -->
  <div class="subpage-hero subpage-hero--lp">
    <div class="particle-container" aria-hidden="true"></div>
    <span class="sec-bg-num sec-bg-num--right" aria-hidden="true">GUIDE</span>
    <div class="max-w-[1140px] mx-auto px-4 lg:px-6 subpage-hero__content">
      <div class="flex items-center gap-4">
        <div class="w-1 h-10 bg-pika flex-shrink-0"></div>
        <div>
          <p class="text-pika text-xs font-bold tracking-widest font-num mb-1">JOB GUIDE</p>
          <h1 class="font-heading font-black text-2xl lg:text-3xl text-white tracking-wide">${h1}</h1>
          <p class="subpage-hero__lead">仕事内容・知識・大変なところ・時給・面接をポケカ専門店ニンニンが解説</p>
        </div>
      </div>
    </div>
  </div>

  <article class="py-10 lg:py-14 bg-white">
    <div class="max-w-[800px] mx-auto px-4 lg:px-6 jp-text text-gray-700 leading-relaxed">

      <div class="guide-summary">
        <p class="guide-summary__ttl">先に結論</p>
        ${list([
    '<strong>仕事内容</strong>：カードの販売・接客、買取査定、在庫管理・値付け、対戦スペースやイベントの運営など。アルバイトはレジ・陳列・仕分けから始めて、慣れたら買取査定の補助へ進みます。',
    '<strong>知識</strong>：ポケカやトレカの知識は入社後の研修で学べます。大阪店ではスタッフの8割がトレカ未経験から始めています。',
    '<strong>条件（ニンニンの場合）</strong>：アルバイトは時給1,400〜1,500円・週3日以上の通し勤務が基本。正社員は月給25万〜50万円。',
    '<strong>応募</strong>：履歴書は面接時でOK。応募から3営業日以内に担当者よりご連絡します。',
  ])}
      </div>
      <p class="text-xs text-gray-500 mt-3">株式会社NINJA（ポケモンカード専門店ニンニン）採用チームが、募集要項と店長インタビューをもとに作成しました。最終更新 ${updated}</p>

      ${h2('work', 'カードショップのバイトの仕事内容')}
      <p class="mb-4">カードショップ（トレカショップ）の仕事は、レジに立つだけではありません。ポケモンカードの場合、シングルカード（1枚売り）やパックの販売、お客様が持ち込んだカードの買取査定、値付けと在庫の管理、対戦スペースや大会の運営まで、お店を回す仕事が幅広くあります。ニンニンの募集要項にある仕事は次のとおりです。</p>
      <h3 class="font-bold text-gray-900 mt-6 mb-2">アルバイトの主な仕事</h3>
      ${list(['レジ対応・カード販売の接客', '商品の陳列・整理・在庫補充', 'カードの仕分け・スリーブ入れ作業', '店内の清掃・ディスプレイ整備', '慣れてきたら買取査定の補助'])}
      <p class="mb-4">先輩スタッフがマンツーマンで教えるので、アルバイトが初めての方でも始められます。</p>
      <h3 class="font-bold text-gray-900 mt-6 mb-2">正社員の主な仕事</h3>
      ${list(['ポケモンカードのシングル販売・パック販売の接客対応', 'カードの買取査定・在庫管理・値付け作業', 'オリパ（オリジナルパック）の企画・作成', '対戦スペースの運営・イベントの企画サポート', 'ECサイトへの商品登録・発送業務', '店舗ディスプレイの作成・SNS運用'])}
      <img src="img/index/gallery_cards.webp" alt="値札付きのポケモンカードが並ぶニンニンの店内" class="w-full mt-6" decoding="async" loading="lazy" width="1400" height="696">

      ${h2('knowledge', 'ポケカやトレカの知識は必要？')}
      <p class="mb-4">応募の時点で知識は必要ありません。入社後の研修で、カードの種類・レアリティ・相場観など、仕事に必要な知識を学べます。大阪店の店長によると、ニンニン大阪ではスタッフの8割がトレカ未経験から始めて活躍しています。</p>
      ${q('カード知識よりも大切なのは、お客様を楽しませたいという気持ちです。', '秋葉原店 店長', 'interview.html#akihabara')}
      <p class="mb-4">面接ではポケモンカードとの関わりやお気に入りのカード・デッキを聞くことがありますが、詳しくなくても大丈夫です。「興味がある」という気持ちがあれば十分です。</p>

      ${h2('hard', '「きつい」と言われるのはどんなところ？')}
      <p class="mb-4">「カードショップのバイトはきつい」という声を見かけることもあります。ニンニンで働く場合に、応募前に知っておいてほしい点を正直にまとめました。</p>
      ${list([
    '<strong>基本は通し勤務です。</strong>アルバイトは平日12:45〜20:15、土日祝10:45〜20:15が基本で、週3日以上働ける方を募集しています（店舗により時短勤務は応相談）。週1〜2日・短時間だけ働きたい方には合わないかもしれません。',
    '<strong>土日に勤務できる方を優遇しています。</strong>',
    '<strong>買取査定にはカードの相場の知識が要ります。</strong>研修でレアリティや相場観を学び、アルバイトは慣れてから査定の補助を任されます。',
    '<strong>社員割引はありません。</strong>交通費は一部支給（上限あり）です。',
  ])}
      <p class="mb-4">一方で、毎日の変化や、お店づくりに関われることにやりがいを感じるスタッフも多い仕事です。</p>
      ${q('大会運営や買取、SNS発信など幅広い仕事に関われるため、毎日変化があって飽きません。', '大阪店 店長', 'interview.html#osaka')}
      ${q('シフトの相談がしやすく、スタッフ同士の協力体制もしっかりしています。', '秋葉原店 店長', 'interview.html#akihabara')}

      ${h2('pay', '時給・給料はどのくらい？')}
      <h3 class="font-bold text-gray-900 mt-6 mb-2">アルバイト</h3>
      <dl class="store-dl">
        <dt>時給</dt><dd>1,400〜1,500円（試用期間は時給1,400円。最短3ヶ月・最長1年で本採用の時給1,500円に自動更新）</dd>
        <dt>勤務時間</dt><dd>平日 12:45〜20:15／土日祝 10:45〜20:15（基本は通し勤務・週3日以上）</dd>
        <dt>交通費</dt><dd>一部支給（上限あり）</dd>
        <dt>保険</dt><dd>労災保険（勤務日数・時間により社会保険加入あり）</dd>
        <dt>その他</dt><dd>研修制度・制服貸与・正社員登用制度あり</dd>
      </dl>
      <h3 class="font-bold text-gray-900 mt-6 mb-2">正社員</h3>
      <dl class="store-dl">
        <dt>月給</dt><dd>25万円〜50万円（経験・能力による）</dd>
        <dt>勤務時間</dt><dd>10:00〜20:00（実働8時間・シフト制）</dd>
        <dt>賞与・昇給</dt><dd>賞与 年2回（7月・12月）／昇給 年1回（4月）</dd>
        <dt>休日</dt><dd>週休2日制（シフト制）・年末年始・有給休暇</dd>
        <dt>保険</dt><dd>社会保険完備（雇用保険・労災保険・健康保険・厚生年金）</dd>
      </dl>
      <p class="mt-4 mb-4">くわしい条件は<a href="jobs.html#part-time" class="store-dl__map">アルバイトの募集要項</a>・<a href="jobs.html#full-time" class="store-dl__map">正社員の募集要項</a>をご覧ください。</p>

      ${h2('student', '高校生・大学生・フリーターでも働ける？')}
      <p class="mb-4">高校生の方はご応募いただけません。大学生・専門学校生の方は応相談です（基本は週3日以上の通し勤務のため、長く安定して働ける方を優先しています）。学校のテスト期間や長期休暇の相談もできます。フリーターの方は歓迎です。</p>

      ${h2('interview', '面接では何を聞かれる？服装は？')}
      ${list([
    '応募はWebの応募フォームか、採用ダイヤル（<a href="tel:03-4363-7710" class="font-num">03-4363-7710</a>・年中無休 13:00〜20:00）から。履歴書は応募時には不要で、面接時にご持参ください。',
    '応募から3営業日以内に担当者よりご連絡します。',
    '面接では志望動機やこれまでのご経験のほか、ポケモンカードとの関わりやお気に入りのカード・デッキをお聞きすることがあります。堅苦しい面接ではなく、お互いを知るための対話です。',
    '服装はカジュアルでOKです。',
    '勤務地は面接でご希望をお伺いします。自宅から通いやすい店舗への配属が基本で、複数の店舗を希望として伝えられます。',
  ])}

      ${h2('fulltime', '正社員として働くには？')}
      <p class="mb-4">正社員（店舗スタッフ）も募集しています。販売・買取に加えて、オリパの企画、ECサイトの運営、SNS運用など、お店づくり全体に関われます。アルバイトから正社員への登用制度もあります。</p>
      ${q('「こうした方がお客様に喜ばれる」「こんなイベントをやりたい」という提案を積極的に聞いてもらえるため、やらされる仕事ではなく、自分でお店を作っている感覚があります。', '秋葉原店 店長', 'interview.html#akihabara')}

      ${h2('stores', 'ニンニンで働ける店舗')}
      <p class="mb-4">東京（秋葉原・中野・池袋）・横浜・大宮・大阪（日本橋）・沖縄の全国11拠点で募集しています。店舗ごとの住所・最寄り駅と応募条件は各店舗の求人ページにまとめています。</p>
      <nav aria-label="店舗別求人">
        <ul class="store-nav">
          ${storeItems}
        </ul>
      </nav>
    </div>
  </article>

  <!-- CTA -->
  <section class="sec-cta">
    <div class="sec-cta-bg" aria-hidden="true"></div>
    <div class="max-w-[800px] mx-auto px-5 text-center relative z-10">
      <p class="text-sm font-num tracking-widest text-white/60 mb-4">JOIN OUR TEAM</p>
      <h2 class="text-2xl lg:text-4xl font-heading font-black text-white mb-4 tracking-wide">ポケカが好きなら、<br>まずは話を聞きに来てください。</h2>
      <p class="text-gray-400 text-xs mb-2">お電話でのお問い合わせ・ご応募</p>
      <a href="tel:03-4363-7710" class="cta-phone font-num">03-4363-7710</a>
      <p class="text-gray-500 text-xs mb-8">年中無休 / 受付時間 13:00〜20:00</p>
      <a href="entry.html" class="btn-cta-large magnetic-btn cta-shimmer" data-cta="guide-bottom">
        応募フォームへ進む
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
      </a>
      <p class="text-gray-500 text-xs mt-6"><a href="jobs.html" class="underline">募集要項を見る</a></p>
    </div>
  </section>

  </main>

${bodyBottom}
`
}
writeFileSync(join(ROOT, GUIDE), guidePage())
console.log(`wrote ${GUIDE}`)

// sitemap.xml: 店舗 URL を差し替え（<!-- stores --> 〜 <!-- /stores --> の間）
const today = new Date().toISOString().slice(0, 10)
const sm = read('sitemap.xml')
// OPEN 前（comingSoon）の店舗は noindex なので sitemap に載せない
const block = stores.filter((s) => !s.comingSoon).map((s) => `  <url>\n    <loc>${SITE}store-${s.slug}.html</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`).join('\n')
const next = sm.includes('<!-- stores -->')
  ? sm.replace(/<!-- stores -->[\s\S]*?<!-- \/stores -->/, `<!-- stores -->\n${block}\n  <!-- /stores -->`)
  : sm.replace('</urlset>', `  <!-- stores -->\n${block}\n  <!-- /stores -->\n</urlset>`)
writeFileSync(join(ROOT, 'sitemap.xml'), next)
console.log('sitemap.xml updated')
