/* Underwriter queue, review screen, document rejection, and approve / hold / decline (FR-028 to FR-031). */

function uwqV() {
  if (uwOpen) return reviewV(db.apps.find((a) => a.id === uwOpen));
  const f = $('#uf')?.value || 'All',
    L = db.apps
      .filter(
        (a) =>
          ['New', 'Exception', 'On Hold', 'Resubmitted'].includes(a.status) &&
          (f === 'All' || a.status === f),
      )
      .sort(
        (a, b) =>
          (b.status === 'Resubmitted') - (a.status === 'Resubmitted') ||
          new Date(a.q) - new Date(b.q),
      );
  return `<div class="card"><h2>Application queue</h2><label for="uf">Status filter</label><select id="uf" style="width:auto" onchange="draw();$('#uf').value=this.value"><option>All</option>${['New', 'Exception', 'On Hold', 'Resubmitted'].map((s) => `<option ${s === f ? 'selected' : ''}>${s}</option>`).join('')}</select>
  <div class="wrap"><table><tr><th>Ref</th><th>Vehicle</th><th>Drivers</th><th>Status</th><th>Submitted</th><th></th></tr>${L.map((a) => `<tr><td>${a.id}</td><td>${esc(a.quote.make)} ${esc(a.quote.model)}</td><td>${a.quote.ds.length}</td><td>${BADGE(a.status)}</td><td>${when(a.q)}</td><td><button class="btn sm" onclick="uwOpen='${a.id}';draw()">Review</button></td></tr>`).join('') || '<tr><td colspan="6">The queue is empty.</td></tr>'}</table></div></div>`;
}

function reviewV(a) {
  const q = a.quote;
  return `<button class="btn line sm" onclick="uwOpen=null;draw()">Back to queue</button><div class="card"><h2>${a.id} ${BADGE(a.status)}</h2><p>${esc(q.make)} ${esc(q.model)} ${q.year}, ${peso(q.value)}, ${q.vig} group, ${q.cover}. Owner: ${esc(a.owner)}</p>
<h3>Driver records (simulated LTO)</h3><div class="wrap"><table><tr><th>Declared</th><th>License</th><th>Result</th><th>LTO violations</th></tr>${q.ds
    .map((d) => {
      const r = ltoFind(d.l);
      return `<tr><td>${esc(d.n)}<br><span class="muted">${esc(d.d)}</span></td><td>${esc(d.l)}</td><td>${BADGE(d.st)}${d.note ? `<div class="muted">${esc(d.note)}</div>` : ''}${r ? `<div class="muted">LTO: ${esc(r.n)}, ${r.d}, ${r.s}</div>` : ''}</td><td>${r ? r.v.map((v) => `${esc(v.c)} (${v.sev}, ${v.dt})`).join('<br>') || 'None' : '-'}</td></tr>`;
    })
    .join('')}</table></div>
${a.status === 'Exception' ? `<button class="btn gold" onclick="resolveEx('${a.id}')">Confirm driver records</button>` : ''}
<h3>Documents</h3>${reqDocs(q)
    .map(([k, l]) => {
      const d = a.docs[k];
      return `<div class="row" style="margin-bottom:.3rem"><div style="flex:1"><b>${esc(l)}</b> ${d ? BADGE(d.state) : ''} <span class="muted">${esc(d?.name || '')}</span> ${d ? `<button class="btn line sm" onclick="viewDoc('${a.id}','${k}')">View</button>` : ''}</div><select id="rr${k}" style="width:auto">${REASONS.map((r) => `<option>${r}</option>`).join('')}</select><button class="btn line sm" onclick="rejDoc('${a.id}','${k}')">Reject document</button></div>`;
    })
    .join('')}
<h3>Decision</h3><button class="btn" onclick="decide('${a.id}','Approved')">Approve</button><button class="btn line" onclick="decide('${a.id}','On Hold')">Hold</button><button class="btn line" onclick="decide('${a.id}','Declined')">Decline</button></div>`;
}

function resolveEx(id) {
  const a = db.apps.find((x) => x.id === id);
  /* manual double-check done: build records for licenses the LTO had no data on, then reprice */
  a.quote.drivers.forEach((d) => {
    if (!ltoFind(d.l)) ltoEnsure(d);
  });
  a.quote = calc({ ...a.quote, manual: false });
  a.status = 'New';
  log('Resolved exception ' + id);
  save();
  toast('Driver records confirmed. Quote repriced from the checked records.');
  draw();
}

function rejDoc(id, k) {
  const a = db.apps.find((x) => x.id === id),
    r = $('#rr' + k).value;
  a.docs[k].state = 'Rejected';
  a.docs[k].reason = r;
  a.status = 'On Hold';
  log(`Rejected ${k} on ${id}: ${r}`);
  notify(a.owner, `A document on ${id} was rejected: ${r}. Re-upload only that file.`);
  save();
  uwOpen = null;
  draw();
}

function decide(id, s) {
  const a = db.apps.find((x) => x.id === id);
  if (s === 'Approved') {
    if (a.status === 'Exception') return toast('Confirm the driver records before approving.');
    if (Object.values(a.docs).some((d) => d.state !== 'Accepted'))
      return toast('A rejected document is still open.');
    db.policies.push({
      no: uid('POL'),
      app: id,
      owner: a.owner,
      status: 'Pending',
      total: a.quote.total,
      vehicle: a.quote.make + ' ' + a.quote.model,
      cover: a.quote.cover,
    });
  }
  if (s === 'Declined') {
    const r = prompt('Reason for declining?');
    if (!r) return;
    a.notes = r;
  }
  a.status = s;
  a.decided = now();
  log(`${s} ${id}`);
  notify(
    a.owner,
    `Application ${id}: ${s}.` + (s === 'Approved' ? ' Pay to activate your policy.' : ''),
  );
  save();
  uwOpen = null;
  draw();
}
