// Follow the color preference the browser reports, including changes while open.
(function () {
  if (!window.matchMedia) return;
  var theme = window.matchMedia('(prefers-color-scheme: dark)');
  var icons = document.querySelectorAll('link[data-favicon-light][data-favicon-dark]');

  function updateFavicon() {
    var attribute = theme.matches ? 'data-favicon-dark' : 'data-favicon-light';
    icons.forEach(function (icon) {
      icon.setAttribute('href', icon.getAttribute(attribute));
    });
  }

  updateFavicon();
  if (theme.addEventListener) theme.addEventListener('change', updateFavicon);
  else if (theme.addListener) theme.addListener(updateFavicon);
})();
