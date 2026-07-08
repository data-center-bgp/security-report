import { AuthProvider } from "@/components/AuthProvider";
import { Sidebar } from "@/components/Sidebar";

export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </AuthProvider>
  );
}
