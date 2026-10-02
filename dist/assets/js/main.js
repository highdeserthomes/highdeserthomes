// High Desert Homes - header, "Let's Talk" panel, scroll reveal, contact form
(function () {
  var header = document.querySelector('[data-header]');
  var panel = document.getElementById('talk-panel');
  var overlay = document.querySelector('.panel-overlay');
  var openBtn = document.querySelector('[data-panel-open]');
  var lastFocus = null;
  var closeTimer;
  var pageRegions = document.querySelectorAll('main, .site-header, .site-footer, .skip-link');

  function setPageInert(value) {
    pageRegions.forEach(function (region) { region.inert = value; });
  }

  // Header turns solid once the page scrolls past the top of the hero
  function updateHeader() {
    if (!header) return;
    var solid = !document.body.classList.contains('has-hero') || window.scrollY > 40;
    header.classList.toggle('is-solid', solid);
  }
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  // Slide-in panel: "Let's Talk" on computers, the full menu on phones
  function openPanel() {
    clearTimeout(closeTimer);
    lastFocus = document.activeElement;
    panel.inert = false;
    overlay.hidden = false;
    requestAnimationFrame(function () {
      overlay.classList.add('is-open');
      panel.classList.add('is-open');
      // focus can only move once the panel is visible
      panel.querySelector('.panel-close').focus();
      setPageInert(true);
    });
    panel.setAttribute('aria-hidden', 'false');
    openBtn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('panel-open');
  }
  function closePanel() {
    clearTimeout(closeTimer);
    overlay.classList.remove('is-open');
    panel.classList.remove('is-open');
    openBtn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('panel-open');
    setPageInert(false);
    if (lastFocus) lastFocus.focus();
    panel.setAttribute('aria-hidden', 'true');
    panel.inert = true;
    closeTimer = setTimeout(function () { overlay.hidden = true; }, 350);
  }
  if (panel && openBtn && overlay) {
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.inert = true;
    openBtn.addEventListener('click', openPanel);
    document.querySelectorAll('[data-panel-close]').forEach(function (el) { el.addEventListener('click', closePanel); });
    document.addEventListener('keydown', function (e) {
      if (!panel.classList.contains('is-open')) return;
      if (e.key === 'Escape') closePanel();
      if (e.key === 'Tab') {
        var focusable = Array.prototype.slice.call(panel.querySelectorAll('a[href], button:not([disabled])')).filter(function (el) { return el.getClientRects().length > 0; });
        var first = focusable[0], last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    panel.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closePanel); });
  }

  // Fade sections in as they scroll into view
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('motion-ready');
    document.querySelectorAll('.service-grid, .value-grid, .steps, .project-grid, .quote-grid').forEach(function (grid) {
      Array.prototype.forEach.call(grid.children, function (el, index) { el.style.setProperty('--reveal-delay', (index % 3) * 65 + 'ms'); });
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -35px 0px', threshold: 0.05 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  // Contact form: posts to the form service set in the form's action attribute
  document.querySelectorAll('[data-contact-form]').forEach(function (form) {
    var status = form.querySelector('.form-status');

    // Texting needs a number, so phone becomes required once someone opts in to SMS
    var smsConsent = form.querySelector('[data-sms-consent]');
    var phone = form.querySelector('input[type="tel"]');
    if (smsConsent && phone) {
      var optional = phone.parentNode.querySelector('.optional');
      var syncPhone = function () {
        phone.required = smsConsent.checked;
        if (optional) optional.hidden = smsConsent.checked;
      };
      smsConsent.addEventListener('change', syncPhone);
      form.addEventListener('reset', function () { setTimeout(syncPhone, 0); });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.getAttribute('action')) {
        status.className = 'form-status is-error';
        status.textContent = 'This draft form is not connected yet. Please call or email us.';
        return;
      }
      var button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      status.className = 'form-status';
      status.textContent = 'Sending...';
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (res) {
          if (!res.ok) throw new Error('Request failed');
          form.reset();
          status.className = 'form-status is-ok';
          status.textContent = "Thanks! We'll be in touch within one business day.";
        })
        .catch(function () {
          status.className = 'form-status is-error';
          status.textContent = 'Something went wrong. Please call or email us instead.';
        })
        .finally(function () { button.disabled = false; });
    });
  });

  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
