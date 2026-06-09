'use client';

import { useState } from 'react';
import type { VerifyCertificateResponse } from '@certchain/shared';
import { VerificationBadge } from '@/components/VerificationBadge';
import { verifyCertificateByPdf } from '@/lib/api';

export default function VerifyByPdfPage() {
  const [result, setResult] = useState<VerifyCertificateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const file = formData.get('file') as File | null;

    if (!file || file.size === 0) {
      setError('Please select a PDF file.');
      setLoading(false);
      return;
    }

    try {
      const data = await verifyCertificateByPdf(file);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-8 text-center text-2xl font-bold text-gray-900">Verify by PDF</h1>

      <form
        onSubmit={handleSubmit}
        className="mb-8 rounded-xl border border-gray-200 bg-white p-8 shadow-sm"
      >
        <p className="mb-4 text-sm text-gray-600">
          Upload the certificate PDF to verify its authenticity against the blockchain registry.
        </p>
        <input
          type="file"
          name="file"
          accept="application/pdf"
          className="mb-4 block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
        />
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-600 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Verify PDF'}
        </button>
      </form>

      {result && (
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-6 text-center">
            <VerificationBadge valid={result.valid} status={result.status} />
          </div>

          {result.status === 'REVOKED' && result.revokedReason && (
            <p className="mb-6 rounded-lg bg-amber-50 px-4 py-3 text-center text-sm text-amber-800">
              This certificate has been revoked. Reason: {result.revokedReason}
            </p>
          )}

          <dl className="space-y-4">
            {result.studentName && (
              <div className="flex justify-between border-b border-gray-100 pb-3">
                <dt className="text-sm font-medium text-gray-500">Student</dt>
                <dd className="text-sm font-semibold text-gray-900">{result.studentName}</dd>
              </div>
            )}
            {result.courseName && (
              <div className="flex justify-between border-b border-gray-100 pb-3">
                <dt className="text-sm font-medium text-gray-500">Course</dt>
                <dd className="text-sm font-semibold text-gray-900">{result.courseName}</dd>
              </div>
            )}
            {result.issueDate && (
              <div className="flex justify-between border-b border-gray-100 pb-3">
                <dt className="text-sm font-medium text-gray-500">Issue Date</dt>
                <dd className="text-sm font-semibold text-gray-900">{result.issueDate}</dd>
              </div>
            )}
            {result.certificateId && (
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Certificate ID</dt>
                <dd className="max-w-xs truncate font-mono text-xs text-gray-700">
                  {result.certificateId}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}
