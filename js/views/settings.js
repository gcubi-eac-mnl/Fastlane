/* Administrator screens: settings for rates, loading rules, repair shops and rejection reasons (FR-052),
   and staff account management (FR-003). Changes apply to new quotes; saved quotes keep their price. */

function cfgV() {
  const last = db.vig.length - 1,
    R = db.rules;
  const list = (title, key, hint) =>
    `<div class="card"><h2>${title}</h2><p class="muted">${hint}</p>${db[key]
      .map(
        (x, i) =>
          `<div class="row" style="margin-bottom:.3rem"><span style="flex:1">${esc(x)}</span><button class="btn line sm" onclick="delItem('${key}',${i})">Remove</button></div>`,
      )
      .join(
        '',
      )}<div class="row"><input id="add_${key}" aria-label="New entry" style="flex:1;max-width:320px"><button class="btn sm" onclick="addItem('${key}')">Add</button></div></div>`;
  return `<div class="card"><h2>Vehicle Insurance Groups and base premium</h2><p class="muted">A vehicle goes in the first group whose value limit it does not exceed. The last group has no limit.</p>
  <div class="wrap"><table><tr><th>Group</th><th>Vehicle value up to (PHP)</th><th>Base annual premium (PHP)</th></tr>${db.vig
    .map(
      (v, i) =>
        `<tr><td>${esc(v.g)}</td><td>${i === last ? '<span class="muted">No limit</span>' : `<input type="number" id="vm${i}" value="${v.max}">`}</td><td><input type="number" id="vb${i}" value="${v.base}"></td></tr>`,
    )
    .join('')}</table></div><button class="btn gold" onclick="saveVig()">Save rates</button></div>
  <div class="card"><h2>Driver risk loading</h2><p class="muted">Loading applies to each driver's own share of the premium, based on major violations in the look-back period.</p>
  <div class="g"><div><label for="lr1">Loading per major violation (%)</label><input id="lr1" type="number" value="${R.perMajor * 100}"></div><div><label for="lr2">Maximum loading (%)</label><input id="lr2" type="number" value="${R.cap * 100}"></div><div><label for="lr3">Major violations that trigger the maximum</label><input id="lr3" type="number" value="${R.threshold}"></div><div><label for="lr4">Look-back period (years)</label><input id="lr4" type="number" value="${R.years}"></div></div>
  <button class="btn gold" onclick="saveRules()">Save loading rules</button></div>
  ${list('Accredited repair shops', 'shops', 'Claims officers pick from this list.')}${list('Document rejection reasons', 'reasons', 'Underwriters pick from this list when rejecting a document.')}`;
}

function saveVig() {
  const next = db.vig.map((v, i, all) => ({
    ...v,
    max: i === all.length - 1 ? v.max : +$('#vm' + i).value,
    base: +$('#vb' + i).value,
  }));
  if (next.some((v) => !(v.base > 0))) return toast('Base premiums must be above zero.');
  if (next.some((v, i) => i < next.length - 1 && (!(v.max > 0) || (i && v.max <= next[i - 1].max))))
    return toast('Value limits must be above zero and increase from one group to the next.');
  db.vig = next;
  log('Updated VIG rates');
  save();
  toast('Rates saved. They apply to new quotes.');
}

function saveRules() {
  const r = {
    perMajor: +$('#lr1').value / 100,
    cap: +$('#lr2').value / 100,
    threshold: +$('#lr3').value,
    years: +$('#lr4').value,
  };
  if (!(r.perMajor >= 0 && r.cap > 0 && r.cap <= 1 && r.threshold >= 1 && r.years >= 1))
    return toast('Check the values: percentages 0 to 100, at least 1 violation and 1 year.');
  db.rules = r;
  log('Updated loading rules');
  save();
  toast('Loading rules saved. They apply to new quotes.');
}

function addItem(key) {
  const v = $('#add_' + key).value.trim();
  if (!v) return;
  if (db[key].includes(v)) return toast('That entry already exists.');
  db[key].push(v);
  log(`Added to ${key}: ${v}`);
  save();
  draw();
}

function delItem(key, i) {
  if (db[key].length <= 1) return toast('Keep at least one entry.');
  log(`Removed from ${key}: ${db[key][i]}`);
  db[key].splice(i, 1);
  save();
  draw();
}

const STAFF_ROLES = ['Underwriter', 'Claims Officer', 'Customer Service', 'Administrator'];

function staffV() {
  const staff = db.users.filter((u) => u.role !== 'Customer');
  return `<div class="card"><h2>Staff accounts</h2><div class="wrap"><table><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr>${staff
    .map(
      (u) =>
        `<tr><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td>${u.role}</td><td>${u.active === false ? '<span class="b bad">Deactivated</span>' : '<span class="b ok">Active</span>'}</td><td>${u.email === me.email ? '' : `<button class="btn line sm" onclick="toggleStaff('${esc(u.email)}')">${u.active === false ? 'Activate' : 'Deactivate'}</button><button class="btn line sm" onclick="adminResetPassword('${esc(u.email)}')">Reset password</button>`}</td></tr>`,
    )
    .join('')}</table></div></div>
  <div class="card"><h2>Create staff account</h2><div class="g"><div><label for="sn">Full name</label><input id="sn"></div><div><label for="se">Email</label><input id="se" type="email"></div><div><label for="sr">Role</label><select id="sr">${STAFF_ROLES.map((r) => `<option>${r}</option>`).join('')}</select></div><div><label for="sp">Temporary password (8+ characters)</label><input id="sp" type="password" autocomplete="new-password"></div></div><button class="btn gold" onclick="createStaff()">Create account</button></div>`;
}

async function createStaff() {
  const n = $('#sn').value.trim(),
    e = $('#se').value.trim().toLowerCase(),
    p = $('#sp').value;
  if (!n || !/^\S+@\S+\.\S+$/.test(e) || p.length < 8)
    return toast('Enter a name, a valid email and a password of 8+ characters.');
  if (db.users.some((x) => x.email === e)) return toast('That email is already registered.');
  db.users.push({ email: e, name: n, role: $('#sr').value, pw: await hashPw(p) });
  log(`Created ${$('#sr').value} account ${e}`);
  save();
  draw();
}

function toggleStaff(email) {
  const u = db.users.find((x) => x.email === email);
  u.active = u.active === false;
  log(`${u.active ? 'Activated' : 'Deactivated'} account ${email}`);
  save();
  draw();
}
