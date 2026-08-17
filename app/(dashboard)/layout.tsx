import { Sidebar, MobileNav } from "@/components/dashboard/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 px-4 py-6 lg:px-10 lg:py-10 pb-20 lg:pb-10">{children}</main>
      <MobileNav />
    </div>
  );
}
