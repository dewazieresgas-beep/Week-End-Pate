/* ================================================================
   contribute.js — « Ma contribution »
   Formulaire simple : chaque participant saisit ses apports de gibier
   (kg). Le net se calcule tout seul. C'est LA page des participants.
   ================================================================ */
window.App = window.App || {};
App.pages = App.pages || {};

App.pages.contribute = function (view) {
  const db = App.store.get();
  const ui = App.ui;
  const s = App.auth.current();
  const isAdmin = App.auth.isAdmin();

  // participant courant : le contributeur lui-même, ou (admin) un choix
  let currentPid = isAdmin
    ? (view._pid || db.participants[0] && db.participants[0].id)
    : s.participantId;

  function render() {
    const parts = db.participants.filter(p => p.actif !== false);
    const selector = isAdmin
      ? `<div class="field" style="max-width:320px">
           <label>Saisir pour&nbsp;:</label>
           <select id="pidSel">${parts.map(p => `<option value="${p.id}" ${p.id === currentPid ? 'selected' : ''}>${ui.esc(p.nom)}</option>`).join('')}</select>
         </div>`
      : `<div class="callout blue">Bonjour <strong>${ui.esc(s.name)}</strong> 👋 — indique les kg de gibier que tu apportes. Tout est enregistré automatiquement.</div>`;

    const rows = db.gibier.map(g => {
      const val = (db.stocks[g.id] && db.stocks[g.id][currentPid]) || '';
      const net = (Number(val) || 0) * g.rendement;
      return `<tr data-g="${g.id}">
        <td>${ui.esc(g.nom)}</td>
        <td class="num muted">${ui.num(g.rendement * 100, 0)} %</td>
        <td class="num"><input class="mini-input" type="number" min="0" step="0.01" inputmode="decimal"
             data-g="${g.id}" value="${val}" placeholder="0" /></td>
        <td class="num net">${net ? ui.num(net, 2) : '—'}</td>
      </tr>`;
    }).join('');

    view.innerHTML = `
      ${ui.pageHead('🖊️ Ma contribution', 'Tes apports de gibier pour la journée pâté. Saisis les kilos ramenés (poids brut).')}
      ${selector}
      <div class="card">
        <div class="tablewrap">
          <table>
            <thead><tr><th>Type de gibier</th><th class="num">Rendement</th><th class="num">Mes kg (brut)</th><th class="num">Net estimé</th></tr></thead>
            <tbody>${rows}</tbody>
            <tfoot>
              <tr class="total-row"><td>MON TOTAL</td><td></td>
                <td class="num" id="totBrut">0</td><td class="num" id="totNet">0</td></tr>
            </tfoot>
          </table>
        </div>
        <p class="muted" style="margin:.7rem 0 0">💡 Le « net » tient compte du rendement (os, découpe). Frédéric agrège tout dans « Stocks gibier ».</p>
      </div>
    `;

    if (isAdmin) view.querySelector('#pidSel').onchange = (e) => {
      currentPid = e.target.value; view._pid = currentPid; render();
    };

    view.querySelectorAll('input[data-g]').forEach(inp => {
      inp.oninput = () => onInput(inp);
    });
    updateTotals();
  }

  function onInput(inp) {
    const gid = inp.dataset.g;
    const v = parseFloat(inp.value);
    if (!db.stocks[gid]) db.stocks[gid] = {};
    if (isNaN(v) || v === 0) delete db.stocks[gid][currentPid];
    else db.stocks[gid][currentPid] = v;
    App.store.save();

    // maj du net de la ligne
    const g = db.gibier.find(x => x.id === gid);
    const net = (v > 0 ? v : 0) * g.rendement;
    const tr = inp.closest('tr');
    tr.querySelector('.net').textContent = net ? ui.num(net, 2) : '—';
    updateTotals();
  }

  function updateTotals() {
    let brut = 0, net = 0;
    db.gibier.forEach(g => {
      const v = Number(db.stocks[g.id] && db.stocks[g.id][currentPid]) || 0;
      brut += v; net += v * g.rendement;
    });
    view.querySelector('#totBrut').textContent = ui.num(brut, 2);
    view.querySelector('#totNet').textContent = ui.num(net, 2);
  }

  render();
};
