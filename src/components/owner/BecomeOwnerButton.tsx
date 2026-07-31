"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

export function BecomeOwnerButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  async function activate() {
    if (pending) return;
    setPending(true);
    try {
      const response = await fetch("/api/account/become-owner", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Vermieterkonto konnte nicht aktiviert werden");
      toast.success("Vermieterkonto aktiviert");
      router.push("/dashboard/anhaenger/neu");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Vermieterkonto konnte nicht aktiviert werden");
      setPending(false);
    }
  }
  return <button onClick={activate} disabled={pending} className="btn-primary h-12 px-6 disabled:opacity-50">{pending ? "Konto wird aktiviert…" : "Vermieterkonto aktivieren"}<ArrowRight size={20} /></button>;
}
