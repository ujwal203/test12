// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from './providers'; // Import the Providers client component
import Navbar from '@/components/Navbar'; // Import the new Navbar component

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Udyog Jagat',
  description: 'Job portal for a specific circle',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Navbar /> {/* <-- Place Navbar here */}
          <main className={inter.className}> {/* Apply font class to main content area */}
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
