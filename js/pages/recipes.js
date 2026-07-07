/* ================================================================
   recipes.js — Recettes
   Pour chaque recette : la viande de base (quels gibiers) + les doses
   d'ingrédient par kg de viande. Ajout / renommage / suppression.
   ================================================================ */
window.App = window.App || {};
App.pages = App.pages || {};

App.pages.recipes = function (view) {
  const db = App.store.get();
  const ui = App.ui;

  let currentId = view._rid && db.recettes.find(r => r.id === view._rid)
    ? view._rid : (db.recettes[0] && db.recettes[0].id);

  function recette() { return db.recettes.find(r => r.id === currentId); }

  function render() {
    const r = recette();
    if (!r) { view.innerHTML = ui.pageHead('📖 Recettes') + `<div class="callout warn">Aucune recette. <button class="linkbtn" id="add">Créer la première</button>.</div>`;
      view.querySelector('#add').onclick = addRecipe; return; }

    const options = db.recettes.map(x => `<option value="${x.id}" ${x.id === currentId ? 'selected' : ''}>${ui.esc(x.nom)}</option>`).join('');

    // viande de base : cases à cocher gibier
    const mapped = db.baseMeatMap[r.key] || [];
    const gibierChecks = db.gibier.map(g => `
      <label class="pill-check">
        <input type="checkbox" data-map="${g.id}" ${mapped.includes(g.id) ? 'checked' : ''}> ${ui.esc(g.nom)}
      </label>`).join('');
    const baseKg = App.calc.baseMeat(db, r.key);

    // doses par ingrédient
    const doseRows = db.ingredients.map(ing => {
      const val = (ing.coefs && ing.coefs[r.key]) || '';
      return `<tr>
        <td>${ui.esc(ing.nom)}</td>
        <td class="muted">${ui.esc(ing.unite)}</td>
        <td class="badge-cell">${ing.cat === 'Gibier' ? '<span class="badge badge-gibier">Gibier</span>' : '<span class="badge badge-achat">Achat</span>'}</td>
        <td class="num editable"><input class="mini-input" type="number" min="0" step="0.001" inputmode="decimal"
             data-dose="${ing.id}" value="${val}" placeholder="0"></td>
      </tr>`;
    }).join('');

    view.innerHTML = `
      ${ui.pageHead('📖 Recettes', 'Doses d\'ingrédient <strong>pour 1 kg de viande de base</strong>. À ne modifier que pour changer une recette.')}
      <div class="card">
        <div class="page-head" style="margin-bottom:.6rem">
          <div class="ph-text">
            <div class="field" style="max-width:360px;margin:0">
              <label>Recette</label>
              <select id="recSel">${options}</select>
            </div>
          </div>
          <div class="ph-actions">
            <button class="btn btn-outline btn-sm" id="renameRec">✏️ Renommer</button>
            <button class="btn btn-amber btn-sm" id="addRec">＋ Nouvelle recette</button>
            <button class="btn btn-danger btn-sm" id="delRec">🗑 Supprimer</button>
          </div>
        </div>

        <h3>Viande de base <span class="help" title="Quels gibiers (nets) composent la viande de base de cette recette.">?</span></h3>
        <div class="checks">${gibierChecks || '<span class="muted">Aucun gibier défini.</span>'}</div>
        <p class="callout">Viande de base actuelle : <strong>${ui.num(baseKg, 2)} kg net</strong>.</p>
      </div>

      <div class="card">
        <h3>Doses (quantité par kg de viande)</h3>
        <div class="tablewrap">
          <table>
            <thead><tr><th>Ingrédient</th><th>Unité</th><th>Cat.</th><th class="num">Dose / kg</th></tr></thead>
            <tbody>${doseRows}</tbody>
          </table>
        </div>
        <p class="muted" style="margin:.7rem 0 0">Astuce : laisse vide (ou 0) pour un ingrédient non utilisé dans cette recette.</p>
      </div>
    `;

    view.querySelector('#recSel').onchange = (e) => { currentId = e.target.value; view._rid = currentId; render(); };
    view.querySelector('#addRec').onclick = addRecipe;
    view.querySelector('#renameRec').onclick = renameRecipe;
    view.querySelector('#delRec').onclick = deleteRecipe;

    view.querySelectorAll('input[data-map]').forEach(chk => chk.onchange = () => {
      const gid = chk.dataset.map;
      let arr = db.baseMeatMap[r.key] || (db.baseMeatMap[r.key] = []);
      if (chk.checked) { if (!arr.includes(gid)) arr.push(gid); }
      else { const i = arr.indexOf(gid); if (i >= 0) arr.splice(i, 1); }
      App.store.save();
      // maj du "baseKg"
      view.querySelector('.callout strong').textContent = ui.num(App.calc.baseMeat(db, r.key), 2) + ' kg net';
    });

    view.querySelectorAll('input[data-dose]').forEach(inp => inp.oninput = () => {
      const ing = db.ingredients.find(x => x.id === inp.dataset.dose);
      const v = parseFloat(inp.value);
      if (!ing.coefs) ing.coefs = {};
      if (isNaN(v) || v === 0) delete ing.coefs[r.key];
      else ing.coefs[r.key] = v;
      App.store.save();
    });
  }

  function addRecipe() {
    ui.modal('Nouvelle recette', `
      <div class="field"><label>Nom du pâté / de la recette</label><input id="rn" placeholder="Ex. Pâté de canard à l'orange"></div>
      <div class="inline-actions" style="justify-content:flex-end">
        <button class="btn btn-ghost" id="c">Annuler</button><button class="btn btn-primary" id="ok">Créer</button>
      </div>`, (body) => {
      body.querySelector('#c').onclick = ui.closeModal;
      body.querySelector('#rn').focus();
      body.querySelector('#ok').onclick = () => {
        const nom = body.querySelector('#rn').value.trim();
        if (!nom) return;
        const id = App.store.uid('r'); const key = 'k_' + id;
        db.recettes.push({ id, key, nom });
        db.baseMeatMap[key] = [];
        App.store.save(); ui.closeModal();
        currentId = id; view._rid = id; render();
        ui.toast('Recette créée.', 'ok');
      };
    });
  }

  function renameRecipe() {
    const r = recette();
    ui.modal('Renommer la recette', `
      <div class="field"><label>Nom</label><input id="rn" value="${ui.esc(r.nom)}"></div>
      <div class="inline-actions" style="justify-content:flex-end">
        <button class="btn btn-ghost" id="c">Annuler</button><button class="btn btn-primary" id="ok">Enregistrer</button>
      </div>`, (body) => {
      body.querySelector('#c').onclick = ui.closeModal;
      body.querySelector('#ok').onclick = () => {
        const nom = body.querySelector('#rn').value.trim(); if (!nom) return;
        r.nom = nom; App.store.save(); ui.closeModal(); render(); ui.toast('Renommé.', 'ok');
      };
    });
  }

  async function deleteRecipe() {
    const r = recette();
    if (!(await ui.confirmBox(`Supprimer la recette « ${r.nom} » ? Ses doses et sa répartition en bocaux seront perdues.`, 'Supprimer'))) return;
    App.store.removeById(db.recettes, r.id);
    delete db.baseMeatMap[r.key];
    db.ingredients.forEach(ing => { if (ing.coefs) delete ing.coefs[r.key]; });
    if (db.bocaux) delete db.bocaux[r.id];
    App.store.save();
    currentId = db.recettes[0] && db.recettes[0].id; view._rid = currentId;
    render(); ui.toast('Recette supprimée.', 'ok');
  }

  render();
};
