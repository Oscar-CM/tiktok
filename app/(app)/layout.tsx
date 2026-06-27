import { SiteHeader } from "@/components/site-header";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SiteHeader />
      <div className="flex flex-1 items-start justify-center px-6 py-12 sm:py-16">
        <main className="flex w-full max-w-xl flex-col gap-8">{children}</main>
      </div>
    </div>
  );
}
