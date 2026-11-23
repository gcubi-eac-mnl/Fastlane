/* Real email for "Forgot password", sent through EmailJS (emailjs.com), which needs no server.
   Leave all three values empty to keep the simulated email shown on screen (the default).
   Setup steps are in README.md. These three values are meant to be public, so they are safe in the repo. */

const EMAILJS_SERVICE_ID = '';
const EMAILJS_TEMPLATE_ID = '';
const EMAILJS_PUBLIC_KEY = '';

const EMAIL_ON = Boolean(EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY);
