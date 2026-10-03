export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="mx-auto max-w-4xl px-6 pb-24 pt-32">{children}</div>;
}
