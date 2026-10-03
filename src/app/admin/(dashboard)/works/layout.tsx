import AdminSectionTitle from "@/components/AdminSectionTitle";

export default function WorksAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <AdminSectionTitle textKey="worksAdmin" label="Works Admin" />
      {children}
    </div>
  );
}
