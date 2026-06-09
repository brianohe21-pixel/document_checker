import type { CertificateStatus } from '@certchain/shared';

interface VerificationBadgeProps {
  valid: boolean;
  status?: CertificateStatus;
}

export function VerificationBadge({ valid, status }: VerificationBadgeProps) {
  if (status === 'REVOKED') {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-4 py-1.5 text-sm font-semibold text-amber-800">
        Revoked
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-semibold ${
        valid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}
    >
      {valid ? 'Valid' : 'Invalid'}
    </span>
  );
}
