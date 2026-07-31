import Image from "next/image";
import { BadgeCheck, MessageCircle } from "lucide-react";

interface OwnerCardProps {
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  isIdVerified: boolean;
  memberSince: Date;
}

export function OwnerCard({ firstName, lastName, avatarUrl, isIdVerified, memberSince }: OwnerCardProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-graphite-100 p-6">
      <div className="flex items-center gap-4">
        <div className="relative h-14 w-14 overflow-hidden rounded-full bg-graphite-100">
          {avatarUrl ? (
            <Image src={avatarUrl} alt={firstName} fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center font-semibold text-graphite-500">
              {firstName.charAt(0)}
              {lastName.charAt(0)}
            </div>
          )}
        </div>
        <div>
          <p className="flex items-center gap-1.5 font-semibold text-graphite-900">
            {firstName} {lastName.charAt(0)}.
            {isIdVerified && <BadgeCheck size={16} className="text-accent-500" aria-label="Verifiziert" />}
          </p>
          <p className="text-sm text-graphite-500">
            Vermieter seit {memberSince.getFullYear()}
          </p>
        </div>
      </div>
      <button className="btn-outline h-10 gap-2 px-4 text-sm">
        <MessageCircle size={16} /> Nachricht senden
      </button>
    </div>
  );
}
