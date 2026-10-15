/* ============================================
   ニンニン求人サイト — Main JavaScript
   モバイルメニュー・スムーススクロール・アニメーション
   アクセシビリティ対応
   ============================================ */

initScrollResetOnNavigate();
const recruitAttribution = captureAttribution();

document.addEventListener('DOMContentLoaded', () => {
  initStickyHeader();
  initMobileMenu();
  initSmoothScroll();
  initScrollAnimations();
  initFloatingCTA();
  initClarityEvents();
  initTelTracking();
  initFormValidation();
  initPageTopButton();
  initStaggerReveal();
  initMagneticButtons();
  initFAQAccordion();
  initActiveNavHighlight();
  initScrollProgress();
});

/* --- 流入経路の記録（ファーストタッチ90日保持 + 直近の流入）---
   応募時に Google フォーム「流入詳細」へ、そのまま読める日本語で送る（シートの対応メモ・通知メールに出る）。
   例: X広告（横浜）｜初回 10/13 横浜店ページに着地｜応募元 横浜店ページ
   先頭の「｜」までが流入元の名前（週次サマリはここで数える）。
   応募フォームの「何で知りましたか」（任意）の回答は末尾に「｜本人回答 Xの広告」と付き、
   自動の記録が不明のときだけ先頭の名前が「友人・知人の紹介（本人回答）」のように回答に替わる。
   公式サイトのバナーは utm_source=ninnin_official、X 広告は twclid で判定（UTM なしなら x/ad）、UTM なしは参照元ドメインで判定。
   保存するのは目印（UTM・参照元）のままで、名前への変換は attributionLabel() だけが行う。 --- */
function attributionLabel(raw) {
  const AD = { osaka: '大阪', yokohama: '横浜', toreren: 'トレレン秋葉原', akihabara: '秋葉原' };
  const BANNER = { top_shop: 'TOP下バナー', kakaku: '買取価格表下バナー', header: 'ヘッダー' };
  const tags = raw.replace(/\+twclid$/, '').split('/');
  if (/\+twclid$/.test(raw) || (tags[0] === 'x' && tags[1] === 'ad')) return 'X広告' + (tags[2] ? '（' + (AD[tags[2]] || tags[2]) + '）' : '');
  if (tags[0] === 'ninnin_official') return '公式サイト（' + (BANNER[tags[2]] || tags[2] || 'バナー') + '）';
  if (tags[0] === 'x' && tags[1] === 'post') return 'X投稿' + (tags[2] ? '（' + tags[2] + '）' : '');
  if (raw === '直接') return '不明（参照元なし）';
  if (raw === '公式サイト') return '公式サイト（バナー以外）';
  if (raw === 'X' || raw === 'com.twitter.android') return 'X（広告以外）';
  const search = /^検索\(.*?(google|yahoo|bing)\./.exec(raw);
  if (search) return '検索（' + { google: 'Google', yahoo: 'Yahoo!', bing: 'Bing' }[search[1]] + '）';
  if (/instagram/i.test(raw)) return 'Instagram';
  if (/youtube/i.test(raw)) return 'YouTube';
  if (/facebook/i.test(raw)) return 'Facebook';
  return raw;
}

function recruitPageName(path) {
  const STORES = { akihabara: '秋葉原店', 'akihabara-2': '秋葉原2号店', nakano: '中野店', ikebukuro: '池袋店', 'osaka-nipponbashi': '大阪日本橋店', 'osaka-nipponbashi-2': '大阪日本橋2号店', 'toreren-akihabara': 'トレレン秋葉原店', yokohama: '横浜店', omiya: '大宮店', okinawa: '沖縄店', 'osaka-nipponbashi-1-5': '大阪日本橋1.5号店', shinsaibashi: '心斎橋店' };
  const file = path.split('/').pop().replace(/\.html$/, '');
  const store = /^store-(.+)$/.exec(file);
  if (store) return (STORES[store[1]] || store[1]) + 'ページ';
  return { '': 'トップ', index: 'トップ', jobs: '募集要項', interview: 'インタビュー', entry: '応募フォーム' }[file] || file;
}

function captureAttribution() {
  const KEY = 'ninnin_recruit_attr';
  const TTL_MS = 90 * 24 * 60 * 60 * 1000;
  let params;
  try { params = new URLSearchParams(location.search); } catch (e) { params = new URLSearchParams(); }
  const utmTags = ['utm_source', 'utm_medium', 'utm_campaign'].map((k) => params.get(k) || '').filter(Boolean).join('/');
  // X 広告のクリックは着地 URL に twclid が付く。UTM の無い広告でも「x/ad」として残す
  const utm = params.get('twclid') ? (utmTags ? utmTags + '+twclid' : 'x/ad') : utmTags;

  let refLabel = '直接';
  let fromPage = ''; // 応募フォームを開く直前に見ていたサイト内のページ
  try {
    if (document.referrer) {
      const ref = new URL(document.referrer);
      const host = ref.hostname;
      // 求人サイト内の移動は流入ではない（本番は公式と同一ドメインなので /recruit 配下のみ内部扱い）
      if (host === location.hostname && (host !== 'nin-nin-pokeka.jp' || ref.pathname.indexOf('/recruit') === 0)) {
        refLabel = '';
        if (/entry\.html$/.test(location.pathname)) fromPage = ref.pathname;
      }
      else if (host === 'nin-nin-pokeka.jp') refLabel = '公式サイト';
      else if (/(^|\.)(t\.co|x\.com|twitter\.com)$|^com\.twitter\.android$/.test(host)) refLabel = 'X';
      else if (/(^|\.)(google|yahoo|bing)\./.test(host)) refLabel = '検索(' + host + ')';
      else refLabel = host;
    } else {
      // 参照元を渡さないアプリ内ブラウザは、UA に出るアプリ名で補う
      const ua = navigator.userAgent;
      if (/Twitter for iP|TwitterAndroid/.test(ua)) refLabel = 'X';
      else if (/\bLine\//.test(ua)) refLabel = 'LINE';
      else if (/Instagram/.test(ua)) refLabel = 'Instagram';
    }
  } catch (e) { /* 参照元が読めなければ直接扱い */ }

  const today = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
  let store = null;
  try {
    store = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (store && Date.now() - store.savedAt > TTL_MS) store = null;
  } catch (e) { store = null; }
  if (!store && (utm || refLabel)) {
    store = { first: utm || refLabel, lp: location.pathname, date: today, savedAt: Date.now() };
  }
  // 直近の流入（参照元なしの再訪では上書きしない）
  const touch = utm || (refLabel !== '直接' ? refLabel : '');
  if (store && touch) { store.last = touch; store.lastDate = today; }
  if (store) {
    try {
      // 訪問回数: ブラウザを開き直すごとに 1 回
      if (!sessionStorage.getItem(KEY)) { sessionStorage.setItem(KEY, '1'); store.visits = (store.visits || 0) + 1; }
      localStorage.setItem(KEY, JSON.stringify(store));
    } catch (e) { /* 保存不可でも継続 */ }
  }
  const unknown = attributionLabel('直接');
  if (!store) return unknown;
  const md = (d) => Number(d.slice(5, 7)) + '/' + Number(d.slice(8, 10));
  const first = attributionLabel(store.first);
  const last = store.last ? attributionLabel(store.last) : first;
  // 先頭 = 流入元の名前。初回が不明で、後から分かった流入があればそちらを採る
  const parts = [first === unknown ? last : first, '初回 ' + md(store.date) + ' ' + recruitPageName(store.lp) + 'に着地' + (first === unknown && last !== first ? '（参照元なし）' : '')];
  if (last !== first) parts.push('再訪 ' + (store.lastDate ? md(store.lastDate) + ' ' : '') + last);
  if (fromPage) parts.push('応募元 ' + recruitPageName(fromPage));
  if (store.visits > 1) parts.push('訪問' + store.visits + '回');
  return parts.join('｜').slice(0, 200);
}

/* --- iOS Safari スクロール位置引き継ぎ対策 ---
   長いページの深い位置からリンク遷移すると、Safari が前ページの
   スクロール量を新ページに引き継ぎ、短いページでは最下部に着地する。
   通常の forward 遷移（hash なし）のみトップへリセットし、
   戻る/進む・bfcache 復帰・ページ内アンカーは復元挙動を尊重する。 --- */
function initScrollResetOnNavigate() {
  const nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
  const isForwardNavigate = !nav || nav.type === 'navigate';

  function resetToTop() {
    if (location.hash || !isForwardNavigate) return;
    if (window.scrollY === 0) return;
    // CSS の scroll-behavior:smooth をバイパスして即時ジャンプ
    const html = document.documentElement;
    const prev = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    html.style.scrollBehavior = prev;
  }

  resetToTop();
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) return; // bfcache 復帰はそのまま
    resetToTop();
  });
}

/* --- スティッキーヘッダー（スクロール時影付加） --- */
function initStickyHeader() {
  const header = document.querySelector('.site-header');
  const topBar = document.querySelector('.top-bar');
  if (!header) return;

  const topBarHeight = topBar ? topBar.offsetHeight : 0;
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const sy = window.scrollY;
        if (sy > 50) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
        /* Desktop: smoothly follow top-bar out of view */
        if (topBarHeight && window.innerWidth >= 1024) {
          header.style.top = Math.max(0, topBarHeight - sy) + 'px';
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

/* --- モバイルメニュー切り替え（アクセシビリティ対応） --- */
function initMobileMenu() {
  const toggle = document.getElementById('menu-toggle');
  const menu = document.getElementById('mobile-menu');
  const overlay = document.getElementById('mobile-menu-overlay');

  if (!toggle || !menu) return;

  // メニュー内のフォーカス可能な要素を取得
  function getFocusableElements() {
    return menu.querySelectorAll('a[href], button, [tabindex]:not([tabindex="-1"])');
  }

  function openMenu() {
    toggle.classList.add('active');
    menu.classList.add('open');
    if (overlay) overlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    // アクセシビリティ: aria-expanded と aria-hidden を切り替え
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'メニューを閉じる');
    menu.setAttribute('aria-hidden', 'false');

    // メニュー内の最初のリンクにフォーカス
    const focusable = getFocusableElements();
    if (focusable.length > 0) {
      requestAnimationFrame(() => {
        focusable[0].focus();
      });
    }
  }

  function closeMenu() {
    toggle.classList.remove('active');
    menu.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';

    // アクセシビリティ: aria-expanded と aria-hidden を切り替え
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'メニューを開く');
    menu.setAttribute('aria-hidden', 'true');

    // トグルボタンにフォーカスを戻す
    toggle.focus();
  }

  toggle.addEventListener('click', () => {
    if (menu.classList.contains('open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  if (overlay) {
    overlay.addEventListener('click', closeMenu);
  }

  // 閉じるボタン（メニュー内×ボタン）のクリックで閉じる
  const closeBtn = menu.querySelector('[data-menu-close]');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeMenu);
  }

  // メニューリンクのクリックで閉じる
  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Escape キーで閉じる
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('open')) {
      closeMenu();
    }
  });

  // フォーカストラップ: メニューが開いているときは Tab キーでメニュー内に閉じ込める
  menu.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || !menu.classList.contains('open')) return;

    const focusable = getFocusableElements();
    if (focusable.length === 0) return;

    const firstFocusable = focusable[0];
    const lastFocusable = focusable[focusable.length - 1];

    if (e.shiftKey) {
      // Shift + Tab: 最初の要素から戻ると最後の要素に移動
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
    } else {
      // Tab: 最後の要素から進むと最初の要素に移動
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  });
}

/* --- アンカーリンクのスムーススクロール --- */
function initSmoothScroll() {
  // prefers-reduced-motion を尊重
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;

      // 不正なセレクタは無視
      let target;
      try {
        target = document.querySelector(targetId);
      } catch (e2) {
        return;
      }
      if (!target) return;

      e.preventDefault();

      const headerHeight = document.querySelector('.site-header')?.offsetHeight || 0;
      const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight - 16;

      window.scrollTo({
        top: targetPosition,
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });

      // スクロール先にフォーカスを移動（スクリーンリーダー対応）
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });
}

/* --- スクロールアニメーション（Intersection Observer） --- */
function initScrollAnimations() {
  // prefers-reduced-motion を尊重
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const animClasses = '.fade-in, .slide-left, .slide-right, .scale-in, .slide-up, .animate-on-scroll';
  const elements = document.querySelectorAll(animClasses);

  if (elements.length === 0) return;

  // モーション無効の場合は即座にすべて表示
  if (prefersReducedMotion) {
    elements.forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  elements.forEach(el => observer.observe(el));
}

/* --- フローティングCTA（常時表示・本文CTA/フッターが見えている間だけ隠す） --- */
function initFloatingCTA() {
  const cta = document.getElementById('floating-cta');
  if (!cta) return;

  // entry.html（応募フォームページ）ではフローティングCTAを非表示にする
  if (document.body.classList.contains('page-entry')) {
    cta.style.display = 'none';
    return;
  }

  // 常時表示。本文内の主CTA・最終CTA・フッターが画面内にある間だけ隠す（重複表示を避ける）
  if (!('IntersectionObserver' in window)) return;
  const targets = document.querySelectorAll('.btn-primary-lg, .sec-cta, .site-footer, .btn-hero-primary, .btn-cta-large, .job-pick');
  if (!targets.length) return;
  const visible = new Set();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) visible.add(entry.target);
      else visible.delete(entry.target);
    });
    cta.classList.toggle('hidden-down', visible.size > 0);
  }, { rootMargin: '0px 0px -72px 0px', threshold: 0.15 });
  targets.forEach((el) => io.observe(el));

  // #part-time / #full-time のどちらが見えているかで、応募ボタンの ?type= を付ける（判定できない間は付けない）
  const btn = cta.querySelector('.floating-cta-btn');
  const sections = [['#part-time', '?type=%E3%82%A2%E3%83%AB%E3%83%90%E3%82%A4%E3%83%88'], ['#full-time', '?type=%E6%AD%A3%E7%A4%BE%E5%93%A1']]
    .map((s) => [document.querySelector(s[0]), s[1]]).filter((s) => s[0]);
  if (!btn || !sections.length) return;
  const baseHref = btn.getAttribute('href') || 'entry.html';
  const seen = new Map();
  const typeIo = new IntersectionObserver((entries) => {
    entries.forEach((entry) => seen.set(entry.target, entry.intersectionRatio));
    let best = null;
    sections.forEach((s) => {
      const r = seen.get(s[0]) || 0;
      if (r > 0 && (!best || r > best[0])) best = [r, s[1]];
    });
    btn.setAttribute('href', best ? baseHref.split('?')[0] + best[1] : baseHref);
  }, { threshold: [0, 0.1, 0.25, 0.5, 0.75] });
  sections.forEach((s) => typeIo.observe(s[0]));
}

/* --- Clarity 計測（応募ボタンのクリック位置・jobs ページの到達セクション） --- */
function sendClarity(name) {
  try { if (typeof window.clarity === 'function') window.clarity('event', name); } catch (e) { /* 計測失敗は握りつぶす */ }
}

function initClarityEvents() {
  const send = sendClarity;
  document.addEventListener('click', (e) => {
    try {
      const a = e.target && e.target.closest ? e.target.closest('a[href*="entry.html"]') : null;
      if (a) send('cta_' + ((a.dataset && a.dataset.cta) || 'other'));
    } catch (err) { /* 遷移は妨げない */ }
  });

  if (!('IntersectionObserver' in window) || !document.getElementById('full-time')) return;
  const reach = [['#full-time', 'reach_fulltime'], ['#part-time', 'reach_parttime'], ['.sec-cta', 'reach_cta']];
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const hit = reach.find((r) => document.querySelector(r[0]) === entry.target);
      if (hit) send(hit[1]);
      io.unobserve(entry.target);
    });
  }, { threshold: 0.1 });
  reach.forEach((r) => { const el = document.querySelector(r[0]); if (el) io.observe(el); });
}

/* --- 電話ボタンのタップ計測 ---
   tel: リンクは通信が起きずアクセスログに残らないので、タップ時に img/t.gif を読みに行かせて記録する。
   ログの例: GET /recruit/img/t.gif?ev=tel&pos=floating&pg=jobs&src=X広告 （集計は tmp/ninnin-yokohama/access-log-agg.mjs）
   pos = floating（画面下の固定ボタン）/ menu（スマホのメニュー内）/ cta（ページ下の応募案内）/ header（PC のヘッダー）/ inline（本文中）
   電話アプリへ切り替わってもページは閉じないので、画像の読み込みで足りる --- */
function initTelTracking() {
  document.addEventListener('click', (e) => {
    try {
      const a = e.target && e.target.closest ? e.target.closest('a[href^="tel:"]') : null;
      if (!a) return;
      const pos = a.classList.contains('floating-cta-phone') ? 'floating'
        : a.classList.contains('mobile-menu__phone') ? 'menu'
        : a.classList.contains('cta-phone') ? 'cta'
        : a.closest('header') ? 'header' : 'inline';
      const pg = location.pathname.split('/').pop().replace(/\.html$/, '') || 'index';
      sendClarity('tel_' + pos);
      new Image().src = 'img/t.gif?ev=tel&pos=' + pos + '&pg=' + encodeURIComponent(pg)
        + '&src=' + encodeURIComponent(String(recruitAttribution).split('｜')[0]) + '&r=' + Date.now();
    } catch (err) { /* 発信は妨げない */ }
  });
}

/* --- フォームバリデーション（アクセシビリティ対応） --- */
function initFormValidation() {
  const form = document.getElementById('entry-form');
  if (!form) return;

  // aria-live リージョン（フォームエラー通知用）
  const liveRegion = document.getElementById('form-errors');

  // --- URLパラメータでフォーム自動入力（jobs.html → entry.html 引き継ぎ） ---
  const params = new URLSearchParams(window.location.search);
  const jobType = params.get('type');
  if (jobType) {
    const radios = form.querySelectorAll('input[name="job_type"]');
    radios.forEach(radio => {
      if (radio.value === jobType) radio.checked = true;
    });
  }
  const locationParam = params.get('location');
  if (locationParam) {
    const locationSelect = form.querySelector('#location');
    if (locationSelect) {
      const options = Array.from(locationSelect.options);
      const match = options.find(opt => opt.value === locationParam);
      if (match) locationSelect.value = locationParam;
    }
  }

  // --- Clarity 計測（PII なし・イベント名のみ） ---
  form.addEventListener('focusin', () => sendClarity('form_start'), { once: true });
  const erroredFields = new Set();
  function trackFieldError(name) {
    if (!name || erroredFields.has(name)) return;
    erroredFields.add(name);
    sendClarity('err_' + name);
  }

  // --- textarea 自動伸長 ---
  form.querySelectorAll('textarea').forEach(ta => {
    ta.addEventListener('input', () => {
      ta.style.height = 'auto';
      ta.style.height = ta.scrollHeight + 'px';
    });
  });

  // --- 必須エラー文言（項目別） ---
  const REQUIRED_MESSAGES = {
    name: 'お名前を入力してください',
    furigana: 'ふりがなを入力してください',
    email: 'メールアドレスを入力してください',
    phone: '電話番号を入力してください',
    location: '希望勤務地を選択してください',
    privacy: 'プライバシーポリシーへの同意が必要です',
  };

  // --- 個別フィールドバリデーション（blur + submit 共通） ---
  function validateField(field) {
    const name = field.getAttribute('name') || field.id;
    // 全角・カタカナ入力の正規化（blur・submit 共通。値を書き戻して表示も揃える）
    if (field.type !== 'checkbox' && field.type !== 'radio' && field.type !== 'select-one' && typeof field.value === 'string' && field.value) {
      let v = field.value;
      if (field.type === 'tel' || name === 'phone') {
        v = v.normalize('NFKC').replace(/[ー－―‐−]/g, '-');
      } else if (field.type === 'email' || name === 'email') {
        v = v.normalize('NFKC').trim();
      } else if (name === 'furigana') {
        v = v.normalize('NFKC').replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
      } else if (name === 'age') {
        v = v.normalize('NFKC').trim();
      }
      if (v !== field.value) field.value = v;
    }
    const value = field.value ? field.value.trim() : '';
    let error = '';

    // チェックボックスの必須判定
    if (field.type === 'checkbox') {
      if (field.hasAttribute('required') && !field.checked) {
        error = name === 'privacy' ? 'プライバシーポリシーへの同意が必要です' : 'この項目は必須です';
      }
      if (field.closest('label')) field.closest('label').classList.toggle('has-error', !!error);
      showFieldError(field, error);
      return !error;
    }

    // 必須チェック
    if (field.hasAttribute('required') && !value) {
      error = REQUIRED_MESSAGES[name] || 'この項目は必須です';
    }
    // メール形式チェック
    else if ((field.type === 'email' || name === 'email') && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      error = '有効なメールアドレスを入力してください';
    }
    // 電話番号形式チェック
    else if ((field.type === 'tel' || name === 'phone') && value && !/^[\d\-+() ]{10,}$/.test(value)) {
      error = '有効な電話番号を入力してください';
    }
    // ふりがなチェック（ひらがな・スペースのみ）
    else if (name === 'furigana' && value && !/^[\u3040-\u309F\u30FC\s]+$/.test(value)) {
      error = 'ひらがなで入力してください';
    }
    // 年齢チェック
    else if (name === 'age' && value) {
      const age = parseInt(value, 10);
      if (!/^\d+$/.test(value) || isNaN(age) || age > 99) {
        error = '18〜99の数値を入力してください';
      } else if (age < 18) {
        error = '18歳以上の方が対象です';
      }
    }

    showFieldError(field, error);
    return !error;
  }

  function showFieldError(field, message) {
    // まずエラーをクリア
    clearFieldError(field);

    if (!message) return;

    field.setAttribute('aria-invalid', 'true');
    field.classList.add('border-red-500');
    trackFieldError(field.name || field.id);

    // 対応する error 要素があれば使う
    const errorId = field.id + '-error';
    const errorEl = document.getElementById(errorId);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.hidden = false;
    } else {
      // フォールバック: 動的にエラー要素を作成
      const error = document.createElement('p');
      error.className = 'error-message form-error';
      error.textContent = message;
      error.setAttribute('role', 'alert');
      field.parentNode.appendChild(error);
    }
  }

  // --- blurイベントで個別バリデーション ---
  const blurTargets = form.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="number"], textarea');
  blurTargets.forEach(field => {
    field.addEventListener('blur', () => {
      // 一度も入力されていない空フィールドはblur時にバリデーションしない（UX考慮）
      // ただし、一度エラーが出た後は再バリデーションする
      if (!field.value.trim() && field.getAttribute('aria-invalid') !== 'true' && !field._blurValidated) {
        return;
      }
      field._blurValidated = true;
      validateField(field);
    });
  });

  // チェックボックスはchange時にバリデーション
  form.querySelectorAll('input[type="checkbox"][required]').forEach(field => {
    field.addEventListener('change', () => {
      validateField(field);
    });
  });

  // --- submit バリデーション ---
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    sendClarity('submit_try');

    let isValid = true;
    const errorMessages = [];

    // 前回のエラーをクリア
    clearAllErrors(form);

    // 全フィールドをバリデーション（select[required] を含む。radio は下のグループ検証で扱う）
    const validatableFields = form.querySelectorAll('input[required]:not([type="radio"]), textarea[required], select[required], input[type="email"], input[type="tel"], input[name="age"]');
    validatableFields.forEach(field => {
      const fieldValid = validateField(field);
      if (!fieldValid) {
        isValid = false;
        const label = getFieldLabel(field);
        const errorId = field.id + '-error';
        const errorEl = document.getElementById(errorId);
        const msg = errorEl && errorEl.textContent ? errorEl.textContent : 'この項目は必須です';
        errorMessages.push(`${label}: ${msg}`);
      }
    });

    // 必須ラジオグループ（希望職種）— novalidate 環境では標準検証が効かないため自前で「いずれか選択必須」
    const requiredRadioNames = new Set();
    form.querySelectorAll('input[type="radio"][required]').forEach(r => requiredRadioNames.add(r.name));
    requiredRadioNames.forEach(groupName => {
      const firstRadio = form.querySelector(`input[name="${groupName}"]`);
      const checked = form.querySelector(`input[name="${groupName}"]:checked`);
      const errorEl = document.getElementById(groupName + '-error');
      const fs = firstRadio ? firstRadio.closest('fieldset') : null;
      const legend = fs ? fs.querySelector('legend') : null;
      const label = legend ? legend.textContent.replace('必須', '').trim() : (groupName || '選択項目');
      if (fs) fs.classList.toggle('has-error', !checked);
      if (!checked) {
        isValid = false;
        if (errorEl) { errorEl.textContent = 'いずれかを選択してください'; errorEl.hidden = false; }
        if (firstRadio) firstRadio.setAttribute('aria-invalid', 'true');
        trackFieldError(groupName);
        errorMessages.push(`${label}: いずれかを選択してください`);
      } else {
        if (errorEl) { errorEl.textContent = ''; errorEl.hidden = true; }
        if (firstRadio) firstRadio.removeAttribute('aria-invalid');
      }
    });

    if (isValid) {
      sendClarity('submit_valid');
      submitEntryForm();
    } else {
      // aria-live でエラー件数を通知
      if (liveRegion) {
        liveRegion.textContent = `入力エラーが${errorMessages.length}件あります。${errorMessages.join('。')}`;
      }

      // 最初のエラーフィールドにフォーカス
      const firstErrorField = form.querySelector('[aria-invalid="true"]');
      if (firstErrorField) {
        firstErrorField.focus();
      }
    }
  });

  // --- フォーム送信（Google フォームへ送信 → 採用管理シートへ自動取込） ---
  const FORM_ENDPOINT = 'https://docs.google.com/forms/d/e/1FAIpQLSejyfjZMzDMjfIONjWN1ByoChy9wPReVtvh6913ag3kcmo7iw/formResponse';
  // Google フォーム側の entry.ID（フォーム項目との対応・ninnin-recruit-form.json と一致）
  const FORM_ENTRY = {
    name: 'entry.1628432266',
    furigana: 'entry.1049953475',
    email: 'entry.66930341',
    phone: 'entry.1288521894',
    age: 'entry.1948866994',
    job_type: 'entry.1942523993',
    location: 'entry.542653453',
    motivation: 'entry.1845980084',
    questions: 'entry.1699287720',
    source: 'entry.2023564994',
    source_detail: 'entry.157378797',
  };

  async function submitEntryForm() {
    const submitBtn = form.querySelector('button[type="submit"]');
    const btnLabel = submitBtn.querySelector('span');
    const originalLabel = btnLabel ? btnLabel.textContent : '';
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 二重送信防止 + 送信中表示
    submitBtn.disabled = true;
    submitBtn.classList.add('opacity-50');
    submitBtn.setAttribute('aria-disabled', 'true');
    if (btnLabel) btnLabel.textContent = '送信中…';
    if (liveRegion) liveRegion.textContent = '送信しています。しばらくお待ちください。';

    // 前回の結果メッセージを削除
    form.querySelectorAll('.form-submit-result').forEach(el => el.remove());

    const fd = new FormData(form);
    const jobTypeChecked = form.querySelector('input[name="job_type"]:checked');

    let ok = false;
    let isBot = false;
    // ハニーポットに入力がある場合はボット判定 → 送信せず成功表示のみ
    if ((fd.get('_honey') || '').toString().trim()) {
      ok = true;
      isBot = true;
    } else {
      const params = new URLSearchParams();
      params.set(FORM_ENTRY.name, (fd.get('name') || '').toString());
      params.set(FORM_ENTRY.furigana, (fd.get('furigana') || '').toString());
      params.set(FORM_ENTRY.email, (fd.get('email') || '').toString());
      params.set(FORM_ENTRY.phone, (fd.get('phone') || '').toString());
      params.set(FORM_ENTRY.age, (fd.get('age') || '').toString());
      params.set(FORM_ENTRY.job_type, jobTypeChecked ? jobTypeChecked.value : '');
      params.set(FORM_ENTRY.location, (fd.get('location') || '').toString());
      params.set(FORM_ENTRY.motivation, (fd.get('motivation') || '').toString());
      params.set(FORM_ENTRY.questions, (fd.get('questions') || '').toString());
      params.set(FORM_ENTRY.source, '求人サイト');
      // 「何で知りましたか」（任意）の回答を流入詳細に足す。自動の記録が不明なら、回答を流入元の名前にする
      const heard = (fd.get('heard_from') || '').toString();
      const unknownSource = attributionLabel('直接');
      params.set(FORM_ENTRY.source_detail, !heard ? recruitAttribution
        : recruitAttribution.startsWith(unknownSource) ? heard + '（本人回答）' + recruitAttribution.slice(unknownSource.length)
        : recruitAttribution + '｜本人回答 ' + heard);
      // Google フォームの formResponse は CORS 非対応 → no-cors（不透明応答）。
      // 応答内容は仕様上読めないため「サーバー側の受理可否」は直接判定できない。
      // → 必須項目（勤務地 select / 希望職種 radio 含む）を送信前に厳格検証し、
      //   ネットワーク失敗・タイムアウトは下の catch で確実に「失敗」扱いにする（成功を偽装しない）。
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      try {
        await fetch(FORM_ENDPOINT, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
          signal: controller.signal,
        });
        ok = true;
      } catch (err) {
        ok = false; // ネットワーク失敗 / 12秒タイムアウト → 失敗としてエラー表示
      } finally {
        clearTimeout(timeoutId);
      }
    }

    // 本物の応募が成功した場合のみ、CV 計測用の完了ページ（thanks.html）へ遷移する。
    // ボット（ハニーポット検知）は遷移させず、CV を汚さない。
    if (ok && !isBot) {
      window.location.href = 'thanks.html';
      return;
    }

    const msg = document.createElement('div');
    msg.className = 'form-submit-result mt-6 p-4 border rounded text-center';
    msg.setAttribute('role', 'status');
    msg.setAttribute('aria-live', 'polite');

    if (ok) {
      msg.classList.add('bg-green-50', 'border-green-200', 'text-green-800');
      msg.innerHTML = '<p class="font-bold text-lg mb-1">送信完了</p><p>ご応募ありがとうございます。担当者より3営業日以内にご連絡いたします。</p>';
      if (btnLabel) btnLabel.textContent = '送信しました';
      if (liveRegion) {
        liveRegion.textContent = '送信が完了しました。担当者より折り返しご連絡いたします。';
      }
    } else {
      sendClarity('submit_fail');
      msg.classList.add('bg-red-50', 'border-red-200', 'text-red-800');
      msg.innerHTML = '<p class="font-bold text-lg mb-1">送信に失敗しました</p><p>お手数ですが時間をおいて再度お試しいただくか、<a href="tel:03-4363-7710" class="underline font-bold whitespace-nowrap">03-4363-7710</a>（年中無休 13:00〜20:00）までお電話ください。</p>';
      if (liveRegion) {
        liveRegion.textContent = '送信に失敗しました。時間をおいて再度お試しください。';
      }
      // 失敗時は再送信できるように復帰
      submitBtn.disabled = false;
      submitBtn.classList.remove('opacity-50');
      submitBtn.removeAttribute('aria-disabled');
      if (btnLabel) btnLabel.textContent = originalLabel;
    }

    form.appendChild(msg);
    msg.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
  }

  // 希望職種を選んだらエラー表示を外す
  form.querySelectorAll('input[type="radio"]').forEach((r) => {
    r.addEventListener('change', () => {
      const fs = r.closest('fieldset');
      if (fs) fs.classList.remove('has-error');
      const errorEl = document.getElementById(r.name + '-error');
      if (errorEl) { errorEl.textContent = ''; errorEl.hidden = true; }
      form.querySelectorAll('input[name="' + r.name + '"]').forEach((x) => x.removeAttribute('aria-invalid'));
    });
  });

  // リアルタイムでエラーをクリア（入力時）— エラー表示中のフィールドのみ再バリデーション
  form.addEventListener('input', (e) => {
    const field = e.target;
    if (e.isComposing) return; // IME 変換中は正規化しない（確定後の input で再検証）
    if (field.getAttribute('aria-invalid') === 'true') {
      validateField(field);
    }
  });

  function clearFieldError(field) {
    field.removeAttribute('aria-invalid');
    field.classList.remove('border-red-500');

    // 対応する error 要素をクリア
    const errorId = field.id + '-error';
    const errorEl = document.getElementById(errorId);
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.hidden = true;
    }

    // 動的に作成したエラー要素も削除
    const dynamicError = field.parentNode.querySelector('.error-message');
    if (dynamicError) {
      dynamicError.remove();
    }
  }

  function clearAllErrors(form) {
    form.querySelectorAll('.error-message').forEach(el => el.remove());
    form.querySelectorAll('.form-error[id]').forEach(el => {
      el.textContent = '';
      el.hidden = true;
    });
    form.querySelectorAll('.form-input, input[type="checkbox"]').forEach(el => {
      el.classList.remove('border-red-500');
      el.removeAttribute('aria-invalid');
    });
    form.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));
  }

  function getFieldLabel(field) {
    // ラベル要素からテキストを取得
    const label = form.querySelector(`label[for="${field.id}"]`);
    if (label) {
      return label.textContent.replace('必須', '').trim();
    }
    // チェックボックスの場合は親ラベルを探す
    const parentLabel = field.closest('label');
    if (parentLabel) {
      return parentLabel.textContent.replace('必須', '').trim().substring(0, 20);
    }
    return field.name || 'フィールド';
  }
}

/* --- ページトップボタンの表示切替 --- */
function initPageTopButton() {
  const pageTopBtn = document.getElementById('page-top') || document.getElementById('page-top-btn');
  if (!pageTopBtn) return;

  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        if (window.scrollY > 400) {
          pageTopBtn.classList.remove('opacity-0', 'pointer-events-none');
          pageTopBtn.classList.add('opacity-100');
        } else {
          pageTopBtn.classList.add('opacity-0', 'pointer-events-none');
          pageTopBtn.classList.remove('opacity-100');
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

/* --- スタガーリビール（順番に表示するアニメーション） --- */
function initStaggerReveal() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const containers = document.querySelectorAll('.stagger-container');

  if (containers.length === 0) return;

  // モーション無効時は即座にすべて表示
  if (prefersReducedMotion) {
    containers.forEach(container => {
      container.classList.add('is-visible');
      container.querySelectorAll('.stagger-item').forEach(item => {
        item.classList.add('is-visible');
      });
    });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const container = entry.target;
        container.classList.add('is-visible');
        const items = container.querySelectorAll('.stagger-item');
        items.forEach((item, index) => {
          // stagger 50ms 刻み・最大 6 段（=最大 300ms）にキャップし波を締める
          setTimeout(() => {
            item.classList.add('is-visible');
          }, Math.min(index, 6) * 50);
        });
        observer.unobserve(container);
      }
    });
  }, { threshold: 0.15 });

  containers.forEach(container => observer.observe(container));
}

/* --- マグネティックボタン（カーソル追従） --- */
function initMagneticButtons() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  // タッチデバイスではスキップ
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (isTouchDevice) return;

  const buttons = document.querySelectorAll('.magnetic-btn');
  if (buttons.length === 0) return;

  const maxDistance = 100;
  const maxDisplacement = 8;

  buttons.forEach(btn => {
    btn.style.transition = 'transform 0.2s ease-out';

    let magRaf = null;

    btn.addEventListener('mousemove', (e) => {
      const clientX = e.clientX, clientY = e.clientY;
      if (magRaf) return;
      magRaf = requestAnimationFrame(() => {
        magRaf = null;
        const rect = btn.getBoundingClientRect();
        const deltaX = clientX - (rect.left + rect.width / 2);
        const deltaY = clientY - (rect.top + rect.height / 2);
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distance < maxDistance) {
          const strength = (maxDistance - distance) / maxDistance;
          btn.style.transform = `translate(${deltaX * strength * (maxDisplacement / maxDistance)}px, ${deltaY * strength * (maxDisplacement / maxDistance)}px)`;
        }
      });
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translate(0px, 0px)';
    });
  });
}

/* --- FAQアコーディオン --- */
function initFAQAccordion() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items = document.querySelectorAll('.faq-item');

  if (items.length === 0) return;

  // 最初のFAQ項目をデフォルトで開く
  const firstItem = items[0];
  if (firstItem && !firstItem.classList.contains('is-open')) {
    firstItem.classList.add('is-open');
  }

  items.forEach(item => {
    const header = item.querySelector('.faq-item-header');
    const content = item.querySelector('.faq-item-content');
    if (!header || !content) return;

    // 初期状態: コンテンツを閉じる
    if (!item.classList.contains('is-open')) {
      content.style.maxHeight = '0';
      content.style.overflow = 'hidden';
      if (!prefersReducedMotion) {
        content.style.transition = 'max-height 0.35s ease';
      }
      header.setAttribute('aria-expanded', 'false');
    } else {
      content.style.maxHeight = content.scrollHeight + 'px';
      content.style.overflow = 'hidden';
      if (!prefersReducedMotion) {
        content.style.transition = 'max-height 0.35s ease';
      }
      header.setAttribute('aria-expanded', 'true');
    }

    header.style.cursor = 'pointer';

    header.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');

      if (isOpen) {
        // 閉じる
        item.classList.remove('is-open');
        header.setAttribute('aria-expanded', 'false');
        if (prefersReducedMotion) {
          content.style.maxHeight = '0';
        } else {
          // scrollHeight から 0 へアニメーション
          content.style.maxHeight = content.scrollHeight + 'px';
          // 強制レイアウト再計算
          content.offsetHeight;
          content.style.maxHeight = '0';
        }
      } else {
        // 開く
        item.classList.add('is-open');
        header.setAttribute('aria-expanded', 'true');
        if (prefersReducedMotion) {
          content.style.maxHeight = content.scrollHeight + 'px';
        } else {
          content.style.maxHeight = content.scrollHeight + 'px';
        }
      }
    });

    // キーボード対応: Enter / Space でアコーディオン開閉
    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        header.click();
      }
    });

    // transitionend でoverflow制御
    if (!prefersReducedMotion) {
      content.addEventListener('transitionend', () => {
        if (item.classList.contains('is-open')) {
          content.style.maxHeight = 'none';
        }
      });
    }
  });
}

/* --- アクティブセクションナビハイライト（IntersectionObserver + サブページ対応） --- */
function initActiveNavHighlight() {
  const allNavLinks = document.querySelectorAll('.nav-link');
  const hashNavLinks = document.querySelectorAll('.nav-link[href^="#"]');

  // --- サブページ対応: 現在のページに対応するナビリンクをハイライト ---
  const currentPath = window.location.pathname;
  const currentPage = currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'index.html';

  // サブページ → 対応するナビリンクのhrefハッシュマッピング
  const pageToHashMap = {
    'jobs.html': '#jobs',
    'interview.html': '#interview'
  };

  const matchHash = pageToHashMap[currentPage];
  if (matchHash) {
    allNavLinks.forEach(link => {
      const href = link.getAttribute('href') || '';
      // index.html#jobs や index.html#interview にマッチ
      if (href.endsWith(matchHash)) {
        link.classList.add('nav-link--active');
      }
    });
    // サブページでは IntersectionObserver によるハイライトは不要なので終了
    return;
  }

  // --- index.html: IntersectionObserver でセクション単位のハイライト ---
  if (hashNavLinks.length === 0) return;

  // ナビリンクのhrefからセクション要素を取得
  const sections = [];
  hashNavLinks.forEach(link => {
    const targetId = link.getAttribute('href');
    if (targetId && targetId !== '#') {
      const section = document.querySelector(targetId);
      if (section) {
        sections.push({ el: section, link: link });
      }
    }
  });

  if (sections.length === 0) return;

  function clearActive() {
    allNavLinks.forEach(link => link.classList.remove('nav-link--active'));
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        clearActive();
        const match = sections.find(s => s.el === entry.target);
        if (match) {
          match.link.classList.add('nav-link--active');
        }
      }
    });
  }, {
    threshold: 0.2,
    rootMargin: '-80px 0px -40% 0px'
  });

  sections.forEach(s => observer.observe(s.el));
}

/* --- スクロールプログレスバー --- */
function initScrollProgress() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const progressBar = document.getElementById('scroll-progress');
  if (!progressBar) return;

  let ticking = false;

  function updateProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) {
      progressBar.style.width = '0%';
      ticking = false;
      return;
    }
    const progress = Math.min((scrollTop / docHeight) * 100, 100);
    progressBar.style.width = progress + '%';
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateProgress);
      ticking = true;
    }
  }, { passive: true });

  // 初期値設定
  updateProgress();
}
