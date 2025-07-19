// src/app/providers.tsx
'use client'; // This component must be a client component

import { SessionProvider } from 'next-auth/react';
import { Inter } from 'next/font/google'; // Import Inter font here as well

const inter = Inter({ subsets: ['latin'] }); // Re-initialize Inter font here

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      {/* Apply the font class to a div or directly to children if it's a single root element */}
      <div className={inter.className}>
        {children}
      </div>
    </SessionProvider>
  );
}
