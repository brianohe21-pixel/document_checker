import type {
  IssueCertificateDto,
  IssueCertificateResponse,
  LoginDto,
  LoginResponse,
  VerifyCertificateResponse,
} from '@certchain/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function login(dto: LoginDto): Promise<LoginResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error('Login failed');
  return res.json();
}

export async function issueCertificate(
  dto: IssueCertificateDto,
  token: string,
): Promise<IssueCertificateResponse & { pdfBase64: string }> {
  const res = await fetch(`${API_URL}/certificates`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? 'Failed to issue certificate');
  }
  return res.json();
}

export async function verifyCertificate(certificateId: string): Promise<VerifyCertificateResponse> {
  const res = await fetch(`${API_URL}/verify/${certificateId}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Certificate not found');
  return res.json();
}
