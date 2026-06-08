interface VerificationBadgeProps {
  valid: boolean;
}

export function VerificationBadge({ valid }: VerificationBadgeProps) {
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
