/* ================================================================
   recipes.js — Recettes
   Vue simple par recette : on affiche seulement ce qui est utilisé.
   Ajout guidé par listes déroulantes pour éviter le grand tableau vide.
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
    if (!r) {
      view.innerHTML = ui.pageHead('📖 Recettes') +
        `<div class="callout warn">Aucune recette. <button class="linkbtn" id="add">Créer la première</button>.</div>`;
      view.querySelector('#add').onclick = addRecipe;
      return;
    }

    const showAll = !!view._showAllIngredients;
    const options = db.recettes.map(x => `<option value="${x.id}" ${x.id === currentId ? 'selected' : ''}>${ui.esc(x.nom)}</option>`).join('');
    const mapped = (db.baseMeatMap[r.key] || []).filter(id => db.gibier.some(g => g.id === id));
    const unusedGibier = db.gibier.filter(g => !mapped.includes(g.id));
    const baseKg = App.calc.baseMeat(db, r.key);

    const baseList = mapped.map(gid => {
      const g = db.gibier.find(x => x.id === gid);
      const net = g ? App.calc.gibierNet(db, g) : 0;
      return `<div class="selected-row">
        <div><strong>${ui.esc(g.nom)}</strong><span>${ui.num(net, 2)} kg net disponible</span></div>
        <button class="iconbtn" data-remove-base="${g.id}" title="Retirer">✕</button>
      </div>`;
    }).join('');
    const baseOptions = unusedGibier.map(g => `<option value="${g.id}">${ui.esc(g.nom)}</option>`).join('');

    const usedIngredients = db.ingredients.filter(ing => Number((ing.coefs && ing.coefs[r.key]) || 0) > 0);
    const visibleIngredients = showAll ? db.ingredients : usedIngredients;
    const unusedIngredients = db.ingredients.filter(ing => !usedIngredients.includes(ing));
    const addIngredientOptions = unusedIngredients.map(ing =>
      `<option value="${ing.id}">${ui.esc(ing.nom)} (${ui.esc(ing.unite || 'sans unité')})</option>`).join('');

    const doseRows = visibleIngredients.map(ing => {
      const val = Number((ing.coefs && ing.coefs[r.key]) || 0);
      const used = val > 0;
      return `<tr class="${used ? '' : 'muted'}">
        <td>${ui.esc(ing.nom)}</td>
        <td class="muted">${ui.esc(ing.unite)}</td>
        <td class="badge-cell">${ing.cat === 'Gibier' ? '<span class="badge badge-gibier">Gibier</span>' : '<span class="badge badge-achat">Achat</span>'}</td>
        <td class="num editable"><input class="mini-input" type="number" min="0" step="0.001" inputmode="decimal"
             data-dose="${ing.id}" value="${used ? val : ''}" placeholder="0"></td>
        <td class="right">${used ? `<button class="iconbtn" data-remove-dose="${ing.id}" title="Retirer de la recette">✕</button>` : ''}</td>
      </tr>`;
    }).join('');

    view.innerHTML = `
      ${ui.pageHead('📖 Recettes', 'Choisis une recette, puis règle uniquement les éléments qui la composent.')}

      <div class="card">
        <div class="page-head" style="margin-bottom:.6rem">
          <div class="ph-text">
            <div class="field" style="max-width:420px;margin:0">
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
      </div>

      <div class="recipe-layout">
        <section class="card">
          <h2>Viande de base</h2>
          <div class="big-number">${ui.num(baseKg, 2)} kg net</div>
          <p class="muted" style="margin:.1rem 0 .8rem">Gibier utilisé pour calculer cette recette.</p>
          <div class="selected-list">
            ${baseList || '<div class="empty-state">Aucun gibier de base pour cette recette.</div>'}
          </div>
          <div class="choice-add">
            <select id="baseAddSel" ${baseOptions ? '' : 'disabled'}>${baseOptions || '<option>Tout est déjà ajouté</option>'}</select>
            <button class="btn btn-outline" id="baseAddBtn" ${baseOptions ? '' : 'disabled'}>Ajouter</button>
          </div>
        </section>

        <section class="card">
          <div class="section-head">
            <div>
              <h2>Ingrédients de la recette</h2>
              <p class="muted">Dose pour 1 kg de viande de base.</p>
            </div>
            <button class="btn btn-outline btn-sm" id="toggleAll">${showAll ? 'Masquer les non utilisés' : 'Voir tous'}</button>
          </div>

          <div class="choice-add">
            <select id="ingAddSel" ${addIngredientOptions ? '' : 'disabled'}>${addIngredientOptions || '<option>Tous les ingrédients sont déjà utilisés</option>'}</select>
            <input class="mini-input" id="ingAddDose" type="number" min="0" step="0.001" inputmode="decimal" placeholder="Dose">
            <button class="btn btn-primary" id="ingAddBtn" ${addIngredientOptions ? '' : 'disabled'}>Ajouter</button>
          </div>

          <div class="tablewrap">
            <table>
              <thead><tr><th>Ingrédient</th><th>Unité</th><th>Cat.</th><th class="num">Dose / kg</th><th></th></tr></thead>
              <tbody>${doseRows || '<tr><td colspan="5" class="muted center">Aucun ingrédient dans cette recette.</td></tr>'}</tbody>
            </table>
          </div>
        </section>
      </div>
    `;

    view.querySelector('#recSel').onchange = (e) => { currentId = e.target.value; view._rid = currentId; view._showAllIngredients = false; render(); };
    view.querySelector('#addRec').onclick = addRecipe;
    view.querySelector('#renameRec').onclick = renameRecipe;
    view.querySelector('#delRec').onclick = deleteRecipe;
    view.querySelector('#toggleAll').onclick = () => { view._showAllIngredients = !view._showAllIngredients; render(); };

    view.querySelector('#baseAddBtn').onclick = () => {
      const gid = view.querySelector('#baseAddSel').value;
      if (!gid) return;
      const arr = db.baseMeatMap[r.key] || (db.baseMeatMap[r.key] = []);
      if (!arr.includes(gid)) arr.push(gid);
      App.store.save();
      render();
    };
    view.querySelectorAll('[data-remove-base]').forEach(btn => btn.onclick = () => {
      const arr = db.baseMeatMap[r.key] || [];
      const i = arr.indexOf(btn.dataset.removeBase);
      if (i >= 0) arr.splice(i, 1);
      App.store.save();
      render();
    });

    view.querySelector('#ingAddBtn').onclick = () => {
      const ing = db.ingredients.find(x => x.id === view.querySelector('#ingAddSel').value);
      if (!ing) return;
      const v = ui.toNumber(view.querySelector('#ingAddDose').value);
      if (!(v > 0)) { ui.toast('Indique une dose supérieure à 0.', 'err'); return; }
      if (!ing.coefs) ing.coefs = {};
      ing.coefs[r.key] = v;
      App.store.save();
      render();
    };

    view.querySelectorAll('input[data-dose]').forEach(inp => inp.oninput = () => {
      const ing = db.ingredients.find(x => x.id === inp.dataset.dose);
      const v = ui.toNumber(inp.value);
      if (!ing.coefs) ing.coefs = {};
      if (isNaN(v) || v <= 0) delete ing.coefs[r.key];
      else ing.coefs[r.key] = v;
      App.store.save();
    });
    view.querySelectorAll('[data-remove-dose]').forEach(btn => btn.onclick = () => {
      const ing = db.ingredients.find(x => x.id === btn.dataset.removeDose);
      if (ing && ing.coefs) delete ing.coefs[r.key];
      App.store.save();
      render();
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
        currentId = id; view._rid = id; view._showAllIngredients = false; render();
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
