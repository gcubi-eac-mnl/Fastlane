/* Customer profile search, management report with CSV export, audit log, and sample LTO data (FR-049 to FR-053). */

function profV() {
  const s = ($('#ps')?.value || '').toLowerCase();
  let out = '';
  if (s) {
    const as = db.apps.filter((a) =>
        (a.id + a.owner + a.quote.ds.map((d) => d.n).join()).toLowerCase().includes(s),
      ),
      owners = [
        ...new Set(
          as
            .map((a) => a.owner)
            .concat(
              db.users
                .filter(
                  (u) => (u.email + u.name).toLowerCase().includes(s) && u.role === 'Customer',
                )
                .map((u) => u.email),
            ),
        ),
      ];
    out =
      owners
        .map(
          (o) =>
            `<div class="card"><h3>${esc(o)}</h3><b>Applications</b><br>${
              db.apps
                .filter((a) => a.owner === o)
                .map((a) => `${a.id} ${BADGE(a.status)} ${esc(a.quote.make)} ${esc(a.quote.model)}`)
                .join('<br>') || 'None'
            }<br><b>Policies</b><br>${
              db.policies
                .filter((p) => p.owner === o)
                .map((p) => `${p.no} ${BADGE(p.status)} ${peso(p.total)}`)
                .join('<br>') || 'None'
            }<br><b>Payments</b><br>${
              db.payments
                .filter((p) => db.policies.some((x) => x.no === p.policy && x.owner === o))
                .map((p) => `${peso(p.amount)} via ${p.method}, ${when(p.date)}`)
                .join('<br>') || 'None'
            }<br><b>Claims</b><br>${
              db.claims
                .filter((c) => c.owner === o)
                .map((c) => `${c.id}: ${STAGES[c.stage]}`)
                .join('<br>') || 'None'
            }</div>`,
        )
        .join('') || '<div class="card">No match found.</div>';
  }
  return `<div class="card"><h2>Customer profiles</h2><label for="ps">Search by name, email or reference number</label><div class="row"><input id="ps" style="max-width:380px" value="${esc(s)}" onkeydown="if(event.key==='Enter')draw()"><button class="btn" onclick="draw()">Search</button></div></div>${out}`;
}

function repV() {
  const ap = db.apps.filter((a) => a.submitted),
    dec = ap.filter((a) => a.decided),
    cl = db.claims.filter((c) => c.stage === 6);
  const avg = (a) => (a.length ? (a.reduce((s, x) => s + x, 0) / a.length).toFixed(1) : 'n/a');
  const rows = [
    ['Applications submitted', ap.length],
    ['Average underwriting turnaround (hours)', avg(dec.map((a) => hrs(a.submitted, a.decided)))],
    [
      'Document resubmission rate',
      ap.length ? Math.round((ap.filter((a) => a.resub).length / ap.length) * 100) + '%' : 'n/a',
    ],
    [
      'Quote to policy conversion',
      db.quotes.length
        ? Math.round(
            (db.apps.filter((a) => a.status === 'Active').length / db.quotes.length) * 100,
          ) + '%'
        : 'n/a',
    ],
    ['Average claim settlement time (hours)', avg(cl.map((c) => hrs(c.hist[0], c.hist[6])))],
    ['Open claims', db.claims.filter((c) => c.stage < 6).length],
    ['Overdue claims', db.claims.filter(claimLate).length],
  ];
  return `<div class="card"><h2>Management report</h2><table>${rows.map((r) => `<tr><td>${r[0]}</td><td><b>${r[1]}</b></td></tr>`).join('')}</table><button class="btn" onclick="csv()">Export CSV</button><button class="btn line" onclick="if(confirm('Delete all sample data and reset?')){localStorage.removeItem(K);indexedDB.deleteDatabase('fastlane_files');location.reload()}">Reset sample data</button></div>`;
}

function csv() {
  const rs = [
    ['Application', 'Owner', 'Status', 'Submitted', 'Decided'],
    ...db.apps.map((a) => [a.id, a.owner, a.status, a.submitted || '', a.decided || '']),
  ];
  const b = new Blob([rs.map((r) => r.join(',')).join('\n')], { type: 'text/csv' }),
    l = document.createElement('a');
  l.href = URL.createObjectURL(b);
  l.download = 'fastlane-report.csv';
  l.click();
}

const auditV = () =>
  `<div class="card"><h2>Audit log</h2><div class="wrap"><table><tr><th>When</th><th>User</th><th>Action</th></tr>${db.audit
    .slice(0, 200)
    .map((a) => `<tr><td>${when(a.t)}</td><td>${esc(a.u)}</td><td>${esc(a.a)}</td></tr>`)
    .join('')}</table></div></div>`;

const ltoV = () =>
  `<div class="card"><h2>Sample LTO records (fictitious)</h2><div class="wrap"><table><tr><th>License</th><th>Name</th><th>Birthdate</th><th>Status</th><th>Violations</th></tr>${db.lto.map((r) => `<tr><td>${r.l}</td><td>${r.n}${r.gen ? ' <span class="muted">(auto-generated)</span>' : ''}</td><td>${r.d}</td><td>${BADGE(r.s === 'Valid' ? 'Verified' : r.s)}</td><td>${r.v.map((v) => `${v.c} (${v.sev}, ${v.dt})`).join('<br>') || 'None'}</td></tr>`).join('')}</table></div></div>`;
