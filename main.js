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
};

boot().then(() => (location.hash.startsWith('#pay=') ? standalone() : draw()));
