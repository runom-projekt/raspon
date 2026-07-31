import Image from "next/image";

export function Logo({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <Image
      src="/icon-512.png"
      alt=""
      width={size}
      height={size}
      className={`rounded-xl ${className}`}
    />
  );
}
