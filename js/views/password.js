/* Forgot password. The person enters their email, gets a 6-digit code by (simulated) email, then chooses a
   new password. The code is stored only as a salted hash, expires after 10 minutes, and allows 5 wrong tries.
   Unknown emails get the same screen, so the page does not reveal which accounts exist. */

const RESET_MINUTES = 10,
  RESET_TRIES = 5;

function authBody() {
  return { forgot: forgotV, reset: resetV, register: registerV }[authView]?.() ?? loginV();
}

function forgotV() {
  return `<div class="card" style="max-width:460px;margin:1rem auto"><h2>Forgot your password?</h2>
  <p class="muted">Enter your account email. We will send a 6-digit code that is valid for ${RESET_MINUTES} minutes.</p>
  <label for="fe">Email</label><input id="fe" type="email" autocomplete="username" value="${esc(resetEmail)}">
  <button class="btn gold" onclick="requestReset()">Send reset code</button><button class="btn line" onclick="authView='login';draw()">Back to log in</button></div>`;
}

/* The demo accounts (@demo.ph) are not real inboxes, so they always use the on-screen simulated email. */
const isDemoAddress = (e) => e.endsWith('@demo.ph');
const RESET_COOLDOWN_SECONDS = 60;

/* Sends the code with EmailJS. The email template must have a "To Email" of {{to_email}} (see README). */
async function sendResetEmail(to, code) {
  const r = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: { to_email: to, code, minutes: RESET_MINUTES, app_name: 'FastLane' },
    }),
  });
  if (!r.ok) throw new Error(`Email service ${r.status}: ${(await r.text()).slice(0, 120)}`);
}

async function requestReset() {
  const e = $('#fe').value.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(e)) return toast('Enter a valid email address.');
  const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, '0'),
    h = await hashPw(code) /* hashed for every email, so unknown emails take the same time */,
    u = db.users.find((x) => x.email === e),
    real = EMAIL_ON && !isDemoAddress(e),
    /* an email went out a moment ago: do not send another, and keep the earlier code valid */
    cooling =
      real && u?.reset?.at && Date.now() - Date.parse(u.reset.at) < RESET_COOLDOWN_SECONDS * 1000;
  if (u && u.active !== false && !cooling) {
    u.reset = {
      h,
      at: now(),
      exp: new Date(Date.now() + RESET_MINUTES * 60000).toISOString(),
      tries: 0,
    };
    if (real) {
      try {
        await sendResetEmail(e, code);
      } catch (err) {
        console.warn('FastLane email:', err.message);
        delete u.reset; /* no email went out, so no code should be valid */
        save();
        return toast('We could not send the email right now. Please try again in a minute.');
      }
    }
    log('Password reset requested for ' + e);
    save();
  }
  resetEmail = e;
  demoMail = real ? null : { to: e, code }; /* real addresses never see the code on screen */
  authView = 'reset';
  draw();
}

function resetV() {
  const mail =
    DEMO_SHOW_RESET_CODE && demoMail
      ? `<div class="card" style="background:#fffbe9;border-color:var(--gold)"><div class="muted">${EMAIL_ON ? 'Demo accounts are not real inboxes, so the message is shown here.' : 'Simulated email. This prototype cannot send real email, so the message is shown here.'}</div>
  <p><b>To:</b> ${esc(demoMail.to)}<br><b>Subject:</b> Your FastLane password reset code</p>
  <p>Use this code to reset your password:</p><div class="tot" style="letter-spacing:.15em">${demoMail.code}</div>
  <p class="muted">The code expires in ${RESET_MINUTES} minutes. If you did not ask for it, ignore this email.</p></div>`
      : '';
  return `<div class="card" style="max-width:460px;margin:1rem auto"><h2>Reset your password</h2>
  <p>If an account exists for <b>${esc(resetEmail)}</b>, a code was sent to it.${EMAIL_ON && !isDemoAddress(resetEmail) ? ' Check your inbox and spam folder. It can take a minute.' : ''}</p>${mail}
  <label for="fc">6-digit code</label><input id="fc" inputmode="numeric" maxlength="6" autocomplete="one-time-code">
  <label for="fp1">New password (8+ characters)</label><input id="fp1" type="password" autocomplete="new-password">
  <label for="fp2">Confirm new password</label><input id="fp2" type="password" autocomplete="new-password">
  <button class="btn gold" onclick="resetPassword()">Change password</button><button class="btn line" onclick="authView='forgot';draw()">Use a different email</button></div>`;
}

async function resetPassword() {
  const code = $('#fc').value.trim(),
    p1 = $('#fp1').value,
    p2 = $('#fp2').value,
    u = db.users.find((x) => x.email === resetEmail),
    r = u?.reset;
  if (!/^\d{6}$/.test(code)) return toast('Enter the 6-digit code.');
  if (p1.length < 8) return toast('The new password needs 8 or more characters.');
  if (p1 !== p2) return toast('The two passwords do not match.');
  if (!r || new Date(r.exp) < new Date())
    return toast('That code is not valid or has expired. Request a new one.');
  if (r.tries >= RESET_TRIES) return toast('Too many wrong tries. Request a new code.');
  if (!(await checkPw(code, r.h))) {
    r.tries++;
    save();
    return toast('That code is not correct.');
  }
  u.pw = await hashPw(p1);
  delete u.reset;
  log('Password reset completed for ' + u.email);
  save();
  demoMail = null;
  authView = 'login';
  draw();
  toast('Password changed. You can log in now.');
}

/* ---- Account: change your own password ---- */
function accountV() {
  return `<div class="card" style="max-width:460px"><h2>Account</h2><p class="muted">${esc(me.name)} (${esc(me.email)}), ${me.role}</p>
  ${me.mustChange ? '<p class="b warn" style="display:block">You are using a temporary password. Choose your own now.</p>' : ''}
  <h3>Change password</h3>
  <label for="cp0">Current password</label><input id="cp0" type="password" autocomplete="current-password">
  <label for="cp1">New password (8+ characters)</label><input id="cp1" type="password" autocomplete="new-password">
  <label for="cp2">Confirm new password</label><input id="cp2" type="password" autocomplete="new-password">
  <button class="btn gold" onclick="changePassword()">Change password</button></div>`;
}

async function changePassword() {
  const u = db.users.find((x) => x.email === me.email),
    p1 = $('#cp1').value;
  if (!(await checkPw($('#cp0').value, u.pw))) return toast('Your current password is incorrect.');
  if (p1.length < 8) return toast('The new password needs 8 or more characters.');
  if (p1 !== $('#cp2').value) return toast('The two passwords do not match.');
  u.pw = await hashPw(p1);
  delete u.mustChange;
  me = u;
  log('Changed own password');
  save();
  draw();
  toast('Password changed.');
}

/* ---- Administrator: reset someone's password ----
   Passwords are never stored in readable form (NFR-008), so an administrator cannot look one up.
   Instead the administrator creates a temporary password, which is shown once. The person must
   replace it with their own after logging in. */
async function adminResetPassword(email) {
  if (me.role !== 'Administrator') return;
  const u = db.users.find((x) => x.email === email);
  if (!u) return;
  if (
    !confirm(
      `Create a new temporary password for ${email}? Their current password will stop working.`,
    )
  )
    return;
  const al = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789',
    temp = Array.from(crypto.getRandomValues(new Uint8Array(10)), (b) => al[b % al.length]).join(
      '',
    );
  u.pw = await hashPw(temp);
  u.mustChange = true;
  delete u.reset;
  log('Reset password for ' + email);
  save();
  showSecret(`Temporary password for ${email}`, temp);
}

function showSecret(title, text) {
  const m = document.createElement('div');
  m.className = 'modal';
  m.setAttribute('role', 'dialog');
  m.setAttribute('aria-label', title);
  m.innerHTML = `<div class="mbox" style="max-width:480px"><h3>${esc(title)}</h3><div class="secret">${esc(text)}</div>
  <p class="muted">Shown only once. FastLane keeps a scrambled version, so it cannot show this again. The person must choose their own password after logging in.</p>
  <div class="row"><button class="btn gold sm" id="sc">Copy</button><button class="btn sm" id="sx">Close</button></div></div>`;
  document.body.append(m);
  m.querySelector('#sc').onclick = () =>
    navigator.clipboard?.writeText(text).then(() => toast('Copied.'));
  m.querySelector('#sx').onclick = () => m.remove();
  m.querySelector('#sx').focus();
}
