/* Constants and settings: storage key, claim stages, rejection reasons, and which menu tabs each role sees.
   Add a new role or menu tab here first. */

const K = 'fastlane_v1';

const STAGES = [
  'Filed',
  'Acknowledged',
  'Inspection Scheduled',
  'Inspection Completed',
  'Settlement Offered',
  'Settlement Accepted',
  'Paid / Closed',
];

/* Shown at the bottom of the site, so you can tell which version is live. Change it with each update. */
const APP_VERSION = '2026-11-22-f';

const IDLE_MS = 30 * 60 * 1000; /* NFR-011: auto logout after 30 minutes without activity */

/* Password reset: FastLane cannot send real email, so the reset code is shown on screen as a simulated email.
   Set to false once a real email service is connected, so the code is no longer shown to the person asking. */
const DEMO_SHOW_RESET_CODE = true;

const REASONS = [
  'Image unreadable',
  'Wrong document',
  'Missing page',
  'Expired document',
  'Details do not match application',
];

const NAV = {
  Customer: [
    ['quote', 'Get a quote'],
    ['apps', 'My applications'],
    ['claims', 'Claims'],
    ['notifs', 'Notifications'],
  ],
  Underwriter: [['uwq', 'Application queue']],
  'Claims Officer': [['cq', 'My claims']],
  'Customer Service': [['prof', 'Customer profiles']],
  Administrator: [
    ['prof', 'Customer profiles'],
    ['rep', 'Reports'],
    ['audit', 'Audit log'],
    ['lto', 'Sample LTO data'],
    ['staff', 'Staff accounts'],
    ['cfg', 'Settings'],
  ],
};
