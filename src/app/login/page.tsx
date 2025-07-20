// src/app/login/page.tsx
import { Suspense } from 'react';
import LoginClient from './LoginClient';

// A loading UI to show while the login form is being prepared.
// This is the fallback for the Suspense boundary.
function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="animate-pulse flex space-x-4">
        <div className="rounded-full bg-[#741EE3] h-12 w-12"></div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    // The Suspense boundary tells Next.js to show the `fallback` UI first,
    // then load the dynamic client component. This is what fixes the build error.
    <Suspense fallback={<Loading />}>
      <LoginClient />
    </Suspense>
  );
}
