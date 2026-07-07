/* ================================================================
   calc.js — moteur de calcul
   Reproduit fidèlement les formules du classeur Excel :
   Stocks → viande de base → recettes → production → bocaux →
   liste de courses → budget.
   ================================================================ */
window.App = window.App || {};

App.calc = (function () {

  /* Le poids (kg) compte pour les unités de masse/volume ; les épices en g
     comptent au millième ; le reste (u, br, fl, m2, CS…) n'ajoute pas de poids. */
  function massFactor(unite) {
    const u = (unite || '').toLowerCase();
    if (u === 'kg' || u === 'l') return 1;
    if (u === 'g') return 0.001;
    return 0;
  }
  /* Facteur de coût : le prix des ingrédients « au gramme » est saisi au kg. */
  function costFactor(unite) {
    return (unite || '').toLowerCase() === 'g' ? 0.001 : 1;
  }

  function gibierBrut(db, gibierId) {
    const row = db.stocks[gibierId] || {};
    let s = 0;
    for (const p in row) s += Number(row[p]) || 0;
    return s;
  }
  function gibierNet(db, g) {
    return gibierBrut(db, g.id) * (Number(g.rendement) || 0);
  }
  function gibierNetTotal(db) {
    return db.gibier.reduce((s, g) => s + gibierNet(db, g), 0);
  }
  /** viande de base (kg net) d'une recette = somme des nets des gibiers mappés */
  function baseMeat(db, recipeKey) {
    const ids = db.baseMeatMap[recipeKey] || [];
    return ids.reduce((s, gid) => {
      const g = db.gibier.find(x => x.id === gid);
      return s + (g ? gibierNet(db, g) : 0);
    }, 0);
  }

  /** Calcul central de la production */
  function production(db) {
    const recettes = db.recettes;
    const base = {};                       // viande de base par recette
    recettes.forEach(r => base[r.key] = baseMeat(db, r.key));

    const rows = db.ingredients.map(ing => {
      const perRecipe = {};
      let total = 0;
      recettes.forEach(r => {
        const coef = (ing.coefs && ing.coefs[r.key]) || 0;
        const qty = coef * base[r.key];
        perRecipe[r.key] = qty;
        total += qty;
      });
      const cost = total * (Number(ing.prix) || 0) * costFactor(ing.unite);
      return { ing, perRecipe, total, cost };
    });

    // poids et coût par recette
    const weight = {}, cost = {};
    recettes.forEach(r => {
      let w = 0, c = 0;
      rows.forEach(row => {
        const q = row.perRecipe[r.key];
        w += q * massFactor(row.ing.unite);
        c += q * (Number(row.ing.prix) || 0) * costFactor(row.ing.unite);
      });
      weight[r.key] = w;
      cost[r.key] = c;
    });

    const totalWeight = recettes.reduce((s, r) => s + weight[r.key], 0);
    const totalCost   = recettes.reduce((s, r) => s + cost[r.key], 0);

    return { base, rows, weight, cost, totalWeight, totalCost };
  }

  /** Liste de courses (besoin – stock = à acheter) */
  function shopping(db, prod) {
    prod = prod || production(db);
    const lines = prod.rows.map(row => {
      const ing = row.ing;
      const c = db.courses[ing.id] || {};
      const besoin = row.total;
      const enStock = Number(c.enStock) || 0;
      const aAcheter = Math.max(besoin - enStock, 0);
      const cout = aAcheter * (Number(ing.prix) || 0) * costFactor(ing.unite);
      return {
        ing, besoin, enStock, aAcheter, cout,
        qui: c.qui || '', statut: c.statut || 'À faire',
      };
    });
    const totalAchats = lines.reduce((s, l) => s + l.cout, 0);
    return { lines, totalAchats };
  }

  /** Répartition en bocaux + suggestions */
  function bocaux(db, prod) {
    prod = prod || production(db);
    const fmtSug = db.formats.find(f => f.id === db.formatSuggere) || db.formats[0];
    const rows = db.recettes.map(r => {
      const b = (db.bocaux && db.bocaux[r.id]) || {};
      let packed = 0;
      const parFormat = {};
      db.formats.forEach(f => {
        const nb = Number(b[f.id]) || 0;
        parFormat[f.id] = nb;
        packed += nb * (f.reelG / 1000);
      });
      const totalKg = prod.weight[r.key] || 0;
      const suggere = fmtSug ? Math.round(totalKg / (fmtSug.reelG / 1000)) : 0;
      return { recette: r, parFormat, packed, totalKg, ecart: totalKg - packed, suggere };
    });
    // totaux par format + bocaux à acheter
    const parFormatTotal = {}, formatLines = [];
    db.formats.forEach(f => {
      const prevu = rows.reduce((s, row) => s + row.parFormat[f.id], 0);
      parFormatTotal[f.id] = prevu;
      const stock = Number((db.bocauxStock || {})[f.id]) || 0;
      formatLines.push({ format: f, stock, prevu, aAcheter: Math.max(prevu - stock, 0) });
    });
    const totalSuggere = rows.reduce((s, r) => s + r.suggere, 0);
    return { rows, formatLines, parFormatTotal, totalSuggere, fmtSug };
  }

  /** Budget estimé + comptes réels */
  function budget(db, prod) {
    prod = prod || production(db);
    const nb = Number(db.params.nbParticipants) || 0;
    const coutIngredients = prod.totalCost;
    const coutParticipant = nb ? coutIngredients / nb : 0;

    const parPate = db.recettes.map(r => ({ recette: r, cost: prod.cost[r.key] }));

    const totalDepenses = (db.depenses || []).reduce((s, d) => s + (Number(d.montant) || 0), 0);
    const partReelle = nb ? totalDepenses / nb : 0;

    return { coutIngredients, coutParticipant, parPate, totalDepenses, partReelle };
  }

  /** Tout d'un coup (pour le tableau de bord) */
  function all(db) {
    const prod = production(db);
    return {
      prod,
      shopping: shopping(db, prod),
      bocaux: bocaux(db, prod),
      budget: budget(db, prod),
      gibierNetTotal: gibierNetTotal(db),
    };
  }

  return {
    massFactor, costFactor,
    gibierBrut, gibierNet, gibierNetTotal, baseMeat,
    production, shopping, bocaux, budget, all,
  };
})();
