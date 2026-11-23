/* Backend 2: Supabase, so several computers share one live system.
   Uses Supabase's plain web API (no extra library). Setup steps are in README.md and supabase-setup.sql.

   How it stores data: every record (an application, a claim, a user...) is one row in the table "records",
   keyed by collection + id. save() only sends the rows that changed since the last save, so two people
   editing different records never overwrite each other. Every few seconds the page asks the server for
   rows changed by others and refreshes the screen. Uploaded documents go to the Storage bucket "documents".
   NOTE: this prototype uses the public (anon) key with open access rules, so use fictitious data only. */

const POLL_MS = 4000; /* how often each open page asks the server for changes */
/* which field identifies a record in each collection */
const COLL = {
  users: 'email',
  lto: 'l',
  vig: 'g',
  quotes: 'id',
  apps: 'id',
  policies: 'no',
  payments: 'id',
  claims: 'id',
  notifs: 'id',
  audit: 'id',
  sessions: 'sid',
  notes: 'id',
};
const NEWEST_FIRST = ['notifs', 'audit', 'notes']; /* these lists are kept newest at the top */
const SETTINGS = ['shops', 'reasons', 'rules']; /* single values, stored as collection "settings" */

/* JSON with sorted keys, so a record compares equal after a round trip through the database */
const canon = (o) =>
  JSON.stringify(o, (k, v) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
      : v,
  );

const cloudStore = {
  snap: new Map() /* "collection/id" -> canon(data) as last synced with the server */,
  lastSeen: '',
  dirty: false,
  busy: false,
  again: false,
  polling: false,
  warnedAt: 0,

  get H() {
    /* Legacy anon keys are JWTs and also go in Authorization. New "publishable" keys go in apikey only. */
    const h = { apikey: SUPABASE_KEY };
    if (SUPABASE_KEY.startsWith('eyJ')) h.Authorization = 'Bearer ' + SUPABASE_KEY;
    return h;
  },
  async req(path, opt = {}) {
    const r = await fetch(SUPABASE_URL + path, { ...opt, headers: { ...this.H, ...opt.headers } });
    if (!r.ok) throw new Error(`Server error ${r.status}: ${(await r.text()).slice(0, 160)}`);
    return r;
  },

  /* ---- reading ---- */
  async fetchRows(since) {
    const rows = [];
    for (let off = 0; ; off += 1000) {
      let q = `/rest/v1/records?select=collection,id,data,deleted,created_at,updated_at&order=created_at.asc,collection.asc,id.asc&limit=1000&offset=${off}`;
      if (since) q += `&updated_at=gte.${encodeURIComponent(since)}`;
      const part = await (await this.req(q)).json();
      rows.push(...part);
      if (part.length < 1000) break;
    }
    return rows;
  },
  async load() {
    const rows = await this.fetchRows('');
    if (!rows.some((r) => !r.deleted)) {
      rows.forEach((r) => {
        if (r.updated_at > this.lastSeen) this.lastSeen = r.updated_at;
      });
      return null; /* empty project: boot() will seed it */
    }
    db = Object.fromEntries(Object.keys(COLL).map((c) => [c, []]));
    this.apply(rows);
    return db;
  },

  /* put rows from the server into db. Returns true if anything changed. */
  apply(rows) {
    let changed = false;
    for (const r of rows) {
      if (!this.lastSeen || r.updated_at > this.lastSeen) this.lastSeen = r.updated_at;
      const settings = r.collection === 'settings';
      if (!settings && !COLL[r.collection]) continue;
      const key = r.collection + '/' + r.id;
      if (r.deleted) {
        if (this.snap.has(key)) {
          if (!settings)
            db[r.collection] = db[r.collection].filter(
              (x) => String(x[COLL[r.collection]]) !== r.id,
            );
          this.snap.delete(key);
          changed = true;
        }
        continue;
      }
      const str = canon(r.data);
      if (this.snap.get(key) === str) continue; /* our own change coming back, or nothing new */
      if (settings) db[r.id] = r.data.v;
      else {
        const arr = db[r.collection],
          idf = COLL[r.collection],
          i = arr.findIndex((x) => String(x[idf]) === r.id);
        if (i >= 0) arr[i] = r.data;
        else if (NEWEST_FIRST.includes(r.collection)) arr.unshift(r.data);
        else arr.push(r.data);
        if (r.collection === 'vig') arr.sort((a, b) => a.max - b.max);
      }
      this.snap.set(key, str);
      changed = true;
    }
    return changed;
  },

  async poll() {
    if (document.hidden || this.polling || this.busy || this.dirty)
      return; /* background tabs stay quiet */
    this.polling = true;
    try {
      const rows = await this.fetchRows(this.lastSeen);
      if (this.busy || this.dirty)
        return; /* we changed something while waiting: do not overwrite it */
      const before = unreadCount();
      if (this.apply(rows)) {
        if (!db.users.length) return location.reload(); /* someone reset the data */
        externalChange(before);
      }
    } catch (e) {
      console.warn('FastLane sync:', e.message);
    } finally {
      this.polling = false;
    }
  },
  start() {
    clearInterval(this.iv);
    this.iv = setInterval(() => this.poll(), POLL_MS);
    if (!this.vis) {
      this.vis = true;
      document.addEventListener('visibilitychange', () => !document.hidden && this.poll());
    }
  },

  /* ---- writing ---- */
  records() {
    const m = new Map();
    for (const [c, idf] of Object.entries(COLL)) {
      const list = NEWEST_FIRST.includes(c) ? [...(db[c] || [])].reverse() : db[c] || [];
      for (const x of list) {
        if (!x[idf]) x[idf] = uid('X');
        m.set(c + '/' + x[idf], { collection: c, id: String(x[idf]), data: x });
      }
    }
    for (const s of SETTINGS)
      if (db[s] !== undefined)
        m.set('settings/' + s, { collection: 'settings', id: s, data: { v: db[s] } });
    return m;
  },
  save() {
    this.dirty = true;
    clearTimeout(this.t);
    this.t = setTimeout(() => this.flush(), 200);
  },
  async saveNow() {
    this.dirty = true;
    clearTimeout(this.t);
    await this.flush();
  },
  async flush() {
    if (this.busy) {
      this.again = true;
      return;
    }
    this.busy = true;
    this.dirty = false;
    try {
      const cur = this.records(),
        base = Date.now(),
        fresh = [],
        changed = [];
      let i = 0;
      for (const [key, r] of cur) {
        const str = canon(r.data);
        if (!this.snap.has(key))
          fresh.push({
            ...r,
            deleted: false,
            created_at: new Date(base + i++).toISOString(),
            _k: key,
            _s: str,
          });
        else if (this.snap.get(key) !== str)
          changed.push({ ...r, deleted: false, _k: key, _s: str });
      }
      const gone = [...this.snap.keys()]
        .filter((k) => !cur.has(k))
        .map((k) => {
          const [collection, ...rest] = k.split('/');
          return { collection, id: rest.join('/'), data: {}, deleted: true, _k: k, _s: null };
        });
      for (const list of [fresh, changed, gone]) {
        for (let n = 0; n < list.length; n += 200) {
          const part = list.slice(n, n + 200);
          await this.req('/rest/v1/records?on_conflict=collection,id', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Prefer: 'resolution=merge-duplicates,return=minimal',
            },
            body: JSON.stringify(part.map(({ _k, _s, ...row }) => row)),
          });
          part.forEach((p) => (p._s === null ? this.snap.delete(p._k) : this.snap.set(p._k, p._s)));
        }
      }
    } catch (e) {
      this.dirty = true;
      if (Date.now() - this.warnedAt > 8000) {
        this.warnedAt = Date.now();
        toast('Could not save to the server. Retrying...');
      }
      console.warn('FastLane save:', e.message);
      clearTimeout(this.t);
      this.t = setTimeout(() => this.flush(), 3000);
    } finally {
      this.busy = false;
      if (this.again) {
        this.again = false;
        this.save();
      }
    }
  },

  /* Reset marks every row deleted. Other computers notice on their next poll and reload. */
  async reset() {
    await this.req('/rest/v1/records?collection=neq.__none__', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ deleted: true }),
    });
  },

  /* ---- uploaded documents (Storage bucket "documents") ---- */
  async putFile(k, b) {
    await this.req('/storage/v1/object/documents/' + k.replace(':', '/'), {
      method: 'POST',
      headers: { 'x-upsert': 'true', 'Content-Type': b.type || 'application/octet-stream' },
      body: b,
    });
  },
  async getFile(k) {
    for (const route of ['authenticated', 'public']) {
      try {
        const r = await fetch(
          `${SUPABASE_URL}/storage/v1/object/${route}/documents/${k.replace(':', '/')}`,
          {
            headers: this.H,
          },
        );
        if (r.ok) return await r.blob();
      } catch {}
    }
    return null;
  },
};
