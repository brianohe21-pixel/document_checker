export declare const CertificateRegistryABI: readonly [
  {
    readonly inputs: readonly [
      {
        readonly internalType: 'string';
        readonly name: 'certificateId';
        readonly type: 'string';
      },
      {
        readonly internalType: 'bytes32';
        readonly name: 'documentHash';
        readonly type: 'bytes32';
      },
    ];
    readonly name: 'registerCertificate';
    readonly outputs: readonly [];
    readonly stateMutability: 'nonpayable';
    readonly type: 'function';
  },
  {
    readonly inputs: readonly [
      {
        readonly internalType: 'string';
        readonly name: 'certificateId';
        readonly type: 'string';
      },
    ];
    readonly name: 'verifyCertificate';
    readonly outputs: readonly [
      {
        readonly internalType: 'bytes32';
        readonly name: 'documentHash';
        readonly type: 'bytes32';
      },
      {
        readonly internalType: 'address';
        readonly name: 'issuer';
        readonly type: 'address';
      },
      {
        readonly internalType: 'uint256';
        readonly name: 'timestamp';
        readonly type: 'uint256';
      },
      {
        readonly internalType: 'bool';
        readonly name: 'exists';
        readonly type: 'bool';
      },
    ];
    readonly stateMutability: 'view';
    readonly type: 'function';
  },
  {
    readonly anonymous: false;
    readonly inputs: readonly [
      {
        readonly indexed: false;
        readonly internalType: 'string';
        readonly name: 'certificateId';
        readonly type: 'string';
      },
      {
        readonly indexed: false;
        readonly internalType: 'bytes32';
        readonly name: 'documentHash';
        readonly type: 'bytes32';
      },
      {
        readonly indexed: true;
        readonly internalType: 'address';
        readonly name: 'issuer';
        readonly type: 'address';
      },
      {
        readonly indexed: false;
        readonly internalType: 'uint256';
        readonly name: 'timestamp';
        readonly type: 'uint256';
      },
    ];
    readonly name: 'CertificateRegistered';
    readonly type: 'event';
  },
];
//# sourceMappingURL=abi.d.ts.map
