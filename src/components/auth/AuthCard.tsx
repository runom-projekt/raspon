import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-graphite-50 px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <Logo size={36} />
          <span className="font-display text-xl font-bold text-graphite-900">Raspon</span>
        </Link>
        <div className="rounded-2xl border border-graphite-100 bg-white p-8 shadow-card">
          <h1 className="font-display text-2xl font-bold text-graphite-900">{title}</h1>
          <p className="mt-1 text-sm text-graphite-500">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
        <p className="mt-6 text-center text-sm text-graphite-500">{footer}</p>
      </div>
    </div>
  );
}
