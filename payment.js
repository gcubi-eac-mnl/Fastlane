/* Payment flow (FR-033, FR-034): QR page, simulated gateway page, success page. Swap the simulated gateway here. */

/* Step 1: Pay now creates a pending payment session and opens the QR page */
function pay(id) {
  const p = db.policies.find((x) => x.app === id),
    n = +$('#pp' + id).value;
  const s = {
    sid: uid('PS'),
    app: id,
    policy: p.no,
    method: $('#pm' + id).value,
    plan: n,
    amount: p.total / n,
    status: 'Pending',
    created: now(),
  };
  (db.sessions = db.sessions || []).push(s);
  paySid = s.sid;
  log('Started payment ' + s.sid);
  save();
  go('payqr');
}

/* Step 3: gateway confirms. Records the payment and activates the policy (coverage starts only here) */
function completePayment(sid) {
  const s = (db.sessions || []).find((x) => x.sid === sid);
  if (!s || s.status !== 'Pending') return null;
  const a = db.apps.find((x) => x.id === s.app),
    p = db.policies.find((x) => x.no === s.policy),
    e = new Date(),
    pay = { id: uid('PAY'), policy: p.no, amount: s.amount, method: s.method, date: now() };
  db.payments.push(pay);
  p.status = 'Active';
  p.start = now();
  e.setFullYear(e.getFullYear() + 1);
  p.end = e.toISOString();
  a.status = 'Active';
  a.activated = now();
  s.status = 'Paid';
  s.payId = pay.id;
  s.paid = pay.date;
  log('Payment confirmed ' + p.no);
  notify(a.owner, 'Payment confirmed. Policy ' + p.no + ' is active.');
  save();
  return s;
}

const payUrl = (s) =>
  location.href.split('#')[0] +
  '#pay=' +
  encodeURIComponent(btoa(JSON.stringify({ sid: s.sid, ref: s.app, amt: s.amount, m: s.method })));

/* Step 2a: QR page */
function payqrV() {
  const s = (db.sessions || []).find((x) => x.sid === paySid);
  if (!s)
    return '<div class="card"><p>No payment in progress.</p><button class="btn" onclick="go(\'apps\')">Back to applications</button></div>';
  setTimeout(() => {
    const el = $('#qr');
    if (!el) return;
    if (window.QRCode)
      new QRCode(el, {
        text: payUrl(s),
        width: 210,
        height: 210,
        correctLevel: QRCode.CorrectLevel.M,
      });
    else el.textContent = 'The QR library could not load. Use the Open payment page button.';
  }, 0);
  return `<div class="card" style="max-width:440px;margin:1rem auto;text-align:center"><h2>Scan to pay with ${esc(s.method)}</h2><p class="tot">${peso(s.amount)}</p><p class="muted">Application ${esc(s.app)}${s.plan > 1 ? ', first of 12 installments' : ', annual premium'}</p>
  <div id="qr" style="display:flex;justify-content:center;margin:1rem 0;min-height:210px"></div>
  <p class="muted">Scan this code with your phone camera. This page moves on by itself once the payment goes through.</p>
  <button class="btn gold" onclick="tab='paygw';draw()">Open payment page (simulate scan)</button><button class="btn line" onclick="go('apps')">Cancel</button>
  <p class="muted">Demo note: a real phone is a separate browser and cannot update this one. To follow the full flow, use the Open payment page button.</p></div>`;
}

/* Step 2b: gateway page (opened from the QR) */
const gwHTML = (s, sa) =>
  `<div class="card" style="max-width:380px;margin:1rem auto;text-align:center"><div class="muted">Simulated ${esc(s.method)} checkout, sandbox mode</div><h2>Confidently Fast</h2><div class="tot">${peso(s.amount)}</div><p class="muted">Reference ${esc(s.app)}<br>No real money moves.</p><button class="btn gold" id="gp" style="width:100%" onclick="confirmPay('${s.sid}',${sa ? 1 : 0})">Pay ${peso(s.amount)}</button>${sa ? '' : '<button class="btn line" style="width:100%" onclick="tab=\'payqr\';draw()">Cancel</button>'}</div>`;

function paygwV() {
  const s = (db.sessions || []).find((x) => x.sid === paySid);
  return s && s.status === 'Pending'
    ? gwHTML(s, 0)
    : '<div class="card"><p>This payment is no longer pending.</p><button class="btn" onclick="go(\'apps\')">Back to applications</button></div>';
}

function confirmPay(sid, sa) {
  const b = $('#gp');
  b.disabled = true;
  b.textContent = 'Processing payment...';
  setTimeout(() => {
    const s = completePayment(sid);
    if (sa) {
      const d = JSON.parse(atob(decodeURIComponent(location.hash.slice(5))));
      shell(
        doneHTML(s || { app: d.ref, amount: d.amt, method: d.m, paid: now() }, null, null, 1, !s),
      );
    } else {
      tab = 'paydone';
      draw();
    }
  }, 1200);
}

/* Step 4: success page */
function doneHTML(s, pol, rc, sa, unsynced) {
  const R = [
    ['Receipt no.', rc?.id],
    ['Amount paid', peso(s.amount)],
    ['Method', s.method + (s.plan > 1 ? ' (first of 12 installments)' : '')],
    ['Application', s.app],
    ['Policy no.', pol?.no],
    ['Coverage period', pol?.start ? when(pol.start) + ' to ' + when(pol.end) : ''],
    ['Paid on', when(s.paid)],
  ].filter((r) => r[1]);
  return `<div class="card" style="max-width:480px;margin:1rem auto;text-align:center"><div style="font:800 3rem Archivo;color:var(--ok)" aria-hidden="true">&#10003;</div><h1 style="font-style:normal;font-size:1.8rem">Payment successful</h1><p>Thank you. We received your payment${pol ? ' and your policy is now active.' : '.'}</p>
  <table style="text-align:left">${R.map((r) => `<tr><th>${r[0]}</th><td>${esc(r[1])}</td></tr>`).join('')}</table>
  ${unsynced ? '<p class="muted">Demo note: this device is a separate browser from the portal, so the policy was not activated there. Use the Open payment page button in the portal to complete the flow.</p>' : ''}
  ${sa ? '' : `<button class="btn gold" onclick="go('apps')">View my applications</button><button class="btn line" onclick="go('claims')">File a claim</button>`}</div>`;
}

function paydoneV() {
  const s = (db.sessions || []).find((x) => x.sid === paySid);
  if (!s || s.status !== 'Paid')
    return '<div class="card"><p>No completed payment to show.</p><button class="btn" onclick="go(\'apps\')">Back to applications</button></div>';
  return doneHTML(
    s,
    db.policies.find((x) => x.no === s.policy),
    db.payments.find((x) => x.id === s.payId),
  );
}

/* If the payment is completed in another tab of this browser, move this page on automatically */
addEventListener('storage', (e) => {
  if (e.key !== K || tab !== 'payqr' || !me || !e.newValue) return;
  db = JSON.parse(e.newValue);
  const s = (db.sessions || []).find((x) => x.sid === paySid);
  if (s?.status === 'Paid') {
    tab = 'paydone';
    draw();
  }
});

/* Opening the QR link on another device or tab lands on the gateway page without a login */
function standalone() {
  try {
    const d = JSON.parse(atob(decodeURIComponent(location.hash.slice(5))));
    shell(gwHTML({ sid: d.sid, app: d.ref, amount: d.amt, method: d.m }, 1));
  } catch {
    draw();
  }
}
