/* ================================================================
   auth.js — rôles & session
   ----------------------------------------------------------------
   Démo locale : session gardée dans sessionStorage.
   - admin      : Frédéric (gestion complète), protégé par mot de passe.
   - contrib    : un participant (accès au formulaire + archives photos).
   En mode Supabase, ce module sera remplacé par la vraie authentification.
   ================================================================ */
window.App = window.App || {};

App.auth = (function () {
  const KEY = 'pate_session';
  let session = null;

  function load() {
    try { session = JSON.parse(sessionStorage.getItem(KEY) || 'null'); }
    catch (e) { session = null; }
    return session;
  }
  function persist() { sessionStorage.setItem(KEY, JSON.stringify(session)); }

  function loginAdmin(pass) {
    const db = App.store.get();
    if (String(pass) === String(db.params.adminPass || 'pate')) {
      session = { role: 'admin', name: 'Frédéric' };
      persist();
      return true;
    }
    return false;
  }
  function loginContrib(participantId) {
    const db = App.store.get();
    const p = db.participants.find(x => x.id === participantId);
    if (!p) return false;
    session = { role: 'contrib', participantId: p.id, name: p.nom };
    persist();
    return true;
  }
  function logout() { session = null; sessionStorage.removeItem(KEY); }
  function current() { return session; }
  function isAdmin() { return session && session.role === 'admin'; }
  function isContrib() { return session && session.role === 'contrib'; }

  return { load, loginAdmin, loginContrib, logout, current, isAdmin, isContrib };
})();
