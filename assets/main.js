(function () {
  'use strict';

  /* =========================================================
   * 설정
   * FORM_ENDPOINT: 상담 신청을 받을 서버 주소 (JSON POST).
   * 비워두면 서버 전송 없이 완료 모달만 표시합니다.
   * ========================================================= */
  var FORM_ENDPOINT = '';

  /* 기종 데이터 (예시 금액 — 실제 정책에 맞게 수정하세요)
   * price: 출고가, subsidy: 공시지원금, extra: 가입유형별 추가지원금 */
  var PHONES = [
    { id: 's26u', brand: 'samsung', brandName: '삼성', name: '갤럭시 S26 Ultra 256GB', price: 1698400, subsidy: 500000, extra: { mnp: 700000, change: 450000, new: 400000 }, badge: 'BEST', shape: 'bar', color: ['#4b4f5c', '#9aa0b0'] },
    { id: 's26', brand: 'samsung', brandName: '삼성', name: '갤럭시 S26 256GB', price: 1155000, subsidy: 500000, extra: { mnp: 575000, change: 400000, new: 350000 }, badge: 'HOT', shape: 'bar', color: ['#a7c7ff', '#5b7cfa'] },
    { id: 'fold7', brand: 'samsung', brandName: '삼성', name: '갤럭시 Z 폴드7 256GB', price: 2379300, subsidy: 600000, extra: { mnp: 900000, change: 600000, new: 550000 }, shape: 'fold', color: ['#2d3142', '#6c7a96'] },
    { id: 'flip7', brand: 'samsung', brandName: '삼성', name: '갤럭시 Z 플립7 256GB', price: 1485000, subsidy: 550000, extra: { mnp: 800000, change: 550000, new: 500000 }, badge: 'HOT', shape: 'flip', color: ['#ffb3c7', '#ff5f8f'] },
    { id: 'a57', brand: 'samsung', brandName: '삼성', name: '갤럭시 A57 128GB', price: 599500, subsidy: 300000, extra: { mnp: 299500, change: 200000, new: 200000 }, badge: '공짜폰', shape: 'bar', color: ['#d2f5e3', '#3cc68a'] },
    { id: 'ip17pm', brand: 'apple', brandName: '애플', name: '아이폰 17 Pro Max 256GB', price: 1900000, subsidy: 450000, extra: { mnp: 600000, change: 350000, new: 300000 }, badge: 'NEW', shape: 'bar', color: ['#e9d8c4', '#b08d6a'] },
    { id: 'ip17p', brand: 'apple', brandName: '애플', name: '아이폰 17 Pro 256GB', price: 1700000, subsidy: 450000, extra: { mnp: 550000, change: 300000, new: 250000 }, shape: 'bar', color: ['#3d4a5c', '#8796ab'] },
    { id: 'ip17', brand: 'apple', brandName: '애플', name: '아이폰 17 256GB', price: 1290000, subsidy: 400000, extra: { mnp: 500000, change: 300000, new: 250000 }, shape: 'bar', color: ['#c9d8ff', '#7d9cff'] }
  ];
  var INSTALLMENT_MONTHS = 24;
  var TYPE_LABEL = { mnp: '번호이동', change: '기기변경', new: '신규가입' };

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var won = function (n) { return n.toLocaleString('ko-KR'); };

  /* ---------- 인기폰 카드 ---------- */
  var state = { type: 'mnp', brand: 'all' };
  var phonesEl = $('.js-phones');

  function phoneShape(p) {
    var cls = 'phone__shape' + (p.shape === 'fold' ? ' phone__shape--fold' : p.shape === 'flip' ? ' phone__shape--flip' : '');
    return '<div class="' + cls + '"><i style="background:linear-gradient(160deg,' + p.color[0] + ',' + p.color[1] + ')"></i></div>';
  }

  function renderPhones() {
    var list = PHONES.filter(function (p) { return state.brand === 'all' || p.brand === state.brand; });
    phonesEl.innerHTML = list.map(function (p) {
      var extra = p.extra[state.type];
      var final = Math.max(0, p.price - p.subsidy - extra);
      var monthly = Math.round(final / INSTALLMENT_MONTHS / 100) * 100;
      var badge = p.badge ? '<span class="phone__badge' + (p.badge === 'NEW' ? ' phone__badge--new' : '') + '">' + p.badge + '</span>' : '';
      return '' +
        '<article class="phone">' + badge +
          '<div class="phone__img">' + phoneShape(p) + '</div>' +
          '<span class="phone__brand">' + p.brandName + '</span>' +
          '<h3 class="phone__name">' + p.name + '</h3>' +
          '<div class="phone__row"><span>출고가</span><s>' + won(p.price) + '원</s></div>' +
          '<div class="phone__row phone__row--sub"><span>공시+추가지원</span><b>-' + won(p.subsidy + extra) + '원</b></div>' +
          '<div class="phone__price"><span>할부원금</span><b class="' + (final === 0 ? 'is-free' : '') + '">' + (final === 0 ? '0원' : won(final) + '원') + '</b></div>' +
          '<p class="phone__monthly">' + (final === 0 ? '기기값 부담 없음' : '월 ' + won(monthly) + '원 (' + INSTALLMENT_MONTHS + '개월)') + '</p>' +
          '<a href="#apply" class="btn btn--primary btn--block js-pick" data-model="' + p.name + '" data-type="' + TYPE_LABEL[state.type] + '">이 폰으로 상담</a>' +
        '</article>';
    }).join('');
  }

  $$('.tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      $$('.tab').forEach(function (t) { t.classList.remove('is-active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');
      state.type = tab.dataset.type;
      renderPhones();
    });
  });

  $$('.chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      $$('.chip').forEach(function (c) { c.classList.remove('is-active'); });
      chip.classList.add('is-active');
      state.brand = chip.dataset.brand;
      renderPhones();
    });
  });

  // 카드의 "이 폰으로 상담" → 견적 폼에 기종/가입유형 자동 입력
  phonesEl.addEventListener('click', function (e) {
    var btn = e.target.closest('.js-pick');
    if (!btn) return;
    var select = $('.js-model-select');
    select.value = btn.dataset.model;
    var radio = $('input[name="joinType"][value="' + btn.dataset.type + '"]');
    if (radio) radio.checked = true;
    setTimeout(function () { $('input[name="name"]').focus({ preventScroll: true }); }, 500);
  });

  // 기종 select 옵션
  var modelSelect = $('.js-model-select');
  PHONES.forEach(function (p) {
    var opt = document.createElement('option');
    opt.value = p.name;
    opt.textContent = p.name;
    modelSelect.appendChild(opt);
  });
  var etc = document.createElement('option');
  etc.value = '기타/추천받기';
  etc.textContent = '기타 / 추천받고 싶어요';
  modelSelect.appendChild(etc);

  renderPhones();

  /* ---------- 오늘 신청자 수 ---------- */
  // 시간대에 따라 자연스럽게 늘어나는 표시용 숫자
  function todayCount() {
    var now = new Date();
    var minutes = now.getHours() * 60 + now.getMinutes();
    return 37 + Math.floor(minutes * 0.31);
  }
  $$('.today-count').forEach(function (el) { el.textContent = won(todayCount()); });

  /* ---------- 실시간 신청 티커 ---------- */
  var LAST = '김이박최정강조윤장임한오서신권황안송류홍'.split('');
  var MODELS = PHONES.map(function (p) { return p.name.replace(/ \d+GB$/, ''); });
  var TYPES = ['번호이동', '기기변경', '신규가입'];
  var pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };

  function tickerItem() {
    var mins = 1 + Math.floor(Math.random() * 9);
    return '<li><b>' + pick(LAST) + '○○</b>님 · ' + pick(MODELS) + ' ' + pick(TYPES) + ' 신청 <em>' + mins + '분 전</em></li>';
  }

  var tickerList = $('.js-ticker');
  var tickerIndex = 0;
  var TICKER_SIZE = 12;
  tickerList.innerHTML = Array.apply(null, Array(TICKER_SIZE)).map(tickerItem).join('');
  setInterval(function () {
    tickerIndex++;
    tickerList.style.transform = 'translateY(' + (-24 * tickerIndex) + 'px)';
    if (tickerIndex >= TICKER_SIZE - 1) {
      // 끝에 다다르면 조용히 처음으로 되돌림
      setTimeout(function () {
        tickerList.style.transition = 'none';
        tickerIndex = 0;
        tickerList.innerHTML = Array.apply(null, Array(TICKER_SIZE)).map(tickerItem).join('');
        tickerList.style.transform = 'translateY(0)';
        void tickerList.offsetHeight;
        tickerList.style.transition = '';
      }, 600);
    }
  }, 2600);

  /* ---------- 숫자 카운트업 ---------- */
  function countUp(el) {
    var to = parseInt(el.dataset.to, 10);
    var start = null;
    var duration = 1200;
    function step(ts) {
      if (!start) start = ts;
      var t = Math.min(1, (ts - start) / duration);
      var eased = 1 - Math.pow(1 - t, 3);
      var v = Math.round(to * eased);
      el.textContent = el.dataset.format === 'won' ? won(v) : v;
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------- 스크롤 등장 애니메이션 ---------- */
  $$('.section__head, .benefit, .compare__card, .step, .review, .faq details, .saving').forEach(function (el) { el.classList.add('reveal'); });

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        if (el.classList.contains('count-up')) countUp(el);
        else el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { threshold: 0.15 });
    $$('.reveal, .count-up').forEach(function (el) { io.observe(el); });
  } else {
    $$('.reveal').forEach(function (el) { el.classList.add('is-in'); });
    $$('.count-up').forEach(countUp);
  }

  /* ---------- 헤더 / 맨위로 ---------- */
  var header = $('#header');
  var toTop = $('.to-top');
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 10);
    toTop.classList.toggle('is-visible', y > 600);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });

  /* ---------- 모달 ---------- */
  var lastFocus = null;
  function openModal(id) {
    lastFocus = document.activeElement;
    var m = document.getElementById(id);
    m.hidden = false;
    document.body.style.overflow = 'hidden';
    var btn = $('.btn', m);
    if (btn) btn.focus();
  }
  function closeModals() {
    $$('.modal').forEach(function (m) { m.hidden = true; });
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  $$('.js-close-modal').forEach(function (el) { el.addEventListener('click', closeModals); });
  $$('.js-open-privacy').forEach(function (el) { el.addEventListener('click', function () { openModal('privacyModal'); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModals(); });

  /* ---------- 상담 신청 폼 ---------- */
  function formatPhone(v) {
    var d = v.replace(/\D/g, '').slice(0, 11);
    if (d.length < 4) return d;
    if (d.length < 8) return d.slice(0, 3) + '-' + d.slice(3);
    return d.slice(0, 3) + '-' + d.slice(3, d.length - 4) + '-' + d.slice(-4);
  }

  $$('.js-lead-form').forEach(function (form) {
    var phoneInput = form.elements.phone;
    var nameInput = form.elements.name;
    var errorEl = $('.form__error', form);
    var submitBtn = $('button[type="submit"]', form);

    phoneInput.addEventListener('input', function () { phoneInput.value = formatPhone(phoneInput.value); });
    [phoneInput, nameInput].forEach(function (el) {
      el.addEventListener('input', function () { el.classList.remove('is-invalid'); errorEl.textContent = ''; });
    });

    function fail(msg, el) {
      errorEl.textContent = msg;
      if (el) { el.classList.add('is-invalid'); el.focus(); }
      return false;
    }

    function validate() {
      var name = nameInput.value.trim();
      var phone = phoneInput.value.replace(/\D/g, '');
      if (name.length < 2) return fail('이름을 2자 이상 입력해 주세요.', nameInput);
      if (!/^01[016789]\d{7,8}$/.test(phone)) return fail('올바른 휴대폰 번호를 입력해 주세요.', phoneInput);
      if (!form.elements.agree.checked) return fail('개인정보 수집·이용에 동의해 주세요.');
      return true;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) return;

      var data = {
        joinType: form.elements.joinType.value,
        carrier: form.elements.carrier.value,
        model: form.elements.model.value || '미정',
        name: nameInput.value.trim(),
        phone: phoneInput.value,
        submittedAt: new Date().toISOString(),
        page: location.href
      };

      submitBtn.disabled = true;
      var done = function () {
        submitBtn.disabled = false;
        form.reset();
        $('.js-done-msg').textContent = data.name + '님, 신청이 접수되었습니다. 전문 상담사가 ' + data.phone + '로 곧 연락드릴게요.';
        openModal('doneModal');
      };

      if (!FORM_ENDPOINT) { setTimeout(done, 400); return; }

      fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        done();
      }).catch(function () {
        submitBtn.disabled = false;
        fail('일시적인 오류로 신청에 실패했어요. 잠시 후 다시 시도하거나 1600-0000으로 전화 주세요.');
      });
    });
  });
})();
