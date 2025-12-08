import Sidebar from "@/components/admin/Sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[#F9FAFB] overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto ml-64">
        <div className="p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}

