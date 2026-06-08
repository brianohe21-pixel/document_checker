import { POLYGONSCAN_AMOY_URL } from '@certchain/shared';
import { VerificationBadge } from '@/components/VerificationBadge';
import { verifyCertificate } from '@/lib/api';

interface VerifyPageProps {
  params: Promise<{ certificateId: string }>;
}

export default async function VerifyPage({ params }: VerifyPageProps) {
  const { certificateId } = await params;

  let data;
  let error: string | null = null;

  try {
    data = await verifyCertificate(certificateId);
  } catch {
    error = 'Certificate not found or verification service unavailable.';
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="mb-4 text-2xl font-bold text-gray-900">Certificate Verification</h1>
        <div className="rounded-xl border border-red-200 bg-red-50 p-8">
          <VerificationBadge valid={false} />
          <p className="mt-4 text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-8 text-center text-2xl font-bold text-gray-900">
        Certificate Verification
      </h1>

      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <VerificationBadge valid={data.valid} />
        </div>

        {!data.valid && (
          <p className="mb-6 rounded-lg bg-amber-50 px-4 py-3 text-center text-sm text-amber-800">
            The certificate exists in the registry but could not be verified on blockchain. If you
            restarted the local node, re-deploy with{' '}
            <code className="font-mono">pnpm setup:local-blockchain</code> and issue a new
            certificate.
          </p>
        )}

        <dl className="space-y-4">
          <div className="flex justify-between border-b border-gray-100 pb-3">
            <dt className="text-sm font-medium text-gray-500">Student</dt>
            <dd className="text-sm font-semibold text-gray-900">{data.studentName}</dd>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-3">
            <dt className="text-sm font-medium text-gray-500">Course</dt>
            <dd className="text-sm font-semibold text-gray-900">{data.courseName}</dd>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-3">
            <dt className="text-sm font-medium text-gray-500">Issue Date</dt>
            <dd className="text-sm font-semibold text-gray-900">{data.issueDate}</dd>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-3">
            <dt className="text-sm font-medium text-gray-500">Document Hash</dt>
            <dd className="max-w-xs truncate text-xs font-mono text-gray-700">
              {data.documentHash}
            </dd>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-3">
            <dt className="text-sm font-medium text-gray-500">Blockchain</dt>
            <dd className="text-sm font-semibold text-gray-900">{data.blockchain}</dd>
          </div>
          {data.transactionHash && (
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Transaction</dt>
              <dd>
                <a
                  href={`${POLYGONSCAN_AMOY_URL}/tx/${data.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-mono text-brand-600 hover:underline"
                >
                  {data.transactionHash.slice(0, 10)}...{data.transactionHash.slice(-8)}
                </a>
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}
