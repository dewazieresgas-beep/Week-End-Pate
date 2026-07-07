/* ================================================================
   app.js — démarrage et branchements globaux
   ================================================================ */
(function () {
  const $ = (id) => document.getElementById(id);

  function boot() {
    App.store.load();
    App.auth.load();

    setYearLabels();
    wireLogin();
    wireChrome();

    if (App.auth.current()) showApp();
    else showLogin();
  }

  function setYearLabels() {
    const y = App.store.get().params.annee;
    ['loginYear', 'brandYear'].forEach(id => { const el = $(id); if (el) el.textContent = y; });
  }

  /* ---------------- Écran de connexion ---------------- */
  function wireLogin() {
    const choice = $('loginChoice'), fAdmin = $('loginAdmin'), fContrib = $('loginContrib');

    document.querySelectorAll('[data-login]').forEach(b => b.onclick = () => {
      choice.hidden = true;
      if (b.dataset.login === 'admin') { fAdmin.hidden = false; $('adminPass').focus(); }
      else { fillContribSelect(); fContrib.hidden = false; }
    });
    document.querySelectorAll('[data-login-back]').forEach(b => b.onclick = () => {
      fAdmin.hidden = true; fContrib.hidden = true; choice.hidden = false; $('adminErr').hidden = true;
    });

    fAdmin.onsubmit = (e) => {
      e.preventDefault();
      if (App.auth.loginAdmin($('adminPass').value)) { $('adminPass').value = ''; showApp(); }
      else { $('adminErr').hidden = false; }
    };
    fContrib.onsubmit = (e) => {
      e.preventDefault();
      if (App.auth.loginContrib($('contribWho').value)) showApp();
    };

    $('loginMode').innerHTML = 'Mode démo locale — les données sont enregistrées sur cet appareil. ' +
      'Le partage entre plusieurs personnes s\'activera avec Supabase (voir README).';
  }

  function fillContribSelect() {
    const sel = $('contribWho');
    const parts = App.store.get().participants.filter(p => p.actif !== false);
    sel.innerHTML = parts.map(p => `<option value="${p.id}">${App.ui.esc(p.nom)}</option>`).join('');
  }

  /* ---------------- Bascule connexion / app ---------------- */
  function showLogin() {
    $('login').hidden = false;
    $('app').hidden = true;
    $('loginChoice').hidden = false;
    $('loginAdmin').hidden = true;
    $('loginContrib').hidden = true;
  }

  function showApp() {
    $('login').hidden = true;
    $('app').hidden = false;

    const s = App.auth.current();
    $('whoBadge').textContent = (s.role === 'admin' ? '🔑 ' : '🖊️ ') + s.name;
    $('footMode').textContent = 'Mode démo locale (données sur cet appareil)';

    App.router.start();
  }

  /* ---------------- Barre, menu mobile, modale, export/import ---------------- */
  function wireChrome() {
    $('burger').onclick = () => App.router.openMobileNav();
    $('scrim').onclick = () => App.router.closeMobileNav();
    document.querySelector('.brand').onclick = () => App.router.go('/');

    $('logoutBtn').onclick = () => { App.auth.logout(); showLogin(); };

    $('modalClose').onclick = () => App.ui.closeModal();
    $('modal').addEventListener('click', (e) => { if (e.target.id === 'modal') App.ui.closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') App.ui.closeModal(); });

    // Export JSON
    $('exportBtn').onclick = () => {
      const blob = new Blob([App.store.exportJSON()], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'pate-gibier-' + App.store.get().params.annee + '.json';
      a.click();
      URL.revokeObjectURL(a.href);
      App.ui.toast('Sauvegarde exportée.', 'ok');
    };
    // Import JSON
    $('importBtn').onclick = () => $('importFile').click();
    $('importFile').onchange = (e) => {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          App.store.importJSON(reader.result);
          App.ui.toast('Données importées.', 'ok');
          App.router.renderNav();
          App.router.refresh();
        } catch (err) { App.ui.toast('Import impossible : ' + err.message, 'err', 4000); }
      };
      reader.readAsText(file);
      e.target.value = '';
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
