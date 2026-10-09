export const DETECTIONS_ENDPOINT = '/mitre-detections';
export const MATRIX_ENDPOINT = '/mitre-matrix';

// Links and saved preferences from before the switch to MITRE's live data used
// these slugs; map them onto the stable ATT&CK group ids so they still resolve.
export const LEGACY_GROUP_IDS: Record<string, string> = {
  apt29: 'G0016',
  apt28: 'G0007',
  apt41: 'G0096',
  lazarus: 'G0032',
  fin7: 'G0046',
};
