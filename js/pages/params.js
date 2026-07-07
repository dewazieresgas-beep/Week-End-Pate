/* ================================================================
   params.js — Paramètres (évolutif : tout se modifie ici)
   Onglets : Général · Participants · Gibier · Ingrédients · Formats · Données
   ================================================================ */
window.App = window.App || {};
App.pages = App.pages || {};

App.pages.params = function (view) {
  const db = App.store.get();
  const ui = App.ui;
  const tabs = [
    { k: 'general',    label: 'Général' },
    { k: 'participants', label: 'Participants' },
    { k: 'gibier',     label: 'Gibier & rendements' },
    { k: 'ingredients', label: 'Ingrédients & prix' },
    { k: 'formats',    label: 'Formats de bocaux' },
    { k: 'data',       label: 'Données' },
  ];
  let tab = view._ptab || 'general';

  function render() {
    view.innerHTML = ui.pageHead('⚙️ Paramètres', 'Ajoute, modifie ou supprime : participants, gibier, ingrédients, recettes, formats. Le site s\'adapte tout seul.') +
      `<div class="pill-row" id="ptabs">${tabs.map(t => `<button class="btn btn-sm ${t.k === tab ? 'btn-primary' : 'btn-outline'}" data-tab="${t.k}">${t.label}</button>`).join('')}</div>
       <div id="ptab"></div>`;
    view.querySelectorAll('#ptabs [data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; view._ptab = tab; render(); });
    ({ general: general, participants: participants, gibier: gibier, ingredients: ingredients, formats: formats, data: dataTab }[tab])();
  }

  const box = () => view.querySelector('#ptab');

  /* ---------------- Général ---------------- */
  function general() {
    const fmtOpts = db.formats.map(f => `<option value="${f.id}" ${f.id === db.formatSuggere ? 'selected' : ''}>${f.reelG} g</option>`).join('');
    box().innerHTML = `<div class="card" style="max-width:620px">
      <div class="form-row">
        <div class="field"><label>Lieu</label><input id="g_lieu" value="${ui.esc(db.params.lieu)}"></div>
        <div class="field"><label>Année</label><input id="g_annee" type="number" value="${db.params.annee}"></div>
      </div>
      <div class="form-row">
        <div class="field"><label>Nombre de participants</label><input id="g_nb" type="number" min="1" value="${db.params.nbParticipants}"><div class="hint">Sert au coût par participant.</div></div>
        <div class="field"><label>Format « suggéré »</label><select id="g_fmt">${fmtOpts}</select><div class="hint">Base du nombre de bocaux suggéré.</div></div>
      </div>
      <div class="field" style="max-width:280px"><label>Mot de passe de gestion</label><input id="g_pass" value="${ui.esc(db.params.adminPass)}"><div class="hint">Demandé à Frédéric à la connexion.</div></div>
    </div>`;
    const bind = (id, fn) => { const el = view.querySelector(id); el.onchange = () => { fn(el.value); App.store.save(); ui.toast('Enregistré.', 'ok', 1200); }; };
    bind('#g_lieu', v => db.params.lieu = v);
    bind('#g_annee', v => { db.params.annee = Math.round(ui.toNumber(v)) || db.params.annee; document.getElementById('brandYear').textContent = db.params.annee; });
    bind('#g_nb', v => db.params.nbParticipants = Math.round(ui.toNumber(v)) || 0);
    bind('#g_fmt', v => db.formatSuggere = v);
    bind('#g_pass', v => db.params.adminPass = v || 'pate');
  }

  /* ---------------- Participants ---------------- */
  function participants() {
    const rows = db.participants.map(p => `<tr data-p="${p.id}">
      <td><input class="txt-input" data-f="nom" value="${ui.esc(p.nom)}"></td>
      <td class="center"><input type="checkbox" data-f="actif" ${p.actif !== false ? 'checked' : ''}></td>
      <td><button class="iconbtn" data-del="${p.id}">🗑</button></td>
    </tr>`).join('');
    box().innerHTML = `<div class="card">
      <div class="page-head" style="margin-bottom:.6rem"><div class="ph-text"><h3 style="margin:0">Participants / chasseurs</h3></div>
        <div class="ph-actions"><button class="btn btn-amber btn-sm" id="add">＋ Participant</button></div></div>
      <div class="tablewrap"><table style="min-width:auto">
        <thead><tr><th>Nom</th><th class="center">Actif</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
      <p class="muted" style="margin:.6rem 0 0">« Actif » = proposé dans le formulaire de contribution. Supprimer efface aussi ses apports.</p>
    </div>`;
    view.querySelectorAll('tr[data-p]').forEach(tr => {
      const p = db.participants.find(x => x.id === tr.dataset.p);
      tr.querySelector('[data-f="nom"]').oninput = (e) => { p.nom = e.target.value; App.store.save(); };
      tr.querySelector('[data-f="actif"]').onchange = (e) => { p.actif = e.target.checked; App.store.save(); };
    });
    view.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
      const p = db.participants.find(x => x.id === b.dataset.del);
      if (!(await ui.confirmBox(`Supprimer « ${p.nom} » et ses apports ?`, 'Supprimer'))) return;
      App.store.removeById(db.participants, p.id);
      Object.keys(db.stocks).forEach(gid => { if (db.stocks[gid]) delete db.stocks[gid][p.id]; });
      App.store.save(); participants();
    });
    view.querySelector('#add').onclick = () => {
      db.participants.push({ id: App.store.uid('p'), nom: 'Nouveau', actif: true });
      App.store.save(); participants();
    };
  }

  /* ---------------- Gibier & rendements ---------------- */
  function gibier() {
    const rows = db.gibier.map(g => `<tr data-g="${g.id}">
      <td><input class="txt-input" data-f="nom" value="${ui.esc(g.nom)}"></td>
      <td class="num"><input class="mini-input" type="number" min="0" max="1" step="0.01" data-f="rendement" value="${g.rendement}"></td>
      <td><button class="iconbtn" data-del="${g.id}">🗑</button></td>
    </tr>`).join('');
    box().innerHTML = `<div class="card">
      <div class="page-head" style="margin-bottom:.6rem"><div class="ph-text"><h3 style="margin:0">Types de gibier</h3></div>
        <div class="ph-actions"><button class="btn btn-amber btn-sm" id="add">＋ Gibier</button></div></div>
      <div class="tablewrap"><table style="min-width:auto">
        <thead><tr><th>Nom</th><th class="num">Rendement (0–1)</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
      <p class="muted" style="margin:.6rem 0 0">Rendement : part utilisable (ex. 0,52 pour le faisan avec os). Net = brut × rendement. Le rattachement aux recettes se fait dans <button class="linkbtn" data-go="/recettes">Recettes</button>.</p>
    </div>`;
    view.querySelectorAll('tr[data-g]').forEach(tr => {
      const g = db.gibier.find(x => x.id === tr.dataset.g);
      tr.querySelector('[data-f="nom"]').oninput = (e) => { g.nom = e.target.value; App.store.save(); };
      tr.querySelector('[data-f="rendement"]').oninput = (e) => { g.rendement = ui.toNumber(e.target.value) || 0; App.store.save(); };
    });
    view.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
      const g = db.gibier.find(x => x.id === b.dataset.del);
      if (!(await ui.confirmBox(`Supprimer le gibier « ${g.nom} » ?`, 'Supprimer'))) return;
      App.store.removeById(db.gibier, g.id);
      delete db.stocks[g.id];
      Object.keys(db.baseMeatMap).forEach(k => { db.baseMeatMap[k] = db.baseMeatMap[k].filter(id => id !== g.id); });
      App.store.save(); gibier();
    });
    view.querySelector('#add').onclick = () => {
      db.gibier.push({ id: App.store.uid('g'), nom: 'Nouveau gibier', rendement: 1 });
      App.store.save(); gibier();
    };
    view.querySelector('[data-go]').onclick = () => App.router.go('/recettes');
  }

  /* ---------------- Ingrédients & prix ---------------- */
  function ingredients() {
    const rows = db.ingredients.map(ing => `<tr data-i="${ing.id}">
      <td><input class="txt-input" data-f="nom" value="${ui.esc(ing.nom)}"></td>
      <td><input class="txt-input" style="width:70px;min-width:60px" data-f="unite" value="${ui.esc(ing.unite)}"></td>
      <td class="num"><input class="mini-input" type="number" min="0" step="0.01" data-f="prix" value="${ing.prix}"></td>
      <td><select class="txt-input" data-f="cat"><option ${ing.cat === 'Gibier' ? 'selected' : ''}>Gibier</option><option ${ing.cat === 'Achat' ? 'selected' : ''}>Achat</option></select></td>
      <td><button class="iconbtn" data-del="${ing.id}">🗑</button></td>
    </tr>`).join('');
    box().innerHTML = `<div class="card">
      <div class="page-head" style="margin-bottom:.6rem"><div class="ph-text"><h3 style="margin:0">Ingrédients</h3></div>
        <div class="ph-actions"><button class="btn btn-amber btn-sm" id="add">＋ Ingrédient</button></div></div>
      <div class="tablewrap"><table>
        <thead><tr><th>Nom</th><th>Unité</th><th class="num">Prix (€)</th><th>Catégorie</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
      <p class="muted" style="margin:.6rem 0 0">« Gibier » = apporté par les chasseurs (pas acheté). « Achat » = liste de courses. Prix des unités en « g » saisi au kg. Les doses par recette se règlent dans <button class="linkbtn" data-go="/recettes">Recettes</button>.</p>
    </div>`;
    view.querySelectorAll('tr[data-i]').forEach(tr => {
      const ing = db.ingredients.find(x => x.id === tr.dataset.i);
      tr.querySelector('[data-f="nom"]').oninput = (e) => { ing.nom = e.target.value; App.store.save(); };
      tr.querySelector('[data-f="unite"]').oninput = (e) => { ing.unite = e.target.value; App.store.save(); };
      tr.querySelector('[data-f="prix"]').oninput = (e) => { ing.prix = ui.toNumber(e.target.value) || 0; App.store.save(); };
      tr.querySelector('[data-f="cat"]').onchange = (e) => { ing.cat = e.target.value; App.store.save(); };
    });
    view.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
      const ing = db.ingredients.find(x => x.id === b.dataset.del);
      if (!(await ui.confirmBox(`Supprimer l'ingrédient « ${ing.nom} » ?`, 'Supprimer'))) return;
      App.store.removeById(db.ingredients, ing.id);
      if (db.courses) delete db.courses[ing.id];
      App.store.save(); ingredients();
    });
    view.querySelector('#add').onclick = () => {
      db.ingredients.push({ id: App.store.uid('i'), nom: 'Nouvel ingrédient', unite: 'kg', prix: 0, cat: 'Achat', coefs: {} });
      App.store.save(); ingredients();
    };
    view.querySelector('[data-go]').onclick = () => App.router.go('/recettes');
  }

  /* ---------------- Formats de bocaux ---------------- */
  function formats() {
    const rows = db.formats.map(f => `<tr data-f="${f.id}">
      <td class="center"><input type="radio" name="sugg" data-sugg="${f.id}" ${f.id === db.formatSuggere ? 'checked' : ''}></td>
      <td class="num"><input class="mini-input" type="number" data-f="nominalG" value="${f.nominalG}"></td>
      <td class="num"><input class="mini-input" type="number" data-f="reelG" value="${f.reelG}"></td>
      <td><button class="iconbtn" data-del="${f.id}">🗑</button></td>
    </tr>`).join('');
    box().innerHTML = `<div class="card" style="max-width:560px">
      <div class="page-head" style="margin-bottom:.6rem"><div class="ph-text"><h3 style="margin:0">Formats de bocaux</h3></div>
        <div class="ph-actions"><button class="btn btn-amber btn-sm" id="add">＋ Format</button></div></div>
      <div class="tablewrap"><table style="min-width:auto">
        <thead><tr><th class="center">Suggéré</th><th class="num">Nominal (g)</th><th class="num">Poids réel (g)</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
      <p class="muted" style="margin:.6rem 0 0">« Nominal » = étiquette commerciale ; « Poids réel » = remplissage réel (utilisé pour les poids et le nombre suggéré).</p>
    </div>`;
    view.querySelectorAll('tr[data-f]').forEach(tr => {
      const f = db.formats.find(x => x.id === tr.dataset.f);
      tr.querySelector('[data-f="nominalG"]').oninput = (e) => { f.nominalG = Math.round(ui.toNumber(e.target.value)) || 0; App.store.save(); };
      tr.querySelector('[data-f="reelG"]').oninput = (e) => { f.reelG = Math.round(ui.toNumber(e.target.value)) || 0; App.store.save(); };
    });
    view.querySelectorAll('[data-sugg]').forEach(r => r.onchange = () => { db.formatSuggere = r.dataset.sugg; App.store.save(); });
    view.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
      const f = db.formats.find(x => x.id === b.dataset.del);
      if (db.formats.length <= 1) { ui.toast('Il faut au moins un format.', 'err'); return; }
      if (!(await ui.confirmBox(`Supprimer le format ${f.reelG} g ?`, 'Supprimer'))) return;
      App.store.removeById(db.formats, f.id);
      if (db.bocauxStock) delete db.bocauxStock[f.id];
      Object.keys(db.bocaux || {}).forEach(rid => { if (db.bocaux[rid]) delete db.bocaux[rid][f.id]; });
      if (db.formatSuggere === f.id) db.formatSuggere = db.formats[0].id;
      App.store.save(); formats();
    });
    view.querySelector('#add').onclick = () => {
      db.formats.push({ id: App.store.uid('f'), nominalG: 0, reelG: 0 });
      App.store.save(); formats();
    };
  }

  /* ---------------- Données ---------------- */
  function dataTab() {
    box().innerHTML = `<div class="card" style="max-width:620px">
      <h3>Sauvegarde & réinitialisation</h3>
      <p class="muted">Les données sont enregistrées sur cet appareil. Pense à exporter régulièrement (bouton en bas de page) pour ne rien perdre, surtout avant de changer de navigateur.</p>
      <div class="inline-actions">
        <button class="btn btn-outline" id="exp">⬇️ Exporter la sauvegarde</button>
        <button class="btn btn-outline" id="imp">⬆️ Importer</button>
      </div>
      <hr style="border:none;border-top:1px solid var(--line);margin:1.2rem 0">
      <h3 style="color:var(--danger)">Zone sensible</h3>
      <p class="muted">Réinitialiser efface toutes tes saisies et recharge les données d'origine (celles de l'Excel 2026).</p>
      <button class="btn btn-danger" id="reset">↺ Tout réinitialiser</button>
    </div>`;
    box().querySelector('#exp').onclick = () => document.getElementById('exportBtn').click();
    box().querySelector('#imp').onclick = () => document.getElementById('importBtn').click();
    box().querySelector('#reset').onclick = async () => {
      if (!(await ui.confirmBox('Tout réinitialiser aux données d\'origine ? Cette action est irréversible.', 'Réinitialiser'))) return;
      App.store.reset(); ui.toast('Données réinitialisées.', 'ok');
      App.router.renderNav(); render();
    };
  }

  render();
};
