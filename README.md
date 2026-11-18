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
| `js/store.js` | **Data layer**: load, save, audit log, notifications, uploaded files | Connect a real backend |
| `js/rules.js` | **Business rules**: LTO lookup, VIG, premium, loading, document checks | Change rates or rules |
| `js/auth.js` | Register, login, logout | Auth changes |
| `js/views/quote.js` | Quote screen | Quote changes |
| `js/views/applications.js` | Customer applications and uploads | Document flow |
| `js/views/payment.js` | QR, gateway and success pages | Payment flow |
| `js/views/underwriting.js` | Underwriter queue and decisions | Underwriting |
| `js/views/claims.js` | Claims for customers and officers | Claims |
| `js/views/admin.js` | Profiles, report, audit log, LTO data | Reports |
| `js/main.js` | Maps tab names to screens and starts the app | Register a new screen |
| `css/styles.css` | All styling | Look and feel |

Scripts are plain files loaded in the order listed in `index.html`. Later files use things defined in earlier ones.

## Add a feature
1. Write a function that returns HTML, for example `function renewalsV() {...}`, in a file under `js/views/`.
2. Add a `<script src="js/views/renewals.js">` line in `index.html`, before `main.js`.
3. Register it in `VIEWS` in `js/main.js`.
4. Add `['renewals', 'Renewals']` to the role's menu in `NAV` in `js/config.js`.

## Connect a backend (Firebase or Supabase)
All saving goes through `boot()` and `save()` in `js/store.js`. Records live in one in-memory object, `db`. Replace `boot()` to load it from the backend and `save()` to write it back, and the rest of the app does not change. This is enough for a shared demo. For real per-user security you would also split `db` into per-table calls.

## Known limits
Rates and loadings are illustrative. Renewals, amendments, cancellation and the policy PDF are not built. See Section 3.2 of the system proposal.
