'use client';

import { useState } from 'react';
import type { DonationMethod } from '@/lib/donate';
import { QrCode } from '@/components/QrCode';

type DonateSectionProps = {
  methods: DonationMethod[];
  maintainerName: string;
};

function LinkCard({ method }: { method: Extract<DonationMethod, { type: 'link' }> }) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-2 text-lg font-semibold text-gray-900">{method.label}</h3>
      <p className="mb-6 flex-1 text-sm text-gray-600">{method.description}</p>
      <a
        href={method.href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex justify-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
      >
        {method.label}
      </a>
    </div>
  );
}

function CryptoCard({ method }: { method: Extract<DonationMethod, { type: 'crypto' }> }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(method.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-2 text-lg font-semibold text-gray-900">
        {method.network ? `${method.label} (${method.network})` : method.label}
      </h3>
      <p className="mb-4 text-sm text-gray-600">{method.description}</p>
      <QrCode value={method.address} alt="Crypto donation address QR code" />
      <code className="mb-4 block break-all rounded bg-gray-100 px-3 py-2 text-xs text-brand-700">
        {method.address}
      </code>
      <button
        type="button"
        onClick={() => void handleCopy()}
        className="rounded-lg border border-brand-600 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
      >
        {copied ? 'Copied!' : 'Copy address'}
      </button>
    </div>
  );
}

function WhatsAppCard({ method }: { method: Extract<DonationMethod, { type: 'whatsapp' }> }) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-2 text-lg font-semibold text-gray-900">{method.label}</h3>
      <p className="mb-4 text-sm text-gray-600">{method.description}</p>
      <p className="mb-1 text-sm font-medium text-gray-900">{method.contactName}</p>
      <p className="mb-4 text-sm text-gray-500">{method.phoneDisplay}</p>
      <QrCode value={method.href} alt="WhatsApp contact QR code" />
      <a
        className="mt-auto inline-flex justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        href={method.href}
        target="_blank"
        rel="noopener noreferrer"
      >
        Chat on WhatsApp
      </a>
    </div>
  );
}

function DonationCard({ method }: { method: DonationMethod }) {
  if (method.type === 'link') return <LinkCard method={method} />;
  if (method.type === 'crypto') return <CryptoCard method={method} />;
  return <WhatsAppCard method={method} />;
}

export function DonateSection({ methods, maintainerName }: DonateSectionProps) {
  return (
    <section className="bg-gray-50 px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900">Support CertChain Open</h2>
          <p className="mx-auto max-w-2xl text-gray-600">
            Maintained by <span className="font-semibold text-gray-900">{maintainerName}</span>.
            CertChain Open is free and open source. Your support helps keep infrastructure running
            and development moving forward.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {methods.map((method) => (
            <DonationCard key={method.id} method={method} />
          ))}
        </div>
      </div>
    </section>
  );
}
