/* ================================================================
   stocks.js — Stocks gibier (vue gestion complète)
   Tableau : gibier × chasseurs. Brut et Net calculés automatiquement.
   ================================================================ */
window.App = window.App || {};
App.pages = App.pages || {};

App.pages.stocks = function (view) {
  const db = App.store.get();
  const ui = App.ui;
  const parts = db.participants.filter(p => p.actif !== false);

  const thParts = parts.map(p => `<th class="num">${ui.esc(p.nom)}</th>`).join('');

  const rows = db.gibier.map(g => {
    const cells = parts.map(p => {
      const v = (db.stocks[g.id] && db.stocks[g.id][p.id]) || '';
      return `<td class="num editable"><input class="mini-input" type="text" inputmode="decimal"
        data-g="${g.id}" data-p="${p.id}" value="${v}" placeholder="0"></td>`;
    }).join('');
    return `<tr data-g="${g.id}">
      <td>${ui.esc(g.nom)}</td>
      ${cells}
      <td class="num rowbrut" data-g="${g.id}">0</td>
      <td class="num muted">${ui.num(g.rendement * 100, 0)} %</td>
      <td class="num rownet" data-g="${g.id}"><strong>0</strong></td>
    </tr>`;
  }).join('');

  const colTotals = parts.map(p => `<td class="num coltot" data-p="${p.id}">0</td>`).join('');

  view.innerHTML = `
    ${ui.pageHead('🦌 Stocks gibier', 'Apports (kg brut) de chaque chasseur. Le net = brut × rendement.')}
    ${ui.legend}
    <div class="card">
      <div class="tablewrap">
        <table>
          <thead><tr><th>Type de gibier</th>${thParts}<th class="num">Total brut</th><th class="num">Rdt</th><th class="num">Net (kg)</th></tr></thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr class="total-row"><td>TOTAL</td>${colTotals}
              <td class="num" id="grandBrut">0</td><td></td><td class="num" id="grandNet">0</td></tr>
          </tfoot>
        </table>
      </div>
      <p class="muted" style="margin:.7rem 0 0">Pour ajouter/supprimer un type de gibier, un rendement ou un chasseur → <button class="linkbtn" data-go="/parametres">Paramètres</button>.</p>
    </div>
  `;

  view.querySelectorAll('input[data-g]').forEach(inp => inp.oninput = () => {
    const gid = inp.dataset.g, pid = inp.dataset.p;
    const v = ui.toNumber(inp.value);
    if (!db.stocks[gid]) db.stocks[gid] = {};
    if (isNaN(v) || v === 0) delete db.stocks[gid][pid];
    else db.stocks[gid][pid] = v;
    App.store.save();
    recompute();
  });
  view.querySelector('[data-go]').onclick = () => App.router.go('/parametres');

  function recompute() {
    let grandBrut = 0, grandNet = 0;
    const colSum = {};
    parts.forEach(p => colSum[p.id] = 0);

    db.gibier.forEach(g => {
      let brut = 0;
      parts.forEach(p => {
        const v = Number(db.stocks[g.id] && db.stocks[g.id][p.id]) || 0;
        brut += v; colSum[p.id] += v;
      });
      const net = brut * g.rendement;
      grandBrut += brut; grandNet += net;
      const rb = view.querySelector(`.rowbrut[data-g="${g.id}"]`);
      const rn = view.querySelector(`.rownet[data-g="${g.id}"]`);
      if (rb) rb.textContent = brut ? ui.num(brut, 2) : '0';
      if (rn) rn.innerHTML = net ? `<strong>${ui.num(net, 2)}</strong>` : '0';
    });
    parts.forEach(p => {
      const c = view.querySelector(`.coltot[data-p="${p.id}"]`);
      if (c) c.textContent = colSum[p.id] ? ui.num(colSum[p.id], 2) : '0';
    });
    view.querySelector('#grandBrut').textContent = ui.num(grandBrut, 2);
    view.querySelector('#grandNet').textContent = ui.num(grandNet, 2);
  }

  recompute();
};
