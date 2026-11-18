/* Session state shared by the screens: who is logged in, the current tab, and what is open. */

let me = null,
  tab = '',
  uwOpen = null,
  lastQuote = null,
  rows = 1,
  toastT;

let paySid = null;
