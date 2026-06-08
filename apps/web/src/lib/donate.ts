const DEFAULT_CONTACT_NAME = 'Brayan Riaño';
const DEFAULT_WHATSAPP = '573223117078';

export type DonationMethod =
  | {
      type: 'link';
      id: string;
      label: string;
      description: string;
      href: string;
    }
  | {
      type: 'crypto';
      id: string;
      label: string;
      description: string;
      address: string;
      network?: string;
    }
  | {
      type: 'whatsapp';
      id: string;
      label: string;
      description: string;
      phone: string;
      phoneDisplay: string;
      href: string;
      contactName: string;
    };

function readEnv(key: string): string | undefined {
  const value = process.env[key]?.trim();
  return value || undefined;
}

function normalizeWhatsApp(phone: string): string {
  return phone.replace(/\D/g, '');
}

function formatWhatsAppDisplay(phone: string): string {
  const digits = normalizeWhatsApp(phone);
  if (digits.length === 12 && digits.startsWith('57')) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }
  return `+${digits}`;
}

export function getContactInfo(): {
  name: string;
  whatsappPhone: string;
  whatsappHref: string;
  whatsappDisplay: string;
} {
  const name = readEnv('NEXT_PUBLIC_CONTACT_NAME') ?? DEFAULT_CONTACT_NAME;
  const whatsappPhone = normalizeWhatsApp(
    readEnv('NEXT_PUBLIC_CONTACT_WHATSAPP') ?? DEFAULT_WHATSAPP,
  );

  return {
    name,
    whatsappPhone,
    whatsappHref: `https://wa.me/${whatsappPhone}`,
    whatsappDisplay: formatWhatsAppDisplay(whatsappPhone),
  };
}

export function getDonationMethods(): DonationMethod[] {
  const methods: DonationMethod[] = [];
  const contact = getContactInfo();

  const githubUrl = readEnv('NEXT_PUBLIC_DONATE_GITHUB_URL');
  if (githubUrl) {
    methods.push({
      type: 'link',
      id: 'github',
      label: 'GitHub Sponsors',
      description: 'Support ongoing development with a monthly sponsorship.',
      href: githubUrl,
    });
  }

  const kofiUrl = readEnv('NEXT_PUBLIC_DONATE_KOFI_URL');
  if (kofiUrl) {
    methods.push({
      type: 'link',
      id: 'kofi',
      label: 'Ko-fi',
      description: 'Buy me a coffee and help fund hosting and improvements.',
      href: kofiUrl,
    });
  }

  const cryptoAddress = readEnv('NEXT_PUBLIC_DONATE_CRYPTO_ADDRESS');
  if (cryptoAddress) {
    methods.push({
      type: 'crypto',
      id: 'crypto',
      label: 'Crypto',
      description: 'Send a one-time donation to the project wallet.',
      address: cryptoAddress,
      network: readEnv('NEXT_PUBLIC_DONATE_CRYPTO_LABEL'),
    });
  }

  if (contact.whatsappPhone) {
    methods.push({
      type: 'whatsapp',
      id: 'whatsapp',
      label: 'WhatsApp',
      description: `Message ${contact.name} for questions, partnerships, or support.`,
      phone: contact.whatsappPhone,
      phoneDisplay: contact.whatsappDisplay,
      href: contact.whatsappHref,
      contactName: contact.name,
    });
  }

  return methods;
}

export function shouldShowSupportSection(): boolean {
  return getDonationMethods().length > 0;
}
