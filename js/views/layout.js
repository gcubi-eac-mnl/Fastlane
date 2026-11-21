/* Page shell: the public landing page, login and register screens, the signed-in header, and draw(),
   which paints the current screen. */

const go = (t) => {
  tab = t;
  uwOpen = null;
  draw();
};

function draw() {
  if (!me) {
    $('#root').innerHTML =
      publicHeader() +
      (authView === 'home' ? homeV() + siteFooter() : `<main>${authBody()}</main>`);
    return;
  }
  const body = VIEWS[tab]();
  const unread = db.notifs.filter((n) => n.to === me.email && !n.read).length;
  const nb = NAV[me.role]
    .map(
      ([k, l]) =>
        `<button class="${tab === k ? 'on' : ''}" onclick="go('${k}')">${l}${k === 'notifs' && unread ? ` <span class="b bad">${unread}</span>` : ''}</button>`,
    )
    .join('');
  $('#root').innerHTML =
    `<header><div class="brand"><img class="mark" src="img/logo.png" alt=""><div>FastLane<small>${esc(me.name)}, ${me.role}</small></div></div><nav>${nb}<button class="${tab === 'account' ? 'on' : ''}" onclick="go('account')">Account</button><button onclick="logout()">Log out</button></nav></header><main>${body}</main>`;
}

/* ---- public pages ---- */
function jump(id) {
  if (authView !== 'home') {
    authView = 'home';
    draw();
  }
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

const publicHeader = () => `<header class="pub"><div class="pub-in">
<button class="pub-brand" onclick="authView='home';draw()"><img class="mark" src="img/logo.png" alt=""><span>Confidently Fast<small>FastLane portal</small></span></button>
<nav class="pub-nav" aria-label="Site"><button onclick="jump('coverage')">Coverage</button><button onclick="jump('how')">How it works</button><button onclick="jump('faq')">FAQ</button></nav>
<div class="pub-cta"><button class="btn line sm" onclick="authView='login';draw()">Log in</button><button class="btn gold sm" onclick="authView='register';draw()">Get a quote</button></div></div></header>`;

const ICON = {
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>',
  users:
    '<circle cx="9" cy="8" r="3.5"/><path d="M2 21c0-4 3-6 7-6s7 2 7 6"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M22 21c0-3-1.7-5-4-5.8"/>',
  route: '<path d="M3 11l18-8-8 18-2-8-8-2z"/>',
};
const icon = (k) =>
  `<div class="ico"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg></div>`;

function homeV() {
  const quote = `onclick="authView='register';draw()"`;
  return `<div class="home">
<section class="hero2"><div class="in">
  <div><p class="eyebrow">Motor vehicle insurance for Filipino households</p>
  <h1>Go further. <span>Drive confidently.</span></h1>
  <p class="lead">Honest, fast, fairly priced car insurance built around how families actually drive. Every driver is priced on their own verified record, not a flat household average.</p>
  <div><button class="btn gold lg" ${quote}>Get a quote</button><button class="btn ghost lg" onclick="authView='login';draw()">Log in</button></div>
  <ul class="chips"><li>Quotes in minutes</li><li>Up to 5 drivers per car</li><li>Track claims online</li></ul></div>
  <div class="qcard" aria-label="Sample quote">
    <div class="muted">Sample illustration, not a real quote</div>
    <h3>Toyota Camry 2019, Standard group</h3>
    <table><tr><td>Maria, clean record</td><td>₱14,000</td></tr><tr><td>Pedro, 3 major violations <span class="b warn">+30%</span></td><td>₱18,200</td></tr><tr><th>Total per year</th><th>₱32,200</th></tr></table>
    <p class="muted">About ₱2,683 a month. Only Pedro pays more, not the whole household.</p>
  </div>
</div></section>

<section class="sec alt"><div class="in"><h2>Why Confidently Fast</h2><p class="sub">Built by drivers who were tired of paying for someone else's record.</p>
<div class="cards">
  <div class="fc">${icon('users')}<h3>Priced per driver</h3><p>A driver with a clean record is not charged for a relative's violations. Each person's own verified record sets their share.</p></div>
  <div class="fc">${icon('bolt')}<h3>Fast and digital</h3><p>Get an itemized quote in minutes, upload documents with instant checks, and pay online. No branch visit, no multi-day paperwork.</p></div>
  <div class="fc">${icon('route')}<h3>See every step</h3><p>Follow your application and claim through each stage online, with the date and time of every update. No calling the hotline to ask.</p></div>
</div></div></section>

<section class="sec" id="coverage"><div class="in"><h2>Coverage</h2><p class="sub">For private passenger vehicles registered in Metro Manila.</p>
<div class="cards">
  <div class="fc"><h3>Comprehensive</h3><ul><li>Damage to your own vehicle</li><li>Accident and collision protection</li><li>Settlement paid directly to an accredited repair shop</li></ul></div>
  <div class="fc"><h3>Third-party liability</h3><ul><li>Covers damage you cause to others</li><li>Lower premium</li><li>Same online quoting and claims tracking</li></ul></div>
  <div class="fc"><h3>Household policies</h3><ul><li>Up to five named drivers per vehicle</li><li>Add or remove drivers by request</li><li>Excluded drivers can be listed on the policy</li></ul></div>
</div>
<p class="sub" style="margin-top:1.5rem">Every vehicle is placed in an Economy, Standard or Performance group by its value, so pricing is consistent and easy to explain.</p>
<div style="text-align:center"><button class="btn gold lg" ${quote}>Get a quote</button></div></div></section>

<section class="sec alt" id="how"><div class="in"><h2>How it works</h2><p class="sub">From quote to coverage without leaving your couch.</p>
<ol class="steps">
  <li><h3>Get a quote</h3><p>Enter your vehicle and up to five drivers. See the price for each driver.</p></li>
  <li><h3>Upload documents</h3><p>Add your OR/CR, license and ID. Blurry or low-resolution files are caught right away.</p></li>
  <li><h3>Pay online</h3><p>After approval, pay by GCash, Maya, card or bank transfer. Coverage starts once payment is confirmed.</p></li>
  <li><h3>Claim with confidence</h3><p>File online, follow seven clear stages, and accept your settlement offer on screen.</p></li>
</ol></div></section>

<section class="sec" id="faq"><div class="in" style="max-width:760px"><h2>Frequently asked questions</h2><p class="sub">Quick answers before you start.</p>
<details><summary>What can I insure?</summary><p>Private passenger vehicles registered in Metro Manila. Commercial and public utility vehicles are not covered yet.</p></details>
<details><summary>How is my price worked out?</summary><p>Your vehicle's group sets a base premium. It is shared among the named drivers, and each driver's share goes up only if their own record has major violations in the last three years.</p></details>
<details><summary>When does my coverage start?</summary><p>When your payment is confirmed. No coverage applies before then.</p></details>
<details><summary>How long does approval take?</summary><p>Applications with verified drivers and complete documents move quickly. If a document needs fixing, you re-upload only that file.</p></details>
<details><summary>How do I file a claim?</summary><p>Log in and open Claims. Report the incident within 48 hours. Claims filed after 72 hours need a reason for the delay.</p></details>
</div></section>

<section class="sec cta"><div class="in" style="text-align:center"><h2>Ready to go further?</h2><p class="sub" style="color:var(--silver)">Create your account and get a quote in a few minutes.</p><button class="btn gold lg" ${quote}>Get a quote</button></div></section>
</div>`;
}

const siteFooter = () => `<footer class="site"><div class="in">
<div class="brand"><img class="mark" src="img/logo.png" alt=""><div>Confidently Fast<small>A GMR Corporation company</small></div></div>
<p>910 Antonio Arnaiz Avenue, Makati City, Metro Manila</p>
<p class="muted">FastLane is a school prototype (BSCOE 3-1). All data is fictitious, and LTO records and payments are simulated.</p></div></footer>`;

/* ---- login and register ---- */
function loginV() {
  return `<div class="authwrap"><div class="card"><h2>Log in</h2><label for="le">Email</label><input id="le" type="email" autocomplete="username"><label for="lp">Password</label><input id="lp" type="password" autocomplete="current-password"><button class="btn" onclick="login($('#le').value,$('#lp').value)">Log in</button><button class="btn line" onclick="authView='forgot';draw()">Forgot password?</button>
<p class="muted demo">Demo accounts (password <b>demo1234</b>):<br>${['customer', 'uw', 'claims', 'claims2', 'csr', 'admin'].map((x) => `<button class="btn line sm" onclick="login('${x}@demo.ph','demo1234')">${x}</button>`).join('')}</p>
<p class="muted">New here? <button class="link" onclick="authView='register';draw()">Create an account</button></p></div></div>`;
}

function registerV() {
  return `<div class="authwrap"><div class="card"><h2>Create a customer account</h2><label for="rn">Full name</label><input id="rn"><label for="re">Email</label><input id="re" type="email"><label for="rp">Password (8+ characters)</label><input id="rp" type="password" autocomplete="new-password">
<label style="font-weight:400"><input id="rc" type="checkbox" style="width:auto"> I consent to FastLane collecting my personal data under the Data Privacy Act of 2012 (RA 10173). This prototype uses sample data only.</label><button class="btn gold" onclick="register()">Create account</button>
<p class="muted">Already have an account? <button class="link" onclick="authView='login';draw()">Log in</button></p></div></div>`;
}

const shell = (h) =>
  ($('#root').innerHTML =
    `<header><div class="brand"><img class="mark" src="img/logo.png" alt=""><div>FastLane<small>Confidently Fast. Go further. Drive confidently.</small></div></div></header><main>${h}</main>`);
