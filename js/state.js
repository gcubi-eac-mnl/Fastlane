/* Session state shared by the screens: who is logged in, the current tab, and what is open. */

let me = null,
  tab = '',
  uwOpen = null,
  lastQuote = null,
  rows = 1,
  toastT;

let paySid = null;

/* Login screen: which panel is showing, and the demo "email" for a password reset */
let authView = 'home',
  resetEmail = '',
  demoMail = null;
