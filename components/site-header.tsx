import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between border-b border-white/5 px-6 py-4 sm:px-10">
      <Link href="/dashboard" className="text-sm font-semibold tracking-tight">
        <span className="gradient-text">Faceless</span> Content Factory
      </Link>
      <UserButton />
    </header>
  );
}
