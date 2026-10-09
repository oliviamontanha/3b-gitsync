import { Tactic, Technique, IndustryStandard, ATPGroup } from './types';
import techniquesText from './techniques.txt' with { type: 'text' };

export const tactics: Tactic[] = [
  { id: 'TA0043', name: 'Reconnaissance', shortName: 'Recon', order: 1 },
  { id: 'TA0042', name: 'Resource Development', shortName: 'Resource', order: 2 },
  { id: 'TA0001', name: 'Initial Access', shortName: 'Initial', order: 3 },
  { id: 'TA0002', name: 'Execution', shortName: 'Execute', order: 4 },
  { id: 'TA0003', name: 'Persistence', shortName: 'Persist', order: 5 },
  { id: 'TA0004', name: 'Privilege Escalation', shortName: 'Priv Esc', order: 6 },
  { id: 'TA0005', name: 'Defense Evasion', shortName: 'Defense', order: 7 },
  { id: 'TA0006', name: 'Credential Access', shortName: 'Creds', order: 8 },
  { id: 'TA0007', name: 'Discovery', shortName: 'Discover', order: 9 },
  { id: 'TA0008', name: 'Lateral Movement', shortName: 'Lateral', order: 10 },
  { id: 'TA0009', name: 'Collection', shortName: 'Collect', order: 11 },
  { id: 'TA0011', name: 'Command and Control', shortName: 'C2', order: 12 },
  { id: 'TA0010', name: 'Exfiltration', shortName: 'Exfil', order: 13 },
  { id: 'TA0040', name: 'Impact', shortName: 'Impact', order: 14 },
];

// techniques.txt is a compact `id|name|description` list, grouped under `#TAxxxx` tactic headers.
function parseTechniques(text: string): Technique[] {
  const parsed: Technique[] = [];
  let tacticId = '';

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith('#')) {
      tacticId = line.slice(1);
      continue;
    }

    const [id, name, description] = line.split('|');
    const isSubTechnique = id.includes('.');
    parsed.push({
      id,
      name,
      tacticId,
      description,
      ...(isSubTechnique ? { isSubTechnique: true, parentId: id.split('.')[0] } : {})
    });
  }

  return parsed;
}

export const techniques: Technique[] = parseTechniques(techniquesText);

export const industryStandards: IndustryStandard[] = [
  {
    id: 'nist',
    name: 'NIST Cybersecurity Framework',
    description: 'NIST CSF core security controls',
    techniques: ['T1566', 'T1190', 'T1133', 'T1078', 'T1059', 'T1053', 'T1098', 'T1136', 'T1134', 'T1003', 'T1110', 'T1087', 'T1083', 'T1021', 'T1570', 'T1562', 'T1070', 'T1055', 'T1560', 'T1071', 'T1105', 'T1041', 'T1486', 'T1485']
  },
  {
    id: 'cis',
    name: 'CIS Controls v8',
    description: 'Center for Internet Security Critical Security Controls',
    techniques: ['T1566', 'T1190', 'T1133', 'T1078', 'T1059', 'T1053', 'T1098', 'T1136', 'T1068', 'T1003', 'T1110', 'T1555', 'T1087', 'T1083', 'T1021', 'T1562', 'T1210', 'T1560', 'T1071', 'T1105', 'T1486']
  },
  {
    id: 'pci-dss',
    name: 'PCI DSS',
    description: 'Payment Card Industry Data Security Standard',
    techniques: ['T1190', 'T1133', 'T1059', 'T1098', 'T1136', 'T1134', 'T1003', 'T1110', 'T1555', 'T1056', 'T1087', 'T1021', 'T1562', 'T1070', 'T1071', 'T1041', 'T1567', 'T1486']
  },
  {
    id: 'iso27001',
    name: 'ISO 27001',
    description: 'Information Security Management System standard',
    techniques: ['T1566', 'T1190', 'T1133', 'T1078', 'T1059', 'T1053', 'T1098', 'T1136', 'T1134', 'T1068', 'T1003', 'T1110', 'T1555', 'T1087', 'T1083', 'T1562', 'T1021', 'T1570', 'T1560', 'T1071', 'T1105', 'T1041', 'T1486', 'T1485']
  },
];

// Offline fallback for the ATT&CK matrix and threat groups, used only when the
// /mitre-matrix snapshot can't be fetched. Group ids match MITRE's so a link
// shared from one mode still resolves in the other. industryStandards below is
// not a fallback — MITRE publishes no compliance crosswalk, so it always applies.
export const atpGroups: ATPGroup[] = [
  {
    id: 'G0016',
    name: 'APT29 (Cozy Bear)',
    description: 'Russian state-sponsored group targeting government entities',
    active: true,
    techniques: ['T1566', 'T1189', 'T1190', 'T1078', 'T1059', 'T1053', 'T1098', 'T1547', 'T1134', 'T1003', 'T1110', 'T1087', 'T1083', 'T1021', 'T1027', 'T1055', 'T1071', 'T1105', 'T1041', 'T1567']
  },
  {
    id: 'G0007',
    name: 'APT28 (Fancy Bear)',
    description: 'Russian military intelligence group',
    active: true,
    techniques: ['T1566', 'T1190', 'T1133', 'T1059', 'T1053', 'T1068', 'T1003', 'T1110', 'T1056', 'T1087', 'T1083', 'T1021', 'T1210', 'T1070', 'T1071', 'T1105', 'T1041']
  },
  {
    id: 'G0096',
    name: 'APT41 (Double Dragon)',
    description: 'Chinese espionage and financially motivated group',
    active: true,
    techniques: ['T1566', 'T1189', 'T1190', 'T1078', 'T1059', 'T1053', 'T1547', 'T1136', 'T1134', 'T1068', 'T1003', 'T1555', 'T1087', 'T1083', 'T1021', 'T1027', 'T1570', 'T1560', 'T1071', 'T1105', 'T1041', 'T1567']
  },
  {
    id: 'G0032',
    name: 'Lazarus Group',
    description: 'North Korean cryptocurrency theft and destructive attacks',
    active: true,
    techniques: ['T1566', 'T1189', 'T1190', 'T1059', 'T1204', 'T1136', 'T1547', 'T1134', 'T1003', 'T1555', 'T1083', 'T1021', 'T1027', 'T1055', 'T1071', 'T1105', 'T1486', 'T1485', 'T1561']
  },
  {
    id: 'G0046',
    name: 'FIN7 (Carbanak)',
    description: 'Financially motivated retail and hospitality targeting',
    active: true,
    techniques: ['T1566', 'T1059', 'T1204', 'T1053', 'T1547', 'T1134', 'T1003', 'T1555', 'T1056', 'T1087', 'T1083', 'T1021', 'T1560', 'T1218', 'T1071', 'T1105', 'T1041', 'T1567']
  },
];

export const recentATPs = atpGroups.filter(group => group.active);
