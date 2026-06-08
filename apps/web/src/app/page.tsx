import Link from 'next/link';

const steps = [
  {
    title: 'Issue',
    description:
      'An authorized admin generates a digital certificate with student and course details.',
  },
  {
    title: 'Hash',
    description:
      'A SHA-256 hash of the PDF is computed. Only the hash is stored — never personal data on-chain.',
  },
  {
    title: 'Blockchain',
    description:
      'The hash is registered immutably on Polygon Amoy testnet for transparent verification.',
  },
  {
    title: 'Verify',
    description:
      'Anyone can scan the QR code or visit the public URL to validate authenticity instantly.',
  },
];

export default function HomePage() {
  return (
    <div>
      <section className="bg-gradient-to-br from-brand-900 to-brand-600 px-4 py-24 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-6 text-5xl font-bold">CertChain Open</h1>
          <p className="mb-8 text-xl text-brand-100">
            Open source platform for issuing and verifying academic certificates on blockchain.
            Secure, transparent, and auditable.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/admin"
              className="rounded-lg bg-white px-6 py-3 font-semibold text-brand-700 hover:bg-brand-50"
            >
              Issue Certificate
            </Link>
            <a
              href="https://github.com/brianohe21-pixel/document_checker"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-white/30 px-6 py-3 font-semibold hover:bg-white/10"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">How It Works</h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-bold">
                {i + 1}
              </div>
              <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
              <p className="text-sm text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-2xl font-bold">Public Verification</h2>
          <p className="mb-6 text-gray-600">
            Scan the QR code on any certificate or enter the certificate ID in the verification URL.
            No login required.
          </p>
          <code className="rounded bg-gray-100 px-4 py-2 text-sm text-brand-700">
            /verify/&#123;certificateId&#125;
          </code>
        </div>
      </section>
    </div>
  );
}
