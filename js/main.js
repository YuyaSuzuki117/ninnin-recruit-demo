/* ============================================
   ニンニン求人サイト — Main JavaScript
   モバイルメニュー・スムーススクロール・アニメーション
   アクセシビリティ対応
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initStickyHeader();
  initMobileMenu();
  initSmoothScroll();
  initScrollAnimations();
  initFormValidation();
  initPageTopButton();
});

/* --- スティッキーヘッダー（スクロール時影付加） --- */
function initStickyHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;

    if (currentScroll > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
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

      const target = document.querySelector(targetId);
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

  const elements = document.querySelectorAll('.animate-on-scroll');

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

/* --- フォームバリデーション（アクセシビリティ対応） --- */
function initFormValidation() {
  const form = document.getElementById('entry-form');
  if (!form) return;

  // aria-live リージョン（フォームエラー通知用）
  const liveRegion = document.getElementById('form-errors');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    let isValid = true;
    const errorMessages = [];

    // 前回のエラーをクリア
    clearAllErrors(form);

    // 必須フィールドのバリデーション
    const requiredFields = form.querySelectorAll('[required]');
    requiredFields.forEach(field => {
      // チェックボックスの場合は checked で判定
      const isEmpty = field.type === 'checkbox' ? !field.checked : !field.value.trim();
      if (isEmpty) {
        isValid = false;
        setFieldError(field, 'この項目は必須です');
        errorMessages.push(`${getFieldLabel(field)}: この項目は必須です`);
      }
    });

    // メールバリデーション
    const emailField = form.querySelector('[type="email"]');
    if (emailField && emailField.value.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailField.value)) {
        isValid = false;
        setFieldError(emailField, '有効なメールアドレスを入力してください');
        errorMessages.push('メールアドレス: 有効なメールアドレスを入力してください');
      }
    }

    // 電話番号バリデーション
    const phoneField = form.querySelector('[type="tel"]');
    if (phoneField && phoneField.value.trim()) {
      const phoneRegex = /^[\d\-+() ]{10,}$/;
      if (!phoneRegex.test(phoneField.value)) {
        isValid = false;
        setFieldError(phoneField, '有効な電話番号を入力してください');
        errorMessages.push('電話番号: 有効な電話番号を入力してください');
      }
    }

    if (isValid) {
      // 成功メッセージ
      const successMsg = document.createElement('div');
      successMsg.className = 'mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-center';
      successMsg.setAttribute('role', 'status');
      successMsg.setAttribute('aria-live', 'polite');
      successMsg.innerHTML = '<p class="font-bold text-lg mb-1">送信完了</p><p>ご応募ありがとうございます。担当者より折り返しご連絡いたします。</p>';
      form.appendChild(successMsg);

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.classList.add('opacity-50');
      submitBtn.setAttribute('aria-disabled', 'true');

      // aria-live で送信完了を通知
      if (liveRegion) {
        liveRegion.textContent = '送信が完了しました。担当者より折り返しご連絡いたします。';
      }
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

  // リアルタイムでエラーをクリア（入力時）
  form.addEventListener('input', (e) => {
    const field = e.target;
    if (field.getAttribute('aria-invalid') === 'true') {
      clearFieldError(field);
    }
  });

  // チェックボックスの変更時もエラーをクリア
  form.addEventListener('change', (e) => {
    const field = e.target;
    if (field.type === 'checkbox' && field.getAttribute('aria-invalid') === 'true') {
      clearFieldError(field);
    }
  });

  function setFieldError(field, message) {
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

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      pageTopBtn.classList.remove('opacity-0', 'pointer-events-none');
      pageTopBtn.classList.add('opacity-100');
    } else {
      pageTopBtn.classList.add('opacity-0', 'pointer-events-none');
      pageTopBtn.classList.remove('opacity-100');
    }
  }, { passive: true });
}
