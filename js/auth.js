/* Registration, login and logout. */

let idleT;
/* NFR-011: any click, key press or touch restarts the 30 minute timer */
function resetIdle() {
  clearTimeout(idleT);
  if (!me) return;
  idleT = setTimeout(() => {
    log('Automatic logout (inactive)');
    me = null;
    draw();
    toast('You were logged out after 30 minutes of inactivity.');
  }, IDLE_MS);
}
['click', 'keydown', 'touchstart'].forEach((ev) => addEventListener(ev, resetIdle));

async function login(e, p) {
  const u = db.users.find((x) => x.email === e.trim().toLowerCase());
  if (!u || !(await checkPw(p, u.pw))) return toast('Email or password is incorrect.');
  if (u.active === false) return toast('This account is deactivated. Ask an administrator.');
  if (isLegacyPw(u.pw)) {
    u.pw = await hashPw(p); /* upgrade an old unsalted hash */
    save();
  }
  me = u;
  authView = 'home';
  resetIdle();
  tab = u.mustChange ? 'account' : NAV[u.role][0][0];
  log('Login');
  draw();
}

async function register() {
  const n = $('#rn').value.trim(),
    e = $('#re').value.trim().toLowerCase(),
    p = $('#rp').value;
  if (!$('#rc').checked) return toast('Tick the data privacy consent first.');
  if (!n || !/^\S+@\S+\.\S+$/.test(e) || p.length < 8)
    return toast('Enter a name, a valid email and a password of 8+ characters.');
  if (db.users.some((x) => x.email === e)) return toast('That email is already registered.');
  db.users.push({ email: e, name: n, role: 'Customer', pw: await hashPw(p) });
  save();
  await login(e, p);
}

const logout = () => {
  clearTimeout(idleT);
  authView = 'home';
  log('Logout');
  me = null;
  draw();
};
