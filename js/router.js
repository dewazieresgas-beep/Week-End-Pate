/* ================================================================
   router.js — navigation par ancre (#/...) + menu selon le rôle
   ================================================================ */
window.App = window.App || {};

App.router = (function () {

  const NAV = [
    { group: 'Gestion', items: [
      { path: '/',           page: 'dashboard',  label: 'Tableau de bord',    ico: '📊', roles: ['admin'] },
      { path: '/stocks',     page: 'stocks',     label: 'Stocks gibier',      ico: '🦌', roles: ['admin'] },
      { path: '/recettes',   page: 'recipes',    label: 'Recettes',           ico: '📖', roles: ['admin'] },
      { path: '/production', page: 'production',  label: 'Production & bocaux',ico: '🥫', roles: ['admin'] },
      { path: '/courses',    page: 'shopping',    label: 'Liste de courses',   ico: '🛒', roles: ['admin'] },
      { path: '/budget',     page: 'budget',      label: 'Budget & comptes',   ico: '💶', roles: ['admin'] },
      { path: '/parametres', page: 'params',      label: 'Paramètres',         ico: '⚙️', roles: ['admin'] },
    ]},
    { group: 'Participants', items: [
      { path: '/contribution', page: 'contribute', label: 'Ma contribution',   ico: '🖊️', roles: ['admin', 'contrib'] },
      { path: '/annees',       page: 'years',      label: 'Années passées',    ico: '📸', roles: ['admin', 'contrib'] },
    ]},
  ];

  function allItems() { return NAV.reduce((a, g) => a.concat(g.items), []); }

  function role() { const s = App.auth.current(); return s ? s.role : null; }

  function renderNav() {
    const r = role();
    const nav = document.getElementById('sidenav');
    let html = '';
    NAV.forEach(group => {
      const items = group.items.filter(it => it.roles.includes(r));
      if (!items.length) return;
      html += `<div class="nav-group">${group.group}</div>`;
      items.forEach(it => {
        html += `<a href="#${it.path}" data-page="${it.page}"><span class="ico">${it.ico}</span>${it.label}</a>`;
      });
    });
    nav.innerHTML = html;
  }

  function currentPath() {
    let h = location.hash.replace(/^#/, '');
    if (!h) h = '/';
    return h;
  }

  function resolve() {
    const r = role();
    const path = currentPath();
    let item = allItems().find(it => it.path === path);
    // route inconnue ou interdite → page par défaut du rôle
    if (!item || !item.roles.includes(r)) {
      item = (r === 'admin')
        ? allItems().find(it => it.page === 'dashboard')
        : allItems().find(it => it.page === 'contribute');
      if (location.hash !== '#' + item.path) { location.hash = '#' + item.path; return; }
    }
    render(item);
  }

  function render(item) {
    const view = document.getElementById('view');
    // menu actif
    document.querySelectorAll('#sidenav a').forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === '#' + item.path);
    });
    closeMobileNav();
    const fn = App.pages[item.page];
    if (typeof fn === 'function') {
      try { fn(view); }
      catch (e) { console.error(e); view.innerHTML = `<div class="callout warn">Erreur d'affichage : ${App.ui.esc(e.message)}</div>`; }
    } else {
      view.innerHTML = `<div class="callout warn">Page « ${item.page} » introuvable.</div>`;
    }
    window.scrollTo(0, 0);
  }

  function go(path) { location.hash = '#' + path; }
  function refresh() { resolve(); }

  function openMobileNav() {
    document.getElementById('sidenav').classList.add('open');
    document.getElementById('scrim').classList.add('show');
  }
  function closeMobileNav() {
    document.getElementById('sidenav').classList.remove('open');
    document.getElementById('scrim').classList.remove('show');
  }

  function start() {
    renderNav();
    window.addEventListener('hashchange', resolve);
    resolve();
  }

  return { start, go, refresh, renderNav, openMobileNav, closeMobileNav };
})();
