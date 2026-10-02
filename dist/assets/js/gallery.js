// High Desert Homes - gallery lightbox.
// Links marked data-lightbox="<group>" open their large photo in an overlay;
// without JavaScript they simply open the large photo.
(function () {
  var links = Array.prototype.slice.call(document.querySelectorAll('a[data-lightbox]'));
  if (!links.length) return;

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
    '<img alt="">' +
    '<button class="lightbox-btn lightbox-next" type="button" aria-label="Next photo">' + icon.next + '</button></div>' +
    '<p class="lightbox-caption"></p>';
  document.body.appendChild(box);

  var img = box.querySelector('img');
  var count = box.querySelector('.lightbox-count');
  var caption = box.querySelector('.lightbox-caption');
  var closeBtn = box.querySelector('.lightbox-close');
  var group = [];
  var index = 0;
  var lastFocus = null;

  function show(i) {
    index = (i + group.length) % group.length;
    var link = group[index];
    var thumb = link.querySelector('img');
    img.src = link.getAttribute('href');
    img.alt = thumb ? thumb.alt : '';
    caption.textContent = img.alt;
    count.textContent = (link.getAttribute('data-title') || '') + '  ' + (index + 1) + ' / ' + group.length;
    // warm up the neighbours so next/previous feel instant
    [index + 1, index - 1].forEach(function (n) {
      var l = group[(n + group.length) % group.length];
      if (l) { var pre = new Image(); pre.src = l.getAttribute('href'); }
    });
  }

  function open(link) {
    var name = link.getAttribute('data-lightbox');
    group = links.filter(function (l) { return l.getAttribute('data-lightbox') === name; });
    lastFocus = link;
    box.querySelector('.lightbox-prev').hidden = group.length < 2;
    box.querySelector('.lightbox-next').hidden = group.length < 2;
    show(group.indexOf(link));
    box.hidden = false;
    document.body.classList.add('lightbox-open');
    closeBtn.focus();
  }

  function close() {
    box.hidden = true;
    img.removeAttribute('src');
    document.body.classList.remove('lightbox-open');
    if (lastFocus) lastFocus.focus();
  }

  links.forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      open(link);
    });
  });

  closeBtn.addEventListener('click', close);
  box.querySelector('.lightbox-prev').addEventListener('click', function () { show(index - 1); });
  box.querySelector('.lightbox-next').addEventListener('click', function () { show(index + 1); });
  // clicking the dark backdrop (not the photo or a button) closes the viewer
  box.addEventListener('click', function (e) {
    if (e.target === box || e.target.classList.contains('lightbox-stage')) close();
  });

  document.addEventListener('keydown', function (e) {
    if (box.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(index - 1);
    else if (e.key === 'ArrowRight') show(index + 1);
    else if (e.key === 'Tab') {
      // keep keyboard focus inside the viewer
      var buttons = Array.prototype.slice.call(box.querySelectorAll('button')).filter(function (b) { return !b.hidden; });
      var first = buttons[0], last = buttons[buttons.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // swipe left or right on touch screens
  var startX = null;
  box.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', function (e) {
    if (startX === null) return;
    var dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
    startX = null;
  });
})();
