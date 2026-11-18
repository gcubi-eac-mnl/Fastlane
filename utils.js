/* Small helpers with no business logic: DOM shortcut, text escaping, peso and date formatting, hashing, toast messages, status badges. */

const $ = (s) => document.querySelector(s);

const esc = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );

const peso = (n) => '₱' + Math.round(n).toLocaleString('en-PH');

const now = () => new Date().toISOString();

const when = (s) =>
  s
    ? new Date(s).toLocaleString('en-PH', {
        timeZone: 'Asia/Manila',
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '-';

const hrs = (a, b) => (new Date(b) - new Date(a)) / 36e5;

const sha = async (p) =>
  [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(p)))]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

const uid = (p) => p + '-' + Math.random().toString(36).slice(2, 8).toUpperCase();

const toast = (m) => {
  clearTimeout(toastT);
  let t = $('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    t.setAttribute('role', 'status');
    document.body.append(t);
  }
  t.textContent = m;
  toastT = setTimeout(() => t.remove(), 3500);
};

const BADGE = (s) =>
  `<span class="b ${/Active|Approved|Accepted|Verified/.test(s) ? 'ok' : /Declined|Rejected|Retake|Lapsed/.test(s) ? 'bad' : /Hold|Exception|Resubmitted/.test(s) ? 'warn' : ''}">${s}</span>`;
