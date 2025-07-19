// src/app/jobs/[id]/applicants/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Job Applicants',
  description: 'View applicants for this job posting',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}