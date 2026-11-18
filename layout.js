/* Page shell: navigation, the header, the login screen, and draw(), which paints the current tab. */

const go = (t) => {
  tab = t;
  uwOpen = null;
  draw();
};

function draw() {
  if (!me) {
    $('#root').innerHTML =
      `<header><div class="brand">FastLane<small>Confidently Fast. Go further. Drive confidently.</small></div></header><main>${loginV()}</main>`;
    return;
  }
  const nb = NAV[me.role]
    .map(([k, l]) => `<button class="${tab === k ? 'on' : ''}" onclick="go('${k}')">${l}</button>`)
    .join('');
  $('#root').innerHTML =
    `<header><div class="brand">FastLane<small>${esc(me.name)}, ${me.role}</small></div><nav>${nb}<button onclick="logout()">Log out</button></nav></header><main>${VIEWS[tab]()}</main>`;
}

function loginV() {
  return `<div class="hero"><h1>Insurance that keeps up with your family.</h1><p>Get a quote for up to five drivers in minutes. Each driver is priced on their own verified record, not a flat household average.</p></div>
<div class="g"><div class="card"><h2>Log in</h2><label for="le">Email</label><input id="le" type="email" autocomplete="username"><label for="lp">Password</label><input id="lp" type="password" autocomplete="current-password"><button class="btn" onclick="login($('#le').value,$('#lp').value)">Log in</button>
<p class="muted demo">Demo accounts (password <b>demo1234</b>):<br>${['customer', 'uw', 'claims', 'claims2', 'csr', 'admin'].map((x) => `<button class="btn line sm" onclick="login('${x}@demo.ph','demo1234')">${x}</button>`).join('')}</p></div>
<div class="card"><h2>Create a customer account</h2><label for="rn">Full name</label><input id="rn"><label for="re">Email</label><input id="re" type="email"><label for="rp">Password (8+ characters)</label><input id="rp" type="password" autocomplete="new-password">
<label style="font-weight:400"><input id="rc" type="checkbox" style="width:auto"> I consent to FastLane collecting my personal data under the Data Privacy Act of 2012 (RA 10173). This prototype uses sample data only.</label><button class="btn gold" onclick="register()">Create account</button></div></div>`;
}

const shell = (h) =>
  ($('#root').innerHTML =
    `<header><div class="brand">FastLane<small>Confidently Fast. Go further. Drive confidently.</small></div></header><main>${h}</main>`);
