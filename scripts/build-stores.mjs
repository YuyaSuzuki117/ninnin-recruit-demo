// 店舗別求人ページ生成: data/stores.json → store-<slug>.html
// ヘッダー・フッター・フローティング CTA・head の共通部分・募集条件テーブル・JobPosting の雛形は jobs.html から切り出す（4 ページ統一を保つ）
// 使い方: node scripts/build-stores.mjs   （repo 直下で実行。sitemap.xml の店舗 URL も更新する）
import { readFileSync, writeFileSync } from 'node:fs'
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
  description: `${base.description} 勤務地はニンニン ${s.name}（${s.access}）です。`,
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
    : `${full}のアルバイト・正社員求人｜ポケカ専門店｜${s.access}`
  const desc = s.comingSoon
    ? `ポケモンカード専門店ニンニンの${s.name}は2026年秋口にオープン予定。オープニングスタッフ（アルバイト・正社員）の募集を予定しています。未経験歓迎、ポケカの知識は入社後に学べます。`
    : `ポケモンカード専門店ニンニン${s.name}（${addr}・${s.access}）の求人。アルバイトは時給1,400〜1,500円、正社員は月給25万円〜50万円。未経験歓迎、ポケカの知識は入社後に学べます。`
  const url = `${SITE}store-${s.slug}.html`
  const loc = `&location=${encodeURIComponent(s.formValue)}`
  const breadcrumb = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'ホーム', item: `${SITE}` },
    { '@type': 'ListItem', position: 2, name: '店舗一覧', item: `${SITE}index.html#stores` },
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
          <p class="job-pick__cond">平日 12:45〜20:15／土日祝 10:45〜20:15</p>
          <p class="job-pick__cond">週3日以上・通し勤務<span class="job-pick__note">高校生不可・学生は応相談・店舗により時短応相談</span></p>
          <div class="job-pick__actions">
            <a class="btn-primary job-pick__btn" data-cta="store-parttime" href="${typeParam.part}${loc}">${s.name}に応募する</a>
            <a class="job-pick__more" href="#part-time">詳細を見る ↓</a>
          </div>
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
          <p class="job-pick__assure">履歴書は面接時にご持参（応募時は不要）・3営業日以内にご連絡</p>
        </div>
      </div>`

  const storeInfo = `
  <section class="py-12 lg:py-16 bg-cream" aria-labelledby="store-info-title">
    <div class="max-w-[1140px] mx-auto px-4 lg:px-6">
      <div class="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
        <div>
          <p class="sec-label">STORE</p>
          <h2 id="store-info-title" class="font-heading font-bold text-2xl lg:text-3xl text-gray-900 mb-4">${full}について</h2>
          <p class="jp-text text-gray-700 leading-relaxed mb-5">${s.area}でポケカのアルバイト・正社員を探している方へ。${full}は${s.comingSoon ? '2026年秋口にオープン予定の' : `${s.access}の`}ポケモンカード専門店です。${s.comingSoon || !s.note ? '' : s.note}カードの販売・買取・査定、オリパの企画、対戦スペースの運営など、お客様の「好き」を支える仕事をお任せします。</p>
          <dl class="store-dl">
            <dt>店舗名</dt><dd>${full}</dd>
            ${addr ? `<dt>住所</dt><dd>${addr}${mapUrl ? `<br><a href="${mapUrl}" target="_blank" rel="noopener noreferrer" class="store-dl__map">Googleマップで見る</a>` : ''}</dd>` : ''}
            <dt>アクセス</dt><dd>${s.access}</dd>
            <dt>募集職種</dt><dd>${s.comingSoon ? 'オープニングスタッフ（アルバイト・正社員）募集予定' : '店舗スタッフ（アルバイト・正社員）'}</dd>
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
  <meta name="robots" content="index, follow">
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
  <meta property="og:image" content="${SITE}img/ogp.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(desc)}">
  <meta name="twitter:image" content="${SITE}img/ogp.png">

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
    <span class="sec-bg-num sec-bg-num--right" data-parallax-speed="-0.3" aria-hidden="true">STORE</span>
    <div class="max-w-[1140px] mx-auto px-4 lg:px-6 subpage-hero__content">
      <div class="flex items-center gap-4">
        <div class="w-1 h-10 bg-pika flex-shrink-0"></div>
        <div>
          <p class="text-pika text-xs font-bold tracking-widest font-num mb-1">${s.area.toUpperCase()}</p>
          <h1 class="font-heading font-black text-2xl lg:text-3xl text-white tracking-wide">${s.comingSoon ? `${full}のオープニングスタッフ求人` : `${full}のアルバイト・正社員求人`}</h1>
          <p class="subpage-hero__lead"><span class="whitespace-nowrap">ポケモンカード専門店｜</span><span class="whitespace-nowrap">${s.access}</span></p>
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

// sitemap.xml: 店舗 URL を差し替え（<!-- stores --> 〜 <!-- /stores --> の間）
const today = new Date().toISOString().slice(0, 10)
const sm = read('sitemap.xml')
const block = stores.map((s) => `  <url>\n    <loc>${SITE}store-${s.slug}.html</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`).join('\n')
const next = sm.includes('<!-- stores -->')
  ? sm.replace(/<!-- stores -->[\s\S]*?<!-- \/stores -->/, `<!-- stores -->\n${block}\n  <!-- /stores -->`)
  : sm.replace('</urlset>', `  <!-- stores -->\n${block}\n  <!-- /stores -->\n</urlset>`)
writeFileSync(join(ROOT, 'sitemap.xml'), next)
console.log('sitemap.xml updated')
