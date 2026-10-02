// High Desert Homes - progressive motion, accessible menu, FAQs and contact form.
(function () {
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var desktopMotion = window.matchMedia('(min-width: 901px) and (pointer: fine)');
  var header = document.querySelector('[data-header]');
  var hero = document.querySelector('.home-page .hero');
  var heroMedia = hero && hero.querySelector('.hero-media');
  var panel = document.getElementById('talk-panel');
  var overlay = document.querySelector('.panel-overlay');
  var openBtn = document.querySelector('[data-panel-open]');
  var lastFocus = null;
  var closeTimer;
  var panelFrame;
  var panelOpen = false;
  var pageRegions = document.querySelectorAll('main, .site-header, .site-footer, .skip-link');

  function setPageInert(value) {
    pageRegions.forEach(function (region) { region.inert = value; });
  }

  // One animation frame per scroll update; photo drift stays small and desktop-only.
  function updateHeader() {
    if (header) {
      var solid = !document.body.classList.contains('has-hero') || window.scrollY > 40;
      header.classList.toggle('is-solid', solid);
    }
    if (heroMedia) {
      if (!motion.matches && desktopMotion.matches) {
        var progress = Math.min(1, Math.max(0, window.scrollY / hero.offsetHeight));
        heroMedia.style.setProperty('--hero-drift', (progress * 28).toFixed(2) + 'px');
      } else heroMedia.style.removeProperty('--hero-drift');
    }
  }
  var scrollFrame = null;
  function scheduleScroll() {
    if (scrollFrame !== null) return;
    scrollFrame = requestAnimationFrame(function () { scrollFrame = null; updateHeader(); });
  }
  updateHeader();
  window.addEventListener('scroll', scheduleScroll, { passive: true });
  window.addEventListener('resize', scheduleScroll, { passive: true });
  window.addEventListener('pageshow', scheduleScroll);

  // Slide-in panel: "Let's Talk" on computers, the full menu on phones
  function openPanel() {
    if (panelOpen) return;
    panelOpen = true;
    clearTimeout(closeTimer);
    lastFocus = document.activeElement;
    panel.inert = false;
    overlay.hidden = false;
    panelFrame = requestAnimationFrame(function () {
      if (!panelOpen) return;
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
    if (!panelOpen) return;
    panelOpen = false;
    cancelAnimationFrame(panelFrame);
    clearTimeout(closeTimer);
    overlay.classList.remove('is-open');
    panel.classList.remove('is-open');
    openBtn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('panel-open');
    setPageInert(false);
    if (lastFocus && lastFocus.isConnected) lastFocus.focus({ preventScroll: true });
    panel.setAttribute('aria-hidden', 'true');
    panel.inert = true;
    if (motion.matches) overlay.hidden = true;
    else closeTimer = setTimeout(function () { if (!panelOpen) overlay.hidden = true; }, 300);
  }
  if (panel && openBtn && overlay) {
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.inert = true;
    overlay.addEventListener('transitionend', function (e) {
      if (e.target === overlay && !panelOpen) { clearTimeout(closeTimer); overlay.hidden = true; }
    });
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

  // Headings introduce each section; photographs use a restrained uncover effect.
  document.querySelectorAll('.section-head, .gallery-head, .gallery-intro, .contact-details, .gallery-grid li').forEach(function (el) {
    if (!el.closest('.reveal')) el.classList.add('reveal');
  });
  document.querySelectorAll('.split-media.reveal, .service-row-media.reveal, .video-frame.reveal, .team-figure.reveal, .project-card.reveal, .gallery-grid li.reveal').forEach(function (el) {
    el.classList.add('reveal-media');
  });
  var reveals = document.querySelectorAll('.reveal');
  var io;
  if ('IntersectionObserver' in window && !motion.matches) {
    document.querySelectorAll('.service-grid, .value-grid, .values-five, .steps, .project-grid, .quote-grid, .why-grid, .gallery-grid').forEach(function (grid) {
      Array.prototype.forEach.call(grid.children, function (el, index) { el.style.setProperty('--reveal-delay', (index % 3) * 60 + 'ms'); });
    });
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -20px 0px', threshold: 0.01 });
    reveals.forEach(function (el) {
      // Restored scroll positions and links to sections must show content immediately.
      if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('is-visible');
      else io.observe(el);
    });
    document.documentElement.classList.add('motion-ready');
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  document.addEventListener('focusin', function (e) {
    var reveal = e.target.closest('.reveal');
    if (reveal) { reveal.classList.add('is-visible'); if (io) io.unobserve(reveal); }
  });

  // Keep native details semantics and animate measured heights in either direction.
  var faqStates = [];
  document.querySelectorAll('.faq details').forEach(function (details) {
    var summary = details.querySelector('summary');
    if (!summary || !details.animate) return;
    var state = { details: details, open: details.open, animation: null };
    faqStates.push(state);
    function settle() {
      if (state.animation) state.animation.cancel();
      state.animation = null;
      details.open = state.open;
      details.style.removeProperty('overflow');
    }
    state.settle = settle;
    summary.addEventListener('click', function (e) {
      if (motion.matches) { state.open = !details.open; return; }
      e.preventDefault();
      var start = details.getBoundingClientRect().height;
      state.open = !state.open;
      if (state.animation) state.animation.cancel();
      details.open = true;
      var border = getComputedStyle(details);
      var closedHeight = summary.getBoundingClientRect().height + parseFloat(border.borderTopWidth) + parseFloat(border.borderBottomWidth);
      var end = state.open ? details.getBoundingClientRect().height : closedHeight;
      details.style.overflow = 'hidden';
      var animation = details.animate([{ height: start + 'px' }, { height: end + 'px' }], { duration: 300, easing: 'cubic-bezier(.2,.7,.2,1)' });
      state.animation = animation;
      animation.finished.then(function () {
        if (state.animation !== animation) return;
        details.open = state.open;
        details.style.removeProperty('overflow');
        state.animation = null;
      }).catch(function () {});
    });
  });
  window.addEventListener('resize', function () { faqStates.forEach(function (state) { if (state.animation) state.settle(); }); }, { passive: true });
  motion.addEventListener('change', function () {
    scheduleScroll();
    if (!motion.matches) return;
    if (io) io.disconnect();
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
    faqStates.forEach(function (state) { if (state.animation) state.settle(); });
    if (!panelOpen && overlay) { clearTimeout(closeTimer); overlay.hidden = true; }
  });

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
