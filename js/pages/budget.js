/* ================================================================
   budget.js — Budget & comptes
   Budget estimé (recettes) + comptes réels de la journée + remboursements.
   ================================================================ */
window.App = window.App || {};
App.pages = App.pages || {};

App.pages.budget = function (view) {
  const db = App.store.get();
  const ui = App.ui;
  const prod = App.calc.production(db);
  const b = App.calc.budget(db, prod);

  function render() {
    const parPate = b.parPate.map(x => `<tr><td>${ui.esc(x.recette.nom)}</td><td class="num">${x.cost ? ui.eur(x.cost) : '—'}</td></tr>`).join('');

    const depRows = (db.depenses || []).map(d => `<tr data-d="${d.id}">
      <td><input class="txt-input" data-f="qui" value="${ui.esc(d.qui)}"></td>
      <td><input class="txt-input" data-f="poste" value="${ui.esc(d.poste)}"></td>
      <td class="num"><input class="mini-input" type="number" step="0.01" data-f="montant" value="${d.montant}"></td>
      <td><button class="iconbtn" data-del-dep="${d.id}">🗑</button></td>
    </tr>`).join('');

    const rembRows = (db.remboursements || []).map(r => `<tr data-r="${r.id}">
      <td><input class="txt-input" data-f="qui" value="${ui.esc(r.qui)}"></td>
      <td class="num"><input class="mini-input" type="number" step="0.01" data-f="montant" value="${r.montant}"></td>
      <td><input class="txt-input" data-f="a" value="${ui.esc(r.a)}"></td>
      <td><button class="iconbtn" data-del-remb="${r.id}">🗑</button></td>
    </tr>`).join('');

    const totalRemb = (db.remboursements || []).reduce((s, r) => s + (Number(r.montant) || 0), 0);

    view.innerHTML = `
      ${ui.pageHead('💶 Budget & comptes', 'Coût estimé (d\'après les recettes) et comptes réels de la journée.')}

      <div class="kpis">
        <div class="kpi"><div class="k-val">${ui.eur(b.coutIngredients)}</div><div class="k-lab">Coût ingrédients (estimé)</div></div>
        <div class="kpi green"><div class="k-val">${ui.eur(b.coutParticipant)}</div><div class="k-lab">Coût estimé / participant</div></div>
        <div class="kpi blue"><div class="k-val">${ui.eur(b.totalDepenses)}</div><div class="k-lab">Dépenses réelles</div></div>
        <div class="kpi"><div class="k-val">${ui.eur(b.partReelle)}</div><div class="k-lab">Part réelle / participant</div></div>
      </div>

      <div class="card">
        <h2>Coût estimé par pâté</h2>
        <div class="tablewrap"><table style="min-width:auto">
          <thead><tr><th>Pâté</th><th class="num">Coût (€)</th></tr></thead>
          <tbody>${parPate}</tbody>
          <tfoot><tr class="total-row"><td>TOTAL</td><td class="num">${ui.eur(b.coutIngredients)}</td></tr></tfoot>
        </table></div>
      </div>

      <div class="card">
        <div class="page-head" style="margin-bottom:.6rem">
          <div class="ph-text"><h2 style="margin:0">Comptes réels de la journée ${db.params.annee}</h2></div>
          <div class="ph-actions"><button class="btn btn-amber btn-sm" id="addDep">＋ Dépense</button></div>
        </div>
        <div class="tablewrap"><table>
          <thead><tr><th>Qui</th><th>Poste</th><th class="num">Montant (€)</th><th></th></tr></thead>
          <tbody>${depRows || `<tr><td colspan="4" class="muted center">Aucune dépense.</td></tr>`}</tbody>
          <tfoot>
            <tr class="total-row"><td colspan="2">TOTAL DÉPENSES</td><td class="num">${ui.eur(b.totalDepenses)}</td><td></td></tr>
            <tr><td colspan="2" class="muted">Part par participant (÷ ${db.params.nbParticipants})</td><td class="num muted">${ui.eur(b.partReelle)}</td><td></td></tr>
          </tfoot>
        </table></div>
      </div>

      <div class="card">
        <div class="page-head" style="margin-bottom:.6rem">
          <div class="ph-text"><h2 style="margin:0">Remboursements</h2></div>
          <div class="ph-actions"><button class="btn btn-amber btn-sm" id="addRemb">＋ Remboursement</button></div>
        </div>
        <div class="tablewrap"><table style="min-width:auto">
          <thead><tr><th>Qui</th><th class="num">Montant (€)</th><th>À</th><th></th></tr></thead>
          <tbody>${rembRows || `<tr><td colspan="4" class="muted center">Aucun remboursement.</td></tr>`}</tbody>
          <tfoot><tr class="total-row"><td>TOTAL</td><td class="num">${ui.eur(totalRemb)}</td><td colspan="2"></td></tr></tfoot>
        </table></div>
      </div>
    `;

    // dépenses : édition inline
    view.querySelectorAll('tr[data-d]').forEach(tr => {
      const d = db.depenses.find(x => x.id === tr.dataset.d);
      tr.querySelectorAll('[data-f]').forEach(inp => inp.oninput = () => {
        const f = inp.dataset.f;
        d[f] = (f === 'montant') ? (parseFloat(inp.value) || 0) : inp.value;
        App.store.save();
        if (f === 'montant') refreshTotals();
      });
    });
    view.querySelectorAll('[data-del-dep]').forEach(btn => btn.onclick = async () => {
      if (!(await ui.confirmBox('Supprimer cette dépense ?', 'Supprimer'))) return;
      App.store.removeById(db.depenses, btn.dataset.delDep); App.store.save(); recomputeAndRender();
    });

    // remboursements : édition inline
    view.querySelectorAll('tr[data-r]').forEach(tr => {
      const r = db.remboursements.find(x => x.id === tr.dataset.r);
      tr.querySelectorAll('[data-f]').forEach(inp => inp.oninput = () => {
        const f = inp.dataset.f;
        r[f] = (f === 'montant') ? (parseFloat(inp.value) || 0) : inp.value;
        App.store.save();
        if (f === 'montant') recomputeAndRender();
      });
    });
    view.querySelectorAll('[data-del-remb]').forEach(btn => btn.onclick = async () => {
      if (!(await ui.confirmBox('Supprimer ce remboursement ?', 'Supprimer'))) return;
      App.store.removeById(db.remboursements, btn.dataset.delRemb); App.store.save(); recomputeAndRender();
    });

    view.querySelector('#addDep').onclick = () => {
      db.depenses.push({ id: App.store.uid('d'), qui: '', poste: '', montant: 0 });
      App.store.save(); recomputeAndRender();
    };
    view.querySelector('#addRemb').onclick = () => {
      db.remboursements.push({ id: App.store.uid('rb'), qui: '', montant: 0, a: '' });
      App.store.save(); recomputeAndRender();
    };
  }

  function refreshTotals() {
    Object.assign(b, App.calc.budget(db, prod));
    recomputeAndRender();
  }
  function recomputeAndRender() {
    Object.assign(b, App.calc.budget(db, prod));
    render();
  }

  render();
};
