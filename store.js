/* DATA LAYER. Every read and write of saved data goes through this file.
   Today it uses the browser (localStorage for records, IndexedDB for uploaded files).
   To move to Firebase or Supabase, replace boot() and save() here: load the data in boot() and write it back in save().
   Also holds the audit log (log) and in-app notifications (notify). */

let db;

async function boot() {
  db = JSON.parse(localStorage.getItem(K) || 'null');
  if (!db) {
    const pw = await sha('demo1234'),
      u = (email, name, role) => ({ email, name, role, pw });
    db = {
      users: [
        u('customer@demo.ph', 'Demo Customer', 'Customer'),
        u('uw@demo.ph', 'Una Underwriter', 'Underwriter'),
        u('claims@demo.ph', 'Carlo Claims', 'Claims Officer'),
        u('claims2@demo.ph', 'Cathy Claims', 'Claims Officer'),
        u('csr@demo.ph', 'Sam Service', 'Customer Service'),
        u('admin@demo.ph', 'Ada Admin', 'Administrator'),
      ],
      lto: [
        { l: 'N01-23-000001', n: 'Juan Dela Cruz', d: '1990-05-14', s: 'Valid', v: [] },
        {
          l: 'N02-21-000002',
          n: 'Maria Dela Cruz',
          d: '1992-08-02',
          s: 'Valid',
          v: [{ c: 'Illegal parking', sev: 'minor', dt: '2025-06-10' }],
        },
        {
          l: 'N03-19-000003',
          n: 'Pedro Santos',
          d: '1985-01-20',
          s: 'Valid',
          v: [
            { c: 'Reckless driving', sev: 'major', dt: '2024-02-11' },
            { c: 'Beating the red light', sev: 'major', dt: '2025-01-05' },
            { c: 'Drunk driving', sev: 'major', dt: '2025-09-18' },
          ],
        },
        { l: 'N04-22-000004', n: 'Ana Reyes', d: '1998-11-30', s: 'Valid', v: [] },
        {
          l: 'N05-18-000005',
          n: 'Luis Garcia',
          d: '1978-03-09',
          s: 'Suspended',
          v: [{ c: 'Reckless driving', sev: 'major', dt: '2025-04-02' }],
        },
        { l: 'N06-20-000006', n: 'Carla Mendoza', d: '2001-07-17', s: 'Valid', v: [] },
      ],
      vig: [
        { g: 'Economy', max: 800000, base: 18000 },
        { g: 'Standard', max: 2000000, base: 28000 },
        { g: 'Performance', max: 1e12, base: 45000 },
      ],
      shops: ['AutoFix Makati', 'RapidRepair Pasig', 'Metro Body Works'],
      quotes: [],
      apps: [],
      policies: [],
      payments: [],
      claims: [],
      notifs: [],
      audit: [],
    };
    save();
  }
}

const save = () => localStorage.setItem(K, JSON.stringify(db));

const log = (a) => {
  db.audit.unshift({ u: me?.email || 'system', a, t: now() });
  save();
};

const notify = (to, m) => {
  db.notifs.unshift({ to, m, t: now() });
  save();
};

const idb = () =>
  new Promise((ok, no) => {
    const r = indexedDB.open('fastlane_files', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('f');
    r.onsuccess = () => ok(r.result);
    r.onerror = () => no(r.error);
  });

const filePut = async (k, b) => {
  const d = await idb();
  return new Promise((ok, no) => {
    const t = d.transaction('f', 'readwrite');
    t.objectStore('f').put(b, k);
    t.oncomplete = ok;
    t.onerror = () => no(t.error);
  });
};

const fileGet = async (k) => {
  const d = await idb();
  return new Promise((ok, no) => {
    const q = d.transaction('f').objectStore('f').get(k);
    q.onsuccess = () => ok(q.result);
    q.onerror = () => no(q.error);
  });
};
