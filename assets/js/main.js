(() => {
  const menuToggle = document.getElementById('menuToggle');
  const mainNav = document.getElementById('mainNav');
  const languageSwitcher = document.getElementById('languageSwitcher');

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

  if (languageSwitcher) {
    const savedLang = localStorage.getItem('eysae-lang') || 'en';
    languageSwitcher.value = savedLang;
    document.documentElement.lang = savedLang;

    languageSwitcher.addEventListener('change', () => {
      const nextLang = languageSwitcher.value;
      localStorage.setItem('eysae-lang', nextLang);
      document.documentElement.lang = nextLang;
    });
  }
})();
