"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Truck,
  CalendarClock,
  Flag,
  Newspaper,
  Image as ImageIcon,
  Tag,
  Bell,
  ClipboardList,
  Wallet,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";

const navItems = [
  { href: "/admin", label: "Statistiken", icon: LayoutDashboard },
  { href: "/admin/benutzer", label: "Benutzer", icon: Users },
  { href: "/admin/anhaenger", label: "Anhänger", icon: Truck },
  { href: "/admin/buchungen", label: "Buchungen", icon: CalendarClock },
  { href: "/admin/auszahlungen", label: "Auszahlungen", icon: Wallet },
  { href: "/admin/meldungen", label: "Meldungen", icon: Flag },
  { href: "/admin/cms/blog", label: "Blog", icon: Newspaper },
  { href: "/admin/cms/banner", label: "Banner", icon: ImageIcon },
  { href: "/admin/cms/rabattcodes", label: "Rabattcodes", icon: Tag },
  { href: "/admin/benachrichtigungen", label: "Benachrichtigungen", icon: Bell },
  { href: "/admin/audit", label: "Audit-Log", icon: ClipboardList },
];

export function AdminSidebar() {
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
      <div className="flex items-center gap-3 border-b border-graphite-800 bg-graphite-950 px-4 py-3 text-graphite-300 md:hidden">
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Menü öffnen"
          className="rounded-lg p-2 hover:bg-graphite-900"
        >
          <Menu size={22} />
        </button>
        <Link href="/" className="flex items-center gap-2">
          <Logo size={32} className="rounded-lg" />
          <span className="font-display text-base font-bold text-white">Raspon Admin</span>
        </Link>
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
          "fixed inset-y-0 left-0 z-50 flex h-full w-64 shrink-0 -translate-x-full flex-col border-r border-graphite-800 bg-graphite-950 py-6 text-graphite-300 transition-transform duration-200 ease-out",
          "md:static md:translate-x-0",
          isOpen && "translate-x-0"
        )}
      >
        <div className="mb-8 flex items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={36} />
            <span className="font-display text-lg font-bold text-white">Raspon Admin</span>
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Menü schließen"
            className="rounded-lg p-1.5 hover:bg-graphite-900 md:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3" aria-label="Admin-Panel-Navigation">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "bg-accent-500 text-white" : "hover:bg-graphite-900"
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
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-graphite-900"
          >
            <LogOut size={18} /> Abmelden
          </button>
        </div>
      </aside>
    </>
  );
}
