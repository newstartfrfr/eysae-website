(() => {
  const menuToggle = document.getElementById('menuToggle');
  const mainNav = document.getElementById('mainNav');
  const languageSwitcher = document.getElementById('languageSwitcher');
  const RTL_LANGS = new Set(['ar']);

  function applyDirection(lang) {
    const dir = RTL_LANGS.has(lang) ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    document.documentElement.setAttribute('dir', dir);

    if (document.body) {
      document.body.setAttribute('dir', dir);
      document.body.classList.toggle('is-rtl', dir === 'rtl');
    }
  }

  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => {
      const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', String(!expanded));
      mainNav.classList.toggle('open', !expanded);
      document.body.classList.toggle('menu-open', !expanded);
    });

    mainNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        menuToggle.setAttribute('aria-expanded', 'false');
        mainNav.classList.remove('open');
        document.body.classList.remove('menu-open');
      });
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  const savedLang = localStorage.getItem('eysae-lang') || 'en';
  applyDirection(savedLang);

  if (languageSwitcher) {
    languageSwitcher.value = savedLang;

    languageSwitcher.addEventListener('change', () => {
      const nextLang = languageSwitcher.value;
      localStorage.setItem('eysae-lang', nextLang);
      applyDirection(nextLang);
      window.dispatchEvent(new CustomEvent('eysae:languagechange', { detail: { lang: nextLang } }));
    });
  }
})();
