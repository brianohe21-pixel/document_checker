import { afterEach, describe, expect, it, vi } from 'vitest';
import { getContactInfo, getDonationMethods, shouldShowSupportSection } from './donate';

describe('donate', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns default contact info for Brayan Riaño and WhatsApp', () => {
    const contact = getContactInfo();
    expect(contact.name).toBe('Brayan Riaño');
    expect(contact.whatsappPhone).toBe('573223117078');
    expect(contact.whatsappHref).toBe('https://wa.me/573223117078');
    expect(contact.whatsappDisplay).toBe('+57 322 311 7078');
  });

  it('allows contact overrides via env', () => {
    vi.stubEnv('NEXT_PUBLIC_CONTACT_NAME', 'Custom Name');
    vi.stubEnv('NEXT_PUBLIC_CONTACT_WHATSAPP', '+1 555 000 1111');

    const contact = getContactInfo();
    expect(contact.name).toBe('Custom Name');
    expect(contact.whatsappPhone).toBe('15550001111');
    expect(contact.whatsappHref).toBe('https://wa.me/15550001111');
  });

  it('includes WhatsApp by default when no donation env is set', () => {
    const methods = getDonationMethods();
    expect(methods).toHaveLength(1);
    expect(methods[0]?.type).toBe('whatsapp');
    expect(methods[0]).toMatchObject({
      contactName: 'Brayan Riaño',
      phone: '573223117078',
    });
  });

  it('includes configured donation methods plus WhatsApp', () => {
    vi.stubEnv('NEXT_PUBLIC_DONATE_GITHUB_URL', 'https://github.com/sponsors/example');
    vi.stubEnv('NEXT_PUBLIC_DONATE_CRYPTO_ADDRESS', '0xabc');
    vi.stubEnv('NEXT_PUBLIC_DONATE_CRYPTO_LABEL', 'Polygon');

    const methods = getDonationMethods();
    expect(methods).toHaveLength(3);
    expect(methods.map((m) => m.id)).toEqual(['github', 'crypto', 'whatsapp']);
    expect(methods[1]).toMatchObject({
      type: 'crypto',
      address: '0xabc',
      network: 'Polygon',
    });
  });

  it('shouldShowSupportSection is true with default WhatsApp', () => {
    expect(shouldShowSupportSection()).toBe(true);
  });
});
