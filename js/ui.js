/* ================================================================
   ui.js — utilitaires d'interface (formatage, toasts, modale…)
   ================================================================ */
window.App = window.App || {};

App.ui = (function () {

  /* ---- Formatage FR ---- */
  function num(v, dec) {
    if (v === '' || v === null || v === undefined || isNaN(v)) return '—';
    dec = (dec === undefined) ? 2 : dec;
    return Number(v).toLocaleString('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }
  function kg(v) { return num(v, 2) + ' kg'; }
  function eur(v) {
    if (v === '' || v === null || v === undefined || isNaN(v)) return '—';
    return Number(v).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  }
  function toNumber(value) {
    if (typeof value === 'number') return value;
    const normalized = String(value == null ? '' : value).trim().replace(/\s/g, '').replace(',', '.');
    const n = parseFloat(normalized);
    return isNaN(n) ? NaN : n;
  }
  /* nombre « intelligent » : entier si entier, sinon 2 déc. (pour doses/qtés) */
  function q(v) {
    const n = Number(v) || 0;
    if (n === 0) return '0';
    if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n));
    return num(n, n < 1 ? 3 : 2);
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ---- Toasts ---- */
  function toast(msg, type, ms) {
    const box = document.getElementById('toasts');
    const t = document.createElement('div');
    t.className = 'toast ' + (type || 'info');
    t.textContent = msg;
    box.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 250); }, ms || 2500);
  }

  /* ---- Modale ---- */
  function modal(title, bodyHTML, onOpen, opts) {
    const m = document.getElementById('modal');
    const box = m.querySelector('.modal-box');
    box.classList.toggle('modal-wide', !!(opts && opts.wide));
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHTML;
    m.hidden = false;
    if (onOpen) onOpen(document.getElementById('modalBody'));
  }
  function closeModal() {
    const m = document.getElementById('modal');
    m.hidden = true;
    m.querySelector('.modal-box').classList.remove('modal-wide');
  }

  /* Confirmation simple → renvoie une promesse */
  function confirmBox(message, okLabel) {
    return new Promise(resolve => {
      modal('Confirmer', `
        <p>${esc(message)}</p>
        <div class="inline-actions" style="justify-content:flex-end;margin-top:1rem">
          <button class="btn btn-ghost" data-c="0">Annuler</button>
          <button class="btn btn-danger" data-c="1">${esc(okLabel || 'Confirmer')}</button>
        </div>`, (body) => {
        body.querySelectorAll('[data-c]').forEach(b => b.onclick = () => {
          closeModal(); resolve(b.dataset.c === '1');
        });
      });
    });
  }

  /* ---- Petites fabriques DOM ---- */
  function h(html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }

  /* En-tête de page réutilisable */
  function pageHead(title, subtitle, actionsHTML) {
    return `<div class="page-head">
      <div class="ph-text"><h1>${esc(title)}</h1>${subtitle ? `<p>${subtitle}</p>` : ''}</div>
      ${actionsHTML ? `<div class="ph-actions">${actionsHTML}</div>` : ''}
    </div>`;
  }

  /* Légende bleu/vert/noir reprise de l'Excel */
  const legend = `<div class="legend">
    <span><i class="dot dot-blue"></i> à remplir</span>
    <span><i class="dot dot-green"></i> repris d'ailleurs</span>
    <span><i class="dot dot-black"></i> calcul automatique</span>
  </div>`;

  return { num, kg, eur, q, toNumber, esc, toast, modal, closeModal, confirmBox, h, pageHead, legend };
})();
