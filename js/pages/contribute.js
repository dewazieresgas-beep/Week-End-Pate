/* ================================================================
   contribute.js — « Ma contribution »
   Formulaire simple : on affiche les apports saisis et on ajoute
   un gibier au besoin, sans parcourir toute la grille.
   ================================================================ */
window.App = window.App || {};
App.pages = App.pages || {};

App.pages.contribute = function (view) {
  const db = App.store.get();
  const ui = App.ui;
  const s = App.auth.current();
  const isAdmin = App.auth.isAdmin();

  let currentPid = isAdmin
    ? (view._pid || db.participants[0] && db.participants[0].id)
    : s.participantId;

  function render() {
    const parts = db.participants.filter(p => p.actif !== false);
    const currentPart = db.participants.find(p => p.id === currentPid);
    const showAll = !!view._showAllGibier;
    const selector = isAdmin
      ? `<div class="field" style="max-width:360px">
           <label>Saisir pour</label>
           <select id="pidSel">${parts.map(p => `<option value="${p.id}" ${p.id === currentPid ? 'selected' : ''}>${ui.esc(p.nom)}</option>`).join('')}</select>
         </div>`
      : `<div class="callout blue">Bonjour <strong>${ui.esc(s.name)}</strong> — indique seulement le gibier que tu apportes.</div>`;

    const used = db.gibier.filter(g => Number(db.stocks[g.id] && db.stocks[g.id][currentPid]) > 0);
    const visible = showAll ? db.gibier : used;
    const available = db.gibier.filter(g => !used.includes(g));

    const rows = visible.map(g => {
      const val = (db.stocks[g.id] && db.stocks[g.id][currentPid]) || '';
      const net = (Number(val) || 0) * g.rendement;
      return `<tr data-g="${g.id}">
        <td>${ui.esc(g.nom)}</td>
        <td class="num muted">${ui.num(g.rendement * 100, 0)} %</td>
        <td class="num editable"><input class="mini-input" type="text" inputmode="decimal"
             data-g="${g.id}" value="${val}" placeholder="0"></td>
        <td class="num net">${net ? ui.num(net, 2) : '—'}</td>
        <td class="right">${val ? `<button class="iconbtn" data-clear="${g.id}" title="Effacer">✕</button>` : ''}</td>
      </tr>`;
    }).join('');

    const addOptions = available.map(g => `<option value="${g.id}">${ui.esc(g.nom)}</option>`).join('');

    view.innerHTML = `
      ${ui.pageHead('🖊️ Ma contribution', 'Saisie des kilos de gibier apportés, en poids brut.')}
      ${selector}

      <div class="kpis">
        <div class="kpi green"><div class="k-val" id="totBrut">0</div><div class="k-lab">kg brut pour ${ui.esc(currentPart ? currentPart.nom : 'ce participant')}</div></div>
        <div class="kpi blue"><div class="k-val" id="totNet">0</div><div class="k-lab">kg net estimé</div></div>
      </div>

      <div class="card">
        <div class="section-head">
          <div>
            <h2>Mes apports</h2>
            <p class="muted">Ajoute une ligne seulement quand tu as ce gibier.</p>
          </div>
          <button class="btn btn-outline btn-sm" id="toggleAll">${showAll ? 'Masquer les lignes vides' : 'Voir tous les gibiers'}</button>
        </div>

        <div class="choice-add">
          <select id="gibAddSel" ${addOptions ? '' : 'disabled'}>${addOptions || '<option>Tous les gibiers sont déjà saisis</option>'}</select>
          <input class="mini-input" id="gibAddKg" type="text" inputmode="decimal" placeholder="kg">
          <button class="btn btn-primary" id="gibAddBtn" ${addOptions ? '' : 'disabled'}>Ajouter</button>
        </div>

        <div class="tablewrap">
          <table>
            <thead><tr><th>Type de gibier</th><th class="num">Rendement</th><th class="num">Kg brut</th><th class="num">Net estimé</th><th></th></tr></thead>
            <tbody>${rows || '<tr><td colspan="5" class="muted center">Aucun apport saisi pour l’instant.</td></tr>'}</tbody>
            <tfoot>
              <tr class="total-row"><td>TOTAL</td><td></td>
                <td class="num" id="totBrutTable">0</td><td class="num" id="totNetTable">0</td><td></td></tr>
            </tfoot>
          </table>
        </div>
      </div>
    `;

    if (isAdmin) view.querySelector('#pidSel').onchange = (e) => {
      currentPid = e.target.value; view._pid = currentPid; view._showAllGibier = false; render();
    };

    view.querySelector('#toggleAll').onclick = () => { view._showAllGibier = !view._showAllGibier; render(); };
    view.querySelector('#gibAddBtn').onclick = () => {
      const gid = view.querySelector('#gibAddSel').value;
      const v = ui.toNumber(view.querySelector('#gibAddKg').value);
      if (!gid) return;
      if (!(v > 0)) { ui.toast('Indique un poids supérieur à 0.', 'err'); return; }
      if (!db.stocks[gid]) db.stocks[gid] = {};
      db.stocks[gid][currentPid] = v;
      App.store.save();
      render();
    };

    view.querySelectorAll('input[data-g]').forEach(inp => inp.oninput = () => onInput(inp));
    view.querySelectorAll('[data-clear]').forEach(btn => btn.onclick = () => {
      const gid = btn.dataset.clear;
      if (db.stocks[gid]) delete db.stocks[gid][currentPid];
      App.store.save();
      render();
    });
    updateTotals();
  }

  function onInput(inp) {
    const gid = inp.dataset.g;
    const v = ui.toNumber(inp.value);
    if (!db.stocks[gid]) db.stocks[gid] = {};
    if (isNaN(v) || v <= 0) delete db.stocks[gid][currentPid];
    else db.stocks[gid][currentPid] = v;
    App.store.save();

    const g = db.gibier.find(x => x.id === gid);
    const net = (v > 0 ? v : 0) * g.rendement;
    const tr = inp.closest('tr');
    tr.querySelector('.net').textContent = net ? ui.num(net, 2) : '—';
    updateTotals();
    if (!(v > 0) && !view._showAllGibier) render();
  }

  function updateTotals() {
    let brut = 0, net = 0;
    db.gibier.forEach(g => {
      const v = Number(db.stocks[g.id] && db.stocks[g.id][currentPid]) || 0;
      brut += v; net += v * g.rendement;
    });
    const brutText = ui.num(brut, 2);
    const netText = ui.num(net, 2);
    view.querySelector('#totBrut').textContent = brutText;
    view.querySelector('#totNet').textContent = netText;
    view.querySelector('#totBrutTable').textContent = brutText;
    view.querySelector('#totNetTable').textContent = netText;
  }

  render();
};
