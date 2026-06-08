'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

type QrCodeProps = {
  value: string;
  alt: string;
};

export function QrCode({ value, alt }: QrCodeProps) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(value, { width: 160, margin: 1 })
      .then((dataUrl) => {
        if (active) setSrc(dataUrl);
      })
      .catch(() => {
        if (active) setSrc(null);
      });
    return () => {
      active = false;
    };
  }, [value]);

  if (!src) return null;

  return (
    <img
      src={src}
      alt={alt}
      className="mx-auto mb-4 h-40 w-40 rounded-lg border border-gray-200 bg-white p-2"
    />
  );
}
