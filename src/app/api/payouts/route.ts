import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "ADMIN")) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  return NextResponse.json(
    { error: "Auszahlungen werden nach Abschluss einer bezahlten Vermietung automatisch vorgemerkt" },
    { status: 409 }
  );
}
