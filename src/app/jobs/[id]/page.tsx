// src/app/jobs/[id]/page.tsx

import JobDetailsClient from './JobDetailsClient';

// This is an async Server Component (the default)
export default async function JobDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  // Await the params to get the ID on the server
  const { id } = await params;

  // Render the Client Component and pass the resolved ID as a regular prop
  return <JobDetailsClient id={id} />;
}
