import type { Metadata } from "next";

// Applies to every /admin/* route (login + the (dashboard) group below it).
// No wrapping markup here on purpose — login and the dashboard group each
// manage their own full layout/container, so this stays a pure metadata
// boundary and must not reintroduce any shared UI between them.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
