/* ================================================================
   years.js — Années passées (archives + photos)
   Tout le monde peut ajouter une année et importer des photos.
   L'admin peut archiver l'année en cours, modifier et supprimer.
   ================================================================ */
window.App = window.App || {};
App.pages = App.pages || {};

App.pages.years = function (view) {
  const db = App.store.get();
  const ui = App.ui;
  const isAdmin = App.auth.isAdmin();
  if (!db.annees) db.annees = [];

  function render() {
    const list = db.annees.slice().sort((a, b) => (b.annee || 0) - (a.annee || 0));

    const cards = list.map(y => {
      const cover = (y.photos && y.photos[0])
        ? `<div class="yc-cover" style="background-image:url('${y.photos[0]}')"></div>`
        : `<div class="yc-cover">🖼️</div>`;
      const pates = (y.pates || []).filter(p => p.poidsKg).map(p =>
        `<tr><td>${ui.esc(p.nom)}</td><td class="num">${ui.num(p.poidsKg, 1)} kg</td></tr>`).join('');
      const strip = (y.photos || []).slice(0, 6).map((src, i) =>
        `<img src="${src}" data-photo="${y.id}:${i}" alt="photo ${y.annee}">`).join('');
      return `<div class="year-card">
        ${cover}
        <div class="yc-body">
          <h3>${ui.esc(String(y.annee))} ${y.lieu ? `<span class="muted" style="font-weight:400;font-size:.8em">· ${ui.esc(y.lieu)}</span>` : ''}</h3>
          ${y.resume ? `<p class="muted" style="margin:.2rem 0 .5rem">${ui.esc(y.resume)}</p>` : ''}
          ${pates ? `<div class="tablewrap"><table style="min-width:auto"><tbody>${pates}
             ${y.totalKg ? `<tr class="total-row"><td>Total</td><td class="num">${ui.num(y.totalKg, 1)} kg</td></tr>` : ''}
             ${y.totalBocaux ? `<tr><td class="muted">Bocaux</td><td class="num muted">${ui.num(y.totalBocaux, 0)}</td></tr>` : ''}
             </tbody></table></div>` : ''}
          ${y.notes ? `<p style="margin:.5rem 0 0">${ui.esc(y.notes)}</p>` : ''}
          <div class="photo-strip">${strip}</div>
          <div class="inline-actions" style="margin-top:.7rem">
            <button class="btn btn-outline btn-sm" data-add-photo="${y.id}">📷 Ajouter des photos</button>
            <button class="btn btn-ghost btn-sm" data-open="${y.id}">Voir tout</button>
            ${isAdmin ? `<button class="btn btn-ghost btn-sm" data-edit="${y.id}">✏️</button>
                         <button class="btn btn-ghost btn-sm" data-del="${y.id}">🗑</button>` : ''}
          </div>
        </div>
      </div>`;
    }).join('');

    view.innerHTML = `
      ${ui.pageHead('📸 Années passées', 'La mémoire des journées pâté : quantités produites et photos. Tout le monde peut importer des photos.',
        `<button class="btn btn-amber btn-sm" id="addYear">＋ Ajouter une année</button>
         ${isAdmin ? `<button class="btn btn-primary btn-sm" id="archive">🗄️ Archiver l'année en cours</button>` : ''}`)}
      ${list.length ? `<div class="year-grid">${cards}</div>`
        : `<div class="card center"><p class="muted">Aucune année archivée pour l'instant.<br>Clique sur « Ajouter une année » ou, côté gestion, « Archiver l'année en cours ».</p></div>`}
      <input type="file" id="photoInput" accept="image/*" multiple hidden>
    `;

    // actions globales
    view.querySelector('#addYear').onclick = addYear;
    if (isAdmin) view.querySelector('#archive').onclick = archiveCurrent;

    // photos
    let targetYear = null;
    const photoInput = view.querySelector('#photoInput');
    view.querySelectorAll('[data-add-photo]').forEach(b => b.onclick = () => { targetYear = b.dataset.addPhoto; photoInput.click(); });
    photoInput.onchange = async () => {
      const y = db.annees.find(x => x.id === targetYear); if (!y) return;
      if (!y.photos) y.photos = [];
      ui.toast('Traitement des photos…', 'info', 1500);
      for (const file of photoInput.files) {
        try { y.photos.push(await shrink(file)); } catch (e) { console.error(e); }
      }
      App.store.save(); photoInput.value = ''; render();
      ui.toast('Photos ajoutées.', 'ok');
    };

    view.querySelectorAll('[data-open]').forEach(b => b.onclick = () => openYear(b.dataset.open));
    view.querySelectorAll('img[data-photo]').forEach(im => im.onclick = () => {
      const [yid, idx] = im.dataset.photo.split(':'); openYear(yid, parseInt(idx, 10));
    });
    if (isAdmin) {
      view.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => editYear(b.dataset.edit));
      view.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
        const y = db.annees.find(x => x.id === b.dataset.del);
        if (!(await ui.confirmBox(`Supprimer l'année ${y.annee} et ses photos ?`, 'Supprimer'))) return;
        App.store.removeById(db.annees, y.id); App.store.save(); render();
      });
    }
  }

  /* --- galerie plein écran d'une année --- */
  function openYear(yid, startIdx) {
    const y = db.annees.find(x => x.id === yid); if (!y) return;
    const photos = y.photos || [];
    const grid = photos.map((src, i) => `<figure>
      <img src="${src}" data-big="${i}">
      ${isAdmin ? `<button class="rm" data-rm="${i}" title="Supprimer">✕</button>` : ''}
    </figure>`).join('') || '<p class="muted">Aucune photo. Utilise « Ajouter des photos ».</p>';
    ui.modal(`Photos — ${y.annee}`, `<div class="gallery-big">${grid}</div>`, (body) => {
      body.querySelectorAll('img[data-big]').forEach(im => im.onclick = () => {
        ui.modal(`${y.annee}`, `<img src="${im.src}" style="width:100%;border-radius:10px">`);
      });
      if (isAdmin) body.querySelectorAll('[data-rm]').forEach(btn => btn.onclick = async () => {
        if (!(await ui.confirmBox('Supprimer cette photo ?', 'Supprimer'))) return;
        y.photos.splice(parseInt(btn.dataset.rm, 10), 1); App.store.save();
        ui.closeModal(); render();
      });
    });
  }

  /* --- ajout manuel d'une année --- */
  function addYear() {
    ui.modal('Ajouter une année', formHTML({ annee: (db.params.annee || new Date().getFullYear()) - 1, resume: '', notes: '' }), (body) => {
      body.querySelector('#c').onclick = ui.closeModal;
      body.querySelector('#ok').onclick = () => {
        const annee = parseInt(body.querySelector('#f_annee').value, 10);
        if (!annee) { ui.toast('Indique une année.', 'err'); return; }
        db.annees.push({ id: App.store.uid('y'), annee, lieu: db.params.lieu,
          resume: body.querySelector('#f_resume').value.trim(),
          notes: body.querySelector('#f_notes').value.trim(), pates: [], photos: [] });
        App.store.save(); ui.closeModal(); render(); ui.toast('Année ajoutée.', 'ok');
      };
    });
  }

  function editYear(yid) {
    const y = db.annees.find(x => x.id === yid); if (!y) return;
    ui.modal('Modifier l\'année', formHTML(y), (body) => {
      body.querySelector('#c').onclick = ui.closeModal;
      body.querySelector('#ok').onclick = () => {
        y.annee = parseInt(body.querySelector('#f_annee').value, 10) || y.annee;
        y.resume = body.querySelector('#f_resume').value.trim();
        y.notes = body.querySelector('#f_notes').value.trim();
        App.store.save(); ui.closeModal(); render(); ui.toast('Modifié.', 'ok');
      };
    });
  }

  function formHTML(y) {
    return `<div class="field"><label>Année</label><input id="f_annee" type="number" value="${y.annee || ''}"></div>
      <div class="field"><label>Résumé court</label><input id="f_resume" value="${ui.esc(y.resume || '')}" placeholder="Ex. Belle saison, beaucoup de faisan"></div>
      <div class="field"><label>Notes</label><textarea id="f_notes" rows="3" placeholder="Anecdotes, quantités, participants…">${ui.esc(y.notes || '')}</textarea></div>
      <div class="inline-actions" style="justify-content:flex-end">
        <button class="btn btn-ghost" id="c">Annuler</button><button class="btn btn-primary" id="ok">Enregistrer</button></div>`;
  }

  /* --- archive l'année en cours à partir des calculs --- */
  function archiveCurrent() {
    const prod = App.calc.production(db);
    const boc = App.calc.bocaux(db, prod);
    const bud = App.calc.budget(db, prod);
    const annee = db.params.annee;
    const existing = db.annees.find(y => y.annee === annee);
    const pates = db.recettes.map(r => ({ nom: r.nom, poidsKg: prod.weight[r.key] || 0 }));
    const totalBocaux = boc.formatLines.reduce((s, l) => s + l.prevu, 0);
    const snap = {
      lieu: db.params.lieu, pates, totalKg: prod.totalWeight, totalBocaux,
      budget: bud.totalDepenses || bud.coutIngredients,
    };
    if (existing) {
      Object.assign(existing, snap); App.store.save(); render();
      ui.toast(`Année ${annee} mise à jour.`, 'ok');
    } else {
      db.annees.push(Object.assign({ id: App.store.uid('y'), annee, resume: '', notes: '', photos: [] }, snap));
      App.store.save(); render();
      ui.toast(`Année ${annee} archivée. Ajoute des photos !`, 'ok');
    }
  }

  /* --- réduction/compression d'image → dataURL --- */
  function shrink(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => {
        const img = new Image();
        img.onload = () => {
          const max = 1200; let w = img.width, h = img.height;
          if (w > h && w > max) { h = Math.round(h * max / w); w = max; }
          else if (h > max) { w = Math.round(w * max / h); h = max; }
          const c = document.createElement('canvas'); c.width = w; c.height = h;
          c.getContext('2d').drawImage(img, 0, 0, w, h);
          res(c.toDataURL('image/jpeg', 0.72));
        };
        img.onerror = rej; img.src = r.result;
      };
      r.onerror = rej; r.readAsDataURL(file);
    });
  }

  render();
};
