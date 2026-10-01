/* devenbhalerao.com — hand-built, no dependencies, no trackers.
   The page's own lists (roles, skills, projects, recognition) are the source of truth:
   every chart below is drawn from them, so editing the HTML updates the charts too. */
(function () {
  'use strict';

  var root = document.documentElement, TAU = Math.PI * 2, NS = 'http://www.w3.org/2000/svg';
  function $(s, el) { return (el || document).querySelector(s); }
  function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function f1(n) { return n.toFixed(1); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function safe(name, fn) { try { fn(); } catch (e) { if (window.console) console.error('[' + name + ']', e); } }
  function restart(el, cls) { el.classList.remove(cls); void el.getBoundingClientRect(); el.classList.add(cls); }
  function store(key, val) { try { localStorage.setItem(key, val); } catch (e) { /* private mode: not remembered */ } }
  function andList(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }

  /* ── Theme ───────────────────────────────────────────────────────────── */

  safe('theme', function () {
    var toggle = $('#theme-toggle');
    if (!toggle) return;
    var dark = window.matchMedia('(prefers-color-scheme: dark)');
    function current() { return root.dataset.theme || (dark.matches ? 'dark' : 'light'); }
    function sync() {
      var next = current() === 'dark' ? 'light' : 'dark';
      toggle.setAttribute('aria-label', 'Switch to ' + next + ' theme');
      toggle.setAttribute('title', 'Switch to ' + next + ' theme');
    }
    sync();
    toggle.addEventListener('click', function () {
      root.dataset.theme = current() === 'dark' ? 'light' : 'dark';
      store('theme', root.dataset.theme);
      sync();
    });
    // Follow the system while the visitor hasn't chosen a theme.
    if (dark.addEventListener) dark.addEventListener('change', function () { if (!root.dataset.theme) sync(); });
  });

  /* ── Animations switch (footer) ──────────────────────────────────────── */

  var motion = root.classList.contains('motion-on'), motionListeners = [];
  safe('motion', function () {
    var btn = $('#motion-toggle');
    if (!btn) return;
    btn.hidden = false;
    function sync() { btn.setAttribute('aria-pressed', String(motion)); btn.textContent = motion ? 'Animations on' : 'Animations off'; }
    sync();
    btn.addEventListener('click', function () {
      motion = !motion;
      root.classList.toggle('motion-on', motion);
      store('motion', motion ? 'on' : 'off');
      sync();
      motionListeners.forEach(function (fn) { safe('motion-listener', function () { fn(motion); }); });
    });
  });

  /* One shared animation loop. It only runs things that are on screen. */
  var loops = [], last = 0;
  function loop(el, fn) { loops.push({ el: el, fn: fn }); }
  function tick(now) {
    var dt = last ? Math.min(.05, (now - last) / 1000) : 0;
    last = now;
    if (motion && !document.hidden) {
      for (var i = 0; i < loops.length; i++) {
        if (!loops[i].el.classList.contains('run')) continue;
        try { loops[i].fn(now / 1000, dt); } catch (e) { if (window.console) console.error(e); loops.splice(i--, 1); }
      }
    }
    requestAnimationFrame(tick);
  }

  /* ── Tooltips: one small bubble, shared by the charts and the "i" buttons ── */

  var tip = document.createElement('div'), tipFor = null;
  tip.className = 'tip';
  tip.setAttribute('role', 'tooltip');
  document.body.appendChild(tip);
  // Put the bubble above a box (or below it when there's no room), kept inside the window.
  function tipAt(owner, html, box) {
    if (tipFor !== owner) tipClose();
    tip.innerHTML = html;
    tip.style.left = '0px'; tip.style.top = '0px';
    var w = tip.offsetWidth, h = tip.offsetHeight, vw = root.clientWidth;
    var cx = box.left + box.width / 2, x = clamp(cx - w / 2, 10, Math.max(10, vw - w - 10)), below = box.top - h - 12 < 8;
    tip.style.left = Math.round(x) + 'px';
    tip.style.top = Math.round(below ? box.bottom + 12 : box.top - h - 12) + 'px';
    tip.style.setProperty('--ax', Math.round(clamp(cx - x, 16, w - 16)) + 'px');
    tip.classList.toggle('below', below);
    tip.classList.add('show');
    if (tipFor !== owner) { tipFor = owner; owner.classList.add('tip-on'); if (owner.tipHook) owner.tipHook(true); }
  }
  function tipShow(owner, html) { tipAt(owner, html, owner.getBoundingClientRect()); }
  function tipPoint(owner, html, x, y) { tipAt(owner, html, { left: x, width: 0, top: y - 8, bottom: y + 8 }); }
  function tipClose(owner) {
    if (!tipFor || (owner && owner !== tipFor)) return;
    var o = tipFor;
    tipFor = null;
    tip.classList.remove('show');
    o.classList.remove('tip-on');
    if (o.tipHook) o.tipHook(false);
  }
  function keyboardFocus(el) { try { return el.matches(':focus-visible'); } catch (e) { return true; } }
  // Mouse: shows while hovering. Keyboard: shows on focus. Touch: tap to show, tap again or anywhere else to hide.
  function bindTip(el, html) {
    var type = '';
    function get() { return typeof html === 'function' ? html() : html; }
    el.addEventListener('pointerdown', function (e) { type = e.pointerType; });
    el.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') tipShow(el, get()); });
    el.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') tipClose(el); });
    // Only for things you can Tab to. (In Chrome, a focus listener alone makes a chart shape a Tab stop.)
    if (el.hasAttribute('tabindex') || /^(A|BUTTON)$/.test(el.tagName)) {
      el.addEventListener('focus', function () { if (keyboardFocus(el)) tipShow(el, get()); });
      el.addEventListener('blur', function () { tipClose(el); });
    }
    el.addEventListener('click', function (e) {
      if (e.detail && type !== 'mouse' && tipFor === el) tipClose(el);
      else tipShow(el, get());
    });
  }
  document.addEventListener('pointerdown', function (e) { if (tipFor && !tipFor.contains(e.target)) tipClose(); }, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') tipClose(); });
  document.addEventListener('scroll', function () { tipClose(); }, true);
  window.addEventListener('resize', function () { tipClose(); });

  // Each "i" button reads its text from the hidden element named in aria-describedby,
  // so screen readers hear the same words as a description of the button.
  safe('info', function () {
    $$('.info').forEach(function (b) {
      var src = document.getElementById(b.getAttribute('aria-describedby'));
      if (src) bindTip(b, function () { return src.innerHTML; });
    });
  });

  /* ── Career data, read from the Experience list ──────────────────────── */

  var NOW = new Date(), nowIdx = NOW.getFullYear() * 12 + NOW.getMonth() + 1;
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function ym(s) { if (!s) return null; var p = s.split('-'); return [Number(p[0]), Number(p[1] || 1)]; }
  function idx(a) { return a[0] * 12 + a[1]; }
  // Each employer keeps one colour everywhere: petal, leaf and flow.
  var RCOL = { ia: '#dcd2f1', rama: '#cadff0', erf: '#cfe2cf', fico: '#f6e7b6', jll: '#f8d8c2', dentsu: '#f4c9d1' };
  var RDEEP = { ia: '#b9aee0', rama: '#9fc4e4', erf: '#a8cfa8', fico: '#e8d38a', jll: '#efbc9a', dentsu: '#e9a5b4' };
  var ROLES = $$('#roles > li').map(function (li) {
    var s = ym(li.getAttribute('data-start')), e = ym(li.getAttribute('data-end'));
    return {
      id: li.getAttribute('data-id'), short: li.getAttribute('data-short'), li: li, s: s, e: e,
      org: $('.r-org', li).textContent.trim(), role: $('.r-role', li).textContent.trim(), date: $('.r-date', li).textContent.trim(),
      months: (e ? idx(e) : nowIdx) - idx(s) + 1,
      tools: $$('.r-tools li', li).filter(function (t) { return !t.classList.contains('practice'); }).map(function (t) { return t.textContent.trim(); })
    };
  }).sort(function (a, b) { return idx(a.s) - idx(b.s); });
  var START = ROLES.length ? ROLES[0].s : [2017, 6];
  function yearsIn() { return (Date.now() - new Date(START[0], START[1] - 1, 1).getTime()) / (365.2425 * 864e5); }
  var YRS = Math.floor(yearsIn() * 10) / 10;
  var TOOLS = {};
  ROLES.forEach(function (r) { r.tools.forEach(function (t) { TOOLS[t] = 1; }); });

  safe('year', function () {
    var y = $('#year');
    if (y) y.textContent = NOW.getFullYear();
  });

  /* ── The rose: a Nightingale rose, each petal's area proportional to months ── */

  function roseMarkup(prefix, R, HOLE, o) {
    o = o || {};
    var n = ROLES.length, maxM = Math.max.apply(null, ROLES.map(function (r) { return r.months; })), gap = 1.6 * Math.PI / 180;
    var defs = '', body = '', data = [];
    function P(a, rad) { return (Math.cos(a) * rad).toFixed(2) + ' ' + (Math.sin(a) * rad).toFixed(2); }
    ROLES.forEach(function (r, i) {
      var a0 = -Math.PI / 2 + i * TAU / n + gap / 2, a1 = a0 + TAU / n - gap, c = RCOL[r.id] || '#e8dfe6';
      var rr = Math.sqrt(HOLE * HOLE + (R * R - HOLE * HOLE) * r.months / maxM);
      var d = 'M' + P(a0, HOLE) + ' L' + P(a0, rr) + ' A' + f1(rr) + ' ' + f1(rr) + ' 0 0 1 ' + P(a1, rr) + ' L' + P(a1, HOLE) + ' A' + HOLE + ' ' + HOLE + ' 0 0 0 ' + P(a0, HOLE) + 'Z';
      defs += '<radialGradient id="' + prefix + i + '" cx="0" cy="0" r="' + f1(rr) + '" gradientUnits="userSpaceOnUse"><stop offset=".2" style="stop-color:var(--petal-core)"/><stop offset=".55" stop-color="' + c + '" stop-opacity=".85"/><stop offset="1" stop-color="' + c + '"/></radialGradient>';
      body += '<g class="rose-petal" data-i="' + i + '"' + (o.focusable ? ' tabindex="0" role="button" aria-label="' + esc(r.org + ', ' + r.months + ' months') + '"' : '') + '>' +
        '<g class="rose-scale" style="--k:' + i + ';--d0:' + (o.d0 || 0) + 'ms"><path d="' + d + '" fill="url(#' + prefix + i + ')"/></g></g>';
      data.push({ r: r, mid: (a0 + a1) / 2 });
    });
    if (o.center) body += '<circle class="rose-hole" r="' + (HOLE - 3) + '"/><text class="rose-cn" text-anchor="middle" y="6"></text><text class="rose-cl" text-anchor="middle" y="25"></text>';
    return { defs: defs, body: '<g class="' + (o.noSway ? '' : 'rose-sway') + '">' + body + '</g>', data: data };
  }
  function nestRose(x, y, R, inner) {
    var s = R + 40;
    return '<svg x="' + (x - s) + '" y="' + (y - s) + '" width="' + (2 * s) + '" height="' + (2 * s) + '" viewBox="' + (-s) + ' ' + (-s) + ' ' + (2 * s) + ' ' + (2 * s) + '" overflow="visible">' + inner + '</svg>';
  }

  /* ── Hero: a stem that is a timeline, a leaf per role, the rose on top ── */

  safe('plant', function () {
    var svg = $('#plant');
    if (!svg || !ROLES.length) return;
    var y0 = START[0] + (START[1] - 1) / 12, nowY = NOW.getFullYear() + NOW.getMonth() / 12;
    var stemD = 'M280 520 C262 440 300 362 280 292 S268 206 280 176';
    svg.innerHTML = '<path class="pl-ground" d="M110 522 Q280 512 450 522"/><g class="pl-sway"><path class="pl-stem" pathLength="1" d="' + stemD + '"/></g>';
    var stem = $('.pl-stem', svg), L = stem.getTotalLength(), plant = $('.pl-sway', svg);
    var maxM = Math.max.apply(null, ROLES.map(function (r) { return r.months; })), g = '';
    ROLES.forEach(function (r, k) {
      var yr = r.s[0] + (r.s[1] - 1) / 12, f = clamp((yr - y0) / (nowY - y0), .03, .97), p = stem.getPointAtLength(L * f);
      var right = k % 2 === 0, len = 30 + 46 * Math.sqrt(r.months / maxM), d = (.4 + 2.2 * f).toFixed(2) + 's';
      var leaf = right
        ? 'M0 0 C' + f1(len * .3) + ' ' + f1(-len * .3) + ' ' + f1(len * .75) + ' ' + f1(-len * .32) + ' ' + f1(len) + ' 0 C' + f1(len * .75) + ' ' + f1(len * .3) + ' ' + f1(len * .3) + ' ' + f1(len * .28) + ' 0 0Z'
        : 'M0 0 C' + f1(-len * .3) + ' ' + f1(-len * .3) + ' ' + f1(-len * .75) + ' ' + f1(-len * .32) + ' ' + f1(-len) + ' 0 C' + f1(-len * .75) + ' ' + f1(len * .3) + ' ' + f1(-len * .3) + ' ' + f1(len * .28) + ' 0 0Z';
      var rot = right ? -24 : 24, tipX = p.x + (right ? 1 : -1) * len * Math.cos(24 * Math.PI / 180), tipY = p.y - len * Math.sin(24 * Math.PI / 180);
      var tx = f1(tipX + (right ? 10 : -10)), anchor = right ? '' : ' text-anchor="end"';
      g += '<g transform="translate(' + f1(p.x) + ' ' + f1(p.y) + ') rotate(' + rot + ')"><path class="pl-leaf ' + (right ? 'r' : 'l') + '" style="--d:' + d + '" d="' + leaf + '" fill="' + RCOL[r.id] + '" stroke="' + RDEEP[r.id] + '" stroke-width="1"/></g>';
      g += '<g class="pl-txt" style="--d:' + d + '"><text class="pl-yr" x="' + tx + '" y="' + f1(tipY - 6) + '"' + anchor + '>' + r.s[0] + '</text><text class="pl-lab" x="' + tx + '" y="' + f1(tipY + 15) + '"' + anchor + '>' + esc(r.short) + '</text></g>';
    });
    var rose = roseMarkup('pl-r', 92, 26, { d0: 2500, noSway: true });
    var defs = document.createElementNS(NS, 'defs');
    defs.innerHTML = rose.defs;
    svg.insertBefore(defs, svg.firstChild);
    plant.insertAdjacentHTML('beforeend', g + nestRose(280, 150, 92, rose.body));
  });

  /* ── About: three numbers that count up ─────────────────────────────── */

  safe('nums', function () {
    var box = $('#nums');
    if (!box || !ROLES.length) return;
    var els = [$('#num-years'), $('#num-tools'), $('#num-roles')], V = [YRS, Object.keys(TOOLS).length, ROLES.length], DEC = [1, 0, 0];
    var prog = motion ? 0 : 1, started = false;
    function paint() { var e = easeOut(clamp(prog, 0, 1)); els.forEach(function (el, i) { if (el) el.textContent = (V[i] * e).toFixed(DEC[i]); }); }
    paint();
    box.addEventListener('enter', function () { started = true; if (!motion) { prog = 1; paint(); } });
    motionListeners.push(function (on) { if (!on) { prog = 1; paint(); } });
    loop(box, function (t, dt) { if (!started || prog >= 1) return; prog = Math.min(1, prog + dt / 1.8); paint(); });
  });

  /* ── Experience: the rose with a detail card ─────────────────────────── */

  safe('experience', function () {
    var svg = $('#rose'), card = $('#exp-card'), sec = $('#experience');
    if (!svg || !card || !ROLES.length) return;
    var rose = roseMarkup('ex', 196, 50, { center: true, focusable: true });
    svg.innerHTML = '<defs>' + rose.defs + '</defs>' + rose.body;
    sec.classList.add('enhanced');
    var petals = $$('.rose-petal', svg), cn = $('.rose-cn', svg), cl = $('.rose-cl', svg), cur = -1;
    function cardHtml(r) {
      var li = r.li, award = $('.r-award', li);
      return '<p class="ec-when">' + esc(r.date) + '</p>' +
        '<p class="ec-org"><i style="--c:' + RDEEP[r.id] + '" aria-hidden="true"></i>' + esc(r.org) + '</p>' +
        '<p class="ec-role">' + esc(r.role) + '</p>' +
        '<ul class="ec-pts">' + $('.r-pts', li).innerHTML + '</ul>' +
        (award ? '<p class="ec-award"><span aria-hidden="true">✦</span>' + award.innerHTML + '</p>' : '') +
        '<ul class="chips">' + $('.r-tools', li).innerHTML + '</ul>';
    }
    function show(i, quiet) {
      if (i === cur) return;
      cur = i;
      var d = rose.data[i];
      petals.forEach(function (p, k) {
        p.classList.toggle('on', k === i);
        p.style.transform = k === i ? 'translate(' + f1(Math.cos(d.mid) * 12) + 'px,' + f1(Math.sin(d.mid) * 12) + 'px)' : '';
      });
      cn.textContent = d.r.months;
      cl.textContent = 'MONTHS';
      card.innerHTML = cardHtml(d.r);
      if (!quiet) restart(card, 'swap');
    }
    petals.forEach(function (p, i) {
      p.addEventListener('pointerenter', function () { svg.classList.add('hovering'); show(i); });
      p.addEventListener('pointerleave', function () { svg.classList.remove('hovering'); });
      p.addEventListener('focus', function () { show(i); });
      p.addEventListener('click', function () { show(i); });
      p.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(i); } });
    });
    show(ROLES.length - 1, true);
  });

  /* ── Top bar: solid once scrolled, and the current section underlined ── */

  safe('topbar', function () {
    var topbar = $('#topbar');
    if (!topbar || !('IntersectionObserver' in window)) return;
    var sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'position:absolute;top:0;height:1px;width:1px;';
    document.body.prepend(sentinel);
    new IntersectionObserver(function (entries) { topbar.classList.toggle('is-stuck', !entries[0].isIntersecting); }).observe(sentinel);
    // Only in-page links (#about…); project pages link back with /#projects, which isn't a section here
    var links = $$('.topnav a[href^="#"]'), sections = links.map(function (a) { return $(a.getAttribute('href')); }).filter(Boolean), visible = {};
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visible[e.target.id] = e.isIntersecting; });
      var active = sections.filter(function (s) { return visible[s.id]; })[0];
      links.forEach(function (a) { a.classList.toggle('is-active', !!active && a.getAttribute('href') === '#' + active.id); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    sections.forEach(function (s) { so.observe(s); });
  });

  /* ── Reveal on scroll ────────────────────────────────────────────────── */

  safe('reveal', function () {
    var els = $$('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('is-visible'); }); return; }
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-visible'); ro.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -40px 0px', threshold: .05 });
    els.forEach(function (el, i) { if (i < 6) el.style.transitionDelay = (i * 80) + 'ms'; ro.observe(el); });
  });

  /* ── Skills: a Sankey from roles to skill groups ─────────────────────── */

  function bez(a, b, c, d, u) { var v = 1 - u; return v * v * v * a + 3 * v * v * u * b + 3 * v * u * u * c + u * u * u * d; }
  function buildSankey(o) {
    var svg = o.svg, W = o.vb[0], left = o.left, right = o.right, links = o.links;
    right.forEach(function (R) { R.v = 0; R.links = []; });
    left.forEach(function (L) { L.links = []; });
    links.forEach(function (lk) { lk.L = left[lk.l]; lk.R = right[lk.r]; lk.L.links.push(lk); lk.R.links.push(lk); lk.R.v += lk.v; });
    var total = left.reduce(function (a, L) { return a + L.v; }, 0);
    var k = Math.min((o.BOT - o.TOP - o.GL * (left.length - 1)) / total, (o.BOT - o.TOP - o.GR * (right.length - 1)) / total);
    function stack(nodes, gap) {
      var h = nodes.reduce(function (a, nd) { return a + nd.v * k; }, 0) + gap * (nodes.length - 1), y = o.TOP + (o.BOT - o.TOP - h) / 2;
      nodes.forEach(function (nd) { nd.y = y; nd.h = nd.v * k; y += nd.h + gap; });
    }
    stack(left, o.GL); stack(right, o.GR);
    var x0 = o.XL + o.NW, x1 = o.XR, xm = (x0 + x1) / 2, id = svg.id;
    left.forEach(function (L) { var y = L.y; L.links.sort(function (a, b) { return a.r - b.r; }).forEach(function (lk) { lk.y0 = y; y += lk.v * k; lk.y0b = y; }); });
    right.forEach(function (R) { var y = R.y; R.links.sort(function (a, b) { return a.l - b.l; }).forEach(function (lk) { lk.y1 = y; y += lk.v * k; lk.y1b = y; }); });
    var defs = '<clipPath id="' + id + '-clip"><rect class="sk-clip" x="0" y="0" width="' + W + '" height="' + o.vb[1] + '"/></clipPath>', body = '', nodes = '';
    links.forEach(function (lk, i) {
      defs += '<linearGradient id="' + id + '-g' + i + '" gradientUnits="userSpaceOnUse" x1="' + x0 + '" x2="' + x1 + '" y1="0" y2="0"><stop offset="0" stop-color="' + lk.L.color + '"/><stop offset="1" stop-color="' + lk.R.color + '"/></linearGradient>';
      body += '<path class="sk-link" data-i="' + i + '" fill="url(#' + id + '-g' + i + ')" opacity=".9" d="M' + x0 + ' ' + f1(lk.y0) + ' C' + xm + ' ' + f1(lk.y0) + ' ' + xm + ' ' + f1(lk.y1) + ' ' + x1 + ' ' + f1(lk.y1) + ' L' + x1 + ' ' + f1(lk.y1b) + ' C' + xm + ' ' + f1(lk.y1b) + ' ' + xm + ' ' + f1(lk.y0b) + ' ' + x0 + ' ' + f1(lk.y0b) + 'Z"/>';
    });
    left.forEach(function (L, i) {
      var cy = L.y + L.h / 2;
      nodes += '<g class="sk-node" data-side="l" data-i="' + i + '"><rect x="' + o.XL + '" y="' + f1(L.y) + '" width="' + o.NW + '" height="' + f1(Math.max(1, L.h)) + '" rx="3" fill="' + L.color + '"/>' +
        '<text class="sk-lab" x="' + (o.XL - 12) + '" y="' + f1(L.sub ? cy - 1 : cy + 5) + '" text-anchor="end">' + esc(L.name) + '</text>' +
        (L.sub ? '<text class="sk-sub" x="' + (o.XL - 12) + '" y="' + f1(cy + 15) + '" text-anchor="end">' + esc(L.sub) + '</text>' : '') + '</g>';
    });
    right.forEach(function (R, i) {
      nodes += '<g class="sk-node" data-side="r" data-i="' + i + '" tabindex="0" role="button" aria-label="' + esc(R.name + ', ' + o.fmt(R.v)) + '"><rect x="' + o.XR + '" y="' + f1(R.y) + '" width="' + o.NW + '" height="' + f1(Math.max(1, R.h)) + '" rx="3" fill="' + R.color + '"/>' +
        '<text class="sk-lab" x="' + (o.XR + o.NW + 12) + '" y="' + f1(R.y + R.h / 2 - 1) + '">' + esc(R.name) + '</text><text class="sk-sub" x="' + (o.XR + o.NW + 12) + '" y="' + f1(R.y + R.h / 2 + 15) + '">' + esc(o.fmt(R.v)) + '</text></g>';
    });
    svg.innerHTML = '<defs>' + defs + '</defs><g clip-path="url(#' + id + '-clip)">' + body + '<g class="sk-dots"></g></g>' + nodes;
    var paths = $$('.sk-link', svg), dotsG = $('.sk-dots', svg), dots = [];
    links.forEach(function (lk, i) {
      for (var j = 0, cnt = Math.max(1, Math.round(lk.v / o.dotEvery)); j < cnt; j++) {
        var c = document.createElementNS(NS, 'circle');
        c.setAttribute('r', '1.7'); c.setAttribute('class', 'sk-dot'); dotsG.appendChild(c);
        dots.push({ el: c, lk: lk, i: i, u: Math.random(), off: (Math.random() - .5) * .6, sp: .045 + Math.random() * .025 });
      }
    });
    function placeDots(dt) {
      dots.forEach(function (p) {
        p.u += dt * p.sp; if (p.u > 1) p.u -= 1;
        var lk = p.lk, a = lk.y0 + (lk.y0b - lk.y0) * (.5 + p.off), b = lk.y1 + (lk.y1b - lk.y1) * (.5 + p.off);
        p.el.setAttribute('cx', f1(bez(x0, xm, xm, x1, p.u)));
        p.el.setAttribute('cy', f1(bez(a, a, b, b, p.u)));
        p.el.setAttribute('opacity', (Math.sin(Math.PI * p.u) * .85).toFixed(2));
      });
    }
    placeDots(0);
    var pinned = null;
    function focus(set) {
      svg.classList.toggle('hovering', !!set);
      paths.forEach(function (p, i) { p.classList.toggle('on', !!set && set.indexOf(i) >= 0); });
      dots.forEach(function (d) { d.el.classList.toggle('on', !!set && set.indexOf(d.i) >= 0); });
    }
    function setOf(side, i) { return links.map(function (lk, j) { return (side === 'l' ? lk.l : lk.r) === i ? j : -1; }).filter(function (j) { return j >= 0; }); }
    paths.forEach(function (p, i) {
      function tipHere(e) { if (o.tipText) tipPoint(p, esc(o.tipText(links[i])), e.clientX, e.clientY); }
      p.addEventListener('pointerenter', function () { focus([i]); });
      p.addEventListener('pointerleave', function () { focus(pinned); tipClose(p); });
      p.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') tipHere(e); });
      p.addEventListener('click', function (e) { tipHere(e); if (o.onPick) o.onPick(links[i].r, false); });
    });
    $$('.sk-node', svg).forEach(function (g) {
      var side = g.getAttribute('data-side'), i = Number(g.getAttribute('data-i')), set = setOf(side, i), nd = side === 'l' ? left[i] : right[i];
      g.addEventListener('pointerenter', function () { focus(set); });
      g.addEventListener('pointerleave', function () { focus(pinned); });
      if (nd.tip) bindTip(g, esc(nd.tip));
      function pick() { if (side === 'r' && o.onPick) o.onPick(i, true); }
      g.addEventListener('click', pick);
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
    });
    return { placeDots: placeDots, pin: function (i) { pinned = i >= 0 ? setOf('r', i) : null; focus(pinned); } };
  }

  safe('skills', function () {
    var svg = $('#flow'), stage = $('#flow-stage'), line = $('#flow-line'), box = $('#skill-groups');
    if (!svg || !box || !ROLES.length) return;
    var GCOL = { ads: '#f5c6a8', bi: '#e9b8d3', data: '#b3d6ea', eng: '#bfe3cd' };
    // Names on the role chips that differ from the skills lists
    var ALIAS = { 'Meta': 'Meta Ads', 'TikTok': 'TikTok Ads', 'MongoDB': 'MERN stack', 'Express.js': 'MERN stack', 'React': 'MERN stack', 'Node.js': 'MERN stack' };
    var EXTRA = { 'Waterline': 'eng', 'Eclipse': 'eng' };
    var groups = $$('.sg', box).map(function (el) {
      var key = el.getAttribute('data-group');
      el.style.setProperty('--c', GCOL[key]);
      return { key: key, el: el, name: $('h3', el).textContent.trim(), color: GCOL[key] || '#e8dfe6', skills: $$('li', el).map(function (li) { return li.textContent.trim(); }) };
    });
    function groupOf(tool) {
      var t = ALIAS[tool] || tool, i;
      for (i = 0; i < groups.length; i++) if (groups[i].skills.indexOf(t) >= 0) return i;
      for (i = 0; i < groups.length; i++) if (groups[i].key === EXTRA[tool]) return i;
      return -1;
    }
    // Each role's months, split evenly across the tools it used
    var roles = ROLES.slice().reverse(), links = [];
    roles.forEach(function (r, li) {
      var counts = groups.map(function () { return 0; }), known = 0;
      r.tools.forEach(function (t) { var gi = groupOf(t); if (gi >= 0) { counts[gi]++; known++; } });
      counts.forEach(function (c, gi) { if (c) links.push({ l: li, r: gi, v: r.months * c / known }); });
    });
    groups.forEach(function (g, gi) {
      var at = links.filter(function (lk) { return lk.r === gi; });
      g.months = at.reduce(function (a, lk) { return a + lk.v; }, 0);
      g.where = andList(at.map(function (lk) { return roles[lk.l].short; }));
    });
    var sk = buildSankey({
      svg: svg, vb: [1000, 470], XL: 190, XR: 760, NW: 12, TOP: 26, BOT: 446, GL: 12, GR: 26, dotEvery: 6,
      left: roles.map(function (r) { return { name: r.short, color: RCOL[r.id], v: r.months, tip: r.date + ' · ' + r.months + ' months' }; }),
      right: groups.map(function (g) { return { name: g.name, color: g.color, tip: g.where ? 'Used at ' + g.where : '' }; }),
      links: links, fmt: function (v) { return Math.round(v) + ' MONTHS'; },
      tipText: function (lk) { return lk.L.name + ' → ' + lk.R.name + ' · about ' + Math.max(1, Math.round(lk.v)) + ' months'; },
      onPick: pick
    });
    // Selecting a group highlights it in the chart and in the lists; selecting it again clears it.
    var picked = -1;
    function pick(gi, toggle) {
      if (toggle && gi === picked) gi = -1;
      picked = gi;
      box.classList.toggle('focus', gi >= 0);
      groups.forEach(function (o, k) { o.el.classList.toggle('on', k === gi); });
      line.textContent = gi >= 0 ? groups[gi].name + ': about ' + Math.round(groups[gi].months) + ' months of work, at ' + groups[gi].where + '.' : '';
      sk.pin(gi);
    }
    groups.forEach(function (g, gi) { g.el.addEventListener('click', function () { pick(gi, true); }); });
    loop(stage, function (t, dt) { sk.placeDots(dt); });
  });

  /* ── Projects: one small ring per project ────────────────────────────── */

  safe('projects', function () {
    var KIND = {
      code: { name: 'Code', c: '#9fc4e4' }, data: { name: 'Data', c: '#a8cfa8' }, app: { name: 'Apps and web', c: '#efbc9a' },
      ai: { name: 'AI and ML', c: '#e9a5b4' }, media: { name: 'Media', c: '#b9aee0' }, doc: { name: 'Research and writing', c: '#e8d38a' }
    };
    var grid = $('#proj-grid'), R = 26, gap = 10 * Math.PI / 180;
    if (!grid) return;
    $$('a.proj', grid).forEach(function (a, k) {
      var tools = $$('.proj-tools li', a), n = tools.length, arcs = '';
      tools.forEach(function (li, j) {
        var kd = KIND[li.getAttribute('data-k')] || KIND.app, a0 = -Math.PI / 2 + j * TAU / n + gap / 2, a1 = a0 + TAU / n - gap;
        li.style.setProperty('--c', kd.c);
        arcs += '<path class="ring-arc" pathLength="1" style="--k:' + k + ';--j:' + j + '" stroke="' + kd.c + '" d="M' + f1(Math.cos(a0) * R) + ' ' + f1(Math.sin(a0) * R) + ' A' + R + ' ' + R + ' 0 ' + (a1 - a0 > Math.PI ? 1 : 0) + ' 1 ' + f1(Math.cos(a1) * R) + ' ' + f1(Math.sin(a1) * R) + '"/>';
      });
      var ring = $('.proj-ring', a);
      if (ring) ring.innerHTML = '<svg viewBox="-38 -38 76 76"><g class="ring-rot">' + arcs + '</g><text class="ring-n" y="7" text-anchor="middle">' + n + '</text></svg>';
    });
    grid.classList.add('ringed');
    // The colour key lives in the Projects "i" tooltip
    var how = $('#proj-how');
    if (how) how.insertAdjacentHTML('beforeend', '<ul class="tip-l">' +
      Object.keys(KIND).map(function (k) { return '<li><i style="--c:' + KIND[k].c + '"></i>' + KIND[k].name + '</li>'; }).join('') + '</ul>');
  });

  /* ── Recognition: seals, counted by the numbers beside them ──────────── */

  safe('recognition', function () {
    var box = $('#rec'), wrap = $('#rec-rows'), list = $('#honours');
    if (!box || !wrap || !list) return;
    var KINDS = [
      { key: 'work', label: 'Awards at work', c: '#f4c9d1', d: '#e9a5b4', t: '#a24d6d' },
      { key: 'degree', label: 'Degrees', c: '#dcd2f1', d: '#b9aee0', t: '#6f5fa8' },
      { key: 'hack', label: 'Hackathons', c: '#cfe2cf', d: '#a8cfa8', t: '#4f7f54' },
      { key: 'cert', label: 'Certification', c: '#f8d8c2', d: '#efbc9a', t: '#a8643c' }
    ];
    var items = $$('li', list).map(function (li) {
      return { li: li, kind: li.getAttribute('data-kind'), date: li.getAttribute('data-date') || '', mid: li.getAttribute('data-mid') || '', ring: li.getAttribute('data-ring') || '', name: $('strong', li).textContent.trim() };
    });
    KINDS.forEach(function (K) { K.items = items.filter(function (it) { return it.kind === K.key; }).sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; }); });
    // Rows sorted by count, largest first: the numbers read like a small bar chart
    var groups = KINDS.filter(function (K) { return K.items.length; }).sort(function (a, b) { return b.items.length - a.items.length; });
    var n = 0;
    wrap.innerHTML = groups.map(function (K, gi) {
      return '<div class="rr" data-g="' + gi + '" style="--c:' + K.c + ';--d:' + K.d + ';--t:' + K.t + '"><div class="rr-key"><span class="rr-n">' + K.items.length + '</span><span class="rr-l">' + K.label + '</span></div><div class="rr-seals">' +
        K.items.map(function (it, j) {
          var id = 'seal-' + (n++);
          return '<svg class="seal' + (n % 2 ? '' : ' rev') + (motion ? '' : ' in') + '" viewBox="-56 -56 112 112" tabindex="0" role="button" data-g="' + gi + '" data-j="' + j + '" aria-label="' + esc(it.name) + '">' +
            '<defs><path id="' + id + '" d="M0 -41 A41 41 0 1 1 -.01 -41"/></defs><g class="sl-w"><circle r="52" fill="' + K.c + '"/><circle r="31" fill="none" stroke="#fff" stroke-width="1.2"/>' +
            '<g class="sl-ring"><text class="sl-tx" dy="3"><textPath href="#' + id + '" textLength="252" lengthAdjust="spacing">' + esc(it.ring) + '</textPath></text></g>' +
            '<text class="sl-c" y="6" text-anchor="middle">' + esc(it.mid) + '</text></g></svg>';
        }).join('') + '</div></div>';
    }).join('');
    $('#recognition').classList.add('enhanced');
    var rows = $$('.rr', wrap), nums = $$('.rr-n', wrap), seals = $$('.seal', wrap);
    function itemOf(s) { return groups[Number(s.getAttribute('data-g'))].items[Number(s.getAttribute('data-j'))]; }
    function focusRow(gi) { wrap.classList.toggle('focus', gi >= 0); rows.forEach(function (r, i) { r.classList.toggle('hl', i === gi); }); }
    // A seal's tooltip: its name, then who gave it, when, and any note, all read from the list
    function tipHtml(it) {
      return '<span class="tip-t">' + esc(it.name) + '</span>' + ['.h-from', '.h-when', '.h-note'].map(function (sel) {
        var el = $(sel, it.li);
        return el ? '<span class="tip-p">' + esc(el.textContent) + '</span>' : '';
      }).join('');
    }
    seals.forEach(function (s) {
      var gi = Number(s.getAttribute('data-g')), html = tipHtml(itemOf(s));
      // While a seal's tooltip is open, its row lights up and the others fade
      s.tipHook = function (on) { focusRow(on ? gi : -1); };
      bindTip(s, html);
      s.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tipShow(s, html); } });
    });
    // The count: one more seal arrives every 0.42 seconds, and its row's number goes up by one
    var counts = groups.map(function () { return 0; }), seq = null;
    function finish() {
      seq = null;
      seals.forEach(function (s) { s.classList.add('in'); });
      nums.forEach(function (el, gi) { el.textContent = groups[gi].items.length; });
    }
    if (motion) nums.forEach(function (el) { el.textContent = '0'; });
    box.addEventListener('enter', function () { if (motion) seq = { i: 0, t: -.4 }; else finish(); });
    motionListeners.push(function (on) { if (!on) finish(); });
    loop(box, function (t, dt) {
      if (!seq) return;
      seq.t += dt;
      while (seq && seq.t >= .42) {
        seq.t -= .42;
        var s = seals[seq.i], gi = Number(s.getAttribute('data-g'));
        s.classList.add('in');
        counts[gi]++; nums[gi].textContent = counts[gi]; restart(nums[gi], 'tick');
        seq.i++;
        if (seq.i >= seals.length) seq = null;
      }
    });
  });

  /* ── Contact: copy the email address ─────────────────────────────────── */

  safe('copy', function () {
    var btn = $('#copy-mail'), msg = $('#copy-msg'), mail = $('.mail'), timer = 0;
    if (!btn || !msg || !mail) return;
    btn.hidden = false;
    btn.addEventListener('click', function () {
      function done(ok) {
        clearTimeout(timer);
        if (ok) {
          // The button itself says "Copied" for a moment
          btn.textContent = 'Copied';
          msg.textContent = 'Email address copied.';
          timer = setTimeout(function () { btn.textContent = 'Copy'; msg.textContent = ''; }, 2200);
        } else {
          // No clipboard access: select the address and say how to copy it
          var rg = document.createRange(), sel = window.getSelection();
          rg.selectNodeContents(mail); sel.removeAllRanges(); sel.addRange(rg);
          msg.textContent = 'Selected. Press Ctrl+C, or Cmd+C on a Mac, to copy it.';
          tipShow(btn, 'Selected. Press Ctrl+C, or ⌘C on a Mac.');
          timer = setTimeout(function () { tipClose(btn); }, 4000);
        }
      }
      try { navigator.clipboard.writeText('devenbhalerao@gmail.com').then(function () { done(true); }, function () { done(false); }); } catch (e) { done(false); }
    });
  });

  /* ── Start: each animated block plays once, when it scrolls into view ── */

  safe('start', function () {
    var blocks = $$('[data-anim]');
    function enter(el) { if (el.classList.contains('is-in')) return; el.classList.add('is-in'); el.dispatchEvent(new CustomEvent('enter')); }
    if (!('IntersectionObserver' in window)) { blocks.forEach(function (el) { el.classList.add('run'); enter(el); }); }
    else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { e.target.classList.toggle('run', e.isIntersecting); if (e.isIntersecting) enter(e.target); });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });
      blocks.forEach(function (el) { io.observe(el); });
    }
    requestAnimationFrame(tick);
  });
})();
