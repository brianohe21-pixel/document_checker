// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract CertificateRegistry {
    struct Certificate {
        bytes32 documentHash;
        address issuer;
        uint256 timestamp;
        bool exists;
    }

    mapping(string => Certificate) private certificates;
    mapping(bytes32 => bool) private usedHashes;

    event CertificateRegistered(string certificateId, bytes32 documentHash, address indexed issuer, uint256 timestamp);

    function registerCertificate(string memory certificateId, bytes32 documentHash) public {
        require(bytes(certificateId).length > 0, "CertificateRegistry: empty certificateId");
        require(documentHash != bytes32(0), "CertificateRegistry: empty hash");
        require(!certificates[certificateId].exists, "CertificateRegistry: certificateId already exists");
        require(!usedHashes[documentHash], "CertificateRegistry: documentHash already registered");

        usedHashes[documentHash] = true;
        certificates[certificateId] = Certificate({
            documentHash: documentHash,
            issuer: msg.sender,
            timestamp: block.timestamp,
            exists: true
        });

        emit CertificateRegistered(certificateId, documentHash, msg.sender, block.timestamp);
    }

    function verifyCertificate(
        string memory certificateId
    ) public view returns (bytes32 documentHash, address issuer, uint256 timestamp, bool exists) {
        Certificate memory cert = certificates[certificateId];
        return (cert.documentHash, cert.issuer, cert.timestamp, cert.exists);
    }
}
