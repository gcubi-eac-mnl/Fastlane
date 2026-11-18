/* Customer applications: document upload and preview, submission, notifications. */

function appsV() {
  const mine = db.apps.filter((a) => a.owner === me.email).reverse();
  if (!mine.length)
    return `<div class="card"><h2>No applications yet</h2><p>Get a quote first, then choose Apply now.</p><button class="btn gold" onclick="go('quote')">Get a quote</button></div>`;
  return mine
    .map((a) => {
      const q = a.quote,
        docs = reqDocs(q),
        all = docs.every(([k]) => a.docs[k]?.state === 'Accepted'),
        editable = ['Draft', 'On Hold'].includes(a.status);
      return `<div class="card"><h2>${a.id} ${BADGE(a.status)}</h2><p class="muted">${esc(q.make)} ${esc(q.model)} ${q.year}, ${peso(q.total)} per year</p>
    ${a.status === 'Declined' ? `<p>Declined: ${esc(a.notes)}</p>` : ''}
    ${
      editable
        ? `<h3>Required documents</h3>${docs
            .map(([k, l]) => {
              const d = a.docs[k];
              return `<div class="row" style="margin-bottom:.4rem"><div style="flex:1;min-width:200px"><b>${esc(l)}</b> ${d ? BADGE(d.state) : '<span class="b">Needed</span>'}${d?.reason ? `<div class="muted">${esc(d.reason)}</div>` : ''}${d ? `<div class="muted">${esc(d.name)} <button class="btn line sm" onclick="viewDoc('${a.id}','${k}')">View</button></div>` : ''}</div>${!d || d.state !== 'Accepted' || a.status === 'Draft' ? `<input type="file" style="width:auto" aria-label="Upload ${esc(l)}" accept=".jpg,.jpeg,.png,.pdf" onchange="upload('${a.id}','${k}',this.files[0])">` : ''}</div>`;
            })
            .join('')}
    <button class="btn gold" ${all ? '' : 'disabled'} onclick="submitApp('${a.id}')">${a.status === 'On Hold' ? 'Resubmit application' : 'Submit application'}</button>${all ? '' : '<span class="muted">Every document must pass the checks first.</span>'}`
        : ''
    }
    ${['New', 'Exception', 'Resubmitted'].includes(a.status) ? `<p>Reference <b>${a.id}</b>. ${a.status === 'Exception' ? 'An underwriter is confirming a driver record.' : 'Your application is in the underwriting queue.'}</p>` : ''}
    ${a.status === 'Approved' ? payV(a) : ''}${a.status === 'Active' ? `<p class="b ok">Policy active. See Claims to file a claim.</p>` : ''}</div>`;
    })
    .join('');
}

async function upload(id, k, f) {
  if (!f) return;
  const a = db.apps.find((x) => x.id === id),
    r = await checkFile(f);
  try {
    await filePut(id + ':' + k, f);
  } catch {}
  a.docs[k] = { name: f.name, state: r.ok ? 'Accepted' : 'Retake', reason: r.reason || '' };
  save();
  toast(r.ok ? 'Document accepted.' : r.reason);
  draw();
}

function submitApp(id) {
  const a = db.apps.find((x) => x.id === id),
    re = a.status === 'On Hold';
  a.status = re ? 'Resubmitted' : a.quote.ok ? 'New' : 'Exception';
  if (re) a.resub = true;
  a.submitted = a.submitted || now();
  a.q = now();
  log('Submitted ' + id);
  notify(me.email, 'Application ' + id + ' received.');
  save();
  draw();
}

function payV(a) {
  const p = db.policies.find((x) => x.app === a.id);
  return `<h3>Pay to activate (simulated gateway)</h3><p class="muted">Coverage starts only after payment is confirmed. No real money moves.</p>
<div class="row"><div><label>Method</label><select id="pm${a.id}"><option>GCash</option><option>Maya</option><option>Credit or debit card</option><option>Online bank transfer</option></select></div><div><label>Plan</label><select id="pp${a.id}"><option value="1">Annual ${peso(p.total)}</option><option value="12">First of 12 installments ${peso(p.total / 12)}</option></select></div><button class="btn gold" onclick="pay('${a.id}')">Pay now</button></div>`;
}

async function viewDoc(id, k) {
  let b;
  try {
    b = await fileGet(id + ':' + k);
  } catch {}
  if (!b) return toast('No file is stored for this document. Ask the customer to upload it again.');
  const u = URL.createObjectURL(b),
    m = document.createElement('div');
  m.className = 'modal';
  m.setAttribute('role', 'dialog');
  m.setAttribute('aria-label', 'Document preview');
  m.innerHTML = `<div class="mbox"><div class="row" style="justify-content:space-between"><b>${esc(b.name || k)}</b><button class="btn sm" id="mc">Close</button></div>${b.type === 'application/pdf' ? `<iframe src="${u}" title="PDF preview"></iframe>` : `<img src="${u}" alt="Uploaded document">`}</div>`;
  const close = () => {
    URL.revokeObjectURL(u);
    m.remove();
  };
  m.onclick = (e) => {
    if (e.target === m) close();
  };
  document.body.append(m);
  m.querySelector('#mc').onclick = close;
  m.querySelector('#mc').focus();
}

function notifsV() {
  const L = db.notifs.filter((n) => n.to === me.email);
  return `<div class="card"><h2>Notifications</h2>${L.map((n) => `<p><span class="muted">${when(n.t)}</span><br>${esc(n.m)}</p>`).join('') || '<p>Nothing yet.</p>'}</div>`;
}
