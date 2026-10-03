import AdminSectionTitle from "@/components/AdminSectionTitle";

export default function ResearchAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <AdminSectionTitle textKey="researchAdmin" label="Research Admin" eyebrow="研究編集" />
      {children}
    </div>
  );
}
