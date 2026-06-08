import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CertChain Open',
  description: 'Open source academic certificate issuance and verification on blockchain',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-gray-200 bg-white">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <a href="/" className="text-xl font-bold text-brand-700">
              CertChain Open
            </a>
            <div className="flex gap-4 text-sm">
              <a href="/" className="text-gray-600 hover:text-brand-600">
                Home
              </a>
              <a href="/admin" className="text-gray-600 hover:text-brand-600">
                Admin
              </a>
              <a
                href="https://github.com/brianohe21-pixel/document_checker"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-brand-600"
              >
                GitHub
              </a>
            </div>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="mt-16 border-t border-gray-200 bg-white py-8 text-center text-sm text-gray-500">
          CertChain Open — MIT License
        </footer>
      </body>
    </html>
  );
}
