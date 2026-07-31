import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { StatusToggleButton } from "@/components/admin/StatusToggleButton";
import { VerifyIdentityButton } from "@/components/admin/VerifyIdentityButton";
import { RoleSelect } from "@/components/admin/RoleSelect";
import { DeleteUserButton } from "@/components/admin/DeleteUserButton";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Benutzer | Admin-Panel" };

export default async function AdminUsersPage() {
  const session = await getSession();
  const canManageRoles = Boolean(session?.isSuperAdmin);

  const users = await prisma.user.findMany({
    where: { isSuperAdmin: false },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      isIdVerified: true,
      identityDocumentUrl: true,
      identitySubmittedAt: true,
    },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-graphite-900">Benutzer</h1>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-graphite-100 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-graphite-100 text-graphite-500">
              <th className="p-4 font-medium">Name</th>
              <th className="p-4 font-medium">E-Mail</th>
              <th className="p-4 font-medium">Rolle</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Identität</th>
              <th className="p-4 font-medium">Beigetreten</th>
              <th className="p-4 font-medium">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-graphite-50">
                <td className="p-4 font-medium text-graphite-900">
                  {u.firstName} {u.lastName}
                </td>
                <td className="p-4 text-graphite-600">{u.email}</td>
                <td className="p-4">
                  {canManageRoles ? <RoleSelect userId={u.id} role={u.role} /> : u.role}
                </td>
                <td className="p-4">
                  <span className="rounded-full bg-graphite-100 px-2.5 py-1 text-xs font-semibold">{u.status}</span>
                </td>
                <td className="p-4">
                  {u.isIdVerified ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      Verifiziert
                    </span>
                  ) : u.identitySubmittedAt ? (
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        Prüfung ausstehend
                      </span>
                      {u.identityDocumentUrl && (
                        <a
                          href={`/api/admin/users/${u.id}/identity-document`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-accent-600 underline"
                        >
                          Dokument
                        </a>
                      )}
                      <VerifyIdentityButton userId={u.id} />
                    </div>
                  ) : (
                    <span className="text-xs text-graphite-400">Nicht eingereicht</span>
                  )}
                </td>
                <td className="p-4 text-graphite-500">{formatDate(u.createdAt)}</td>
                <td className="p-4">
                  {u.id === session!.sub ? (
                    <span className="text-xs text-graphite-400">Ihr eigenes Konto</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      {u.status === "ACTIVE" ? (
                        <StatusToggleButton
                          endpoint={`/api/admin/users/${u.id}/status`}
                          targetStatus="SUSPENDED"
                          label="Sperren"
                          variant="danger"
                        />
                      ) : (
                        <StatusToggleButton
                          endpoint={`/api/admin/users/${u.id}/status`}
                          targetStatus="ACTIVE"
                          label="Aktivieren"
                        />
                      )}
                      {canManageRoles && <DeleteUserButton userId={u.id} email={u.email} />}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
