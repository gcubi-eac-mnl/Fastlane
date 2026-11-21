/* Entry point: maps each tab name to its screen function and starts the app. Add a new screen to VIEWS. */

const VIEWS = {
  payqr: payqrV,
  paygw: paygwV,
  paydone: paydoneV,
  quote: quoteV,
  apps: appsV,
  claims: claimsV,
  notifs: notifsV,
  uwq: uwqV,
  cq: cqV,
  prof: profV,
  rep: repV,
  audit: auditV,
  lto: ltoV,
  cfg: cfgV,
  account: accountV,
  staff: staffV,
};

boot()
  .then(() => (location.hash.startsWith('#pay=') ? standalone() : draw()))
  .catch((e) => {
    document.getElementById('root').innerHTML =
      '<div class="card" style="max-width:580px;margin:3rem auto"><h2>FastLane could not start</h2><p>' +
      esc(e.message) +
      '</p><p class="muted">Try clearing this site\'s data in your browser, then reload.</p></div>';
  });
