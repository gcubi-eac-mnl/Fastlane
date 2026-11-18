/* Claims: customer filing and tracker, claims officer queue, stage updates (FR-035 to FR-042). */

function claimsV() {
  const ps = db.policies.filter((p) => p.owner === me.email && p.status === 'Active'),
    mine = db.claims.filter((c) => c.owner === me.email).reverse();
  return `<div class="card"><h2>File a claim</h2>${
    ps.length
      ? `<div class="g"><div><label>Policy</label><select id="cp">${ps.map((p) => `<option value="${p.no}">${p.no} ${esc(p.vehicle)}</option>`).join('')}</select></div><div><label>Incident date and time</label><input id="ci" type="datetime-local"></div><div><label>Location</label><input id="cl"></div><div><label>Estimated damage (₱)</label><input id="cd" type="number"></div></div>
  <label>What happened</label><textarea id="cx" rows="2"></textarea><label>Third party details (optional)</label><input id="ct"><button class="btn gold" onclick="fileClaim()">File claim</button>`
      : '<p>You need an active policy to file a claim.</p>'
  }</div>${mine.map(claimCard).join('')}`;
}

function claimCard(c) {
  return `<div class="card"><h3>${c.id} <span class="muted">${c.policy}</span> ${c.flag ? `<span class="b warn">${c.flag}</span>` : ''} ${claimLate(c) ? '<span class="b bad">Overdue</span>' : ''}</h3>
<div class="track">${STAGES.map((s, i) => `<span class="${i < c.stage ? 'd' : i === c.stage ? 'c' : ''}">${s}${c.hist[i] ? `<br>${when(c.hist[i])}` : ''}</span>`).join('')}</div>
<p class="muted">Officer: ${esc(c.officer)}${c.shop ? ` | Repair shop: ${esc(c.shop)}` : ''}${c.est ? ` | Estimate ${peso(c.est)}` : ''}${c.inspect ? ' | Inspection required' : ''}</p>
${me.role === 'Customer' && c.stage === 4 ? `<p>Settlement offer: <b>${peso(c.settle)}</b> ${c.method}</p><button class="btn gold" onclick="adv('${c.id}')">Accept offer</button>` : ''}
${me.role === 'Claims Officer' && c.stage !== 4 && c.stage < 6 ? `<button class="btn" onclick="adv('${c.id}')">Move to: ${STAGES[c.stage + 1]}</button>` : ''}</div>`;
}

function fileClaim() {
  const inc = $('#ci').value,
    desc = $('#cx').value.trim(),
    est = +$('#cd').value;
  if (!inc || !$('#cl').value.trim() || !desc)
    return toast('Enter the incident time, location and description.');
  if (new Date(inc) > new Date()) return toast('Incident time cannot be in the future.');
  const h = hrs(inc, now());
  let flag = '',
    late = '';
  if (h > 72) {
    late = prompt('This claim is over 72 hours late. Give the reason for the delay:');
    if (!late) return;
    flag = 'Filed late: reason required';
  } else if (h > 48) flag = 'Filed after 48 hours';
  const off = db.users
      .filter((u) => u.role === 'Claims Officer')
      .map((u) => ({ u, n: db.claims.filter((c) => c.officer === u.name && c.stage < 6).length }))
      .sort((a, b) => a.n - b.n)[0].u.name,
    p = db.policies.find((x) => x.no === $('#cp').value);
  const c = {
    id: uid('CL'),
    policy: p.no,
    owner: me.email,
    inc,
    loc: $('#cl').value,
    desc,
    tp: $('#ct').value,
    late,
    flag,
    stage: 0,
    hist: [now()],
    t: now(),
    officer: off,
    est: est || 0,
    inspect: p.cover === 'Comprehensive' && est > 10000,
    method: 'Direct payment to repair shop',
  };
  db.claims.push(c);
  log('Filed claim ' + c.id);
  notify(me.email, `Claim ${c.id} filed and assigned to ${off}.`);
  save();
  draw();
}

function adv(id) {
  const c = db.claims.find((x) => x.id === id);
  if (c.stage === 1) {
    const s = prompt(
      'Select repair shop:\n' +
        db.shops.map((x, i) => `${i + 1}. ${x}`).join('\n') +
        '\nEnter number:',
    );
    if (!s || !db.shops[s - 1]) return;
    c.shop = db.shops[s - 1];
  }
  if (c.stage === 2) {
    const e = +prompt('Repair estimate in pesos:', c.est || '');
    if (!(e > 0)) return;
    c.est = e;
    const rep = confirm(
      'Is the damage repairable?\nOK = repairable (pay shop). Cancel = not repairable (cash settlement).',
    );
    c.method = rep ? 'Direct payment to repair shop' : 'Cash settlement';
    c.settle = e;
  }
  c.stage++;
  c.hist[c.stage] = now();
  c.t = now();
  log(`Claim ${id} to ${STAGES[c.stage]}`);
  notify(c.owner, `Claim ${id} is now: ${STAGES[c.stage]}.`);
  save();
  draw();
}

function cqV() {
  const L = db.claims.filter((c) => c.officer === me.name).reverse();
  return `<div class="card"><h2>My claims</h2><p class="muted">Claims turn red when a stage passes its timer: 24 hours to acknowledge, 72 hours for later stages.</p></div>${L.map(claimCard).join('') || '<div class="card">No claims assigned.</div>'}`;
}
