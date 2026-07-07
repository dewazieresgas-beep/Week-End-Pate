/* ================================================================
   shopping.js — Liste de courses
   Besoin (production) − En stock = À acheter. Coût automatique.
   ================================================================ */
window.App = window.App || {};
App.pages = App.pages || {};

App.pages.shopping = function (view) {
  const db = App.store.get();
  const ui = App.ui;
  const prod = App.calc.production(db);

  // On n'achète que les ingrédients "Achat" (le gibier vient des chasseurs)
  const achats = prod.rows.filter(row => row.ing.cat === 'Achat');

  const statuts = ['À faire', 'En cours', 'Acheté'];

  const rows = achats.map(row => {
    const ing = row.ing;
    const c = db.courses[ing.id] || {};
    const enStock = c.enStock || '';
    const opts = statuts.map(st => `<option ${((c.statut || 'À faire') === st) ? 'selected' : ''}>${st}</option>`).join('');
    return `<tr data-i="${ing.id}">
      <td>${ui.esc(ing.nom)}</td>
      <td class="muted">${ui.esc(ing.unite)}</td>
      <td class="num besoin">${ui.q(row.total)}</td>
      <td class="num editable"><input class="mini-input" type="number" min="0" step="0.01" inputmode="decimal" data-stock="${ing.id}" value="${enStock}" placeholder="0"></td>
      <td class="num acheter" data-i="${ing.id}">0</td>
      <td class="num muted">${ui.num(ing.prix, 2)}</td>
      <td class="num cout" data-i="${ing.id}">—</td>
      <td><input class="txt-input" data-qui="${ing.id}" value="${ui.esc(c.qui || '')}" placeholder="qui ?"></td>
      <td><select class="txt-input" data-statut="${ing.id}">${opts}</select></td>
    </tr>`;
  }).join('');

  // bocaux à prévoir
  const boc = App.calc.bocaux(db, prod);
  const bocRows = db.formats.map(f => {
    const line = boc.formatLines.find(l => l.format.id === f.id);
    const stock = (db.bocauxStock && db.bocauxStock[f.id]) || '';
    return `<tr data-f="${f.id}">
      <td>${f.reelG} g</td>
      <td class="num editable"><input class="mini-input" type="number" min="0" step="1" inputmode="numeric" data-bstock="${f.id}" value="${stock}" placeholder="0"></td>
      <td class="num">${ui.num(line.prevu, 0)}</td>
      <td class="num bacheter" data-f="${f.id}">${ui.num(line.aAcheter, 0)}</td>
    </tr>`;
  }).join('');

  view.innerHTML = `
    ${ui.pageHead('🛒 Liste de courses', 'Le besoin vient de la production. Indique le stock et qui s\'en occupe — le reste se calcule.')}
    ${ui.legend}
    <div class="card">
      <h2>Ingrédients à acheter</h2>
      <div class="tablewrap">
        <table>
          <thead><tr><th>Ingrédient</th><th>Unité</th><th class="num">Besoin</th><th class="num">En stock</th><th class="num">À acheter</th><th class="num">Prix</th><th class="num">Coût</th><th>Qui ?</th><th>Statut</th></tr></thead>
          <tbody>${rows}</tbody>
          <tfoot><tr class="total-row"><td colspan="6">TOTAL ACHATS</td><td class="num" id="totCourses">—</td><td colspan="2"></td></tr></tfoot>
        </table>
      </div>
    </div>

    <div class="card">
      <h2>Bocaux à prévoir</h2>
      <div class="tablewrap">
        <table style="min-width:auto">
          <thead><tr><th>Format</th><th class="num">En stock</th><th class="num">Prévu</th><th class="num">À acheter</th></tr></thead>
          <tbody>${bocRows}</tbody>
        </table>
      </div>
    </div>
  `;

  // Handlers ingrédients
  view.querySelectorAll('input[data-stock]').forEach(inp => inp.oninput = () => {
    setCourse(inp.dataset.stock, 'enStock', parseFloat(inp.value));
    recomputeCourses();
  });
  view.querySelectorAll('input[data-qui]').forEach(inp => inp.oninput = () => setCourse(inp.dataset.qui, 'qui', inp.value));
  view.querySelectorAll('select[data-statut]').forEach(sel => sel.onchange = () => setCourse(sel.dataset.statut, 'statut', sel.value));

  // Handlers bocaux
  view.querySelectorAll('input[data-bstock]').forEach(inp => inp.oninput = () => {
    const fid = inp.dataset.bstock; const v = parseInt(inp.value, 10);
    if (!db.bocauxStock) db.bocauxStock = {};
    if (isNaN(v)) delete db.bocauxStock[fid]; else db.bocauxStock[fid] = v;
    App.store.save();
    const b2 = App.calc.bocaux(db, prod);
    const line = b2.formatLines.find(l => l.format.id === fid);
    view.querySelector(`.bacheter[data-f="${fid}"]`).textContent = ui.num(line.aAcheter, 0);
  });

  function setCourse(id, field, val) {
    if (!db.courses[id]) db.courses[id] = {};
    if (field === 'enStock') { if (isNaN(val)) delete db.courses[id].enStock; else db.courses[id].enStock = val; }
    else db.courses[id][field] = val;
    App.store.save();
  }

  function recomputeCourses() {
    const sh = App.calc.shopping(db, prod);
    sh.lines.forEach(l => {
      if (l.ing.cat !== 'Achat') return;
      const ac = view.querySelector(`.acheter[data-i="${l.ing.id}"]`);
      const co = view.querySelector(`.cout[data-i="${l.ing.id}"]`);
      if (ac) ac.textContent = ui.q(l.aAcheter);
      if (co) co.textContent = l.cout ? ui.eur(l.cout) : '—';
    });
    view.querySelector('#totCourses').textContent = ui.eur(sh.totalAchats);
  }

  recomputeCourses();
};
