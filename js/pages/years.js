/* ================================================================
   years.js — Années passées (archives + photos)
   Parcours principal : choisir une année, ajouter des photos, ouvrir
   une grande fiche annuelle avec quantités, bocaux et participants.
   ================================================================ */
window.App = window.App || {};
App.pages = App.pages || {};

App.pages.years = function (view) {
  const db = App.store.get();
  const ui = App.ui;
  const isAdmin = App.auth.isAdmin();
  if (!db.annees) db.annees = [];

  let selectedYearId = view._yearId || null;
  let pendingPhotoYearId = null;

  function currentYear() {
    return Number(db.params.annee) || new Date().getFullYear();
  }

  function sortedArchives() {
    return db.annees.slice().sort((a, b) => (Number(b.annee) || 0) - (Number(a.annee) || 0));
  }

  function findYearById(id) {
    return db.annees.find(y => y.id === id);
  }

  function findYearByNumber(annee) {
    return db.annees.find(y => Number(y.annee) === Number(annee));
  }

  function yearChoices() {
    const years = new Set([currentYear()]);
    db.annees.forEach(y => { if (Number(y.annee)) years.add(Number(y.annee)); });
    return Array.from(years).sort((a, b) => b - a);
  }

  function ensureYear(annee) {
    let y = findYearByNumber(annee);
    if (y) return y;
    y = {
      id: App.store.uid('y'),
      annee: Number(annee),
      lieu: db.params.lieu,
      resume: '',
      notes: '',
      pates: [],
      totalKg: 0,
      totalBocaux: 0,
      participantsCount: Number(db.params.nbParticipants) || 0,
      photos: [],
    };
    db.annees.push(y);
    App.store.save();
    return y;
  }

  function stats(y) {
    const patesTotal = (y.pates || []).reduce((s, p) => s + (Number(p.poidsKg) || 0), 0);
    return {
      totalKg: Number(y.totalKg) || patesTotal,
      totalBocaux: Number(y.totalBocaux) || 0,
      participantsCount: Number(y.participantsCount || y.nbParticipants) ||
        (Number(y.annee) === currentYear() ? (Number(db.params.nbParticipants) || 0) : 0),
      budget: Number(y.budget) || 0,
      photos: (y.photos || []).length,
    };
  }

  function render() {
    const selected = selectedYearId ? findYearById(selectedYearId) : null;
    if (selected) renderDetail(selected);
    else renderList();
  }

  function renderList() {
    const archives = sortedArchives();
    const choices = yearChoices();
    const defaultChoice = view._yearChoice || choices[0] || currentYear();
    const choiceOptions = choices.map(y => `<option value="${y}" ${Number(y) === Number(defaultChoice) ? 'selected' : ''}>${y}</option>`).join('');

    const cards = archives.map(y => {
      const st = stats(y);
      const cover = (y.photos && y.photos[0])
        ? `<div class="yr-cover" style="background-image:url('${y.photos[0]}')"></div>`
        : `<div class="yr-cover yr-empty">📷</div>`;
      return `<article class="year-row">
        ${cover}
        <div class="yr-main">
          <h2>${ui.esc(String(y.annee))}${y.lieu ? ` <span>${ui.esc(y.lieu)}</span>` : ''}</h2>
          ${y.resume ? `<p class="muted">${ui.esc(y.resume)}</p>` : ''}
          <div class="mini-metrics">
            <span><strong>${st.totalKg ? ui.num(st.totalKg, 1) : '—'}</strong> kg produits</span>
            <span><strong>${st.totalBocaux ? ui.num(st.totalBocaux, 0) : '—'}</strong> bocaux</span>
            <span><strong>${st.participantsCount || '—'}</strong> participants</span>
            <span><strong>${st.photos}</strong> photos</span>
          </div>
        </div>
        <div class="yr-actions">
          <button class="btn btn-primary btn-sm" data-open="${y.id}">Ouvrir</button>
          <button class="btn btn-outline btn-sm" data-add-photo="${y.id}">📷 Photos</button>
          ${isAdmin ? `<button class="btn btn-ghost btn-sm" data-edit="${y.id}">✏️</button>
                       <button class="btn btn-ghost btn-sm" data-del="${y.id}">🗑</button>` : ''}
        </div>
      </article>`;
    }).join('');

    view.innerHTML = `
      ${ui.pageHead('📸 Années passées', 'Choisis une année pour voir la fiche complète ou ajouter des photos.',
        `<button class="btn btn-amber btn-sm" id="addYear">＋ Ajouter une année</button>
         ${isAdmin ? `<button class="btn btn-primary btn-sm" id="archive">🗄️ Archiver ${currentYear()}</button>` : ''}`)}

      <div class="card year-picker">
        <div>
          <h2>Choisir l'année</h2>
          <p class="muted">Pour ajouter des photos de ${currentYear()}, sélectionne ${currentYear()} puis clique sur Photos.</p>
        </div>
        <div class="choice-add choice-add-large">
          <select id="yearChoice">${choiceOptions}</select>
          <button class="btn btn-primary" id="openChoice">Ouvrir</button>
          <button class="btn btn-outline" id="photoChoice">📷 Photos</button>
        </div>
      </div>

      ${archives.length ? `<div class="year-list">${cards}</div>` :
        `<div class="card center"><p class="muted">Aucune année archivée pour l’instant. Sélectionne ${currentYear()} ci-dessus pour commencer à ajouter des photos.</p></div>`}

      <input type="file" id="photoInput" accept="image/*" multiple hidden>
    `;

    view.querySelector('#addYear').onclick = addYear;
    if (isAdmin) view.querySelector('#archive').onclick = archiveCurrent;
    view.querySelector('#yearChoice').onchange = (e) => { view._yearChoice = Number(e.target.value); };
    view.querySelector('#openChoice').onclick = () => {
      const y = ensureYear(Number(view.querySelector('#yearChoice').value));
      openDetail(y.id);
    };
    view.querySelector('#photoChoice').onclick = () => {
      const y = ensureYear(Number(view.querySelector('#yearChoice').value));
      startPhotoAdd(y.id);
    };

    view.querySelectorAll('[data-open]').forEach(b => b.onclick = () => openDetail(b.dataset.open));
    view.querySelectorAll('[data-add-photo]').forEach(b => b.onclick = () => startPhotoAdd(b.dataset.addPhoto));
    if (isAdmin) {
      view.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => editYear(b.dataset.edit));
      view.querySelectorAll('[data-del]').forEach(b => b.onclick = () => deleteYear(b.dataset.del));
    }
    wirePhotoInput();
  }

  function renderDetail(y) {
    const st = stats(y);
    const photos = y.photos || [];
    const activePates = (y.pates || []).filter(p => Number(p.poidsKg) > 0);
    const pateRows = activePates.map(p =>
      `<tr><td>${ui.esc(p.nom)}</td><td class="num">${ui.num(p.poidsKg, 1)} kg</td></tr>`).join('');
    const gallery = photos.map((src, i) => `<figure>
      <img src="${src}" data-big="${i}" alt="photo ${ui.esc(String(y.annee))}">
      ${isAdmin ? `<button class="rm" data-rm-photo="${i}" title="Supprimer">✕</button>` : ''}
    </figure>`).join('');
    const coverStyle = photos[0] ? `style="background-image:url('${photos[0]}')"` : '';
    const isCurrent = Number(y.annee) === currentYear();

    view.innerHTML = `
      ${ui.pageHead(`📸 ${y.annee}`, y.lieu ? ui.esc(y.lieu) : '',
        `<button class="btn btn-outline btn-sm" id="backYears">← Années</button>
         <button class="btn btn-primary btn-sm" id="addPhotos">📷 Ajouter des photos</button>
         ${isAdmin && isCurrent ? `<button class="btn btn-amber btn-sm" id="archive">🗄️ Mettre à jour ${currentYear()}</button>` : ''}
         ${isAdmin ? `<button class="btn btn-ghost btn-sm" id="editYear">✏️ Modifier</button>` : ''}`)}

      <section class="archive-hero ${photos[0] ? '' : 'archive-empty'}" ${coverStyle}>
        <div>
          <p>${ui.esc(y.resume || 'Journée pâté')}</p>
          <h2>${ui.esc(String(y.annee))}</h2>
        </div>
      </section>

      <div class="kpis archive-kpis">
        <div class="kpi green"><div class="k-val">${st.totalKg ? ui.num(st.totalKg, 1) : '—'}</div><div class="k-lab">kg produits</div></div>
        <div class="kpi blue"><div class="k-val">${st.totalBocaux ? ui.num(st.totalBocaux, 0) : '—'}</div><div class="k-lab">bocaux</div></div>
        <div class="kpi"><div class="k-val">${st.participantsCount || '—'}</div><div class="k-lab">participants</div></div>
        <div class="kpi"><div class="k-val">${st.photos}</div><div class="k-lab">photos</div></div>
      </div>

      <div class="archive-layout">
        <section class="card">
          <h2>Production</h2>
          ${pateRows ? `<div class="tablewrap"><table style="min-width:auto">
            <thead><tr><th>Recette</th><th class="num">Quantité</th></tr></thead>
            <tbody>${pateRows}</tbody>
            <tfoot><tr class="total-row"><td>Total</td><td class="num">${st.totalKg ? ui.num(st.totalKg, 1) + ' kg' : '—'}</td></tr></tfoot>
          </table></div>` : `<div class="empty-state">Les quantités de cette année ne sont pas encore renseignées.</div>`}
          <div class="mini-metrics" style="margin-top:.8rem">
            <span><strong>${st.totalBocaux ? ui.num(st.totalBocaux, 0) : '—'}</strong> bocaux</span>
            <span><strong>${st.budget ? ui.eur(st.budget) : '—'}</strong> budget</span>
          </div>
        </section>

        <section class="card">
          <h2>Participants et notes</h2>
          <p><strong>${st.participantsCount || '—'}</strong> participants</p>
          ${Array.isArray(y.participants) && y.participants.length ? `<p class="muted">${ui.esc(y.participants.join(', '))}</p>` : ''}
          ${y.notes ? `<p>${ui.esc(y.notes)}</p>` : `<div class="empty-state">Aucune note pour cette année.</div>`}
        </section>
      </div>

      <section class="card">
        <div class="section-head">
          <div>
            <h2>Photos</h2>
            <p class="muted">${st.photos} photo${st.photos > 1 ? 's' : ''}</p>
          </div>
          <button class="btn btn-outline" id="addPhotos2">📷 Ajouter</button>
        </div>
        <div class="archive-gallery">${gallery || '<div class="empty-state">Aucune photo pour cette année.</div>'}</div>
      </section>

      <input type="file" id="photoInput" accept="image/*" multiple hidden>
    `;

    view.querySelector('#backYears').onclick = () => { selectedYearId = null; view._yearId = null; renderList(); };
    view.querySelector('#addPhotos').onclick = () => startPhotoAdd(y.id);
    view.querySelector('#addPhotos2').onclick = () => startPhotoAdd(y.id);
    if (isAdmin && isCurrent) view.querySelector('#archive').onclick = archiveCurrent;
    if (isAdmin) view.querySelector('#editYear').onclick = () => editYear(y.id);
    view.querySelectorAll('img[data-big]').forEach(im => im.onclick = () => {
      ui.modal(`${y.annee}`, `<img class="photo-full" src="${im.src}" alt="">`, null, { wide: true });
    });
    if (isAdmin) view.querySelectorAll('[data-rm-photo]').forEach(btn => btn.onclick = async () => {
      if (!(await ui.confirmBox('Supprimer cette photo ?', 'Supprimer'))) return;
      y.photos.splice(Number(btn.dataset.rmPhoto), 1);
      App.store.save();
      renderDetail(y);
    });
    wirePhotoInput();
  }

  function openDetail(yid) {
    selectedYearId = yid;
    view._yearId = yid;
    render();
  }

  function startPhotoAdd(yid) {
    pendingPhotoYearId = yid;
    const input = view.querySelector('#photoInput');
    if (input) input.click();
  }

  function wirePhotoInput() {
    const photoInput = view.querySelector('#photoInput');
    if (!photoInput) return;
    photoInput.onchange = async () => {
      const y = findYearById(pendingPhotoYearId);
      if (!y || !photoInput.files.length) return;
      if (!y.photos) y.photos = [];
      ui.toast('Traitement des photos…', 'info', 1500);
      for (const file of photoInput.files) {
        try { y.photos.push(await shrink(file)); } catch (e) { console.error(e); }
      }
      App.store.save();
      photoInput.value = '';
      selectedYearId = y.id;
      view._yearId = y.id;
      pendingPhotoYearId = null;
      render();
      ui.toast('Photos ajoutées.', 'ok');
    };
  }

  function addYear() {
    ui.modal('Ajouter une année', formHTML({
      annee: currentYear(),
      lieu: db.params.lieu,
      resume: '',
      notes: '',
      totalKg: '',
      totalBocaux: '',
      participantsCount: db.params.nbParticipants,
      budget: '',
    }), (body) => {
      body.querySelector('#c').onclick = ui.closeModal;
      body.querySelector('#ok').onclick = () => {
        const annee = Math.round(ui.toNumber(body.querySelector('#f_annee').value));
        if (!annee) { ui.toast('Indique une année.', 'err'); return; }
        const existing = findYearByNumber(annee);
        if (existing) {
          ui.closeModal();
          openDetail(existing.id);
          ui.toast('Cette année existe déjà.', 'info');
          return;
        }
        const y = { id: App.store.uid('y'), photos: [], pates: [] };
        readYearForm(body, y);
        db.annees.push(y);
        App.store.save();
        ui.closeModal();
        openDetail(y.id);
        ui.toast('Année ajoutée.', 'ok');
      };
    });
  }

  function editYear(yid) {
    const y = findYearById(yid); if (!y) return;
    ui.modal('Modifier l’année', formHTML(y), (body) => {
      body.querySelector('#c').onclick = ui.closeModal;
      body.querySelector('#ok').onclick = () => {
        readYearForm(body, y);
        App.store.save();
        ui.closeModal();
        openDetail(y.id);
        ui.toast('Modifié.', 'ok');
      };
    });
  }

  async function deleteYear(yid) {
    const y = findYearById(yid); if (!y) return;
    if (!(await ui.confirmBox(`Supprimer l'année ${y.annee} et ses photos ?`, 'Supprimer'))) return;
    App.store.removeById(db.annees, y.id);
    App.store.save();
    selectedYearId = null;
    view._yearId = null;
    renderList();
  }

  function formHTML(y) {
    return `<div class="form-row">
        <div class="field"><label>Année</label><input id="f_annee" type="number" value="${ui.esc(y.annee || '')}"></div>
        <div class="field"><label>Lieu</label><input id="f_lieu" value="${ui.esc(y.lieu || db.params.lieu || '')}"></div>
      </div>
      <div class="form-row">
        <div class="field"><label>Kg produits</label><input id="f_totalKg" type="number" min="0" step="0.1" inputmode="decimal" value="${ui.esc(y.totalKg || '')}"></div>
        <div class="field"><label>Nombre de bocaux</label><input id="f_totalBocaux" type="number" min="0" step="1" value="${ui.esc(y.totalBocaux || '')}"></div>
      </div>
      <div class="form-row">
        <div class="field"><label>Participants</label><input id="f_participants" type="number" min="0" step="1" value="${ui.esc(y.participantsCount || y.nbParticipants || '')}"></div>
        <div class="field"><label>Budget</label><input id="f_budget" type="number" min="0" step="0.01" inputmode="decimal" value="${ui.esc(y.budget || '')}"></div>
      </div>
      <div class="field"><label>Résumé court</label><input id="f_resume" value="${ui.esc(y.resume || '')}" placeholder="Ex. Belle journée, beaucoup de faisan"></div>
      <div class="field"><label>Notes</label><textarea id="f_notes" rows="3" placeholder="Anecdotes, organisation, remarques…">${ui.esc(y.notes || '')}</textarea></div>
      <div class="inline-actions" style="justify-content:flex-end">
        <button class="btn btn-ghost" id="c">Annuler</button><button class="btn btn-primary" id="ok">Enregistrer</button>
      </div>`;
  }

  function readYearForm(body, y) {
    y.annee = Math.round(ui.toNumber(body.querySelector('#f_annee').value)) || y.annee || currentYear();
    y.lieu = body.querySelector('#f_lieu').value.trim();
    y.totalKg = ui.toNumber(body.querySelector('#f_totalKg').value) || 0;
    y.totalBocaux = Math.round(ui.toNumber(body.querySelector('#f_totalBocaux').value)) || 0;
    y.participantsCount = Math.round(ui.toNumber(body.querySelector('#f_participants').value)) || 0;
    y.budget = ui.toNumber(body.querySelector('#f_budget').value) || 0;
    y.resume = body.querySelector('#f_resume').value.trim();
    y.notes = body.querySelector('#f_notes').value.trim();
    if (!y.photos) y.photos = [];
    if (!y.pates) y.pates = [];
  }

  function archiveCurrent() {
    const prod = App.calc.production(db);
    const boc = App.calc.bocaux(db, prod);
    const bud = App.calc.budget(db, prod);
    const annee = currentYear();
    let y = findYearByNumber(annee);
    const pates = db.recettes.map(r => ({ nom: r.nom, poidsKg: prod.weight[r.key] || 0 }));
    const bocauxSaisis = boc.formatLines.reduce((s, l) => s + l.prevu, 0);
    const snap = {
      annee,
      lieu: db.params.lieu,
      pates,
      totalKg: prod.totalWeight,
      totalBocaux: bocauxSaisis || boc.totalSuggere,
      participantsCount: Number(db.params.nbParticipants) || 0,
      participants: db.participants.filter(p => p.actif !== false).map(p => p.nom),
      budget: bud.totalDepenses || bud.coutIngredients,
      updatedAt: new Date().toISOString(),
    };
    if (y) {
      Object.assign(y, snap);
      App.store.save();
      selectedYearId = y.id; view._yearId = y.id;
      render();
      ui.toast(`Année ${annee} mise à jour.`, 'ok');
    } else {
      y = Object.assign({ id: App.store.uid('y'), resume: '', notes: '', photos: [] }, snap);
      db.annees.push(y);
      App.store.save();
      selectedYearId = y.id; view._yearId = y.id;
      render();
      ui.toast(`Année ${annee} archivée.`, 'ok');
    }
  }

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
