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

  const show = (n) => {
    idx = (n + slides.length) % slides.length;
    slides.forEach((s, i) => s.classList.toggle('is-active', i === idx));
    dots.forEach((d, i) => {
      d.classList.toggle('is-active', i === idx);
      d.setAttribute('aria-pressed', String(i === idx));
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
