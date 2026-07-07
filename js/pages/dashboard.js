/* ================================================================
   dashboard.js — Tableau de bord (onglet Accueil de l'Excel)
   ================================================================ */
window.App = window.App || {};
App.pages = App.pages || {};

App.pages.dashboard = function (view) {
  const db = App.store.get();
  const c = App.calc.all(db);
  const ui = App.ui;

  const kpis = [
    { cls: 'green', val: ui.num(c.gibierNetTotal, 1) + ' kg', lab: 'Gibier net total' },
    { cls: '',      val: ui.num(c.prod.totalWeight, 1) + ' kg', lab: 'Poids total de pâté' },
    { cls: 'blue',  val: ui.num(db.params.nbParticipants, 0), lab: 'Participants' },
    { cls: '',      val: ui.eur(c.prod.totalCost), lab: 'Budget ingrédients (estimé)' },
    { cls: 'green', val: ui.eur(c.budget.coutParticipant), lab: 'Coût / participant' },
    { cls: 'blue',  val: ui.num(c.bocaux.totalSuggere, 0), lab: 'Bocaux 315 g suggérés' },
  ];

  const recap = db.recettes.map(r => {
    const poids = c.prod.weight[r.key] || 0;
    const cost = c.prod.cost[r.key] || 0;
    return `<tr>
      <td>${ui.esc(r.nom)}</td>
      <td class="num">${poids ? ui.num(poids, 2) : '—'}</td>
      <td class="num">${cost ? ui.eur(cost) : '—'}</td>
    </tr>`;
  }).join('');

  view.innerHTML = `
    ${ui.pageHead('🦌 Tableau de bord', `Journée pâtés de gibier — ${ui.esc(db.params.lieu)} · ${db.params.annee}`)}

    <div class="kpis">
      ${kpis.map(k => `<div class="kpi ${k.cls}"><div class="k-val">${k.val}</div><div class="k-lab">${k.lab}</div></div>`).join('')}
    </div>

    <div class="card">
      <h2>Récapitulatif par pâté</h2>
      <div class="tablewrap">
        <table>
          <thead><tr><th>Pâté</th><th class="num">Poids (kg)</th><th class="num">Coût estimé (€)</th></tr></thead>
          <tbody>
            ${recap}
            <tr class="total-row">
              <td>TOTAL</td>
              <td class="num">${ui.num(c.prod.totalWeight, 2)}</td>
              <td class="num">${ui.eur(c.prod.totalCost)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <h2>Comment ça marche</h2>
      <ol class="muted" style="margin:.3rem 0 0;padding-left:1.2rem;line-height:1.9">
        <li><strong>Paramètres</strong> — prix des ingrédients, formats de bocaux, participants.</li>
        <li><strong>Stocks gibier</strong> — chaque chasseur saisit ses kg (ou via « Ma contribution »). Le net se calcule seul.</li>
        <li><strong>Recettes</strong> — doses par kg de viande (à ne toucher que pour changer une recette).</li>
        <li><strong>Production & bocaux</strong> — tout est automatique ; on y saisit le nombre de bocaux par format.</li>
        <li><strong>Liste de courses</strong> — se remplit seule : indique le stock et qui achète.</li>
        <li><strong>Budget & comptes</strong> — coût estimé + dépenses réelles + remboursements.</li>
      </ol>
    </div>

    <div class="pill-row">
      <button class="btn btn-outline btn-sm" data-go="/stocks">🦌 Saisir les stocks</button>
      <button class="btn btn-outline btn-sm" data-go="/production">🥫 Voir la production</button>
      <button class="btn btn-outline btn-sm" data-go="/courses">🛒 Liste de courses</button>
      <button class="btn btn-outline btn-sm" data-go="/budget">💶 Budget</button>
    </div>
  `;

  view.querySelectorAll('[data-go]').forEach(b => b.onclick = () => App.router.go(b.dataset.go));
};
