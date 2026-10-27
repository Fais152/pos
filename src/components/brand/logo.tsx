import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  priority,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#f7f2df] p-1.5",
        className
      )}
    >
      <Image
        src="/brand/koetaw-mark.png"
        alt=""
        width={258}
        height={306}
        className="h-full w-auto object-contain"
        priority={priority}
      />
    </span>
  );
}

export function BrandLogo({
  className,
  priority,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center overflow-hidden rounded-2xl bg-[#f7f2df] px-3 py-2",
        className
      )}
    >
      <Image
        src="/brand/koetaw-logo.png"
        alt="Koetaw"
        width={1125}
        height={340}
        className="h-full w-auto object-contain"
        priority={priority}
      />
    </span>
  );
}
