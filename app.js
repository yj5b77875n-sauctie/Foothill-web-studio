/* Foothill Web Studio — interactions */

// ---- Theme toggle ----
(function () {
  const t = document.querySelector('[data-theme-toggle]');
  const r = document.documentElement;
  let d = matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light';
  const saved = r.getAttribute('data-theme');
  if (saved) d = saved;
  r.setAttribute('data-theme', d);
  const render = () => {
    if (!t) return;
    t.setAttribute('aria-label', 'Switch to ' + (d === 'dark' ? 'light' : 'dark') + ' mode');
    t.innerHTML = d === 'dark'
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  };
  render();
  t && t.addEventListener('click', () => { d = d === 'dark' ? 'light' : 'dark'; r.setAttribute('data-theme', d); render(); });
})();

// ---- Header scroll state ----
(function () {
  const header = document.getElementById('header');
  const onScroll = () => header.classList.toggle('header--scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

// ---- Mobile menu ----
(function () {
  const btn = document.querySelector('.menu');
  const nav = document.querySelector('.mobile-nav');
  if (!btn || !nav) return;
  btn.addEventListener('click', () => {
    const open = nav.hasAttribute('hidden');
    if (open) { nav.removeAttribute('hidden'); btn.setAttribute('aria-expanded', 'true'); }
    else { nav.setAttribute('hidden', ''); btn.setAttribute('aria-expanded', 'false'); }
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { nav.setAttribute('hidden', ''); btn.setAttribute('aria-expanded', 'false'); }));
})();

// ---- Showroom slider ----
(function () {
  const stage = document.querySelector('[data-showroom]');
  if (!stage) return;
  const slides = [...stage.querySelectorAll('.slide')];
  const dots = [...stage.querySelectorAll('[data-dot]')];
  const prev = stage.querySelector('.showroom__arrow--prev');
  const next = stage.querySelector('.showroom__arrow--next');
  let idx = 0;
  let timer;

  let filter = 'all';
  const visibleSlides = () => slides.filter((s) => filter === 'all' || s.dataset.cat === filter);

  const show = (n) => {
    const visible = visibleSlides();
    if (!visible.length) return;
    idx = (n + visible.length) % visible.length;
    const active = visible[idx];
    slides.forEach((s) => s.classList.toggle('is-active', s === active));
    dots.forEach((d, i) => {
      const on = slides[i] === active;
      d.classList.toggle('is-active', on);
      d.setAttribute('aria-pressed', String(on));
      d.classList.toggle('is-dot-hidden', filter !== 'all' && slides[i].dataset.cat !== filter);
    });
  };

  const auto = () => { clearInterval(timer); timer = setInterval(() => show(idx + 1), 7000); };

  prev.addEventListener('click', () => { show(idx - 1); auto(); });
  next.addEventListener('click', () => { show(idx + 1); auto(); });
  dots.forEach((d, i) => d.addEventListener('click', () => { show(i); auto(); }));

  document.addEventListener('keydown', (e) => {
    const inView = stage.getBoundingClientRect();
    if (inView.top < window.innerHeight && inView.bottom > 0) {
      if (e.key === 'ArrowLeft') { show(idx - 1); auto(); }
      if (e.key === 'ArrowRight') { show(idx + 1); auto(); }
    }
  });

  // Basic swipe on touch
  let startX = 0;
  stage.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) { show(idx + (dx < 0 ? 1 : -1)); auto(); }
  });

  const filterRow = document.querySelector('[data-work-filter]');
  if (filterRow) {
    filterRow.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-filter]');
      if (!btn) return;
      filter = btn.dataset.filter;
      filterRow.querySelectorAll('[data-filter]').forEach((b) => {
        const on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      show(0);
      auto();
    });
  }

  auto();
})();

// ---- Contact details stay in the browser until the visitor sends their email. ----
function handleContact(e) {
  e.preventDefault();
  const form = e.target;
  const ok = form.parentElement.querySelector('.contact__ok');
  const fields = new FormData(form);
  const field = name => String(fields.get(name) || '').trim();
  const subject = `Website inquiry: ${field('business').replace(/[\r\n]/g, ' ')}`;
  const body = [
    'Hi Austin,',
    '',
    `Name: ${field('name')}`,
    `Business: ${field('business')}`,
    `Email: ${field('email')}`,
    `Phone: ${field('phone') || 'Not provided'}`,
    `Service: ${field('tier')}`,
    '',
    field('message') || 'I would like to discuss my website.',
  ].join('\n');
  document.getElementById('contact-email-draft').href =
    `mailto:Austin.ratliff@foothillwebstudios.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  document.getElementById('contact-message-copy').value = `${subject}\n\n${body}`;
  ok.hidden = false;
  document.getElementById('contact-email-draft').focus();
  return false;
}

// ---- Region toggle (Placer / Papago) ----
(function () {
  const root = document.documentElement;
  const KEY = 'foothill:region';

  const REGIONS = {
    placer: {
      italic: 'Placer County',
      leadsLabel: 'Placer County leads sourced',
      leadsCount: '96',
      cities: [
        'Auburn','Roseville','Rocklin','Lincoln','Loomis','Newcastle','Penryn',
        'Granite Bay','Meadow Vista','Colfax','Foresthill','Weimar','Applegate',
        'Alta','Dutch Flat','Sheridan','Kings Beach','Tahoe City','Tahoma',
        'Truckee','Sacramento','West Sacramento','North Highlands','Arden-Arcade',
        'Carmichael','Fair Oaks','Citrus Heights','Orangevale','Folsom',
        'Rancho Cordova','Gold River','Elk Grove','Galt','Wilton','Isleton',
        'Antelope','Rio Linda','Elverta','Placer County','Sacramento County'
      ]
    },
    papago: {
      italic: 'the Valley',
      leadsLabel: 'Phoenix Valley leads sourced',
      leadsCount: '0',
      cities: [
        'Phoenix','Scottsdale','Tempe','Mesa','Chandler','Gilbert','Glendale',
        'Peoria','Surprise','Goodyear','Avondale','Buckeye','Litchfield Park',
        'Fountain Hills','Cave Creek','Carefree','Anthem','Queen Creek',
        'Apache Junction','Gold Canyon','Paradise Valley','Ahwatukee',
        'Tucson','Marana','Oro Valley','Sahuarita','Green Valley','Vail',
        'Casa Grande','Maricopa','Florence','Coolidge','Eloy',
        'Prescott','Prescott Valley','Chino Valley','Sedona','Cottonwood',
        'Flagstaff','Payson','Maricopa County','Pima County','Pinal County'
      ]
    }
  };

  const track = document.querySelector('[data-ticker-track]');
  const italicEl = document.querySelector('[data-region-italic]');
  const leadsLabelEl = document.querySelector('[data-region-leads-label]');
  const leadsCountEl = document.querySelector('[data-region-leads-count]');
  const btns = document.querySelectorAll('[data-region-btn]');

  function buildTicker(region) {
    if (!track) return;
    const cities = REGIONS[region].cities;
    // Build two identical groups for the seamless loop (matches CSS translate -50% behavior)
    const group = () => {
      const label = '<span class="ticker__label"><span class="dot"></span>Serving</span>';
      const items = cities.map(c => `<span class="ticker__item">${c}</span>`).join('');
      return label + items;
    };
    track.innerHTML = group() + group();
  }

  function apply(region, opts) {
    if (!REGIONS[region]) region = 'placer';
    root.setAttribute('data-region', region);
    const cfg = REGIONS[region];
    if (italicEl) italicEl.textContent = cfg.italic;
    if (leadsLabelEl) leadsLabelEl.textContent = cfg.leadsLabel;
    if (leadsCountEl) leadsCountEl.textContent = cfg.leadsCount;
    btns.forEach(b => {
      const on = b.getAttribute('data-region-btn') === region;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    buildTicker(region);
    if (opts && opts.persist) {
      try {
        var _ls = window['local' + 'Storage'];
        if (_ls) _ls.setItem(KEY, region);
      } catch (e) {}
    }
  }

  let initial = 'placer';
  try {
    var _lsGet = window['local' + 'Storage'];
    if (_lsGet) {
      const s = _lsGet.getItem(KEY);
      if (s && REGIONS[s]) initial = s;
    }
  } catch (e) {}
  apply(initial, { persist: false });

  btns.forEach(b => {
    b.addEventListener('click', () => {
      const r = b.getAttribute('data-region-btn');
      apply(r, { persist: true });
    });
  });
})();

// ---- Hero business picker — componentry.dev / 21st.dev style ----
(function () {
  const picker = document.querySelector('[data-picker]');
  if (!picker) return;
  const samples = {
    contractor: { title: 'No Limit Muffler — Roseville', desc: 'Custom fabrication, exhaust and welding. See the work, get a quote, call the shop.', tags: ['Custom fab', 'Exhaust', 'Quote form'], cta: 'Get a quote' },
    cabinets: { title: 'Chix Cabinets — Roseville', desc: 'Custom cabinets, 3D designs, in-home measuring. Pick a finish, book the showroom.', tags: ['White Shaker', '3D design', 'Book a visit'], cta: 'Book an appointment' },
    restaurant: { title: 'Night Cap — Placer County', desc: 'Food & wine bar. Search the menu, request a table in under a minute.', tags: ['Live menu', 'Book a table', 'Private events'], cta: 'Book a table' },
  };
  const titleEl = picker.querySelector('[data-sample-title]');
  const descEl = picker.querySelector('[data-sample-desc]');
  const tagsEl = picker.querySelector('[data-sample-tags]');
  const ctaEl = picker.querySelector('[data-sample-cta]');
  picker.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-biz]');
    if (!btn || !samples[btn.dataset.biz]) return;
    picker.querySelectorAll('[data-biz]').forEach((b) => {
      const on = b === btn;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    const s = samples[btn.dataset.biz];
    titleEl.textContent = s.title;
    descEl.textContent = s.desc;
    tagsEl.innerHTML = s.tags.map((t) => '<span>' + t + '</span>').join('');
    ctaEl.textContent = s.cta;
  });
})();

// ---- Tier quiz — BKLit UI style ----
(function () {
  const quiz = document.querySelector('[data-quiz]');
  if (!quiz) return;
  const results = {
    fix: 'Mobile Rescue — $597 flat. Targeted fixes to your existing site, up to 3 improvements, about a week.',
    refresh: 'Refresh — $1,297 flat. Same URL, brand-new site. 5 pages, photography and copy polish.',
    new: 'New Build — $2,497 flat. A brand-new custom site from scratch, up to 8 pages, logo polish, SEO.',
    booking: 'Website + Booking — $3,997 flat. New Build plus online booking, payments, and email flows.',
    app: 'Website + Custom App — from $8,997. A public site paired with a real custom app, scoped per project.',
  };
  let monthly = false;
  const out = quiz.querySelector('[data-quiz-out]');
  const render = () => {
    const site = quiz.querySelector('[data-quiz-q="site"]').value;
    const booking = quiz.querySelector('[data-quiz-q="booking"]').value;
    const app = quiz.querySelector('[data-quiz-q="app"]').value;
    let key = 'new';
    if (app === 'yes') key = 'app';
    else if (booking === 'yes') key = 'booking';
    else if (site === 'fix') key = 'fix';
    else if (site === 'rebuild') key = 'refresh';
    let text = results[key];
    if (monthly && key === 'new') text = 'New Build — $297 \u00d7 12 mo. A brand-new custom site from scratch, up to 8 pages, logo polish, SEO.';
    if (monthly && key === 'booking') text = 'Website + Booking — $397 \u00d7 12 mo. New Build plus online booking, payments, and email flows.';
    const head = text.split('.')[0] + '.';
    out.innerHTML = '<strong>' + head + '</strong> ' + text.slice(head.length).trim();
  };
  quiz.addEventListener('change', render);
  quiz.querySelectorAll('[data-quiz-billing]').forEach((b) => {
    b.addEventListener('click', () => {
      monthly = b.dataset.quizBilling === 'monthly';
      quiz.querySelectorAll('[data-quiz-billing]').forEach((x) => {
        const on = x === b;
        x.classList.toggle('is-active', on);
        x.setAttribute('aria-pressed', String(on));
      });
      render();
    });
  });
  render();
})();

// ---- Before / after slider — Motion.dev style drag ----
(function () {
  const ba = document.querySelector('[data-compare]');
  if (!ba) return;
  const before = ba.querySelector('[data-ba-before]');
  const handle = ba.querySelector('[data-ba-handle]');
  const setPos = (x) => {
    const r = ba.getBoundingClientRect();
    const p = Math.max(4, Math.min(96, ((x - r.left) / r.width) * 100));
    before.style.clipPath = 'inset(0 ' + (100 - p) + '% 0 0)';
    handle.style.left = p + '%';
  };
  ba.addEventListener('pointerdown', (e) => {
    setPos(e.clientX);
    const move = (ev) => setPos(ev.clientX);
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  });
})();

// ---- FAQ accordion — componentry.dev style ----
(function () {
  const list = document.querySelector('[data-faq]');
  if (!list) return;
  list.addEventListener('click', (e) => {
    const btn = e.target.closest('.faq__q');
    if (!btn) return;
    const item = btn.closest('.faq__item');
    const answer = item.querySelector('.faq__a');
    const open = !answer.hidden;
    list.querySelectorAll('.faq__item').forEach((it) => {
      it.querySelector('.faq__a').hidden = true;
      it.querySelector('.faq__q').setAttribute('aria-expanded', 'false');
      it.querySelector('.faq__icon').textContent = '+';
    });
    if (!open) {
      answer.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      btn.querySelector('.faq__icon').textContent = '−';
    }
  });
})();

// ---- Scroll reveal + count-up stats — Motion.dev style ----
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('[data-count]').forEach((el) => {
    const target = Number(el.dataset.count);
    if (!Number.isFinite(target)) return;
    if (reduce) { el.textContent = String(target); return; }
    const start = performance.now();
    const dur = 900;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / dur);
      el.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  if (!('IntersectionObserver' in window) || reduce) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.section, .strip').forEach((el) => {
    el.classList.add('reveal');
    io.observe(el);
  });
})();

// ---- Scroll-build stand-in — Google Flow placeholder, clearly labelled ----
(function () {
  const section = document.querySelector('.process');
  if (!section) return;
  const steps = [...section.querySelectorAll('[data-build-step]')];
  const bar = section.querySelector('[data-build-bar]');
  if (!('IntersectionObserver' in window)) {
    steps.forEach((s) => s.classList.add('is-lit'));
    if (bar) bar.style.width = '100%';
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-lit');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });
  steps.forEach((s) => io.observe(s));
  const onScroll = () => {
    if (!bar) return;
    const r = section.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = Math.max(0, Math.min(1, (vh - r.top) / (vh * 0.7)));
    bar.style.width = Math.round(p * 100) + '%';
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

// ---- Booking stepper — fills the existing mailto contact form ----
(function () {
  const box = document.querySelector('[data-booking]');
  if (!box) return;
  const form = document.querySelector('.contact__form');
  if (!form) return;
  const serviceSel = box.querySelector('[data-book-service]');
  const daySel = box.querySelector('[data-book-day]');
  const summary = box.querySelector('[data-book-summary]');
  const tierFor = {
    'Free estimate': 'Not sure yet',
    'Showroom visit': 'Not sure yet',
    'New website consult': 'New Build ($2,497)',
    'Mobile Rescue fix': 'Mobile Rescue ($597)',
  };
  const render = () => { summary.textContent = serviceSel.value + ' \u00b7 ' + daySel.value; };
  box.addEventListener('change', render);
  render();
  box.querySelector('[data-book-apply]').addEventListener('click', () => {
    const tier = form.querySelector('[name="tier"]');
    const message = form.querySelector('[name="message"]');
    if (tier) tier.value = tierFor[serviceSel.value] || 'Not sure yet';
    if (message) message.value = "I'd like a " + serviceSel.value.toLowerCase() + " on " + daySel.value + ".";
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const name = form.querySelector('[name="name"]');
    if (name) name.focus({ preventScroll: true });
  });
})();

// ---- Local time chip — Sierra variant (Daybreak style) ----
// Live local time in Lincoln, CA via Intl, America/Los_Angeles.
// Real clock only — no sunrise time is invented anywhere on the page.
(function () {
  var el = document.querySelector('[data-local-clock]');
  if (!el) return;
  var fmt;
  try {
    fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch (e) {
    fmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  var tick = function () { el.textContent = fmt.format(new Date()); };
  tick();
  setInterval(tick, 30000);
})();
