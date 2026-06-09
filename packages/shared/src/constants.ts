import type { TemplateConfig } from './types';

export const BLOCKCHAIN_NAME = 'Polygon Amoy';
export const POLYGON_AMOY_CHAIN_ID = 80002;
export const POLYGONSCAN_AMOY_URL = 'https://amoy.polygonscan.com';

export const DEFAULT_TEMPLATE_CONFIG: TemplateConfig = {
  title: 'CERTIFICATE OF COMPLETION',
  subtitle: 'This certifies that',
  bodyLines: ['has successfully completed'],
  primaryColor: '#1a4d99',
  showQr: true,
  showCertificateId: true,
};
