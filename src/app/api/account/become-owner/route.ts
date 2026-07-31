import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, getSession, setSessionCookie } from "@/lib/auth";
import { activateOwnerAccount, OwnerOnboardingError } from "@/server/services/ownerOnboardingService";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Anmeldung erforderlich" }, { status: 401 });
  try {
    const user = await activateOwnerAccount(session, req.headers.get("x-request-id"));
    const token = await createSessionToken({ sub: user.id, email: user.email, role: user.role, sessionVersion: user.sessionVersion, mfa: session.mfa });
    await setSessionCookie(token);
    return NextResponse.json({ user: { id: user.id, role: user.role } });
  } catch (error) {
    if (error instanceof OwnerOnboardingError) return NextResponse.json({ error: "Konto kann nicht aktiviert werden" }, { status: error.code === "NOT_FOUND" ? 404 : 403 });
    throw error;
  }
}
