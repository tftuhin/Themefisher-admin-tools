import SCBSidebar from "@/components/SCBSidebar";

export default function SCBToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-slate-50 text-slate-900">
      <SCBSidebar />
      <main className="flex-1 w-full overflow-y-auto min-h-0">
        {children}
      </main>
    </div>
  );
}
