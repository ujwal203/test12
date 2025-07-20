// src/app/jobs/find/page.tsx
import { Suspense } from 'react';
import FindJobsClient from './FindJobsClient';

// A simple loading component to show while the client component is loading.
// This is what the user will see initially.
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-gray-50">
      <div className="inline-block h-12 w-12 border-4 border-[#741ee3] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}

export default function FindJobsPage() {
  return (
    // The Suspense boundary is the key to solving the error.
    // It tells Next.js to show the `fallback` UI first, and then
    // load the dynamic client component that uses searchParams.
    <Suspense fallback={<LoadingSpinner />}>
      <FindJobsClient />
    </Suspense>
  );
}
