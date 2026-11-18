/* BUSINESS RULES. No HTML in this file.
   Simulated LTO lookup, vehicle group (VIG) assignment, premium and loading, required documents, document quality checks, overdue-claim timer.
   Rates and thresholds from the Week 4 business rules live here. */

const ltoFind = (l) => db.lto.find((r) => r.l === l.trim().toUpperCase());

/* Unknown license: auto-generate a random driving background that matches the declared name and birthdate, and save it so the result stays the same */
function ltoEnsure(d) {
  let r = ltoFind(d.l);
  if (r) return r;
  const P = [
      'Illegal parking',
      'Speeding',
      'Disregarding traffic signs',
      'Reckless driving',
      'Beating the red light',
      'Drunk driving',
    ],
    M = ['Reckless driving', 'Beating the red light', 'Drunk driving'];
  const k = Math.random() < 0.5 ? 0 : Math.floor(Math.random() * 5);
  const v = Array.from({ length: k }, () => {
    const c = P[Math.floor(Math.random() * P.length)];
    return {
      c,
      sev: M.includes(c) ? 'major' : 'minor',
      dt: new Date(Date.now() - Math.random() * 5 * 365 * 864e5).toISOString().slice(0, 10),
    };
  });
  r = { l: d.l.trim().toUpperCase(), n: d.n.trim(), d: d.d, s: 'Valid', v, gen: true };
  db.lto.push(r);
  save();
  return r;
}

function calc(f) {
  const v = db.vig.find((x) => f.value <= x.max),
    n = f.drivers.length,
    mult = f.cover === 'Comprehensive' ? 1 : 0.45;
  const ds = f.drivers.map((d, i) => {
    const r = f.manual ? ltoFind(d.l) : ltoEnsure(d);
    let st = 'Verified',
      note = '',
      load = 0,
      excl = false;
    if (!r) {
      st = 'Not Found';
      note = 'No LTO record found. Needs a manual check by an underwriter';
    } else if (r.n.toLowerCase() !== d.n.trim().toLowerCase() || r.d !== d.d) {
      st = 'Discrepancy';
      note = 'Name or birthdate does not match the LTO record';
    } else if (r.s !== 'Valid') {
      if (i === 0) {
        st = 'Discrepancy';
        note = 'Suspended license cannot be the primary driver';
      } else {
        excl = true;
        note = 'Suspended: listed as excluded driver';
      }
    }
    if (r && !excl) {
      const lim = new Date();
      lim.setFullYear(lim.getFullYear() - 3);
      const maj = r.v.filter((x) => x.sev === 'major' && new Date(x.dt) >= lim).length;
      load = maj >= 3 ? 0.3 : maj * 0.05;
    }
    const tr = (v.base / n) * mult,
      amt = excl ? 0 : tr * (1 + load);
    return { ...d, st, note, load, excl, tr, amt, viol: r ? r.v.length : 0 };
  });
  const total = ds.reduce((s, d) => s + d.amt, 0);
  return {
    ...f,
    vig: v.g,
    base: v.base,
    ds,
    total,
    monthly: total / 12,
    ok: ds.every((d) => d.st === 'Verified'),
  };
}

const reqDocs = (q) => [
  ['or', 'Vehicle OR/CR'],
  ['id', 'Government ID of applicant'],
  ...q.ds.map((d, i) => ['lic' + i, 'Driver license: ' + d.n]),
];

async function checkFile(f) {
  if (!/^(image\/(jpeg|png)|application\/pdf)$/.test(f.type))
    return { ok: false, reason: 'Use a JPG, PNG or PDF file' };
  if (f.size > 5 * 1048576) return { ok: false, reason: 'File is over 5 MB' };
  if (f.type === 'application/pdf') return { ok: true };
  try {
    const bm = await createImageBitmap(f);
    if (bm.width < 800 || bm.height < 600)
      return { ok: false, reason: 'Resolution too low (needs at least 800x600)' };
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const x = c.getContext('2d');
    x.drawImage(bm, 0, 0, 128, 128);
    const p = x.getImageData(0, 0, 128, 128).data,
      g = [];
    for (let i = 0; i < p.length; i += 4) g.push(0.3 * p[i] + 0.59 * p[i + 1] + 0.11 * p[i + 2]);
    let s = 0,
      s2 = 0,
      k = 0;
    for (let y = 1; y < 127; y++)
      for (let xx = 1; xx < 127; xx++) {
        const i = y * 128 + xx,
          l = 4 * g[i] - g[i - 1] - g[i + 1] - g[i - 128] - g[i + 128];
        s += l;
        s2 += l * l;
        k++;
      }
    if (s2 / k - (s / k) ** 2 < 25)
      return { ok: false, reason: 'Image looks blurry. Retake the photo' };
    return { ok: true };
  } catch {
    return { ok: false, reason: 'File is damaged or unreadable' };
  }
}

/* Claims */
const claimLate = (c) => {
  const sla = c.stage === 0 ? 24 : 72;
  return c.stage < 6 && hrs(c.t, now()) > sla;
};
