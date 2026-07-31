"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, Search, Store, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileBottomNavProps {
  accountHref: string;
  messagesHref: string;
  unreadCount?: number;
}

const baseItems = [
  { href: "/", label: "Start", icon: Home, match: (path: string) => path === "/" },
  {
    href: "/anhaenger",
    label: "Suchen",
    icon: Search,
    match: (path: string) => path === "/anhaenger" || path.startsWith("/anhaenger/"),
  },
  {
    href: "/anhaenger-vermieten",
    label: "Vermieten",
    icon: Store,
    match: (path: string) => path === "/anhaenger-vermieten",
  },
] as const;

export function MobileBottomNav({ accountHref, messagesHref, unreadCount = 0 }: MobileBottomNavProps) {
  const pathname = usePathname();

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
    return null;
  }

  const items = [
    ...baseItems,
    {
      href: messagesHref,
      label: "Nachrichten",
      icon: MessageCircle,
      match: (path: string) => path.startsWith("/nachrichten") || path.startsWith("/dashboard/nachrichten"),
    },
    {
      href: accountHref,
      label: "Konto",
      icon: User,
      match: (path: string) =>
        path === "/anmelden" || path === "/registrieren" || path.startsWith("/buchungen"),
    },
  ];

  return (
    <>
      <div aria-hidden="true" className="h-[calc(5rem+env(safe-area-inset-bottom))] lg:hidden" />
      <nav
        className="fixed inset-x-0 bottom-0 z-[60] border-t border-graphite-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(24,24,27,0.08)] backdrop-blur-xl lg:hidden"
        aria-label="Mobile Hauptnavigation"
      >
        <div className="mx-auto grid h-20 max-w-3xl grid-cols-5 px-1 sm:px-4">
          {items.map(({ href, label, icon: Icon, match }) => {
            const active = match(pathname);
            return (
              <Link
                key={label}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-semibold transition-colors",
                  active
                    ? "text-accent-600"
                    : "text-graphite-500 hover:bg-graphite-50 hover:text-graphite-900"
                )}
              >
                <span
                  className={cn(
                    "relative flex h-8 w-12 items-center justify-center rounded-full transition-colors",
                    active && "bg-accent-500/10"
                  )}
                >
                  <Icon size={21} strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
                  {label === "Konto" && unreadCount > 0 && <span className="absolute right-1 top-0 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">{Math.min(unreadCount, 99)}</span>}
                </span>
                <span className="w-full truncate text-center">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
