/* Customer quote screen (FR-004 to FR-011) and the start of an application. */

const quoteV = () => {
  rows = 1;
  return `<div class="hero"><h1>Get a quote in minutes.</h1><p>Enter your vehicle and up to five drivers. Try the sample licenses in the admin tab, for example N01-23-000001 (Juan Dela Cruz, 1990-05-14).</p></div>
<div class="card"><h2>Vehicle</h2><div class="g"><div><label>Make</label><input id="vm"></div><div><label>Model</label><input id="vo"></div><div><label>Year</label><input id="vy" type="number"></div><div><label>Market value (₱)</label><input id="vv" type="text" inputmode="numeric"></div><div><label>Registered in</label><select id="vc"><option>Metro Manila</option><option>Outside Metro Manila</option></select></div><div><label>Vehicle type</label><select id="vt"><option>Private passenger</option><option>Commercial</option><option>Public utility</option></select></div><div><label>Unknown license numbers</label><select id="lm"><option value="auto">Auto-generate a background</option><option value="manual">Send to manual review</option></select></div><div><label>Coverage</label><select id="cv"><option>Comprehensive</option><option>Third-Party Liability</option></select></div></div>
<h2 style="margin-top:1rem">Drivers</h2><div id="drvs">${drvRow(0)}</div><button class="btn line sm" onclick="addDrv()">Add driver</button><div id="qerr"></div><button class="btn gold" onclick="getQuote()">Get quote</button></div><div id="qres"></div>`;
};

function drvRow(i) {
  return `<div class="drv"><div><label>Driver ${i + 1} name${i ? '' : ' (primary)'}</label><input class="dn"></div><div><label>Birthdate</label><input class="dd" type="date"></div><div><label>License no.</label><input class="dl" placeholder="N01-23-000001"></div>${i ? `<button class="btn line sm" onclick="rows--;this.parentNode.remove()">Remove</button>` : '<span></span>'}</div>`;
}

function addDrv() {
  if (rows >= 5) return toast('A vehicle can have up to 5 drivers.');
  $('#drvs').insertAdjacentHTML('beforeend', drvRow(rows++));
}

function getQuote() {
  const f = {
    make: $('#vm').value.trim(),
    model: $('#vo').value.trim(),
    year: +$('#vy').value,
    value: +$('#vv').value.replace(/,/g, ''),
    city: $('#vc').value,
    cover: $('#cv').value,
    manual: $('#lm').value === 'manual',
    drivers: [...document.querySelectorAll('.drv')].map((r) => ({
      n: r.querySelector('.dn').value.trim(),
      d: r.querySelector('.dd').value,
      l: r.querySelector('.dl').value.trim(),
    })),
  };
  const er = [];
  if (!f.make || !f.model) er.push('Enter the vehicle make and model.');
  if (!(f.year >= 1990 && f.year <= 2027)) er.push('Vehicle year must be between 1990 and 2027.');
  if (!(f.value >= 50000)) er.push('Enter the vehicle market value in pesos (at least 50,000).');
  f.drivers.forEach((d, i) => {
    if (!d.n || !d.d) er.push(`Driver ${i + 1}: enter name and birthdate.`);
    if (!/^[A-Z]\d{2}-\d{2}-\d{6}$/i.test(d.l))
      er.push(`Driver ${i + 1}: license format is N01-23-000001.`);
  });
  if (f.city !== 'Metro Manila')
    er.push('Only private passenger vehicles registered in Metro Manila can be insured.');
  if ($('#vt').value !== 'Private passenger')
    er.push('Commercial and public utility vehicles are not covered.');
  if (er.length) {
    $('#qerr').innerHTML = er
      .map((x) => `<div class="b bad" style="display:block;margin:.2rem 0">${esc(x)}</div>`)
      .join('');
    $('#qres').innerHTML = '';
    return;
  }
  $('#qerr').innerHTML = '';
  lastQuote = calc(f);
  const q = { id: uid('Q'), owner: me.email, date: now(), q: lastQuote };
  db.quotes.push(q);
  lastQuote.qid = q.id;
  save();
  notify(me.email, 'Your quote is ready.');
  quoteOut();
}

function quoteOut() {
  const q = lastQuote;
  $('#qres').innerHTML =
    `<div class="card"><h2>Your quote</h2><p class="muted">${esc(q.make)} ${esc(q.model)} ${q.year}, ${q.vig} group, ${q.cover}</p>
  <div class="wrap"><table><tr><th>Driver</th><th>LTO check</th><th>Base share</th><th>Risk loading</th><th>Annual</th></tr>${q.ds.map((d) => `<tr><td>${esc(d.n)}</td><td><span class="b ${d.st === 'Verified' ? 'ok' : 'bad'}">${d.st}</span>${d.note ? `<div class="muted">${esc(d.note)}</div>` : ''}</td><td>${peso(d.tr)}</td><td>${d.excl ? 'Excluded' : Math.round(d.load * 100) + '%'}</td><td>${peso(d.amt)}</td></tr>`).join('')}</table></div>
  <p><span class="tot">${peso(q.total)}</span> per year, or <b>${peso(q.monthly)}</b> per month</p>
  ${q.ok ? '<p class="b ok">All drivers verified. No manual review needed.</p>' : '<p class="b warn">Some drivers need an underwriter check. You can still apply and we will resolve it.</p>'}
  <div><button class="btn gold" onclick="applyNow()">Apply now</button> <span class="muted">Change coverage:</span> <button class="btn line sm" onclick="recalc('Comprehensive')">Comprehensive</button><button class="btn line sm" onclick="recalc('Third-Party Liability')">Third-party liability</button></div></div>`;
}

function recalc(c) {
  lastQuote = calc({ ...lastQuote, cover: c, drivers: lastQuote.drivers });
  quoteOut();
}

function applyNow() {
  const a = {
    id: uid('FL'),
    owner: me.email,
    quote: lastQuote,
    status: 'Draft',
    docs: {},
    created: now(),
    resub: false,
    notes: '',
  };
  db.apps.push(a);
  log('Started application ' + a.id);
  go('apps');
}

/* Add thousands separators to the market value as the user types */
document.addEventListener('input', (e) => {
  if (e.target.id !== 'vv') return;
  const el = e.target;
  const pos = el.selectionStart;
  const before = el.value.length;

  const digits = el.value.replace(/\D/g, '');
  el.value = digits ? Number(digits).toLocaleString('en-US') : '';

  const newPos = Math.max(0, pos + (el.value.length - before));
  el.setSelectionRange(newPos, newPos);
});