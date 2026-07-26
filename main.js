/* devenbhalerao.com — no dependencies, no trackers. */
(function () {
  'use strict';

  var root = document.documentElement;

  /* ── Theme ───────────────────────────────────────────────────────────── */

  var toggle = document.getElementById('theme-toggle');

  function currentTheme() {
    if (root.dataset.theme) return root.dataset.theme;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function syncToggleLabel() {
    if (!toggle) return;
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    toggle.setAttribute('aria-label', 'Switch to ' + next + ' theme');
    toggle.setAttribute('title', 'Switch to ' + next + ' theme');
  }

  if (toggle) {
    syncToggleLabel();
    toggle.addEventListener('click', function () {
      root.dataset.theme = currentTheme() === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('theme', root.dataset.theme);
      } catch (e) { /* private mode — theme just won't persist */ }
      syncToggleLabel();
    });
  }

  // Follow the OS while the user hasn't chosen a theme explicitly.
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function () {
    if (!root.dataset.theme) syncToggleLabel();
  });

  /* ── Reveal on scroll ────────────────────────────────────────────────── */

  var reveals = document.querySelectorAll('.reveal');

  if (!('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    // The bottom margin is a fixed pixel value, not a percentage. A percentage
    // scales with the viewport, and on a very tall one it pushes content at the
    // foot of the page permanently outside the trigger band — it never reveals.
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -40px 0px', threshold: 0.05 });

    reveals.forEach(function (el, i) {
      // Stagger only within the first screenful; below the fold it reads as lag.
      if (i < 8) el.style.transitionDelay = (i * 70) + 'ms';
      revealObserver.observe(el);
    });
  }

  /* ── Sticky bar state ────────────────────────────────────────────────── */

  var topbar = document.getElementById('topbar');

  if (topbar) {
    var sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'position:absolute;top:0;height:1px;width:1px;';
    document.body.prepend(sentinel);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        topbar.classList.toggle('is-stuck', !entries[0].isIntersecting);
      }).observe(sentinel);
    }
  }

  /* ── Active section in nav ───────────────────────────────────────────── */

  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.topnav a'));
  var sections = navLinks
    .map(function (link) { return document.querySelector(link.getAttribute('href')); })
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    var visible = new Set();

    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) visible.add(entry.target.id);
        else visible.delete(entry.target.id);
      });

      // Highlight the topmost section currently in the reading band.
      var active = sections.filter(function (s) { return visible.has(s.id); })[0];

      navLinks.forEach(function (link) {
        link.classList.toggle('is-active', !!active && link.getAttribute('href') === '#' + active.id);
      });
    }, { rootMargin: '-45% 0px -45% 0px' });

    sections.forEach(function (s) { sectionObserver.observe(s); });
  }

  /* ── Footer year ─────────────────────────────────────────────────────── */

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
