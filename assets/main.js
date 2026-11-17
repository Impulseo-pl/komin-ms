/* Komin-Ms - skrypt strony (układ wg wzoru z 17.11.2026). Bez bibliotek. */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1) Wejścia sekcji przy przewijaniu. Stan startowy (ukrycie) włącza dopiero ta klasa,
  //    więc bez JS wszystko jest widoczne; timer awaryjny odsłania resztę po 3 s.
  var rv = [].slice.call(document.querySelectorAll('[data-rv]'));
  if (rv.length && 'IntersectionObserver' in window && !reduce) {
    root.classList.add('js-on');
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    rv.forEach(function (el) { io.observe(el); });
    setTimeout(function () {
      rv.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight) el.classList.add('in');
      });
    }, 3000);
  }

  // 2) Pasek pływający: na stronie głównej pojawia się po zejściu z pierwszego ekranu.
  var fh = document.querySelector('.fh[data-float]');
  if (fh) {
    var hero = document.querySelector('.hero');
    var busy = false;
    var upd = function () {
      var prog = hero ? hero.offsetHeight * 0.62 : 200;
      fh.classList.toggle('is-off', (window.scrollY || 0) < prog);
      busy = false;
    };
    window.addEventListener('scroll', function () { if (!busy) { busy = true; requestAnimationFrame(upd); } }, { passive: true });
    window.addEventListener('resize', upd, { passive: true });
    upd();
  }

  // 3) Menu na telefonie: zamknij po kliknięciu linku, poza panelem i klawiszem Escape.
  var mn = document.querySelector('.mnav');
  if (mn) {
    mn.addEventListener('click', function (e) { if (e.target.closest('a')) mn.removeAttribute('open'); });
    document.addEventListener('click', function (e) { if (mn.open && !mn.contains(e.target)) mn.removeAttribute('open'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') mn.removeAttribute('open'); });
  }

  // 4) Zdjęcia ze zleceń: zakładki przełączają parę zdjęć i opis w panelu.
  var tabs = [].slice.call(document.querySelectorAll('.film-b'));
  if (tabs.length) {
    var pick = function (id, focus) {
      tabs.forEach(function (b) {
        var on = b.getAttribute('data-job') === id;
        b.setAttribute('aria-selected', on ? 'true' : 'false');
        b.tabIndex = on ? 0 : -1;
        if (on && focus) b.focus();
      });
      [].forEach.call(document.querySelectorAll('[data-jobpane]'), function (p) {
        p.hidden = p.getAttribute('data-jobpane') !== id;
      });
    };
    tabs.forEach(function (b, i) {
      b.addEventListener('click', function () { pick(b.getAttribute('data-job')); });
      b.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        pick(tabs[(i + d + tabs.length) % tabs.length].getAttribute('data-job'), true);
      });
    });
  }

  // 5) Wstęga zdjęć: karty ustawione w łuk, przeciąganie myszą/palcem, strzałki z klawiatury.
  var rib = document.querySelector('.ribbon');
  if (rib) {
    var cards = [].slice.call(rib.querySelectorAll('.rb'));
    var n = cards.length, pos = 0, target = 0, raf = 0;
    var half = n / 2;
    var P = 1500;                                        // ta sama wartość co perspective w CSS
    var lay = function () {
      var w = cards[0].offsetWidth;
      cards.forEach(function (c, i) {
        var o = i - pos;
        o = ((o + half) % n + n) % n - half;              // zawinięcie w kółko
        var a = Math.abs(o), sg = o < 0 ? -1 : 1;
        // łuk wklęsły jak we wzorze: środek najdalej, skraje bliżej widza i obrócone do środka
        var x = sg * w * (1.16 * a - 0.184 * a * a);
        var z = Math.min(a * 325, P * 0.72);
        var ry = -o * 15;
        c.style.transform = 'translate(-50%,-50%) translateX(' + x.toFixed(1) + 'px) translateZ(' + z.toFixed(1) + 'px) rotateY(' + ry.toFixed(2) + 'deg)';
        c.style.zIndex = String(10 + Math.round(a * 10));
        c.style.opacity = a > 2.1 ? String(Math.max(0, 1 - (a - 2.1) / 0.45)) : '1';
        c.style.visibility = a > 2.55 ? 'hidden' : 'visible';
      });
    };
    var step = function () { return cards[0].offsetWidth * 1.3; };
    var run = function () {
      var d = target - pos;
      if (Math.abs(d) < 0.002) { pos = target; lay(); raf = 0; return; }
      pos += d * 0.12; lay(); raf = requestAnimationFrame(run);
    };
    var go = function (t) { target = t; if (reduce) { pos = target; lay(); return; } if (!raf) raf = requestAnimationFrame(run); };
    rib.classList.add('is-3d');
    lay();
    window.addEventListener('resize', lay, { passive: true });

    var sx = 0, sp = 0, drag = false, moved = false;
    rib.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      drag = true; moved = false; sx = e.clientX; sp = pos;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
    });
    window.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var dx = e.clientX - sx;
      if (!moved && Math.abs(dx) < 6) return;
      if (!moved) { moved = true; rib.classList.add('is-drag'); }
      pos = sp - dx / step(); target = pos; lay();
    }, { passive: true });
    var end = function () {
      if (!drag) return;
      drag = false; rib.classList.remove('is-drag');
      if (moved) go(Math.round(pos));
    };
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    rib.addEventListener('dragstart', function (e) { e.preventDefault(); });
    rib.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(Math.round(target) + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(Math.round(target) - 1); }
    });
    [].forEach.call(document.querySelectorAll('[data-rib]'), function (b) {
      b.addEventListener('click', function () { go(Math.round(target) + (b.getAttribute('data-rib') === 'next' ? 1 : -1)); });
    });
  }

  // 6) Zamknięcie strony: poświata idzie za kursorem.
  var cl = document.querySelector('.closing');
  if (cl && !reduce && window.matchMedia('(hover:hover)').matches) {
    cl.addEventListener('pointermove', function (e) {
      var r = cl.getBoundingClientRect();
      cl.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px');
      cl.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px');
    }, { passive: true });
  }
  // 7) Stopklatka: przyklejone tło jest widoczne tylko wtedy, gdy sekcja jest w kadrze.
  (function () {
    var pasy = document.querySelectorAll('.stopklatka');
    if (!pasy.length || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (wpisy) {
      wpisy.forEach(function (w) {
        var tlo = w.target.querySelector('.stk-bg');
        if (tlo) tlo.style.visibility = w.isIntersecting ? 'visible' : 'hidden';
      });
    }, { rootMargin: '200px 0px' });
    pasy.forEach(function (p) { io.observe(p); });
  })();
})();

// LICZNIK WAŻNOŚCI DEMA (K. 09.08: pełne odliczanie dni/godzin/minut/sekund).
// Element wstrzykuje multipage TYLKO w dema. Nie wita klienta przy wejściu - wjeżdża
// po zejściu z pierwszego ekranu i chowa się po powrocie na górę.
(function () {
  var el = document.querySelector('.demo-wazne');
  if (!el || !el.getAttribute('data-do')) return;
  var koniec = new Date(el.getAttribute('data-do') + 'T23:59:59');
  if (isNaN(koniec)) return;
  var txt = el.querySelector('.dw-txt') || el;
  var dwa = function (n) { return (n < 10 ? '0' : '') + n; };

  var cykl = parseInt(el.getAttribute('data-cykl') || '0', 10);   // dni; 0 = brak wznowienia
  function tyka() {
    var teraz = new Date(), ms = koniec - teraz;
    // po wygaśnięciu licznik rusza od nowa (K. 10.08) - dema i tak zostają, a odliczanie
    // ma dawać klientowi realne poczucie, że sprawa ma termin.
    while (ms <= 0 && cykl > 0) {
      koniec = new Date(koniec.getTime() + cykl * 86400000);
      ms = koniec - teraz;
    }
    if (ms <= 0) { txt.innerHTML = 'Wersja pokazowa wygasła'; el.classList.add('is-koniec'); return false; }
    var s = Math.floor(ms / 1000), d = Math.floor(s / 86400);
    var g = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sek = s % 60;
    var zegar = dwa(g) + ':' + dwa(m) + ':' + dwa(sek);
    txt.innerHTML = d > 0
      ? 'Wersja pokazowa · <b>' + d + ' dni</b> <span class="dw-zeg">' + zegar + '</span>'
      : 'Wersja pokazowa · <b class="dw-pilne">' + zegar + '</b>';
    el.classList.toggle('is-pilne', d === 0);
    return true;
  }
  if (tyka() !== false) setInterval(tyka, 1000);
  el.hidden = false;

  var tick = false;
  function stan() {
    el.classList.toggle('is-on', (window.scrollY || 0) > window.innerHeight * 0.55);
    tick = false;
  }
  window.addEventListener('scroll', function () {
    if (tick) return; tick = true; requestAnimationFrame(stan);
  }, { passive: true });
  stan();
})();

/* === licznik otwarć demo (buy-signal) v3 - geo po stronie serwera === */
(function(){try{if(String(location.protocol).indexOf('http')!==0)return;try{if(/[?&#]team=1/.test(location.search+location.hash)){localStorage.setItem('nb_team','1');}}catch(e){}try{if(localStorage.getItem('nb_team')==='1')return;}catch(e){}if(/crm-newbeginning|crm\.impulseo\.pl/.test(document.referrer||''))return;try{if(navigator.webdriver)return;}catch(e){}try{if(/^https?:\/\/(kris20032|impulseo-pl)\.github\.io\/?$/i.test(document.referrer||''))return;}catch(e){}if(sessionStorage.getItem('_dv'))return;sessionStorage.setItem('_dv','1');var seg=(location.pathname.split('/').filter(Boolean)[0])||'';var base=location.origin+(seg?('/'+seg):'');var ua='';try{ua=(navigator.userAgent||'').slice(0,300);}catch(e){}var EP='https://zngfubfinbojfgaxdrbf.supabase.co/functions/v1/demo-view';try{fetch(EP,{method:'POST',keepalive:true,headers:{'Content-Type':'text/plain'},body:JSON.stringify({demo_url:base,page:location.pathname,referrer:(document.referrer||null),user_agent:(ua||null)})}).catch(function(){});}catch(e){}}catch(e){}})();
