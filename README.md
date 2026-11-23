# FastLane

Web portal for Confidently Fast (motor vehicle insurance): quote, driver verification, documents, underwriting, payment and claims. BSCOE 3-1 prototype. All data is fictitious and the LTO and payment gateway are simulated.

## Run it
- **Online:** push this folder to a public GitHub repo, then Settings, Pages, deploy from `main` and `/ (root)`.
- **Locally:** open `index.html`. No install or build step. Fonts and the payment QR code need an internet connection.

## Demo accounts (password `demo1234`)
`customer@demo.ph`, `uw@demo.ph`, `claims@demo.ph`, `claims2@demo.ph`, `csr@demo.ph`, `admin@demo.ph`

## Folder guide
| File | What it does | Typical reason to edit |
|---|---|---|
| `js/config.js` | Constants, claim stages, rejection reasons, menu per role | Add a role or menu tab |
| `js/utils.js` | Formatting and small helpers | Rarely |
| `js/state.js` | Who is logged in, current tab | Rarely |
| `js/email-config.js` | EmailJS settings (empty = simulated email) | Turn on real reset emails |
| `js/supabase-config.js` | Supabase URL and key (empty = data stays in this browser) | Turn on shared data |
| `js/store.js` | **Data layer**: seed data, audit log, notifications, picks the backend | Data layer changes |
| `js/store-local.js` | Backend 1: this browser only (default) | Rarely |
| `js/store-supabase.js` | Backend 2: shared data in Supabase | Sync behavior |
| `js/rules.js` | **Business rules**: LTO lookup, VIG, premium, loading, document checks | Change rates or rules |
| `js/auth.js` | Register, login, logout | Auth changes |
| `js/views/quote.js` | Quote screen | Quote changes |
| `js/views/applications.js` | Customer applications and uploads | Document flow |
| `js/views/payment.js` | QR, gateway and success pages | Payment flow |
| `js/views/underwriting.js` | Underwriter queue and decisions | Underwriting |
| `js/views/claims.js` | Claims for customers and officers | Claims |
| `js/views/admin.js` | Profiles, report, audit log, LTO data | Reports |
| `js/views/settings.js` | Admin: rates, loading rules, repair shops, rejection reasons, staff accounts | Admin features |
| `js/views/policy.js` | Policy PDF download | Policy document wording |
| `js/main.js` | Maps tab names to screens and starts the app | Register a new screen |
| `img/logo.png` | Company logo (from the Company Conceptualization document) | Branding |
| `css/styles.css` | All styling | Look and feel |

Scripts are plain files loaded in the order listed in `index.html`. Later files use things defined in earlier ones.

## Add a feature
1. Write a function that returns HTML, for example `function renewalsV() {...}`, in a file under `js/views/`.
2. Add a `<script src="js/views/renewals.js">` line in `index.html`, before `main.js`.
3. Register it in `VIEWS` in `js/main.js`.
4. Add `['renewals', 'Renewals']` to the role's menu in `NAV` in `js/config.js`.

## Share data between computers (Supabase, optional)
By default each browser keeps its own data. To let several computers share one live system:
1. Create a free project at supabase.com.
2. Open **SQL Editor**, paste all of `supabase-setup.sql`, and click **Run**.
3. Open **Project Settings, API**. Copy the **Project URL** and the public key. Newer projects call it the **Publishable key** (starts with `sb_publishable_`); older ones call it the **anon public** key. Either works.
4. Paste them into `js/supabase-config.js` and commit. (Never use the `service_role` key.)
5. Open the site. The first computer to load it fills the database with the demo accounts. Every other computer then shares the data and sees changes within a few seconds.

To go back to browser-only mode, empty the two values again.

### Security (what is and is not protected)
Protected:
- Passwords are stored as salted PBKDF2-SHA256 hashes (150,000 rounds, a unique salt per account). Accounts from the first version are upgraded the next time their owner logs in.
- The database only accepts the record types the app uses, with a size cap per record. The public key cannot delete rows or files, and the document bucket accepts only JPG, PNG and PDF files up to 5 MB.

Not protected (prototype limits):
- Anyone who has the site's public key can still read and change records, including the stored password hashes and uploaded documents. Role-based access is enforced in the screens only, not in the database (see NFR-010 in the system proposal).
- Real per-user security would need Supabase Auth and per-role database rules, and moving the LTO lookup and pricing to the server.
- Use fictitious data only, and never reuse a real password.

## Public site and accounts
- **Landing page** (`homeV()` in `js/views/layout.js`): hero, benefits, coverage, how it works, FAQ and footer. Login and registration are separate screens opened from its buttons.
- **Account** tab (every role): change your own password.
- **Administrators cannot see passwords.** Passwords are stored only as salted hashes, as NFR-008 requires. An administrator can instead press **Reset password** (Staff accounts, or a customer profile) to create a temporary password that is shown once. The person must choose their own at next login.

## Forgot password
Log in screen, **Forgot password?**: enter the email, get a 6-digit code, choose a new password. The code is stored as a salted hash, expires after 10 minutes and allows 5 wrong tries.

By default the code appears on screen as a **simulated email** (anyone who knows an account's email could then reset its password). To send **real email** instead, connect EmailJS (free: 200 emails a month, no server needed):
1. Create an account at emailjs.com. Under **Email Services**, add your Gmail (or other) account and note the **Service ID**.
2. Under **Email Templates**, create a template. Subject: `Your {{app_name}} password reset code`. Body: `Use this code to reset your password: {{code}}. It expires in {{minutes}} minutes. If you did not ask for it, ignore this email.` Set the **To Email** field to `{{to_email}}`. Save and note the **Template ID**.
3. Under **Account**, copy your **Public Key**.
4. Paste the three values into `js/email-config.js` and commit.

With email on: only accounts that exist are emailed, real addresses never see the code on screen, a second request within 60 seconds does not send another email, and the `@demo.ph` demo accounts keep using the on-screen simulated email. EmailJS lists IP rate limits and an optional reCAPTCHA for abuse control, but its allowed-domain list is not on the free plan, so anyone who finds your public key could use up your monthly quota.

## Known limits
Rates and loadings are illustrative. Renewals, amendments, cancellation, the blacklist check and the post-claim survey are not built (the "Should" items in Section 4 of the system proposal). Internet is needed for the fonts, the QR code and the PDF library.
