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
  ],
};
