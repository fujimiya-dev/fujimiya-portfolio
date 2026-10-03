import AdminSectionTitle from "@/components/AdminSectionTitle";

export default function ExperienceAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <AdminSectionTitle textKey="experienceAdmin" label="Experience Admin" />
      {children}
    </div>
  );
}
