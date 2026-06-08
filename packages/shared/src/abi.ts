export const CertificateRegistryABI = [
  {
    inputs: [
      { internalType: 'string', name: 'certificateId', type: 'string' },
      { internalType: 'bytes32', name: 'documentHash', type: 'bytes32' },
    ],
    name: 'registerCertificate',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'string', name: 'certificateId', type: 'string' }],
    name: 'verifyCertificate',
    outputs: [
      { internalType: 'bytes32', name: 'documentHash', type: 'bytes32' },
      { internalType: 'address', name: 'issuer', type: 'address' },
      { internalType: 'uint256', name: 'timestamp', type: 'uint256' },
      { internalType: 'bool', name: 'exists', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'string', name: 'certificateId', type: 'string' },
      { indexed: false, internalType: 'bytes32', name: 'documentHash', type: 'bytes32' },
      { indexed: true, internalType: 'address', name: 'issuer', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'CertificateRegistered',
    type: 'event',
  },
] as const;
