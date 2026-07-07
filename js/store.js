/* ================================================================
   store.js — couche de données
   ----------------------------------------------------------------
   MODE ACTUEL : "démo locale" → tout est enregistré dans le
   navigateur (localStorage). Chaque appareil a ses propres données.

   MODE FUTUR : "Supabase" (partage multi-personnes). La forme des
   données ci-dessous a été pensée pour se brancher sur Supabase
   sans tout réécrire (voir README + supabase/schema.sql).
   ================================================================ */
window.App = window.App || {};

App.store = (function () {
  const KEY = 'pate_gibier_db_v1';
  let db = null;

  /** identifiant unique court */
  function uid(prefix) {
    return (prefix || 'id') + '_' + Math.random().toString(36).slice(2, 9);
  }

  /** charge la base : localStorage sinon données initiales (seed) */
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        db = JSON.parse(raw);
      } else {
        db = App.seed.build();
        save();
      }
    } catch (e) {
      console.error('Lecture base impossible, réinitialisation.', e);
      db = App.seed.build();
      save();
    }
    // garde-fou : compléter les champs manquants si le seed a évolué
    ensureShape();
    return db;
  }

  function ensureShape() {
    const def = App.seed.build();
    for (const k in def) {
      if (db[k] === undefined) db[k] = def[k];
    }
    if (!db.meta) db.meta = def.meta;
    mergeById(db.formats, def.formats);
    if (!db.bocauxStock) db.bocauxStock = {};
    def.formats.forEach(f => {
      if (db.bocauxStock[f.id] === undefined) {
        db.bocauxStock[f.id] = (def.bocauxStock && def.bocauxStock[f.id]) || 0;
      }
    });
  }

  function mergeById(target, defaults) {
    if (!Array.isArray(target) || !Array.isArray(defaults)) return;
    defaults.forEach(item => {
      if (!target.some(x => x && x.id === item.id)) {
        target.push(JSON.parse(JSON.stringify(item)));
      }
    });
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(db));
    } catch (e) {
      // dépassement de quota (souvent : trop de photos en base locale)
      App.ui && App.ui.toast(
        "Espace local plein — pense à archiver/alléger les photos (ou active Supabase).",
        'err', 5000
      );
      console.error(e);
    }
  }

  function get() { return db; }

  function reset() {
    db = App.seed.build();
    save();
  }

  function exportJSON() {
    return JSON.stringify(db, null, 2);
  }

  function importJSON(text) {
    const obj = JSON.parse(text);
    if (!obj || !obj.ingredients || !obj.recettes) {
      throw new Error('Fichier non reconnu.');
    }
    db = obj;
    ensureShape();
    save();
  }

  /* --- petits utilitaires de collection --- */
  function byId(list, id) { return (list || []).find(x => x.id === id); }
  function removeById(list, id) {
    const i = list.findIndex(x => x.id === id);
    if (i >= 0) list.splice(i, 1);
  }

  return { load, save, get, reset, uid, byId, removeById, exportJSON, importJSON };
})();
