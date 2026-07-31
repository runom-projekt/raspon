"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Truck,
  CalendarClock,
  Wallet,
  MessageCircle,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Übersicht", icon: LayoutDashboard },
  { href: "/dashboard/anhaenger", label: "Meine Anhänger", icon: Truck },
  { href: "/dashboard/buchungen", label: "Buchungen", icon: CalendarClock },
  { href: "/dashboard/einnahmen", label: "Einnahmen", icon: Wallet },
  { href: "/dashboard/nachrichten", label: "Nachrichten", icon: MessageCircle },
  { href: "/benachrichtigungen", label: "Benachrichtigungen", icon: Bell },
  { href: "/dashboard/einstellungen", label: "Einstellungen", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center justify-between border-b border-graphite-100 bg-white px-4 py-3 md:hidden">
        <Link href="/" className="flex items-center gap-2">
          <Logo size={32} className="rounded-lg" />
          <span className="font-display text-base font-bold text-graphite-900">Raspon</span>
        </Link>
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Menü öffnen"
          className="rounded-lg p-2 text-graphite-600 hover:bg-graphite-50"
        >
          <Menu size={22} />
        </button>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full w-64 shrink-0 -translate-x-full flex-col border-r border-graphite-100 bg-white py-6 transition-transform duration-200 ease-out",
          "md:static md:translate-x-0",
          isOpen && "translate-x-0"
        )}
      >
        <div className="mb-8 flex items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={36} />
            <span className="font-display text-lg font-bold text-graphite-900">Raspon</span>
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Menü schließen"
            className="rounded-lg p-1.5 text-graphite-400 hover:bg-graphite-50 md:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3" aria-label="Vermieter-Dashboard-Navigation">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "bg-graphite-900 text-white" : "text-graphite-600 hover:bg-graphite-50"
                )}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-graphite-600 hover:bg-graphite-50"
          >
            <LogOut size={18} /> Abmelden
          </button>
        </div>
      </aside>
    </>
  );
}
