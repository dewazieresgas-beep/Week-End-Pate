/* ================================================================
   production.js — Production & bocaux
   Tout est calculé à partir des recettes et de la viande de base.
   Seule saisie : le nombre de bocaux par format.
   ================================================================ */
window.App = window.App || {};
App.pages = App.pages || {};

App.pages.production = function (view) {
  const db = App.store.get();
  const ui = App.ui;
  const prod = App.calc.production(db);
  const recettes = db.recettes;

  // ---- viande de base par pâté ----
  const baseCards = recettes.map(r => `
    <div class="kpi"><div class="k-val" style="font-size:1.2rem">${ui.num(prod.base[r.key], 2)} kg</div>
      <div class="k-lab">${ui.esc(r.nom)}</div></div>`).join('');

  // ---- quantités d'ingrédients par pâté ----
  const thRec = recettes.map(r => `<th class="num" title="${ui.esc(r.nom)}">${ui.esc(shortName(r.nom))}</th>`).join('');
  const qtyRows = prod.rows.map(row => {
    if (row.total === 0) return ''; // n'affiche que les ingrédients réellement utilisés
    const cells = recettes.map(r => {
      const v = row.perRecipe[r.key];
      return `<td class="num ${v ? '' : 'muted'}">${v ? ui.q(v) : '·'}</td>`;
    }).join('');
    return `<tr><td>${ui.esc(row.ing.nom)}</td><td class="muted">${ui.esc(row.ing.unite)}</td>${cells}<td class="num"><strong>${ui.q(row.total)}</strong></td></tr>`;
  }).join('');

  const weightCells = recettes.map(r => `<td class="num">${ui.num(prod.weight[r.key], 2)}</td>`).join('');

  // ---- répartition en bocaux ----
  const fmts = db.formats;
  const thFmt = fmts.map(f => `<th class="num">${f.reelG} g</th>`).join('');
  const bocRows = recettes.map(r => {
    const b = (db.bocaux && db.bocaux[r.id]) || {};
    const inputs = fmts.map(f => `<td class="num editable"><input class="mini-input" type="number" min="0" step="1" inputmode="numeric"
        data-r="${r.id}" data-f="${f.id}" value="${b[f.id] || ''}" placeholder="0"></td>`).join('');
    return `<tr data-r="${r.id}">
      <td>${ui.esc(r.nom)}</td>
      ${inputs}
      <td class="num packed" data-r="${r.id}">0</td>
      <td class="num">${ui.num(prod.weight[r.key], 2)}</td>
      <td class="num ecart" data-r="${r.id}">0</td>
      <td class="num muted sugg" data-r="${r.id}">0</td>
    </tr>`;
  }).join('');
  const fmtTotals = fmts.map(f => `<td class="num fmttot" data-f="${f.id}">0</td>`).join('');

  view.innerHTML = `
    ${ui.pageHead('🥫 Production & bocaux', 'Calcul automatique depuis les recettes. Saisis seulement le nombre de bocaux par format.')}
    ${ui.legend}

    <div class="card">
      <h2>Viande de base par pâté (kg net)</h2>
      <div class="kpis" style="margin:0">${baseCards}</div>
    </div>

    <div class="card">
      <h2>Quantités d'ingrédients calculées</h2>
      <div class="tablewrap">
        <table>
          <thead><tr><th>Ingrédient</th><th>Unité</th>${thRec}<th class="num">Total</th></tr></thead>
          <tbody>${qtyRows || `<tr><td colspan="${recettes.length + 3}" class="muted center">Aucune quantité (saisis d'abord les stocks gibier).</td></tr>`}</tbody>
          <tfoot><tr class="total-row"><td>POIDS TOTAL (kg)</td><td></td>${weightCells}<td class="num">${ui.num(prod.totalWeight, 2)}</td></tr></tfoot>
        </table>
      </div>
    </div>

    <div class="card">
      <h2>Répartition en bocaux</h2>
      <p class="muted" style="margin:.1rem 0 .8rem">Saisis le nombre de bocaux par format. « Suggéré » = poids ÷ format ${ui.esc(String((db.formats.find(f=>f.id===db.formatSuggere)||{}).reelG || 315))} g.</p>
      <div class="tablewrap">
        <table>
          <thead><tr><th>Pâté</th>${thFmt}<th class="num">Emballé (kg)</th><th class="num">Total (kg)</th><th class="num">Écart</th><th class="num">Suggéré</th></tr></thead>
          <tbody>${bocRows}</tbody>
          <tfoot><tr class="total-row"><td>TOTAL</td>${fmtTotals}<td class="num" id="totPacked">0</td><td class="num">${ui.num(prod.totalWeight, 2)}</td><td></td><td class="num" id="totSugg">0</td></tr></tfoot>
        </table>
      </div>
    </div>
  `;

  view.querySelectorAll('input[data-r]').forEach(inp => inp.oninput = () => {
    const rid = inp.dataset.r, fid = inp.dataset.f;
    const v = parseInt(inp.value, 10);
    if (!db.bocaux) db.bocaux = {};
    if (!db.bocaux[rid]) db.bocaux[rid] = {};
    if (isNaN(v) || v === 0) delete db.bocaux[rid][fid];
    else db.bocaux[rid][fid] = v;
    App.store.save();
    recomputeBocaux();
  });

  function recomputeBocaux() {
    const b = App.calc.bocaux(db, prod);
    let totPacked = 0;
    b.rows.forEach(row => {
      const rid = row.recette.id;
      const pc = view.querySelector(`.packed[data-r="${rid}"]`);
      const ec = view.querySelector(`.ecart[data-r="${rid}"]`);
      const sg = view.querySelector(`.sugg[data-r="${rid}"]`);
      if (pc) pc.textContent = ui.num(row.packed, 2);
      if (ec) ec.textContent = ui.num(row.ecart, 2);
      if (sg) sg.textContent = ui.num(row.suggere, 0);
      totPacked += row.packed;
    });
    db.formats.forEach(f => {
      const c = view.querySelector(`.fmttot[data-f="${f.id}"]`);
      if (c) c.textContent = ui.num(b.parFormatTotal[f.id], 0);
    });
    view.querySelector('#totPacked').textContent = ui.num(totPacked, 2);
    view.querySelector('#totSugg').textContent = ui.num(b.totalSuggere, 0);
  }

  recomputeBocaux();

  function shortName(nom) {
    return nom.replace(/^Pâté de /i, '').replace(/^Rillette de /i, 'Rill. ').replace(/^Daube de /i, 'Daube ').replace(/^Civet de /i, 'Civet ');
  }
};
