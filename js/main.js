/* ============================================
   ニンニン求人サイト — Main JavaScript
   モバイルメニュー・スムーススクロール・アニメーション
   アクセシビリティ対応
   ============================================ */

initScrollResetOnNavigate();

document.addEventListener('DOMContentLoaded', () => {
  initStickyHeader();
  initMobileMenu();
  initSmoothScroll();
  initScrollAnimations();
  initFloatingCTA();
  initFormValidation();
  initPageTopButton();
  initCountUpAnimated();
  initParallax();
  initCardTilt();
  initStaggerReveal();
  initMagneticButtons();
  initFloatingParticles();
  initFAQAccordion();
  initActiveNavHighlight();
  initScrollProgress();
});

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

/* --- フローティングCTA（スクロール方向で表示/非表示） --- */
function initFloatingCTA() {
  const cta = document.getElementById('floating-cta');
  if (!cta) return;

  // entry.html（応募フォームページ）ではフローティングCTAを非表示にする
  if (document.body.classList.contains('page-entry')) {
    cta.style.display = 'none';
    return;
  }

  let lastScroll = 0;
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const currentScroll = window.scrollY;

        if (currentScroll < 200) {
          cta.classList.add('hidden-down');
        } else if (currentScroll > lastScroll + 5) {
          // 下スクロール
          cta.classList.add('hidden-down');
        } else if (currentScroll < lastScroll - 5) {
          // 上スクロール
          cta.classList.remove('hidden-down');
        }

        lastScroll = currentScroll;
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
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

  // --- textarea 自動伸長 ---
  form.querySelectorAll('textarea').forEach(ta => {
    ta.addEventListener('input', () => {
      ta.style.height = 'auto';
      ta.style.height = ta.scrollHeight + 'px';
    });
  });

  // --- 個別フィールドバリデーション（blur + submit 共通） ---
  function validateField(field) {
    const name = field.getAttribute('name') || field.id;
    const value = field.value ? field.value.trim() : '';
    let error = '';

    // チェックボックスの必須判定
    if (field.type === 'checkbox') {
      if (field.hasAttribute('required') && !field.checked) {
        error = 'この項目は必須です';
      }
      showFieldError(field, error);
      return !error;
    }

    // 必須チェック
    if (field.hasAttribute('required') && !value) {
      error = 'この項目は必須です';
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
      if (isNaN(age) || age < 18 || age > 99) {
        error = '18〜99の数値を入力してください';
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

    let isValid = true;
    const errorMessages = [];

    // 前回のエラーをクリア
    clearAllErrors(form);

    // 全フィールドをバリデーション
    const validatableFields = form.querySelectorAll('input[required], textarea[required], input[type="email"], input[type="tel"], input[name="age"]');
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

    if (isValid) {
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
    // ハニーポットに入力がある場合はボット判定 → 送信せず成功表示のみ
    if ((fd.get('_honey') || '').toString().trim()) {
      ok = true;
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
      try {
        // Google フォームの formResponse は CORS 非対応 → no-cors（不透明応答）で送信。
        // ネットワーク成功で送信完了とみなす（応答内容は仕様上読めない）。
        await fetch(FORM_ENDPOINT, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
        });
        ok = true;
      } catch (err) {
        ok = false;
      }
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

  // リアルタイムでエラーをクリア（入力時）— エラー表示中のフィールドのみ再バリデーション
  form.addEventListener('input', (e) => {
    const field = e.target;
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

/* --- カウントアップアニメーション（easeOutCubic, IntersectionObserver） --- */
function initCountUpAnimated() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const elements = document.querySelectorAll('[data-count]');

  if (elements.length === 0) return;

  // モーション無効時は即時表示
  if (prefersReducedMotion) {
    elements.forEach(el => {
      el.textContent = formatCountNumber(parseInt(el.getAttribute('data-count'), 10));
    });
    return;
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function formatCountNumber(n) {
    return n.toLocaleString('en-US');
  }

  function animateCount(el) {
    const target = parseInt(el.getAttribute('data-count'), 10);
    if (isNaN(target)) {
      el.textContent = el.getAttribute('data-count');
      return;
    }

    const duration = 2000;
    let startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);
      const current = Math.round(easedProgress * target);

      el.textContent = formatCountNumber(current);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  // ビューポート外の要素は初期表示を「--」にしてアニメーション待機
  elements.forEach(el => {
    el.textContent = '--';
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  elements.forEach(el => observer.observe(el));
}

/* --- パララックススクロール --- */
function initParallax() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const elements = document.querySelectorAll('[data-parallax-speed]');
  if (elements.length === 0) return;

  let ticking = false;

  function updateParallax() {
    // モバイルではスキップ
    if (window.innerWidth < 768) {
      elements.forEach(el => { el.style.transform = ''; });
      ticking = false;
      return;
    }

    const scrollY = window.scrollY;
    elements.forEach(el => {
      const speed = parseFloat(el.getAttribute('data-parallax-speed')) || 0;
      const yOffset = speed * scrollY * 0.1;
      el.style.transform = `translateY(${yOffset}px)`;
    });
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }, { passive: true });
}

/* --- カードチルトエフェクト --- */
function initCardTilt() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  // タッチデバイスではスキップ
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (isTouchDevice) return;

  const cards = document.querySelectorAll('.tilt-card');
  if (cards.length === 0) return;

  const maxDeg = 12;

  cards.forEach(card => {
    card.style.transition = 'transform 0.15s ease-out';

    let tiltRaf = null;

    // インタラクション開始時のみ GPU 合成層へ昇格（アイドル時のメモリ浪費を回避）
    card.addEventListener('mouseenter', () => {
      card.style.willChange = 'transform';
    });

    card.addEventListener('mousemove', (e) => {
      const clientX = e.clientX, clientY = e.clientY;
      if (tiltRaf) return;
      tiltRaf = requestAnimationFrame(() => {
        tiltRaf = null;
        const rect = card.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((clientY - rect.top - centerY) / centerY) * -maxDeg;
        const rotateY = ((clientX - rect.left - centerX) / centerX) * maxDeg;

        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      });
    });

    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform 0.4s ease-out';
      card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg)';
      // 復帰後に高速トランジションに戻し、合成層を解放
      setTimeout(() => {
        card.style.transition = 'transform 0.15s ease-out';
        card.style.willChange = 'auto';
      }, 400);
    });
  });
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

/* --- フローティングパーティクル --- */
function initFloatingParticles() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const containers = document.querySelectorAll('.particle-container');
  if (containers.length === 0) return;

  // particleFloat キーフレームを動的に追加（一度だけ）
  if (!document.getElementById('particle-keyframes')) {
    const style = document.createElement('style');
    style.id = 'particle-keyframes';
    style.textContent = `
      @keyframes particleFloat {
        0%, 100% {
          transform: translateY(0) translateX(0) scale(1);
          opacity: 0;
        }
        10% {
          opacity: 0.6;
        }
        50% {
          transform: translateY(-80px) translateX(20px) scale(1.2);
          opacity: 0.3;
        }
        90% {
          opacity: 0.6;
        }
      }
      .particle {
        position: absolute;
        border-radius: 50%;
        background: var(--color-primary, #FFCB05);
        pointer-events: none;
        opacity: 0;
      }
    `;
    document.head.appendChild(style);
  }

  containers.forEach(container => {
    // position relativeを確保
    const computedPosition = getComputedStyle(container).position;
    if (computedPosition === 'static') {
      container.style.position = 'relative';
    }
    container.style.overflow = 'hidden';

    for (let i = 0; i < 15; i++) {
      const particle = document.createElement('span');
      particle.className = 'particle';

      const size = Math.random() * 6 + 4; // 4-10px
      const left = Math.random() * 100;    // 0-100%
      const top = Math.random() * 100;     // 0-100%
      const duration = Math.random() * 7 + 8; // 8-15s
      const delay = Math.random() * 5;     // 0-5s

      particle.style.width = size + 'px';
      particle.style.height = size + 'px';
      particle.style.left = left + '%';
      particle.style.top = top + '%';
      particle.style.animation = `particleFloat ${duration}s ${delay}s ease-in-out infinite`;

      container.appendChild(particle);
    }
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
