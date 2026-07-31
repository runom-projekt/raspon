"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export function LogoutButton({ className, label = "Abmelden" }: { className?: string; label?: string }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className={cn("flex items-center gap-2 text-sm font-medium text-graphite-600 hover:text-graphite-900", className)}
    >
      <LogOut size={16} /> {label}
    </button>
  );
}
