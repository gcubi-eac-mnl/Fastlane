/* Registration, login and logout. */

async function login(e, p) {
  const u = db.users.find((x) => x.email === e.trim().toLowerCase());
  if (!u || u.pw !== (await sha(p))) return toast('Email or password is incorrect.');
  me = u;
  tab = NAV[u.role][0][0];
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
  db.users.push({ email: e, name: n, role: 'Customer', pw: await sha(p) });
  save();
  await login(e, p);
}

const logout = () => {
  log('Logout');
  me = null;
  draw();
};
