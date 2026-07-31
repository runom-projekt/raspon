import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  href,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  href?: string;
}) {
  const className = cn(
    "rounded-2xl border border-graphite-100 bg-white p-6",
    href && "transition-shadow hover:border-graphite-200 hover:shadow-card"
  );
  const content = (
    <>
      <div className="flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
          <Icon size={20} />
        </span>
        {trend && <span className="text-xs font-semibold text-emerald-600">{trend}</span>}
      </div>
      <p className="mt-4 text-2xl font-bold text-graphite-900">{value}</p>
      <p className="text-sm text-graphite-500">{label}</p>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }
  return <div className={className}>{content}</div>;
}
