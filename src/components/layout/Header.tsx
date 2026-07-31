import Link from "next/link";
import { Bell, Heart, MessageCircle, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function Header() {
  const session = await getSession();
  const accountHref = session
    ? session.role === "ADMIN"
      ? "/admin"
      : session.role === "OWNER" ? "/dashboard" : "/buchungen"
    : "/anmelden";
  const unreadCount = session ? await prisma.notification.count({ where: { userId: session.sub, channel: "IN_APP", readAt: null } }) : 0;

  return (
    <header className="sticky top-0 z-50 border-b border-graphite-100 bg-white/90 backdrop-blur-md">
        <div className="container-page flex h-16 items-center justify-between lg:h-20">
          <Link href="/" className="flex items-center gap-2" aria-label="Raspon — Startseite">
            <Logo size={36} />
            <span className="font-display text-xl font-bold tracking-tight text-graphite-900">
              Raspon
            </span>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Hauptnavigation">
            <Link href="/anhaenger" className="text-sm font-medium text-graphite-700 hover:text-graphite-900">
              Anhänger finden
            </Link>
            <Link href="/anhaenger-vermieten" className="text-sm font-medium text-graphite-700 hover:text-graphite-900">
              Mit Raspon Geld verdienen
            </Link>
            <Link href="/so-funktionierts" className="text-sm font-medium text-graphite-700 hover:text-graphite-900">
              So funktioniert es
            </Link>
            <Link href="/blog" className="text-sm font-medium text-graphite-700 hover:text-graphite-900">
              Blog
            </Link>
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            {session ? (
              <>
                <Link
                  href="/favoriten"
                  className="flex h-10 w-10 items-center justify-center rounded-full text-graphite-600 hover:bg-graphite-100"
                  aria-label="Favoriten"
                >
                  <Heart size={20} />
                </Link>
                <Link
                  href="/benachrichtigungen"
                  className="relative flex h-10 w-10 items-center justify-center rounded-full text-graphite-600 hover:bg-graphite-100"
                  aria-label={`Benachrichtigungen${unreadCount ? ` (${unreadCount} ungelesen)` : ""}`}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && <span className="absolute right-0 top-0 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{Math.min(unreadCount, 99)}</span>}
                </Link>
                <Link
                  href="/nachrichten"
                  className="flex h-10 w-10 items-center justify-center rounded-full text-graphite-600 hover:bg-graphite-100"
                  aria-label="Nachrichten"
                >
                  <MessageCircle size={20} />
                </Link>
                <Link
                  href={accountHref}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-graphite-900 text-white"
                  aria-label="Benutzerkonto"
                >
                  <User size={18} />
                </Link>
                <LogoutButton className="ml-1" />
              </>
            ) : (
              <>
                <Button href="/anmelden" variant="ghost" size="sm">
                  Anmelden
                </Button>
                <Button href="/anhaenger-vermieten" variant="primary" size="sm">
                  Anhänger vermieten
                </Button>
              </>
            )}
          </div>
        </div>
    </header>
  );
}
