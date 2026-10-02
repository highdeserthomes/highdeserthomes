// High Desert Homes - gallery lightbox.
// Links marked data-lightbox="<group>" open their large photo in an overlay;
// without JavaScript they simply open the large photo.
(function () {
  var links = Array.prototype.slice.call(document.querySelectorAll('a[data-lightbox]'));
  if (!links.length) return;
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var pageRegions = document.querySelectorAll('main, .site-header, .site-footer, .skip-link');

  var icon = {
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>'
  };

  var box = document.createElement('div');
  box.className = 'lightbox';
  box.hidden = true;
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', 'Photo viewer');
  box.innerHTML =
    '<div class="lightbox-bar"><span class="lightbox-count" aria-live="polite"></span>' +
    '<button class="lightbox-btn lightbox-close" type="button" aria-label="Close">' + icon.close + '</button></div>' +
    '<div class="lightbox-stage">' +
    '<button class="lightbox-btn lightbox-prev" type="button" aria-label="Previous photo">' + icon.prev + '</button>' +
    '<div class="lightbox-photos" aria-busy="false"><img class="lightbox-image" alt="" aria-hidden="true"><img class="lightbox-image" alt="" aria-hidden="true"></div>' +
    '<button class="lightbox-btn lightbox-next" type="button" aria-label="Next photo">' + icon.next + '</button></div>' +
    '<div class="lightbox-bottom"><p class="lightbox-caption"></p>' +
    '<p class="lightbox-status" role="status"><span></span> <a target="_blank" rel="noopener" hidden>Open original photo</a></p></div>';
  document.body.appendChild(box);

  var photos = box.querySelector('.lightbox-photos');
  var images = box.querySelectorAll('.lightbox-image');
  var count = box.querySelector('.lightbox-count');
  var caption = box.querySelector('.lightbox-caption');
  var closeBtn = box.querySelector('.lightbox-close');
  var group = [];
  var index = 0;
  var lastFocus = null;
  var activeImage = -1;
  var requestId = 0;
  var loadingTimer;
  var closing = false;
  var overlayAnimation;
  var photoAnimations = [];
  var status = box.querySelector('.lightbox-status span');
  var originalLink = box.querySelector('.lightbox-status a');

  function cancelPhotoAnimations() {
    photoAnimations.forEach(function (animation) { animation.cancel(); });
    photoAnimations = [];
  }

  function setPageInert(value) {
    pageRegions.forEach(function (region) { region.inert = value; });
  }

  function show(i, direction) {
    if (closing) return;
    index = (i + group.length) % group.length;
    var link = group[index];
    var thumb = link.querySelector('img');
    var selectedIndex = index;
    var id = ++requestId;
    var src = link.getAttribute('href');
    var alt = thumb ? thumb.alt : '';
    clearTimeout(loadingTimer);
    status.textContent = '';
    originalLink.hidden = true;
    originalLink.href = src;
    photos.setAttribute('aria-busy', 'true');
    loadingTimer = setTimeout(function () { if (id === requestId) status.textContent = 'Loading photo…'; }, 180);

    // Decode off-screen and keep the previous photo visible until the next is ready.
    var loader = new Image();
    loader.onload = function () {
      var decoded = loader.decode ? loader.decode().catch(function () {}) : Promise.resolve();
      decoded.then(function () {
        if (id !== requestId || box.hidden || closing) return;
        clearTimeout(loadingTimer);
        status.textContent = '';
        photos.setAttribute('aria-busy', 'false');
        cancelPhotoAnimations();
        var previous = activeImage >= 0 ? images[activeImage] : null;
        var next = activeImage === 0 ? images[1] : images[0];
        images.forEach(function (image) { if (image !== previous) image.classList.remove('is-current'); });
        next.src = src;
        next.alt = alt;
        next.setAttribute('aria-hidden', 'false');
        if (previous) previous.setAttribute('aria-hidden', 'true');
        next.classList.add('is-current');
        activeImage = next === images[0] ? 0 : 1;
        caption.textContent = alt;
        count.textContent = (link.getAttribute('data-title') || '') + '  ' + (selectedIndex + 1) + ' / ' + group.length;
        if (!motion.matches && next.animate) {
          var incoming = next.animate([
            { opacity: 0, transform: 'translateX(' + ((direction || 1) * 10) + 'px)' },
            { opacity: 1, transform: 'translateX(0)' }
          ], { duration: 260, easing: 'cubic-bezier(.2,.7,.2,1)' });
          photoAnimations.push(incoming);
          if (previous) {
            var outgoing = previous.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: 'forwards' });
            photoAnimations.push(outgoing);
            outgoing.finished.then(function () {
              if (previous !== images[activeImage]) previous.classList.remove('is-current');
              outgoing.cancel();
            }).catch(function () {});
          }
        } else if (previous) previous.classList.remove('is-current');
      });
    };
    loader.onerror = function () {
      if (id !== requestId || box.hidden || closing) return;
      clearTimeout(loadingTimer);
      photos.setAttribute('aria-busy', 'false');
      status.textContent = 'This photo could not load.';
      originalLink.hidden = false;
    };
    loader.src = src;
    // warm up the neighbours so next/previous feel instant
    [index + 1, index - 1].forEach(function (n) {
      var l = group[(n + group.length) % group.length];
      if (l) { var pre = new Image(); pre.src = l.getAttribute('href'); }
    });
  }

  function open(link) {
    if (overlayAnimation) overlayAnimation.cancel();
    closing = false;
    var name = link.getAttribute('data-lightbox');
    group = links.filter(function (l) { return l.getAttribute('data-lightbox') === name; });
    lastFocus = link;
    box.querySelector('.lightbox-prev').hidden = group.length < 2;
    box.querySelector('.lightbox-next').hidden = group.length < 2;
    box.hidden = false;
    document.body.classList.add('lightbox-open');
    closeBtn.focus();
    setPageInert(true);
    show(group.indexOf(link));
    if (!motion.matches && box.animate) {
      overlayAnimation = box.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, easing: 'ease-out' });
    }
  }

  function finishClose() {
    box.hidden = true;
    closing = false;
    cancelPhotoAnimations();
    images.forEach(function (image) { image.classList.remove('is-current'); image.removeAttribute('src'); image.alt = ''; image.setAttribute('aria-hidden', 'true'); });
    activeImage = -1;
    caption.textContent = '';
    status.textContent = '';
    photos.setAttribute('aria-busy', 'false');
    document.body.classList.remove('lightbox-open');
    setPageInert(false);
    if (lastFocus && lastFocus.isConnected) lastFocus.focus({ preventScroll: true });
  }

  function close() {
    if (box.hidden || closing) return;
    closing = true;
    requestId++;
    clearTimeout(loadingTimer);
    if (overlayAnimation) overlayAnimation.cancel();
    if (motion.matches || !box.animate) { finishClose(); return; }
    overlayAnimation = box.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, easing: 'ease-in' });
    overlayAnimation.finished.then(finishClose).catch(function () {});
  }

  links.forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      open(link);
    });
  });

  closeBtn.addEventListener('click', close);
  box.querySelector('.lightbox-prev').addEventListener('click', function () { show(index - 1, -1); });
  box.querySelector('.lightbox-next').addEventListener('click', function () { show(index + 1, 1); });
  // clicking the dark backdrop (not the photo or a button) closes the viewer
  box.addEventListener('click', function (e) {
    if (e.target === box || e.target === photos || e.target.classList.contains('lightbox-stage')) close();
  });

  document.addEventListener('keydown', function (e) {
    if (box.hidden || closing) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1, -1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1, 1); }
    else if (e.key === 'Tab') {
      // keep keyboard focus inside the viewer
      var buttons = Array.prototype.slice.call(box.querySelectorAll('button, a[href]')).filter(function (b) { return !b.hidden; });
      var first = buttons[0], last = buttons[buttons.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // swipe left or right on touch screens
  var startX = null;
  var startY = null;
  photos.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; startY = e.touches[0].clientY; }, { passive: true });
  photos.addEventListener('touchend', function (e) {
    if (startX === null) return;
    var dx = e.changedTouches[0].clientX - startX;
    var dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.2) show(index + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
    startX = null;
  });
  motion.addEventListener('change', function () {
    if (!motion.matches) return;
    cancelPhotoAnimations();
    images.forEach(function (image, i) { image.classList.toggle('is-current', i === activeImage); });
    if (overlayAnimation) overlayAnimation.cancel();
    if (closing) finishClose();
  });
})();
