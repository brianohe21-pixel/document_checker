'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { issueCertificate, login } from '@/lib/api';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const issueSchema = z.object({
  studentName: z.string().min(1, 'Required'),
  courseName: z.string().min(1, 'Required'),
  issueDate: z.string().min(1, 'Required'),
});

type LoginForm = z.infer<typeof loginSchema>;
type IssueForm = z.infer<typeof issueSchema>;

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [result, setResult] = useState<{
    certificateId: string;
    verificationUrl: string;
    transactionHash: string;
    pdfBase64: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const issueForm = useForm<IssueForm>({
    resolver: zodResolver(issueSchema),
    defaultValues: {
      studentName: '',
      courseName: '',
      issueDate: new Date().toISOString().split('T')[0],
    },
  });

  const handleLogin = async (data: LoginForm) => {
    setError(null);
    setLoading(true);
    try {
      const res = await login(data);
      setToken(res.accessToken);
    } catch {
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleIssue = async (data: IssueForm) => {
    if (!token) return;
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const res = await issueCertificate(data, token);
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to issue certificate');
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = () => {
    if (!result?.pdfBase64) return;
    const link = document.createElement('a');
    link.href = `data:application/pdf;base64,${result.pdfBase64}`;
    link.download = `certificate-${result.certificateId}.pdf`;
    link.click();
  };

  if (!token) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="mb-8 text-center text-2xl font-bold">Admin Login</h1>
        <form
          onSubmit={loginForm.handleSubmit(handleLogin)}
          className="space-y-4 rounded-xl border bg-white p-8 shadow-sm"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              {...loginForm.register('email')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            {loginForm.formState.errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {loginForm.formState.errors.email.message}
              </p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              {...loginForm.register('password')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand-600 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Issue Certificate</h1>
        <button
          onClick={() => {
            setToken(null);
            setResult(null);
          }}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Logout
        </button>
      </div>

      <form
        onSubmit={issueForm.handleSubmit(handleIssue)}
        className="space-y-4 rounded-xl border bg-white p-8 shadow-sm"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Student Name</label>
          <input
            {...issueForm.register('studentName')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          {issueForm.formState.errors.studentName && (
            <p className="mt-1 text-sm text-red-600">
              {issueForm.formState.errors.studentName.message}
            </p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Course Name</label>
          <input
            {...issueForm.register('courseName')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Issue Date</label>
          <input
            type="date"
            {...issueForm.register('issueDate')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-600 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? 'Issuing...' : 'Issue Certificate'}
        </button>
      </form>

      {result && (
        <div className="mt-8 rounded-xl border border-green-200 bg-green-50 p-6">
          <h2 className="mb-4 font-semibold text-green-800">Certificate Issued Successfully</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-gray-500">Certificate ID</dt>
              <dd className="font-mono">{result.certificateId}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Verification URL</dt>
              <dd>
                <a href={result.verificationUrl} className="text-brand-600 hover:underline">
                  {result.verificationUrl}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Transaction</dt>
              <dd className="font-mono text-xs">{result.transactionHash}</dd>
            </div>
          </dl>
          <button
            onClick={downloadPdf}
            className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Download PDF
          </button>
        </div>
      )}
    </div>
  );
}
